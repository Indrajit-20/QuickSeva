// 404 handler
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.stack || err.message);

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

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
