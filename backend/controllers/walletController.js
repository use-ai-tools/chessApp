const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.getWallet = async (req, res) => {
  try {
    const tx = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ wallet: req.user.wallet, transactions: tx });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load wallet' });
  }
};

exports.addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (amount > 10000) return res.status(400).json({ message: 'Maximum deposit is ₹10,000' });

    const user = await User.findById(req.user._id);

    if (user.depositLimit > 0) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyDeposits = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: 'credit',
            reason: 'wallet top-up',
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const deposited = monthlyDeposits[0]?.total || 0;
      if (deposited + amount > user.depositLimit) {
        return res.status(400).json({
          message: `Deposit limit exceeded. Monthly limit: ₹${user.depositLimit}, used: ₹${deposited}`,
        });
      }
    }

    user.wallet += amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount,
      type: 'credit',
      reason: 'wallet top-up',
      status: 'completed',
    });

    res.json({ wallet: user.wallet, message: `₹${amount} added successfully` });
  } catch (err) {
    console.error('[wallet] add-money error:', err);
    res.status(500).json({ message: 'Failed to add money' });
  }
};

exports.withdrawMoney = async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (amount < 50) return res.status(400).json({ message: 'Minimum withdrawal is ₹50' });
    if (!upiId) return res.status(400).json({ message: 'UPI ID is required' });

    const user = await User.findById(req.user._id);
    if (user.wallet < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    let tdsDeduction = 0;
    const totalWinnings = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'credit', reason: { $regex: /^Won/ } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalWon = totalWinnings[0]?.total || 0;
    if (totalWon > 10000) {
      tdsDeduction = Math.round(amount * 0.3); 
    }

    const finalAmount = amount - tdsDeduction;
    user.wallet -= amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount,
      type: 'debit',
      reason: `Withdrawal to ${upiId}${tdsDeduction > 0 ? ` (TDS: ₹${tdsDeduction})` : ''}`,
      status: 'pending',
    });

    res.json({
      wallet: user.wallet,
      message: `Withdrawal of ₹${finalAmount} requested. ${tdsDeduction > 0 ? `TDS deducted: ₹${tdsDeduction}. ` : ''}Processing in 24-48 hours.`,
      tdsDeduction,
    });
  } catch (err) {
    console.error('[wallet] withdraw error:', err);
    res.status(500).json({ message: 'Failed to process withdrawal' });
  }
};

exports.setDepositLimit = async (req, res) => {
  try {
    const { limit } = req.body;
    if (limit !== undefined && (limit < 0 || limit > 100000)) {
      return res.status(400).json({ message: 'Invalid limit (0 to ₹1,00,000)' });
    }
    await User.findByIdAndUpdate(req.user._id, { depositLimit: limit || 0 });
    res.json({ message: limit > 0 ? `Monthly deposit limit set to ₹${limit}` : 'Deposit limit removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to set limit' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      transactions,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load transactions' });
  }
};
