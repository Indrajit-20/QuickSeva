const express = require("express");
const router = express.Router();
const { searchNearby } = require("../controllers/searchController");

// Public route for nearby location-based seller and services search
router.get("/nearby", searchNearby);

module.exports = router;
