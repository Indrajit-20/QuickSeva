const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { chargeLead } = require("../controllers/leadChargeController");

router.post("/leads/charge", protect, chargeLead);

// NOTE: this route is mounted under /api in backend/server.js

module.exports = router;
