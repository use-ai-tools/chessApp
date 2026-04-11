const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');

router.post('/', protect, chatController.processChat);

module.exports = router;
