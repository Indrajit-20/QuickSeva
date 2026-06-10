const express = require("express");
const router = express.Router();
const {
  createService, getMyServices, getServiceById,
  getServicesBySeller, searchServices, updateService, deleteService,
} = require("../controllers/serviceController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");
const { uploadService } = require("../middleware/uploadMiddleware");

// Public
router.get("/search",                 searchServices);
router.get("/:id",                    getServiceById);
router.get("/seller/:sellerId",       getServicesBySeller);

// Seller only
router.post("/",     protect, sellerOnly, uploadService.array("images", 5), createService);
router.get("/me/my", protect, sellerOnly, getMyServices);
router.put("/:id",   protect, sellerOnly, uploadService.array("images", 5), updateService);
router.delete("/:id", protect, sellerOnly, deleteService);

module.exports = router;
