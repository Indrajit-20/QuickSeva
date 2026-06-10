const express = require("express");
const router = express.Router();
const {
  getNearbySellers, getCategories, getNearbyByCategory,
} = require("../controllers/nearbyController");

// All public routes (no auth needed to browse)
router.get("/sellers",                  getNearbySellers);
router.get("/categories",               getCategories);
router.get("/category/:category_id",    getNearbyByCategory);

module.exports = router;
