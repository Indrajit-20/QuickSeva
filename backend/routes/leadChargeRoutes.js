const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { chargeLead, checkLeadCharge } = require("../controllers/leadChargeController");

router.post("/leads/charge", protect, chargeLead);
router.get("/leads/check", protect, checkLeadCharge);

// NOTE: this route is mounted under /api in backend/server.js

module.exports = router;
