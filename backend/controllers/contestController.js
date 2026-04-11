const ContestType = require('../models/ContestType');
const Contest = require('../models/Contest');

exports.getContests = async (req, res) => {
  try {
    const types = await ContestType.find({ active: true }).lean();

    const result = await Promise.all(types.map(async (ct) => {
      const openContests = await Contest.find({
        contestType: ct._id,
        status: 'open',
      }).populate('players', 'username elo').lean();

      const waitingContests = openContests.filter(c => c.players.length === 1);
      const emptyContests = openContests.filter(c => c.players.length === 0);

      return {
        ...ct,
        openCount: openContests.length,
        waitingCount: waitingContests.length,
        waitingPlayers: waitingContests.map(c => ({
          contestId: c._id,
          player: c.players[0],
        })),
        emptyContests: emptyContests.map(c => c._id),
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('[contests] GET / error:', err);
    res.status(500).json({ message: 'Failed to load contests' });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const contests = await Contest.find({
      players: userId,
      status: 'completed',
    })
      .populate('contestType')
      .populate('winner', 'username')
      .populate('loser', 'username')
      .populate('whitePlayer', 'username elo')
      .populate('blackPlayer', 'username elo')
      .sort({ endedAt: -1 })
      .limit(50)
      .lean();

    res.json(contests);
  } catch (err) {
    console.error('[contests] my-history error:', err);
    res.status(500).json({ message: 'Failed to load history' });
  }
};

exports.getActiveContests = async (req, res) => {
  try {
    const userId = req.user._id;
    const contests = await Contest.find({
      players: userId,
      status: { $in: ['open', 'matched', 'playing'] },
    })
      .populate('contestType')
      .populate('players', 'username elo')
      .lean();

    res.json(contests);
  } catch (err) {
    console.error('[contests] active error:', err);
    res.status(500).json({ message: 'Failed to load active contests' });
  }
};
