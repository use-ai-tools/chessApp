const User = require('../models/User');
const Room = require('../models/Room');
const Transaction = require('../models/Transaction');
const SuspiciousLog = require('../models/SuspiciousLog');
const { signToken } = require('../utils/jwt');
const crypto = require('crypto');

/**
 * Separate admin login endpoint.
 * Validates that the user has role: 'admin'.
 */
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Not an admin account' });
    if (user.banned) return res.status(403).json({ message: 'Account banned' });

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const sessionId = crypto.randomBytes(16).toString('hex');
    user.activeSession = sessionId;
    await user.save();

    const token = signToken(user._id, sessionId);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        wallet: user.wallet,
        elo: user.elo || 1000,
        stats: user.stats,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[admin] login error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
};

exports.listRooms = async (req, res) => {
  const rooms = await Room.find().populate('players', 'username').sort({ createdAt: -1 });
  res.json(rooms);
};

exports.listTransactions = async (req, res) => {
  const tx = await Transaction.find().populate('userId', 'username').sort({ createdAt: -1 }).limit(200);
  res.json(tx);
};

exports.flagUser = async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId || !reason) return res.status(400).json({ message: 'userId and reason required' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.flags = user.flags || [];
  user.flags.push(reason);
  await user.save();

  await SuspiciousLog.create({ userId, reason, details: { flaggedBy: req.user._id } });

  res.json({ status: 'flagged', user });
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot ban admin' });

    user.banned = true;
    await user.save();

    await SuspiciousLog.create({
      userId,
      reason: 'banned',
      details: { bannedBy: req.user._id },
    });

    res.json({ status: 'banned', userId });
  } catch (err) {
    console.error('[admin] ban error', err);
    res.status(500).json({ message: 'Failed to ban user' });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.banned = false;
    await user.save();

    res.json({ status: 'unbanned', userId });
  } catch (err) {
    console.error('[admin] unban error', err);
    res.status(500).json({ message: 'Failed to unban user' });
  }
};

exports.editRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, entryFee, maxPlayers, prizeDistribution } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status !== 'waiting') return res.status(400).json({ message: 'Can only edit waiting rooms' });

    if (name) room.name = name;
    if (entryFee !== undefined) room.entryFee = Number(entryFee);
    if (maxPlayers) room.maxPlayers = Number(maxPlayers);
    if (prizeDistribution) room.prizeDistribution = prizeDistribution;

    await room.save();
    res.json(room);
  } catch (err) {
    console.error('[admin] editRoom error', err);
    res.status(500).json({ message: 'Failed to edit room' });
  }
};

exports.liveMatches = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'ongoing' })
      .populate('players', 'username elo')
      .populate('matches.player1 matches.player2 matches.winner', 'username');

    const liveMatches = [];
    for (const room of rooms) {
      const activeMatches = room.matches.filter((m) => m.status === 'playing');
      for (const match of activeMatches) {
        liveMatches.push({
          roomId: room.roomId,
          roomName: room.name,
          matchId: match._id,
          player1: match.player1,
          player2: match.player2,
          round: match.round,
          startedAt: match.startedAt,
          moveCount: match.moves?.length || 0,
        });
      }
    }

    res.json(liveMatches);
  } catch (err) {
    console.error('[admin] liveMatches error', err);
    res.status(500).json({ message: 'Failed to fetch live matches' });
  }
};

exports.manualCredit = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount) return res.status(400).json({ message: 'userId and amount required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wallet += Number(amount);
    await user.save();

    await Transaction.create({
      userId,
      amount: Number(amount),
      type: 'credit',
      reason: reason || `Manual credit by admin ${req.user.username}`,
      status: 'completed',
    });

    res.json({ status: 'credited', wallet: user.wallet });
  } catch (err) {
    console.error('[admin] manualCredit error', err);
    res.status(500).json({ message: 'Failed to credit' });
  }
};

exports.listSuspicious = async (req, res) => {
  const logs = await SuspiciousLog.find().populate('userId', 'username').sort({ createdAt: -1 }).limit(100);
  res.json(logs);
};

exports.getMatch = async (req, res) => {
  const { id } = req.params;
  const room = await Room.findOne({ 'matches._id': id });
  if (!room) return res.status(404).json({ message: 'Match not found' });
  const match = room.matches.id(id);
  res.json({ roomId: room.roomId, match });
};

exports.analytics = async (req, res) => {
  const roomsCount = await Room.countDocuments();
  const usersCount = await User.countDocuments();
  const txCount = await Transaction.countDocuments();
  const ongoingCount = await Room.countDocuments({ status: 'ongoing' });
  const waitingCount = await Room.countDocuments({ status: 'waiting' });
  const bannedCount = await User.countDocuments({ banned: true });
  const revenue = await Transaction.aggregate([
    { $match: { type: 'credit', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  res.json({
    roomsCount,
    usersCount,
    txCount,
    ongoingCount,
    waitingCount,
    bannedCount,
    revenue: revenue[0]?.total || 0,
  });
};

/**
 * Admin: Add balance to user by username
 * POST /api/admin/add-balance { username, amount }
 */
exports.addBalanceToUser = async (req, res) => {
  try {
    const { username, amount } = req.body;
    if (!username || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Username and positive amount required' });
    }

    // Case-insensitive user search
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.wallet = (user.wallet || 0) + Number(amount);
    await user.save();

    // Log transaction
    await Transaction.create({
      userId: user._id,
      amount: Number(amount),
      type: 'credit',
      reason: `Admin credited ₹${amount} to ${user.username}`,
      status: 'completed',
    });

    res.json({ success: true, message: 'Balance added', wallet: user.wallet });
  } catch (err) {
    console.error('[admin] addBalanceToUser error', err);
    res.status(500).json({ success: false, message: 'Failed to add balance' });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    const Contest = require('../models/Contest');
    const Tournament = require('../models/Tournament');
    
    const txRes = await Transaction.deleteMany({});
    const contestRes = await Contest.deleteMany({});
    const roomRes = await Room.deleteMany({});
    const tourneyRes = await Tournament.deleteMany({});

    res.json({
      success: true,
      message: 'History cleared',
      deleted: {
        transactions: txRes.deletedCount,
        contests: contestRes.deletedCount,
        rooms: roomRes.deletedCount,
        tournaments: tourneyRes.deletedCount
      }
    });
  } catch (err) {
    console.error('[admin] clearHistory error', err);
    res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
};
