const logger = require("../utils/logger");

// 404 handler
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // MySQL duplicate entry
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 400;
    message = "Duplicate entry: this record already exists";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Log the complete error trace and context to Winston logger
  logger.error(err.message || "Internal Server Error", {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    statusCode,
  });

  // Sanitizing internal errors to prevent security leaks of database queries / stack traces to users
  if (statusCode === 500) {
    message = "An internal server error occurred. Please try again later.";
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
