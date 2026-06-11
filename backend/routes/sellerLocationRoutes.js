const express = require("express");
const router = express.Router();

const { protect, sellerOnly } = require("../middleware/authMiddleware");
const {
  saveSellerLocation,
  getSellerLocation,
} = require("../controllers/sellerLocationController");

// Seller location (GPS + coverage radius)
router.post("/me/location", protect, sellerOnly, saveSellerLocation);
router.get("/me/location", protect, sellerOnly, getSellerLocation);

module.exports = router;
