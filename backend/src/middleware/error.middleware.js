const logger = require('../utils/logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error converter middleware - converts non-ApiError errors to ApiError
 */
const errorConverter = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

/**
 * Error handler middleware - sends error response to client
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Handle specific error types
  if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    message = 'A record with this value already exists';
    
    // Extract field name if possible
    if (err.detail) {
      const match = err.detail.match(/Key \((.*?)\)/);
      if (match) {
        message = `A record with this ${match[1]} already exists`;
      }
    }
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference to related record';
  } else if (err.code === '23502') {
    // PostgreSQL not null violation
    statusCode = 400;
    message = 'Missing required field';
    if (err.column) {
      message = `Missing required field: ${err.column}`;
    }
  } else if (err.code === '22P02') {
    // PostgreSQL invalid text representation
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message || 'Validation failed';
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }
  
  // Log error
  if (!err.isOperational) {
    logger.error('API Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.username,
    });
  }
  
  // Send response
  const response = {
    success: false,
    message: isProduction && !err.isOperational 
      ? 'An unexpected error occurred. Please try again later.' 
      : message,
    ...(isProduction ? {} : { 
      error: err.message,
      stack: err.stack,
      code: err.code,
    }),
  };
  
  res.status(statusCode).json(response);
};

/**
 * 404 handler - called when no route matches
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  ApiError,
  errorConverter,
  errorHandler,
  notFoundHandler,
};
