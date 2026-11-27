const AppError = require('../utils/AppError');

// Centralised error-handling middleware
module.exports = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let error = err;

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = new AppError('Validation failed', 400, errors);
  } else if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`Duplicate value for ${field}`, 409);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  } else if (err.type === 'entity.parse.failed') {
    error = new AppError('Malformed JSON body', 400);
  }

  const status = error.statusCode || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    ...(error.errors ? { errors: error.errors } : {}),
  });
};
