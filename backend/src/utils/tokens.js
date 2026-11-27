const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signAccess = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.ACCESS_EXPIRES || '15m' });

const signRefresh = (user) =>
  jwt.sign({ id: user._id, jti: crypto.randomBytes(8).toString('hex') }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRES || '7d',
  });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { signAccess, signRefresh, hashToken };
