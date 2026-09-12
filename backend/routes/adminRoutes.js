const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getStats,
  getUsers,
  getSellers,
  getBookings,
  getDisputes,
  resolveDispute,
  getCategories,
  createCategory,
  toggleCategory,
  exportUsersCSV,
  exportSellersCSV,
  exportBookingsCSV,
  exportDisputesCSV,
  getPayments,
  exportPaymentsCSV,
  getReviews,
  deleteReview,
  exportReviewsCSV,
  getLeads,
  updateLeadStatus,
  exportLeadsCSV,
  bulkImportServices,
  sendBulkWhatsApp,
  getContractorVerifications,
  reviewContractorVerification,
  getAdminContractorPosts,
  updateAdminContractorPostStatus,
  getAdminQuoteRequests,
  updateAdminQuoteRequestStatus,
  getAdminContractorAnalytics,
} = require("../controllers/adminController");

// Apply admin protection to all routes in this file
router.use(protect, adminOnly);

// Stats & Dashboard
router.get("/stats", getStats);

// Users, Sellers, and Bookings Management
router.get("/users", getUsers);
router.get("/sellers", getSellers);
router.get("/bookings", getBookings);

// Contractor Verifications & Posts Moderation Management
router.get("/contractor-verifications", getContractorVerifications);
router.patch("/contractor-verifications/:id", reviewContractorVerification);
router.get("/contractor-posts", getAdminContractorPosts);
router.patch("/contractor-posts/:id/status", updateAdminContractorPostStatus);
router.get("/quote-requests", getAdminQuoteRequests);
router.patch("/quote-requests/:id/status", updateAdminQuoteRequestStatus);
router.get("/contractor-analytics", getAdminContractorAnalytics);

// Excel / CSV Exports
router.get("/export/users", exportUsersCSV);
router.get("/export/sellers", exportSellersCSV);
router.get("/export/bookings", exportBookingsCSV);
router.get("/export/disputes", exportDisputesCSV);
router.get("/export/payments", exportPaymentsCSV);
router.get("/export/reviews", exportReviewsCSV);
router.get("/export/leads", exportLeadsCSV);
router.get("/payments", getPayments);
router.get("/reviews", getReviews);
router.delete("/reviews/:id", deleteReview);
router.get("/leads", getLeads);
router.patch("/leads/:id/status", updateLeadStatus);

// Bulk Import & WhatsApp Broadcasts
router.post("/import/services", bulkImportServices);
router.post("/whatsapp/send-bulk", sendBulkWhatsApp);

// Disputes
router.get("/disputes", getDisputes);
router.post("/disputes/:orderId/resolve", resolveDispute);

// Categories CRUD
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id/toggle", toggleCategory);

module.exports = router;
