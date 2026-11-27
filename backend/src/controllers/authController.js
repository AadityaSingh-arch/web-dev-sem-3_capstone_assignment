const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signAccess, signRefresh, hashToken } = require('../utils/tokens');

async function issueTokens(user, res, status = 200) {
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  user.refreshTokenHash = hashToken(refreshToken); // only a hash is stored
  await user.save({ validateBeforeSave: false });
  res.status(status).json({ success: true, user, accessToken, refreshToken });
}

// POST /api/auth/register  (public registration always creates a complainant)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, userType } = req.body;
  if (await User.findOne({ email: String(email || '').toLowerCase() })) throw new AppError('Email already registered', 409);
  const user = await User.create({ name, email, password, userType: userType === 'staff' ? 'staff' : 'student', role: 'complainant' });
  await issueTokens(user, res, 201);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated', 403);
  await issueTokens(user, res);
});

// POST /api/auth/refresh  (rotates the refresh token)
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshTokenHash');
  if (!user || !user.isActive || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new AppError('Refresh token is invalid or has been revoked', 401);
  }
  await issueTokens(user, res);
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $unset: { refreshTokenHash: 1 } });
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  await req.user.populate('department', 'name');
  res.json({ success: true, user: req.user });
});
