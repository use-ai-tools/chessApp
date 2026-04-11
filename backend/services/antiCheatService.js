const User = require('../models/User');
const SuspiciousLog = require('../models/SuspiciousLog');

const logSuspicious = async (userId, reason, details) => {
  await SuspiciousLog.create({ userId, reason, details });
  const user = await User.findById(userId);
  if (user) {
    user.flags = user.flags || [];
    user.flags.push(reason);
    await user.save();
  }
};

exports.checkMoveTime = async ({ userId, durationMs }) => {
  if (durationMs < 500) {
    await logSuspicious(userId, 'fast-move', { durationMs });
  }
};

exports.checkInactivity = async ({ userId, lastActionAt }) => {
  if (!lastActionAt) return;
  if (Date.now() - new Date(lastActionAt).getTime() > 30000) {
    await logSuspicious(userId, 'inactive', { lastActionAt });
  }
};

exports.logAccuracy = async (userId, score) => {
  if (score > 0.95) {
    await logSuspicious(userId, 'high-accuracy-engine-like', { score });
  }
};

exports.logSuspicious = logSuspicious;
