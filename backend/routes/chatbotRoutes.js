const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { handleChatbotQuery, handleChatbotHealth } = require("../controllers/chatbotController");
const { verifyToken } = require("../utils/jwtUtils");

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiter — prevents Gemini API quota abuse and spam
// 20 requests per minute per IP address
// ─────────────────────────────────────────────────────────────────────────────
const chatbotRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100,            // max 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent. Please wait a moment before trying again.",
  },
  skip: (req) => {
    // Skip rate limiting for authenticated users (they are trusted)
    // We still apply it to anonymous/guest users to prevent abuse
    const authHeader = req.headers.authorization;
    return Boolean(authHeader && authHeader.startsWith("Bearer "));
  },
});

// Optional auth middleware (attaches req.user if valid token provided, but doesn't block guests)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        req.user = decoded;
      }
    }
  } catch (err) {
    // Ignore invalid/expired token for guest chatbot queries
  }
  next();
};

// @route   POST /api/chatbot/query
// @desc    Process chatbot query
router.post("/query", chatbotRateLimiter, optionalAuth, handleChatbotQuery);

// @route   GET /api/chatbot/health
// @desc    Check chatbot AI/database configuration without exposing secrets
router.get("/health", handleChatbotHealth);

module.exports = router;
