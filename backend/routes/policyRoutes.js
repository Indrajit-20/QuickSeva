const express = require("express");
const router = express.Router();
const { getPolicy, updatePolicy, getSystemSettingsPublic } = require("../controllers/policyController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.get("/settings", getSystemSettingsPublic);
router.get("/:key", getPolicy);

// Admin-only protected routes
router.put("/:key", protect, adminOnly, updatePolicy);

module.exports = router;
