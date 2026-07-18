const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");

router.post("/create-order", protect, sellerOnly, createOrder);
router.post("/verify", protect, sellerOnly, verifyPayment);

module.exports = router;
