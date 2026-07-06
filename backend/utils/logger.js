const winston = require("winston");
const path = require("path");
const fs = require("fs");

const logDirectory = path.join(__dirname, "../logs");

// Ensure logs directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Custom format for files (JSON-based with structured details)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }), // Automatically append error stack trace if present
  winston.format.json()
);

// Custom format for console (more readable, colorized)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logStr = `[${timestamp}] ${level}: ${message}`;
    if (Object.keys(meta).length) {
      // Exclude service meta if it's there
      const cleanMeta = { ...meta };
      delete cleanMeta.service;
      if (Object.keys(cleanMeta).length) {
        logStr += ` | Meta: ${JSON.stringify(cleanMeta)}`;
      }
    }
    if (stack) {
      logStr += `\n❌ Stack Trace:\n${stack}`;
    }
    return logStr;
  })
);

// Configure the Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: fileFormat,
  defaultMeta: { service: "quickseva-backend" },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(logDirectory, "combined.log"),
      maxsize: 5242880, // 5MB limit
      maxFiles: 5,
    }),
    // Write only error logs to error.log
    new winston.transports.File({ 
      filename: path.join(logDirectory, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB limit
      maxFiles: 5,
    }),
  ],
});

// Always add Console transport so logs appear in standard console outputs (Terminal / Cloud Dashboard logs)
logger.add(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

module.exports = logger;
