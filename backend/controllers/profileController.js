const User = require('../models/User');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');

const VALID_AVATARS = ['♔', '♕', '♖', '♗', '♘', '♙'];

exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || !VALID_AVATARS.includes(avatar)) {
      return res.status(400).json({ message: 'Invalid avatar. Choose from: ♔ ♕ ♖ ♗ ♘ ♙' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    ).select('-password -activeSession');

    res.json({ message: 'Avatar updated', avatar: user.avatar });
  } catch (err) {
    console.error('[profile] updateAvatar error', err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('[profile] changePassword error', err);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -activeSession');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Calculate total earnings from credit transactions
    const earningsResult = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: 'credit',
          reason: { $regex: /prize/i },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
        },
      },
    ]);

    const totalEarnings = earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0;
    const stats = user.paidStats || {};
    const totalMatches = stats.totalMatches || 0;
    const wins = stats.wins || 0;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    res.json({
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar || '♔',
        elo: user.elo?.free || 1000,
        createdAt: user.createdAt,
      },
      stats: {
        totalMatches,
        wins,
        losses,
        winRate,
        totalEarnings,
        winStreak: stats.winStreak || 0,
        recentResults: stats.recentResults || [],
      },
    });
  } catch (err) {
    console.error('[profile] getStats error', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};
