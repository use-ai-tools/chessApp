const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createOrder = async ({ amount, currency = 'INR', receipt }) => {
  const order = await razorpayClient.orders.create({ amount, currency, receipt, payment_capture: 1 });
  return order;
};

exports.verifySignature = ({ order_id, payment_id, signature }) => {
  const generated = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');
  return generated === signature;
};
