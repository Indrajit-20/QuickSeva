const express = require("express");
const router = express.Router();
const {
  register, login, getMe, sendOTP, verifyOTP,
  changePassword, resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register",         register);
router.post("/login",            login);
router.post("/send-otp",         sendOTP);
router.post("/verify-otp",       verifyOTP);
router.post("/reset-password",   resetPassword);
router.get("/me",                protect, getMe);
router.put("/change-password",   protect, changePassword);

module.exports = router;
