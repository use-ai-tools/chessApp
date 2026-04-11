const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const contestController = require('../controllers/contestController');

// GET /api/contests — All contest types with open contest counts
router.get('/', protect, contestController.getContests);

// GET /api/contests/my-history — User's completed contests
router.get('/my-history', protect, contestController.getMyHistory);

// GET /api/contests/active — User's active/playing contests
router.get('/active', protect, contestController.getActiveContests);

// GET /api/contests/:id — Single contest details
router.get('/:id', protect, contestController.getContestDetails);

module.exports = router;
