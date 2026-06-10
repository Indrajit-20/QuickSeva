const bcrypt = require("bcryptjs");
const UserModel = require("../models/userModel");
const WalletModel = require("../models/walletModel");
const SellerModel = require("../models/sellerModel");
const { generateToken } = require("../utils/jwtUtils");
const { pool } = require("../config/db");
const {
  successRes, errorRes, generateOTP, otpExpiresAt,
} = require("../utils/helpers");
const { sendEmail, otpEmailTemplate } = require("../utils/sendEmail");

// ── Register ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role = "buyer" } = req.body;

    const existing = await UserModel.findByPhone(phone);
    if (existing) return errorRes(res, "Phone number already registered", 400);

    if (email) {
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) return errorRes(res, "Email already registered", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await UserModel.create({ name, phone, email, hashedPassword, role });

    // Auto-create wallet for every new user
    await WalletModel.create(userId);

    const token = generateToken({ id: userId, role });
    const user = await UserModel.findById(userId);

    return successRes(res, { user, token }, "Account created successfully", 201);
  } catch (err) {
    console.error("Register error:", err);
    return errorRes(res, "Registration failed");
  }
};

// ── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await UserModel.findByPhone(phone);
    if (!user) return errorRes(res, "Invalid phone or password", 401);
    if (!user.is_active) return errorRes(res, "Account is deactivated", 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return errorRes(res, "Invalid phone or password", 401);

    const token = generateToken({ id: user.id, role: user.role });

    // Get seller profile if role is seller
    let sellerProfile = null;
    if (user.role === "seller") {
      sellerProfile = await SellerModel.findByUserId(user.id);
    }

    const { password: _, ...userData } = user;
    return successRes(res, { user: userData, sellerProfile, token }, "Login successful");
  } catch (err) {
    console.error("Login error:", err);
    return errorRes(res, "Login failed");
  }
};

// ── Get current user (me) ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    return successRes(res, { user });
  } catch (err) {
    return errorRes(res, "Failed to fetch profile");
  }
};

// ── Send OTP ─────────────────────────────────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { identifier, type = "register" } = req.body; // identifier = phone or email

    const otp = generateOTP();
    const expires_at = otpExpiresAt();

    // Remove any existing OTPs for this identifier
    await pool.query(
      `DELETE FROM otp_verifications WHERE identifier = ? AND type = ?`,
      [identifier, type]
    );

    await pool.query(
      `INSERT INTO otp_verifications (identifier, otp, type, expires_at) VALUES (?, ?, ?, ?)`,
      [identifier, otp, type, expires_at]
    );

    // If email, send via email; otherwise (phone) you'd integrate SMS here
    if (identifier.includes("@")) {
      await sendEmail({
        to: identifier,
        subject: "QuickSeva OTP Verification",
        html: otpEmailTemplate(otp),
      });
    } else {
      // TODO: Integrate SMS gateway (e.g., Twilio, MSG91)
      console.log(`📱 SMS OTP for ${identifier}: ${otp}`);
    }

    return successRes(res, { message: "OTP sent" }, "OTP sent successfully");
  } catch (err) {
    console.error("Send OTP error:", err);
    return errorRes(res, "Failed to send OTP");
  }
};

// ── Verify OTP ───────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { identifier, otp, type = "register" } = req.body;

    const [rows] = await pool.query(
      `SELECT * FROM otp_verifications
       WHERE identifier = ? AND otp = ? AND type = ?
         AND is_used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [identifier, otp, type]
    );

    if (!rows.length) return errorRes(res, "Invalid or expired OTP", 400);

    await pool.query(
      `UPDATE otp_verifications SET is_used = 1 WHERE id = ?`,
      [rows[0].id]
    );

    // Mark user as verified if register OTP
    if (type === "register") {
      await pool.query(
        `UPDATE users SET is_verified = 1 WHERE phone = ? OR email = ?`,
        [identifier, identifier]
      );
    }

    return successRes(res, null, "OTP verified successfully");
  } catch (err) {
    console.error("Verify OTP error:", err);
    return errorRes(res, "OTP verification failed");
  }
};

// ── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await UserModel.findByPhone(req.user.phone);
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return errorRes(res, "Current password is incorrect", 400);

    const hashed = await bcrypt.hash(new_password, 12);
    await UserModel.updatePassword(req.user.id, hashed);

    return successRes(res, null, "Password changed successfully");
  } catch (err) {
    return errorRes(res, "Failed to change password");
  }
};

// ── Reset Password (after OTP) ───────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, new_password } = req.body;

    const user =
      identifier.includes("@")
        ? await UserModel.findByEmail(identifier)
        : await UserModel.findByPhone(identifier);

    if (!user) return errorRes(res, "User not found", 404);

    const hashed = await bcrypt.hash(new_password, 12);
    await UserModel.updatePassword(user.id, hashed);

    return successRes(res, null, "Password reset successful");
  } catch (err) {
    return errorRes(res, "Password reset failed");
  }
};
