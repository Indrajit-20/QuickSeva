const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  acceptOrder,
  startOrder,
  completeOrder,
  cancelOrder,
} = require("../controllers/orderController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");

router.post("/", protect, placeOrder);
router.get("/my", protect, getMyOrders);
router.get("/seller", protect, sellerOnly, getSellerOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/accept", protect, sellerOnly, acceptOrder);
router.patch("/:id/start", protect, sellerOnly, startOrder);
router.patch("/:id/complete", protect, sellerOnly, completeOrder);
router.patch("/:id/cancel", protect, cancelOrder);

module.exports = router;
