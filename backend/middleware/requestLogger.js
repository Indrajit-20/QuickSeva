const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const statusCode = res.statusCode;
    
    const logMsg = `${method} ${originalUrl} ${statusCode} - ${duration}ms (IP: ${ip})`;
    
    const meta = {
      method,
      url: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip
    };
    
    if (statusCode >= 500) {
      logger.error(logMsg, meta);
    } else if (statusCode >= 400) {
      logger.warn(logMsg, meta);
    } else {
      logger.info(logMsg, meta);
    }
  });
  
  next();
};

module.exports = requestLogger;
