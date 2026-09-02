const express = require("express");
const router  = express.Router();

const {
  register,
  login,
  getMe,
  sendOTP,
  verifyOTP,
  changePassword,
  resetPassword,
  adminLogin,
  getCaptcha,
  logout,
  checkEmail,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// ── Public ────────────────────────────────────────────────────────────────────
// Direct register (used internally / admin seeding — NOT the normal user flow)
router.post("/register",        register);

// Math Captcha & Email availability pre-check
router.get("/captcha",          getCaptcha);
router.get("/check-email",      checkEmail);

// OTP-based authentication — used by both Register.jsx and Login.jsx
// Register flow : send-otp { type:"register" } → verify-otp { type:"register", name, email }
// Login flow    : send-otp { type:"login"    } → verify-otp { type:"login"    }
router.post("/send-otp",        sendOTP);
router.post("/verify-otp",      verifyOTP);

// Password-based login (legacy / admin)
router.post("/login",           login);
router.post("/admin-login",     adminLogin);
router.post("/logout",          logout);

// Password management
router.post("/reset-password",  resetPassword);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get( "/me",              protect, getMe);
router.put( "/change-password", protect, changePassword);

module.exports = router;
