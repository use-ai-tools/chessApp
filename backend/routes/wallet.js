const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const walletController = require('../controllers/walletController');

// GET /api/wallet — Balance + recent transactions
router.get('/', protect, walletController.getWallet);

// POST /api/wallet/add-money — Add money to wallet
router.post('/add-money', protect, walletController.addMoney);

// POST /api/wallet/withdraw — Request withdrawal
router.post('/withdraw', protect, walletController.withdrawMoney);

// POST /api/wallet/set-deposit-limit
router.post('/set-deposit-limit', protect, walletController.setDepositLimit);

// GET /api/wallet/transactions — Full transaction history with pagination
router.get('/transactions', protect, walletController.getTransactions);

module.exports = router;