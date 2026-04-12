const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');
const {
  adminLogin,
  listUsers,
  listRooms,
  listTransactions,
  flagUser,
  banUser,
  unbanUser,
  editRoom,
  liveMatches,
  manualCredit,
  listSuspicious,
  getMatch,
  analytics,
  addBalanceToUser,
  clearHistory
} = require('../controllers/adminController');

// Public admin login (no auth middleware)
router.post('/login', adminLogin);

// Protected admin-only routes
router.get('/users', protect, adminOnly, listUsers);
router.get('/rooms', protect, adminOnly, listRooms);
router.get('/transactions', protect, adminOnly, listTransactions);
router.post('/flag-user', protect, adminOnly, flagUser);
router.put('/ban/:userId', protect, adminOnly, banUser);
router.put('/unban/:userId', protect, adminOnly, unbanUser);
router.put('/rooms/:roomId', protect, adminOnly, editRoom);
router.get('/live-matches', protect, adminOnly, liveMatches);
router.post('/credit', protect, adminOnly, manualCredit);
router.get('/suspicious-users', protect, adminOnly, listSuspicious);
router.get('/match/:id', protect, adminOnly, getMatch);
router.get('/analytics', protect, adminOnly, analytics);

// Add balance to user by admin
router.post('/add-balance', protect, adminOnly, addBalanceToUser);

// Clear transaction and match history
router.post('/clear-history', protect, adminOnly, clearHistory);

module.exports = router;