const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// POST /api/user/deduct-balance
router.post('/deduct-balance', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.wallet < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.wallet -= amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount,
      type: 'debit',
      reason: 'Puzzle unlock',
      status: 'completed',
    });

    return res.json({ wallet: user.wallet, message: `₹${amount} deducted` });
  } catch (err) {
    console.error('[user] deduct-balance error:', err);
    return res.status(500).json({ message: 'Failed to deduct balance' });
  }
});

// POST /api/user/add-balance
router.post('/add-balance', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wallet += amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount,
      type: 'credit',
      reason: 'Puzzle completion reward',
      status: 'completed',
    });

    return res.json({ wallet: user.wallet, message: `₹${amount} added` });
  } catch (err) {
    console.error('[user] add-balance error:', err);
    return res.status(500).json({ message: 'Failed to add balance' });
  }
});

module.exports = router;
