const express = require("express");
const router = express.Router();
const {
  getWallet,
  getTransactions,
  topUpWallet,
  adminCreditWallet,
} = require("../controllers/walletController");
const {
  protect,
  adminOnly,
  sellerOnly,
} = require("../middleware/authMiddleware");

router.get("/", protect, sellerOnly, getWallet);
router.get("/transactions", protect, sellerOnly, getTransactions);
router.post("/topup", protect, sellerOnly, topUpWallet);

router.post("/admin/credit", protect, adminOnly, adminCreditWallet);

module.exports = router;
