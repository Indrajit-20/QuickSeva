const express = require("express");
const router = express.Router();
const { submitLead, getSellerLeads, getUnreadLeadsCount } = require("../controllers/leadController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");

router.post("/submit-lead", submitLead);
router.get("/seller/leads/unread-count", protect, sellerOnly, getUnreadLeadsCount);
router.get("/seller/leads", protect, sellerOnly, getSellerLeads);

module.exports = router;
