const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const bonusController = require('../controllers/bonusController');

router.post('/claim', protect, bonusController.claimDailyBonus);

module.exports = router;
