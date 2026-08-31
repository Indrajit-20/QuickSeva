const express = require("express");
const router = express.Router();
const socialLeadController = require("../controllers/socialLeadController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");

// All routes require seller authentication
router.use(protect, sellerOnly);

// Stats & Overview
router.get("/stats", socialLeadController.getStats);

// Conversations & Leads
router.get("/conversations", socialLeadController.getConversations);
router.get("/conversations/:id", socialLeadController.getConversationById);
router.post("/conversations/:id/messages", socialLeadController.sendMessage);
router.patch("/conversations/:id/status", socialLeadController.updateStatus);
router.post("/conversations/:id/notes", socialLeadController.addNote);
router.post("/conversations/:id/convert", socialLeadController.convertToBooking);

// Social Accounts Management
router.get("/accounts", socialLeadController.getSocialAccounts);
router.post("/accounts/toggle", socialLeadController.toggleSocialAccount);

module.exports = router;
