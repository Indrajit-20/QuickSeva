const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getStats,
  getUsers,
  getSellers,
  getDisputes,
  resolveDispute,
  getCategories,
  createCategory,
  toggleCategory,
  exportUsersCSV,
  exportSellersCSV,
  exportBookingsCSV,
  bulkImportServices,
  sendBulkWhatsApp,
} = require("../controllers/adminController");

// Apply admin protection to all routes in this file
router.use(protect, adminOnly);

// Stats & Dashboard
router.get("/stats", getStats);

// Users and Sellers Management
router.get("/users", getUsers);
router.get("/sellers", getSellers);

// Excel / CSV Exports
router.get("/export/users", exportUsersCSV);
router.get("/export/sellers", exportSellersCSV);
router.get("/export/bookings", exportBookingsCSV);

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
