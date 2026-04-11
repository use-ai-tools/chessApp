const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { createOrder, verifySignature } = require('../services/razorpayService');

exports.createOrder = async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  const value = Math.round(amount * 100);
  const order = await createOrder({ amount: value, receipt: `rcpt_${Date.now()}` });

  await Transaction.create({ userId: req.user._id, amount, type: 'credit', status: 'pending', reason: 'wallet top-up', orderId: order.id });
  res.json(order);
};

exports.verify = async (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  if (!order_id || !payment_id || !signature) return res.status(400).json({ message: 'Invalid payload' });

  const verified = verifySignature({ order_id, payment_id, signature });
  if (!verified) return res.status(400).json({ message: 'Payment verification failed' });

  const tx = await Transaction.findOne({ orderId: order_id });
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });

  tx.status = 'completed';
  tx.paymentId = payment_id;
  await tx.save();

  // credit wallet
  const user = await User.findById(req.user._id);
  user.wallet += tx.amount;
  await user.save();

  res.json({ status: 'success', balance: user.wallet });
};

exports.webhook = async (req, res) => {
  const sig = req.headers['x-razorpay-signature'];
  const payload = JSON.stringify(req.body);
  const generated = require('crypto').createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex');
  if (generated !== sig) return res.status(400).send('Invalid signature');

  const { event, payload: eventPayload } = req.body;
  if (event === 'payment.captured') {
    const payment = eventPayload.payment.entity;
    const tx = await Transaction.findOne({ orderId: payment.order_id });
    if (tx) {
      tx.status = 'completed';
      tx.paymentId = payment.id;
      await tx.save();
      await User.findByIdAndUpdate(tx.userId, { $inc: { wallet: tx.amount } });
    }
  }

  res.json({ status: 'ok' });
};
