const express = require("express");
const router = express.Router();
const socialLeadController = require("../controllers/socialLeadController");
const { protect, contractorOrSeller } = require("../middleware/authMiddleware");

// ── Public Meta Webhooks & OAuth Callback Endpoints ──
router.get("/meta/callback", socialLeadController.handleMetaCallback);
router.get("/meta/webhook", socialLeadController.verifyMetaWebhook);
router.post("/meta/webhook", socialLeadController.receiveMetaWebhook);

// ── Protected Routes (Require seller or contractor auth) ──
router.use(protect, contractorOrSeller);

// Meta Connect Initiator
router.get("/meta/connect", socialLeadController.initiateMetaAuth);

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
