const express = require("express");
const router = express.Router();
const {
  createService,
  getMyServices,
  getServiceById,
  getServicesBySeller,
  searchServices,
  updateService,
  deleteService,
  getSubServicesByCategory,
} = require("../controllers/serviceController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");
const { uploadService } = require("../middleware/uploadMiddleware");

// Public
router.get("/search",                 searchServices);
router.get("/seller/:sellerId",       getServicesBySeller);
router.get("/sub-services/:categoryId", getSubServicesByCategory);

// Seller only
router.post("/",             protect, sellerOnly, uploadService.array("images", 5), createService);
router.get("/my-services",   protect, sellerOnly, getMyServices);
router.get("/me/my",         protect, sellerOnly, getMyServices); // Keep compatibility
router.get("/:id",           protect, getServiceById); // Allow both public and protected lookup
router.put("/:id",           protect, sellerOnly, uploadService.array("images", 5), updateService);
router.delete("/:id",        protect, sellerOnly, deleteService);

module.exports = router;
