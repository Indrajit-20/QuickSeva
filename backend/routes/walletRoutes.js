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

// Any authenticated user can read their own wallet (buyers also purchase credits)
router.get("/", protect, getWallet);
router.get("/transactions", protect, getTransactions);
router.post("/topup", protect, sellerOnly, topUpWallet);

router.post("/admin/credit", protect, adminOnly, adminCreditWallet);

module.exports = router;
