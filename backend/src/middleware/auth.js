const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Protected route: valid access token required
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new AppError('Not authenticated. Please log in.', 401);
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET); // errors handled centrally
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError('User no longer exists or is deactivated.', 401);
  req.user = user;
  next();
});

// RBAC: restrict to given roles
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};
