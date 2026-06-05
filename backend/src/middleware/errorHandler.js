const logger = require('../config/logger');

function errorHandler(err, req, res, _next) {
  const status  = err.status || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    logger.error(`${req.method} ${req.path} → ${status}`, { message: err.message, stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.path} → ${status}: ${message}`);
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.code && { code: err.code }),
    ...(process.env.NODE_ENV !== 'production' && status >= 500 && { stack: err.stack }),
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
}

module.exports = { errorHandler, notFound };
