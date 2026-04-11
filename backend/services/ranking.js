const Room = require('../models/Room');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Calculate ELO rating changes for a match result.
 * K-factor = 32, clamped to +8..+16 for wins, -8..-16 for losses.
 */
const calculateElo = (winnerElo, loserElo) => {
  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  let winnerDelta = Math.round(K * (1 - expectedWinner));
  let loserDelta = Math.round(K * (0 - expectedLoser));

  // Clamp: winner gets +8 to +16, loser gets -8 to -16
  winnerDelta = Math.max(8, Math.min(16, winnerDelta));
  loserDelta = Math.max(-16, Math.min(-8, loserDelta));

  return { winnerDelta, loserDelta };
};

/**
 * Calculate ELO adjustment for a draw.
 * Small adjustment toward the average of both players.
 */
const calculateDrawElo = (elo1, elo2) => {
  const K = 32;
  const expected1 = 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
  let delta1 = Math.round(K * (0.5 - expected1));

  // Clamp draw adjustments to ±4
  delta1 = Math.max(-4, Math.min(4, delta1));

  return { delta1, delta2: -delta1 };
};

const finalizeRoom = async (roomId) => {
  const room = await Room.findOne({ roomId }).populate('matches.player1 matches.player2 matches.winner');
  if (!room || room.status === 'completed') return null;

  const ranking = [];
  const eloChanges = {}; // Track ELO changes per user for result display

  for (const match of room.matches) {
    if (match.winner) {
      const winnerId = match.winner._id ? match.winner._id.toString() : match.winner.toString();
      const p1Id = match.player1._id ? match.player1._id.toString() : match.player1.toString();
      const p2Id = match.player2._id ? match.player2._id.toString() : match.player2.toString();
      const loserId = p1Id === winnerId ? p2Id : p1Id;

      ranking.push(winnerId);

      // Update win/loss stats
      await User.findByIdAndUpdate(winnerId, { $inc: { 'stats.wins': 1, 'stats.gamesPlayed': 1 } });
      if (loserId) await User.findByIdAndUpdate(loserId, { $inc: { 'stats.losses': 1, 'stats.gamesPlayed': 1 } });

      // Calculate and apply ELO changes
      const winner = await User.findById(winnerId);
      const loser = await User.findById(loserId);
      if (winner && loser) {
        const { winnerDelta, loserDelta } = calculateElo(winner.elo || 1000, loser.elo || 1000);

        await User.findByIdAndUpdate(winnerId, { $inc: { elo: winnerDelta } });
        await User.findByIdAndUpdate(loserId, { $inc: { elo: loserDelta } });

        // Track for result display
        eloChanges[winnerId] = (eloChanges[winnerId] || 0) + winnerDelta;
        eloChanges[loserId] = (eloChanges[loserId] || 0) + loserDelta;
      }
    } else {
      // handle draws if match has been completed without winner
      if (match.status === 'completed') {
        const p1Id = match.player1?._id ? match.player1._id.toString() : match.player1?.toString();
        const p2Id = match.player2?._id ? match.player2._id.toString() : match.player2?.toString();

        if (p1Id) await User.findByIdAndUpdate(p1Id, { $inc: { 'stats.draws': 1, 'stats.gamesPlayed': 1 } });
        if (p2Id) await User.findByIdAndUpdate(p2Id, { $inc: { 'stats.draws': 1, 'stats.gamesPlayed': 1 } });

        // ELO draw adjustment
        if (p1Id && p2Id) {
          const player1 = await User.findById(p1Id);
          const player2 = await User.findById(p2Id);
          if (player1 && player2) {
            const { delta1, delta2 } = calculateDrawElo(player1.elo || 1000, player2.elo || 1000);
            await User.findByIdAndUpdate(p1Id, { $inc: { elo: delta1 } });
            await User.findByIdAndUpdate(p2Id, { $inc: { elo: delta2 } });

            eloChanges[p1Id] = (eloChanges[p1Id] || 0) + delta1;
            eloChanges[p2Id] = (eloChanges[p2Id] || 0) + delta2;
          }
        }
      }
    }
  }

  const finalRanking = [...new Set(ranking)];

  room.status = 'completed';
  await room.save();

  // Prize distribution
  if (room.prizeDistribution === 'top4') {
    const pool = (room.entryFee || 0) * (room.players?.length || 0);
    const percentage = [0.5, 0.25, 0.15, 0.10];
    for (let i = 0; i < Math.min(4, finalRanking.length); i++) {
      const userId = finalRanking[i];
      const prize = Math.floor(pool * percentage[i]);
      if (!prize) continue;
      await User.findByIdAndUpdate(userId, { $inc: { wallet: prize } });
      await Transaction.create({ userId, amount: prize, type: 'credit', reason: `room ${roomId} prize place ${i + 1}`, status: 'completed' });
    }
  } else if (room.prizeDistribution === 'winnerTA' && finalRanking[0]) {
    const pool = (room.entryFee || 0) * (room.players?.length || 0);
    const winner = finalRanking[0];
    await User.findByIdAndUpdate(winner, { $inc: { wallet: pool } });
    await Transaction.create({ userId: winner, amount: pool, type: 'credit', reason: `room ${roomId} winner-takes-all`, status: 'completed' });
  }

  // Auto-renew contests after finalization
  try {
    const { autoRenewContests } = require('./tournamentService');
    await autoRenewContests();
  } catch (err) {
    console.error('[ranking] auto-renew error:', err.message);
  }

  return { roomId: room.roomId, ranking: finalRanking, eloChanges };
};

module.exports = { finalizeRoom, calculateElo, calculateDrawElo };
