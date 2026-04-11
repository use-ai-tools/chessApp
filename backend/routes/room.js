const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { validateRoom } = require('../middlewares/validators');
const {
  listRooms,
  createRoom,
  joinRoom,
  getRoomDetails,
  getMyContests,
  getLiveContests,
  getBracket,
  getLeaderboard,
  deleteRoom,
} = require('../controllers/roomController');

router.get('/', protect, listRooms);
router.post('/create', protect, validateRoom, createRoom);
router.post('/join', protect, joinRoom);
router.get('/my-contests', protect, getMyContests);
router.get('/live', protect, getLiveContests);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/:roomId', protect, getRoomDetails);
router.get('/:roomId/bracket', protect, getBracket);
router.delete('/:roomId', protect, deleteRoom);

module.exports = router;