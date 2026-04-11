const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { createOrder, verify, webhook } = require('../controllers/paymentController');
const { validatePayment } = require('../middlewares/validators');

router.post('/create-order', protect, validatePayment, createOrder);
router.post('/verify', protect, verify);
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

module.exports = router;
