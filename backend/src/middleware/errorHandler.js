/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // If headers have already been sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  // Format standard API error response
  res.status(statusCode).json({
    success: false,
    status: status,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
