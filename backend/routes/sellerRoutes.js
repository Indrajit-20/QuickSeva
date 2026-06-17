const express = require("express");
const router = express.Router();
const {
  createSellerProfile,
  getMySellerProfile,
  getSellerById,
  updateSellerProfile,
  toggleAvailability,
  uploadDocuments,
  getAllSellers,
  verifySeller,
  registerSeller,
  getMySellerCategories,
  getSellerAvailability,
  updateSellerAvailability,
} = require("../controllers/sellerController");

const {
  protect,
  sellerOnly,
  adminOnly,
} = require("../middleware/authMiddleware");
const {
  uploadDocuments: uploadDocs,
} = require("../middleware/uploadMiddleware");

// Public
router.get("/:id", getSellerById);

// Public: Seller registration
router.post("/register", registerSeller);

// Authenticated
router.post("/", protect, createSellerProfile);

router.get("/me/categories", protect, sellerOnly, getMySellerCategories);
router.get("/me/availability", protect, sellerOnly, getSellerAvailability);
router.patch("/me/availability", protect, sellerOnly, updateSellerAvailability);
router.get("/me/profile", protect, getMySellerProfile);
router.put("/me/profile", protect, sellerOnly, updateSellerProfile);
router.patch(
  "/me/toggle-availability",
  protect,
  sellerOnly,
  toggleAvailability,
);
router.post(
  "/me/documents",
  protect,
  sellerOnly,
  uploadDocs.array("documents", 5),
  uploadDocuments,
);

// Admin
router.get("/", protect, adminOnly, getAllSellers);
router.patch("/:id/verify", protect, adminOnly, verifySeller);

module.exports = router;
