const express = require("express");
const router = express.Router();
const { handleChatbotQuery, handleChatbotHealth } = require("../controllers/chatbotController");
const { verifyToken } = require("../utils/jwtUtils");

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
router.post("/query", optionalAuth, handleChatbotQuery);

// @route   GET /api/chatbot/health
// @desc    Check chatbot AI/database configuration without exposing secrets
router.get("/health", handleChatbotHealth);

module.exports = router;
