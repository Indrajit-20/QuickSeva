const express = require("express");
const router = express.Router();
const { submitLead, getSellerLeads } = require("../controllers/leadController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");

router.post("/submit-lead", submitLead);
router.get("/seller/leads", protect, sellerOnly, getSellerLeads);

module.exports = router;
