const Room = require('../models/Room');
const User = require('../models/User');
const Contest = require('../models/Contest');
const ContestType = require('../models/ContestType');

/**
 * Pair players into matches for a room's current round.
 * Called when a room becomes full (status = 'ongoing') or on nextRound.
 */
exports.matchRoom = async (roomId) => {
  const room = await Room.findOne({ roomId }).populate('players', 'username');
  if (!room) throw new Error('Room not found');

  // Only create matches when room is ongoing and no current-round playing/waiting matches exist
  const currentRound = room.currentRound || 1;
  const currentRoundMatches = room.matches.filter(
    (m) => m.round === currentRound && (m.status === 'waiting' || m.status === 'playing')
  );

  if (room.status !== 'ongoing' || currentRoundMatches.length > 0) {
    return room;
  }

  // For round 1, use all players; for later rounds, use winners from previous round
  let activePlayers;
  if (currentRound === 1) {
    activePlayers = room.players.map((p) => p._id.toString());
  } else {
    const prevRoundMatches = room.matches.filter(
      (m) => m.round === currentRound - 1 && m.status === 'completed'
    );
    activePlayers = prevRoundMatches
      .filter((m) => m.winner)
      .map((m) => m.winner.toString());
  }

  // Remove duplicates
  activePlayers = [...new Set(activePlayers)];

  if (activePlayers.length < 2) {
    // Tournament over or not enough players
    if (currentRound > 1) {
      room.status = 'completed';
      await room.save();
    }
    return room;
  }

  // Shuffle for fair pairing
  for (let i = activePlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activePlayers[i], activePlayers[j]] = [activePlayers[j], activePlayers[i]];
  }

  // Create match pairs
  const pairs = [];
  for (let i = 0; i + 1 < activePlayers.length; i += 2) {
    pairs.push([activePlayers[i], activePlayers[i + 1]]);
  }

  // Create playing matches
  for (const [p1, p2] of pairs) {
    // Create a shadow contest for the socket handler to manage the actual chess game
    let tournamentCT = await ContestType.findOne({ name: 'Tournament Match' });
    if (!tournamentCT) {
      tournamentCT = await ContestType.create({ name: 'Tournament Match', entry: 0, payout: 0, platform: 0 });
    }

    const contest = await Contest.create({
      contestType: tournamentCT._id,
      players: [p1, p2],
      whitePlayer: p1,
      blackPlayer: p2,
      status: 'playing',
      startedAt: new Date(),
    });

    room.matches.push({
      player1: p1,
      player2: p2,
      contestId: contest._id,
      status: 'playing',
      round: currentRound,
      startedAt: new Date(),
    });
  }

  await room.save();
  return Room.findOne({ roomId }).populate('players', 'username').populate('matches.player1 matches.player2 matches.winner', 'username');
};

/**
 * Advance tournament to next round after all current round matches complete.
 */
exports.nextRound = async (roomId) => {
  const room = await Room.findOne({ roomId });
  if (!room) throw new Error('Room not found');

  const currentRound = room.currentRound || 1;
  const currentRoundMatches = room.matches.filter((m) => m.round === currentRound);
  const allCompleted = currentRoundMatches.length > 0 && currentRoundMatches.every((m) => m.status === 'completed');

  if (!allCompleted) {
    return room;
  }

  // Gather winners from current round only
  const winners = currentRoundMatches
    .filter((m) => m.winner)
    .map((m) => m.winner.toString());
  const uniqueWinners = [...new Set(winners)];

  if (uniqueWinners.length <= 1) {
    // Tournament complete — only one winner remains
    room.status = 'completed';
    await room.save();
    return room;
  }

  // Advance to next round
  room.currentRound = currentRound + 1;
  await room.save();

  // Create matches for the next round
  return exports.matchRoom(roomId);
};

/**
 * Get structured bracket data for frontend rendering.
 */
exports.getTournamentBracket = async (roomId) => {
  const room = await Room.findOne({ roomId })
    .populate('players', 'username')
    .populate('matches.player1 matches.player2 matches.winner', 'username');

  if (!room) return null;

  const totalRounds = Math.ceil(Math.log2(room.maxPlayers));
  const rounds = [];

  for (let r = 1; r <= Math.max(totalRounds, room.currentRound || 1); r++) {
    const roundMatches = room.matches
      .filter((m) => m.round === r)
      .map((m) => ({
        matchId: m._id,
        player1: m.player1 ? { id: m.player1._id || m.player1, username: m.player1.username || 'TBD' } : null,
        player2: m.player2 ? { id: m.player2._id || m.player2, username: m.player2.username || 'TBD' } : null,
        winner: m.winner ? { id: m.winner._id || m.winner, username: m.winner.username || 'TBD' } : null,
        status: m.status,
        round: m.round,
      }));

    let roundName = `Round ${r}`;
    if (totalRounds >= 3) {
      if (r === totalRounds) roundName = 'Final';
      else if (r === totalRounds - 1) roundName = 'Semi Final';
      else if (r === totalRounds - 2) roundName = 'Quarter Final';
    } else if (totalRounds === 2) {
      if (r === 2) roundName = 'Final';
      else roundName = 'Semi Final';
    } else if (totalRounds === 1) {
      roundName = 'Final';
    }

    rounds.push({
      round: r,
      name: roundName,
      matches: roundMatches,
    });
  }

  return {
    roomId: room.roomId,
    totalRounds,
    currentRound: room.currentRound,
    status: room.status,
    rounds,
  };
};

/**
 * Auto-renew contests after completion.
 * Ensures at least 3 contests of each type (2P, 4P, 10P) are always available.
 */
exports.autoRenewContests = async () => {
  const contestTypes = [
    { maxPlayers: 2, baseName: 'Head to Head', entryFee: 49, prizeDistribution: 'winnerTA' },
    { maxPlayers: 4, baseName: '4 Player', entryFee: 99, prizeDistribution: 'top4' },
    { maxPlayers: 10, baseName: '10 Player', entryFee: 149, prizeDistribution: 'top4' },
  ];

  const MIN_AVAILABLE = 3;

  for (const type of contestTypes) {
    try {
      // Count waiting rooms of this type
      const waitingCount = await Room.countDocuments({
        maxPlayers: type.maxPlayers,
        status: 'waiting',
      });

      if (waitingCount < MIN_AVAILABLE) {
        const toCreate = MIN_AVAILABLE - waitingCount;

        // Find the highest existing number for this contest type name
        const existingRooms = await Room.find({
          name: { $regex: `^${type.baseName} #\\d+$` },
        }).sort({ createdAt: -1 }).limit(1);

        let nextNum = 1;
        if (existingRooms.length > 0) {
          const match = existingRooms[0].name.match(/#(\d+)$/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }

        for (let i = 0; i < toCreate; i++) {
          const roomId = `auto-${type.maxPlayers}p-${Date.now()}-${i}`;
          const name = `${type.baseName} #${nextNum + i}`;

          await Room.create({
            roomId,
            name,
            maxPlayers: type.maxPlayers,
            entryFee: type.entryFee,
            prizeDistribution: type.prizeDistribution,
            status: 'waiting',
            currentRound: 1,
          });

          console.log(`[auto-renew] Created contest: ${name} (${type.maxPlayers}P, ₹${type.entryFee})`);
        }
      }
    } catch (err) {
      console.error(`[auto-renew] Error for ${type.maxPlayers}P:`, err.message);
    }
  }
};
