const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Room = require('../models/Room');
const { matchRoom } = require('../services/tournamentService');
const mongoose = require('mongoose');

exports.listTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ 
      status: { $in: ['upcoming', 'registering', 'in_progress'] } 
    }).sort({ startTime: 1 });
    res.json(tournaments);
  } catch (err) {
    console.error('[tournament] listTournaments error', err);
    res.status(500).json({ message: 'Failed to fetch tournaments' });
  }
};

exports.register = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.status !== 'registering' && tournament.status !== 'upcoming') {
      return res.status(400).json({ message: 'Registration is not open' });
    }
    if (tournament.registeredPlayers.length >= tournament.maxPlayers) {
      return res.status(400).json({ message: 'Tournament is full' });
    }
    if (tournament.registeredPlayers.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already registered' });
    }

    const user = await User.findById(req.user._id);
    if (user.wallet < tournament.entryFee) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct entry fee
    user.wallet -= tournament.entryFee;
    await user.save();

    // Create transaction
    await Transaction.create({
      userId: req.user._id,
      amount: tournament.entryFee,
      type: 'debit',
      reason: `registration - tournament: ${tournament.name}`,
      status: 'completed'
    });

    // Add player to tournament
    tournament.registeredPlayers.push(req.user._id);
    if (tournament.status === 'upcoming') tournament.status = 'registering';
    await tournament.save();

    res.json({ success: true, tournament });
  } catch (err) {
    console.error('[tournament] register error', err);
    res.status(500).json({ message: 'Failed to register' });
  }
};

/**
 * Background function to start tournaments past their startTime
 */
exports.checkAndStartTournaments = async (io) => {
  try {
    const now = new Date();
    const upcoming = await Tournament.find({
      status: { $in: ['upcoming', 'registering'] },
      startTime: { $lte: now }
    });

    for (const t of upcoming) {
      if (t.registeredPlayers.length < 2) {
        // Not enough players, cancel and refund
        console.log(`[tournament] Cancelling ${t.name} - not enough players`);
        t.status = 'completed'; // or 'cancelled' if we add to enum
        await t.save();
        
        for (const playerId of t.registeredPlayers) {
          await User.findByIdAndUpdate(playerId, { $inc: { wallet: t.entryFee } });
          await Transaction.create({
            userId: playerId,
            amount: t.entryFee,
            type: 'credit',
            reason: `refund - tournament ${t.name} cancelled`,
            status: 'completed'
          });
        }
        continue;
      }

      // Start tournament
      console.log(`[tournament] Starting ${t.name} with ${t.registeredPlayers.length} players`);
      t.status = 'in_progress';
      
      // Create a Room to handle the tournament matches
      const roomId = `tournament-${t._id}-${Date.now()}`;
      const room = await Room.create({
        roomId,
        name: t.name,
        maxPlayers: t.maxPlayers,
        entryFee: t.entryFee,
        prizeDistribution: 'winnerTA',
        status: 'ongoing',
        players: t.registeredPlayers,
        currentRound: 1
      });

      await t.save();

      // Initial pairing
      await matchRoom(roomId);
      
      if (io) {
        io.emit('tournamentStarted', { 
            tournamentId: t._id, 
            tournamentName: t.name,
            roomId 
        });
      }
    }
  } catch (err) {
    console.error('[tournament] checkAndStartTournaments error', err);
  }
};
