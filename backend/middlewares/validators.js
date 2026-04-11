const { body, validationResult } = require('express-validator');

exports.validateRoom = [
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('maxPlayers').isInt({ min: 2 }).withMessage('Max players must be at least 2'),
  body('entryFee').isFloat({ min: 1 }).withMessage('Entry fee must be positive'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

exports.validatePayment = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];
