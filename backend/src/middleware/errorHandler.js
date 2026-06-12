/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // If headers have already been sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development VS Production error responses
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production response (do not leak stack traces or internal errors to users)
    res.status(err.statusCode).json({
      status: err.status,
      message: err.statusCode === 500 ? 'Something went wrong on our end!' : err.message
    });
  }
};

export default errorHandler;
