export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose / MongoDB duplicate key error (duplicate participation)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'You have already joined this event.';
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  }
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack }),
  });
};
