// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = statusCode === 500 ? 'Something went wrong. Please try again.' : err.message;

  if (err.code === 11000) {
    statusCode = 409;
    message = 'You have already joined this event.';
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body.';
  }

  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
