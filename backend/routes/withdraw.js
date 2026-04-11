const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');
const { withdraw, approveWithdraw } = require('../controllers/withdrawController');
const { body, validationResult } = require('express-validator');

const validateWithdraw = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

router.post('/', protect, validateWithdraw, withdraw);
router.post('/approve/:transactionId', protect, adminOnly, approveWithdraw);

module.exports = router;
