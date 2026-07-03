/**
 * Global error-handling middleware. Must be registered last (4 args).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId / cast error.
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found';
  }

  // Mongoose validation error → use the first validation message.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const firstError = Object.values(err.errors)[0];
    message = firstError ? firstError.message : 'Validation error';
  }

  // Mongoose duplicate key error.
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
  }

  // JWT errors.
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
