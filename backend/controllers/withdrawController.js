const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.withdraw = async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.wallet < amount) return res.status(400).json({ message: 'Insufficient balance' });

  user.wallet -= amount;
  await user.save();

  const tx = await Transaction.create({ userId: user._id, amount, type: 'debit', status: 'pending', reason: 'withdraw request' });
  res.json({ message: 'Withdraw request created', transaction: tx });
};

exports.approveWithdraw = async (req, res) => {
  const { transactionId } = req.params;
  const tx = await Transaction.findById(transactionId);
  if (!tx || tx.type !== 'debit') return res.status(404).json({ message: 'Withdraw transaction not found' });
  if (tx.status !== 'pending') return res.status(400).json({ message: 'Already processed' });

  tx.status = 'completed';
  await tx.save();
  res.json({ message: 'Withdraw approved', transaction: tx });
};
