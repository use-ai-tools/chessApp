const mongoose = require('mongoose');
const Room = require('../models/Room');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { matchRoom, getTournamentBracket } = require('../services/tournamentService');

exports.listRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('players', 'username wallet online').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error('[room] listRooms error', err);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { roomId, name, maxPlayers, entryFee, prizeDistribution, startTime, endTime } = req.body;
    if (!roomId) return res.status(400).json({ message: 'roomId required' });

    const existing = await Room.findOne({ roomId });
    if (existing) return res.status(400).json({ message: 'Room exists' });

    const room = await Room.create({
      roomId,
      name: name || `Contest #${roomId}`,
      maxPlayers: maxPlayers || 2,
      entryFee: entryFee !== undefined ? entryFee : 49,
      prizeDistribution: prizeDistribution || 'winner_takes_all',
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      status: 'waiting',
      currentRound: 1,
    });

    console.log('[room] created', { roomId: room.roomId, maxPlayers: room.maxPlayers, entryFee: room.entryFee });
    res.status(201).json(room);
  } catch (err) {
    console.error('[room] createRoom error', err);
    res.status(500).json({ message: 'Failed to create room' });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId, entryFee } = req.body;
    
    // Find existing WAITING room by entryFee with available slot
    let room = await Room.findOne({
      entryFee: entryFee !== undefined ? entryFee : 49,
      status: 'waiting',
      $expr: { $lt: [{ $size: '$players' }, '$maxPlayers'] },
      players: { $ne: req.user._id }
    }).populate('players');

    if (!room) {
      // Create new room
      const newRoomId = roomId || new mongoose.Types.ObjectId().toString();
      const created = await Room.create({
        roomId: newRoomId,
        name: `Match ₹${entryFee !== undefined ? entryFee : 49}`,
        maxPlayers: 2,
        entryFee: entryFee !== undefined ? entryFee : 49,
        prizeDistribution: 'winner_takes_all',
        status: 'waiting',
        players: []
      });
      // Query it to have population format match existing flow
      room = await Room.findById(created._id).populate('players');
    }

    if (room.players.some(p => p._id && p._id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already joined' });
    }

    // Join existing room
    room.players.push(req.user._id);

    if (room.players.length === room.maxPlayers) {
      room.status = 'ongoing';
      await room.save();

      const populatedRoom = await Room.findById(room._id).populate('players');
      const [p1, p2] = populatedRoom.players;
      const io = req.app.get('io');
      const roomIdStr = room._id.toString();
      console.log('[matchStarted] emitting roomId:', roomIdStr);
      
      io.to(roomIdStr).emit('matchStarted', {
        roomId: roomIdStr,
        matchId: roomIdStr,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        whitePlayerId: p1._id.toString(),
        blackPlayerId: p2._id.toString(),
        whitePlayer: { id: p1._id, username: p1.username },
        blackPlayer: { id: p2._id, username: p2.username },
      });
    } else {
      await room.save();
    }

    res.json({ success: true, room });
  } catch (err) {
    console.error('[room] joinRoom error', err);
    res.status(500).json({ message: 'Failed to join room' });
  }
};

exports.getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId })
      .populate('players', 'username wallet stats online')
      .populate('matches.player1 matches.player2 matches.winner', 'username online');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    console.error('[room] getRoomDetails error', err);
    res.status(500).json({ message: 'Failed to fetch room details' });
  }
};

exports.getMyContests = async (req, res) => {
  try {
    const rooms = await Room.find({ players: req.user._id })
      .populate('players', 'username wallet online')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error('[room] getMyContests error', err);
    res.status(500).json({ message: 'Failed to fetch contests' });
  }
};

exports.getLiveContests = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'ongoing' })
      .populate('players', 'username wallet online')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error('[room] getLiveContests error', err);
    res.status(500).json({ message: 'Failed to fetch live contests' });
  }
};

exports.getBracket = async (req, res) => {
  try {
    const { roomId } = req.params;
    const bracket = await getTournamentBracket(roomId);
    if (!bracket) return res.status(404).json({ message: 'Room not found' });
    res.json(bracket);
  } catch (err) {
    console.error('[room] getBracket error', err);
    res.status(500).json({ message: 'Failed to fetch bracket' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { period } = req.query; // 'all' or 'weekly'

    // All-time leaderboard — sorted by ELO rating
    const allTimePlayers = await User.find({ role: 'user' })
      .select('username stats wallet online elo')
      .sort({ elo: -1 })
      .limit(50);

    // Weekly leaderboard — wins in last 7 days from transactions
    let weeklyPlayers = [];
    if (period === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklyStats = await Transaction.aggregate([
        {
          $match: {
            type: 'credit',
            reason: { $regex: /prize/ },
            status: 'completed',
            createdAt: { $gte: weekAgo },
          },
        },
        {
          $group: {
            _id: '$userId',
            totalEarnings: { $sum: '$amount' },
            contestsWon: { $sum: 1 },
          },
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: 50 },
      ]);

      const userIds = weeklyStats.map((s) => s._id);
      const users = await User.find({ _id: { $in: userIds } }).select('username stats online elo');
      const userMap = {};
      users.forEach((u) => { userMap[u._id.toString()] = u; });

      weeklyPlayers = weeklyStats.map((s) => ({
        user: userMap[s._id.toString()],
        totalEarnings: s.totalEarnings,
        contestsWon: s.contestsWon,
      }));
    }

    res.json({ allTime: allTimePlayers, weekly: weeklyPlayers });
  } catch (err) {
    console.error('[room] getLeaderboard error', err);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Refund players if room is still waiting
    if (room.status === 'waiting') {
      for (const playerId of room.players) {
        await User.findByIdAndUpdate(playerId, { $inc: { wallet: room.entryFee } });
        await Transaction.create({
          userId: playerId,
          amount: room.entryFee,
          type: 'credit',
          reason: `refund - room ${roomId} deleted`,
          roomId,
          status: 'completed',
        });
      }
    }

    await Room.deleteOne({ roomId });
    res.json({ message: 'Room deleted', roomId });
  } catch (err) {
    console.error('[room] deleteRoom error', err);
    res.status(500).json({ message: 'Failed to delete room' });
  }
};
