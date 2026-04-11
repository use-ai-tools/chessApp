const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    if (user.banned) return res.status(403).json({ message: 'Account banned' });
    if (payload.sessionId && user.activeSession && payload.sessionId !== user.activeSession) {
      return res.status(401).json({ message: 'Session invalidated' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token error' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

module.exports = { protect, adminOnly };