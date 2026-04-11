const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', protect, notificationController.getNotifications);
router.post('/read-all', protect, notificationController.markAsRead);
router.post('/:id/read', protect, notificationController.markOneAsRead);

module.exports = router;
