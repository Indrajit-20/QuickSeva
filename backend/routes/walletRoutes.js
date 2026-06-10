const express = require("express");
const router = express.Router();
const {
  getWallet, getTransactions, topUpWallet, adminCreditWallet,
} = require("../controllers/walletController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/",                  protect,            getWallet);
router.get("/transactions",      protect,            getTransactions);
router.post("/topup",            protect,            topUpWallet);
router.post("/admin/credit",     protect, adminOnly, adminCreditWallet);

module.exports = router;
