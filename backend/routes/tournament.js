const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { protect } = require('../middlewares/auth');

router.get('/', tournamentController.listTournaments);
router.post('/:id/register', protect, tournamentController.register);

module.exports = router;
