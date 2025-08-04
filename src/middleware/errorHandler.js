const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too many requests';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  } else if (err.response && err.response.status) {
    statusCode = err.response.status;
    message = err.response.data?.message || 'External service error';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

module.exports = { errorHandler }; 