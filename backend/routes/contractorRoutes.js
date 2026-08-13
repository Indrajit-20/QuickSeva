const express = require("express");
const router = express.Router();
const ContractorController = require("../controllers/contractorController");
const { protect } = require("../middleware/authMiddleware");

// Optional auth middleware: Attaches user details if valid token passed, but NEVER blocks guest requests if token is invalid/expired
const optionalProtect = async (req, res, next) => {
  try {
    let token = req.cookies?.authToken;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token && token !== "null" && token !== "undefined") {
      const { verifyToken } = require("../utils/jwtUtils");
      const { pool } = require("../config/db");
      try {
        const decoded = verifyToken(token);
        if (decoded?.id) {
          const [rows] = await pool.query(
            "SELECT id, name, email, phone, role, company_name, trade_specialization FROM users WHERE id = ?",
            [decoded.id]
          );
          if (rows.length) req.user = rows[0];
        }
      } catch (tokenErr) {
        // Expired or invalid token in optionalProtect: treat as guest gracefully
        req.user = null;
      }
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

// ==========================================
// PUBLIC & CUSTOMER ENDPOINTS
// ==========================================
// Public work site posts feed
router.get("/posts", ContractorController.getPublicPosts);

// Single post details
router.get("/posts/:id", ContractorController.getPostById);

// Public Contractors Directory (for Customers to find Contractors)
router.get("/directory", ContractorController.getContractorsDirectory);

// Customer -> Contractor quote request / callback
router.post("/quote-request", ContractorController.createQuoteRequest);

// Agency / Worker application to contractor site post
router.post("/applications", ContractorController.createApplication);

// Create post (Guest or Logged-in Contractor)
router.post("/posts", optionalProtect, ContractorController.createPost);

// Register / Upgrade user role to Contractor (Supports Guest registration or Logged-in Upgrade)
router.post("/register", optionalProtect, ContractorController.registerContractor);

// ==========================================
// PROTECTED CONTRACTOR DASHBOARD ENDPOINTS
// ==========================================
// Get contractor's own posts
router.get("/my-posts", protect, ContractorController.getMyPosts);

// Update post status (active / closed)
router.patch("/posts/:id/status", protect, ContractorController.updatePostStatus);

// Get applications for a contractor's post
router.get("/posts/:id/applications", protect, ContractorController.getPostApplications);

// Get customer quote requests for contractor dashboard
router.get("/my-quote-requests", protect, ContractorController.getQuoteRequests);

module.exports = router;
