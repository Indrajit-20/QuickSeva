const bcrypt = require("bcryptjs");
const UserModel = require("../models/userModel");
const WalletModel = require("../models/walletModel");
const SellerModel = require("../models/sellerModel");
const { generateToken } = require("../utils/jwtUtils");
const { pool } = require("../config/db");
const { successRes, errorRes } = require("../utils/helpers");
const { sendEmail, otpEmailTemplate } = require("../utils/sendEmail");

// If you want to integrate SMS, configure this in backend/.env
// TWO_FACTOR_API_KEY=...
const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;

// NOTE: OTP generation/storage is intentionally NOT done in our system.
// We rely entirely on 2Factor.in AUTOGEN + VERIFY APIs.

const normalizeIdentifier = (identifier) => {
  if (!identifier || typeof identifier !== "string") return "";
  return identifier.trim();
};

const { normalizeIndianMobile } = require("../utils/phoneUtils");

const normalizeOtpType = (type) => {
  const t = normalizeIdentifier(type);
  const allowed = ["login", "register", "seller-register"];
  if (!allowed.includes(t)) return "login";
  return t;
};

// Call 2Factor AUTOGEN to generate OTP + session on their side.
// https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE}/AUTOGEN/anyhelp
const autogenWith2Factor = async ({ phone }) => {
  if (!TWO_FACTOR_API_KEY) {
    throw new Error("Missing TWO_FACTOR_API_KEY in server environment");
  }

  const url = `https://2factor.in/API/V1/${encodeURIComponent(
    TWO_FACTOR_API_KEY,
  )}/SMS/${encodeURIComponent(phone)}/AUTOGEN/anyhelp`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `2Factor AUTOGEN request failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  // Expected: { Status: "Success", Details: "<session_id>" }
  if (data?.Status !== "Success") {
    throw new Error(data?.Details || "2Factor AUTOGEN failed");
  }

  const sessionId = data?.Details;
  if (!sessionId) {
    throw new Error(
      "2Factor AUTOGEN succeeded but sessionId missing in response",
    );
  }

  return { sessionId, raw: data };
};

// Call 2Factor VERIFY.
// https://2factor.in/API/V1/{API_KEY}/SMS/VERIFY/{SESSION_ID}/{OTP}
const verifyWith2Factor = async ({ sessionId, otp }) => {
  if (!TWO_FACTOR_API_KEY) {
    throw new Error("Missing TWO_FACTOR_API_KEY in server environment");
  }

  const url = `https://2factor.in/API/V1/${encodeURIComponent(
    TWO_FACTOR_API_KEY,
  )}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(otp)}`;

  console.log("================================");
  console.log("SESSION ID:", sessionId);
  console.log("OTP:", otp);
  console.log("VERIFY URL:", url);

  const response = await fetch(url);

  const text = await response.text();

  console.log("STATUS:", response.status);
  console.log("2FACTOR RESPONSE:", text);
  console.log("================================");

  if (!response.ok) {
    throw new Error(`2Factor VERIFY failed: ${text}`);
  }

  const data = JSON.parse(text);

  if (data?.Status !== "Success") {
    throw new Error(data?.Details || "2Factor VERIFY failed");
  }

  return { verified: true, raw: data };
};

// ── Register ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, phone, email, role = "buyer" } = req.body;

    const existing = await UserModel.findByPhone(phone);
    if (existing) return errorRes(res, "Phone number already registered", 400);

    if (email) {
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) return errorRes(res, "Email already registered", 400);
    }

    const userId = await UserModel.create({
      name,
      phone,
      email,

      role,
    });

    // Auto-create wallet for every new user
    await WalletModel.create(userId);

    const token = generateToken({ id: userId, role });
    const user = await UserModel.findById(userId);

    return successRes(
      res,
      { user, token },
      "Account created successfully",
      201,
    );
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
    if (!user) return errorRes(res, "Invalid phone ", 401);
    if (!user.is_active) return errorRes(res, "Account is deactivated", 401);

    const token = generateToken({ id: user.id, role: user.role });

    // Get seller profile if role is seller
    let sellerProfile = null;
    if (user.role === "seller") {
      sellerProfile = await SellerModel.findByUserId(user.id);
    }

    const { password: _, ...userData } = user;
    return successRes(
      res,
      { user: userData, sellerProfile, token },
      "Login successful",
    );
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

// ── Send OTP (2Factor AUTOGEN) ─────────────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const rawIdentifier = normalizeIdentifier(req.body?.identifier);
    const type = normalizeOtpType(req.body?.type || "login");

    if (!rawIdentifier) return errorRes(res, "Identifier is required", 400);

    if (rawIdentifier.includes("@")) {
      return errorRes(res, "OTP supports phone number only", 400);
    }

    const normalizedPhone = normalizeIndianMobile(rawIdentifier);
    console.log("Original Phone:", rawIdentifier);
    console.log("Normalized Phone:", normalizedPhone);

    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return errorRes(res, "Valid phone number is required", 400);
    }

    // Business rules:
    // - login: user must exist
    // - register: user must NOT exist
    // - seller-register: seller user must NOT exist yet
    if (type === "login") {
      console.log(
        "[sendOTP] LOGIN identifier(raw)=",
        rawIdentifier,
        " phone(db lookup)=",
        normalizedPhone,
      );
      const existing = await UserModel.findByPhone(normalizedPhone);

      console.log(
        "[sendOTP] LOGIN existingUser=",
        existing
          ? {
              id: existing.id,
              role: existing.role,
              is_active: existing.is_active,
              phone: existing.phone,
            }
          : null,
      );
      if (!existing) return errorRes(res, "User not found", 404);
    }

    if (type === "register") {
      const existing = await UserModel.findByPhone(normalizedPhone);
      if (existing)
        return errorRes(res, "Phone number already registered", 400);
    }

    if (type === "seller-register") {
      const existing = await UserModel.findByPhone(normalizedPhone);
      if (existing)
        return errorRes(res, "Phone number already registered", 400);
    }

    const { sessionId } = await autogenWith2Factor({ phone: normalizedPhone });

    return successRes(res, { sessionId }, "OTP sent successfully", 201);
  } catch (err) {
    console.error("Send OTP error:", err);
    return errorRes(res, err?.message || "Failed to send OTP");
  }
};

// ── Verify OTP (2Factor VERIFY) ────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const rawIdentifier = normalizeIdentifier(req.body?.identifier);
    const type = normalizeOtpType(req.body?.type || "login");
    const otp = String(req.body?.otp || "").trim();

    if (!rawIdentifier) return errorRes(res, "Identifier is required", 400);
    if (!otp) return errorRes(res, "OTP is required", 400);

    const sessionId = normalizeIdentifier(req.body?.sessionId);
    if (!sessionId) return errorRes(res, "sessionId is required", 400);

    const phone = normalizeIndianMobile(rawIdentifier);
    console.log("Original Phone:", rawIdentifier);
    console.log("Normalized Phone:", phone);

    const { verified } = await verifyWith2Factor({ sessionId, otp });
    if (!verified) return errorRes(res, "OTP verification failed", 400);

    if (type === "login") {
      const user = await UserModel.findByPhone(phone);
      if (!user) return errorRes(res, "User not found", 404);
      if (!user.is_active) return errorRes(res, "Account is deactivated", 401);

      const token = generateToken({ id: user.id, role: user.role });

      const { password: _, ...userData } = user;

      return successRes(
        res,
        {
          token,
          user: {
            id: userData.id,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
          },
        },
        "Login successful",
      );
    }

    if (type === "register") {
      // Registration: create user + wallet only if it doesn't exist.
      const existing = await UserModel.findByPhone(phone);
      if (existing)
        return errorRes(res, "Phone number already registered", 400);

      const { name, email, role = "buyer" } = req.body || {};

      if (!name) return errorRes(res, "name is required", 400);
      if (!email) return errorRes(res, "email is required", 400);

      const userId = await UserModel.create({
        name,
        phone,
        email,
        role,
      });

      await WalletModel.create(userId);

      const token = generateToken({ id: userId, role });
      const user = await UserModel.findById(userId);
      const { password: _, ...userData } = user;

      return successRes(
        res,
        {
          token,
          user: {
            id: userData.id,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
          },
        },
        "Registration successful",
      );
    }

    if (type === "seller-register") {
      // Seller Registration: create seller-capable user + wallet.
      const existing = await UserModel.findByPhone(phone);
      if (existing)
        return errorRes(res, "Phone number already registered", 400);

      console.log("[verifyOTP seller-register] BODY:", req.body);
      console.log("[verifyOTP seller-register] PHONE(db lookup input)=", phone);

      const { firstName, lastName, email, businessName } = req.body || {};

      const name = `${firstName || ""} ${lastName || ""}`.trim();
      if (!name) return errorRes(res, "Seller name is required", 400);
      if (!email) return errorRes(res, "email is required", 400);

      // Create user with role=seller.
      const userId = await UserModel.create({
        name,
        phone,
        email,
        role: "seller",
      });

      console.log("Created seller user:", userId);
      console.log("Creating seller profile...");

      const sellerBusinessName = businessName || name;
      await SellerModel.create({
        user_id: userId,
        business_name: sellerBusinessName,
        category_id: null,
        bio: "",
        experience_yrs: 0,
      });

      console.log("Seller profile created");

      await WalletModel.create(userId);

      const token = generateToken({ id: userId, role: "seller" });
      const user = await UserModel.findById(userId);

      console.log(
        "[verifyOTP seller-register] CREATED user=",
        user
          ? {
              id: user.id,
              phone: user.phone,
              role: user.role,
              is_active: user.is_active,
            }
          : null,
      );

      const { password: _, ...userData } = user;

      return successRes(
        res,
        {
          token,
          user: {
            id: userData.id,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
          },
        },
        "Seller registration successful",
      );
    }

    return errorRes(res, "Unsupported OTP type", 400);
  } catch (err) {
    console.error("Verify OTP error:", err);
    return errorRes(res, err?.message || "OTP verification failed");
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

    const user = identifier.includes("@")
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
