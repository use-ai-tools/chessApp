const jwt = require('jsonwebtoken');

const signToken = (id, sessionId) => {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { signToken, verifyToken };