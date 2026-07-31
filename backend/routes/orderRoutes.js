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
  submitQuotation,
  approveQuotation,
  verifyStartCode,
  disputeOrder,
  switchToCash,
  switchPaymentMethod,
  rejectQuotation,
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
router.patch("/:id/dispute", protect, disputeOrder);
router.patch("/:id/quotation", protect, sellerOnly, submitQuotation);
router.patch("/:id/approve-quotation", protect, approveQuotation);
router.patch("/:id/reject-quotation", protect, rejectQuotation);
router.post("/:id/verify-start-code", protect, sellerOnly, verifyStartCode);
router.patch("/:id/switch-to-cash", protect, switchToCash);
router.patch("/:id/switch-payment-method", protect, switchPaymentMethod);

module.exports = router;
