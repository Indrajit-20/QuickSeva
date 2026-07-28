const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const UserModel = require("../models/userModel");
const WalletModel = require("../models/walletModel");
const SellerModel = require("../models/sellerModel");
const { generateToken } = require("../utils/jwtUtils");

const sendTokenCookie = (res, token) => {
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // 'lax' is generally more compatible for local development cross-origin setups than 'strict'
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

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
    if (text.includes("OTP Mismatch")) {
      throw new Error("Invalid OTP code. Please check and try again.");
    }
    throw new Error("OTP verification failed. Please try again.");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("OTP verification failed. Please try again.");
  }

  if (data?.Status !== "Success") {
    if (data?.Details === "OTP Mismatch" || (typeof data?.Details === "string" && data.Details.includes("Mismatch"))) {
      throw new Error("Invalid OTP code. Please check and try again.");
    }
    throw new Error(data?.Details || "Invalid OTP code. Please check and try again.");
  }

  return { verified: true, raw: data };
};

const verifyCaptcha = (answer, token) => {
  try {
    if (!answer || !token) return false;
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [expiryStr, signature] = decoded.split("|");
    const expiry = parseInt(expiryStr, 10);

    if (Date.now() > expiry) return false;

    const hmacInput = `${String(answer).trim()}|${expiry}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "fallback_secret")
      .update(hmacInput)
      .digest("hex");

    return signature === expectedSignature;
  } catch (err) {
    console.error("verifyCaptcha error:", err);
    return false;
  }
};

exports.getCaptcha = async (req, res) => {
  try {
    const num1 = Math.floor(Math.random() * 15) + 1;
    const num2 = Math.floor(Math.random() * 15) + 1;
    const question = `${num1} + ${num2} = ?`;
    const answer = String(num1 + num2);

    const expiry = Date.now() + 2 * 60 * 1000;
    const hmacInput = `${answer}|${expiry}`;
    const signature = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "fallback_secret")
      .update(hmacInput)
      .digest("hex");

    const captchaToken = Buffer.from(`${expiry}|${signature}`).toString("base64");

    return successRes(res, { question, captchaToken }, "Captcha generated successfully");
  } catch (err) {
    console.error("Get Captcha error:", err);
    return errorRes(res, "Failed to generate Captcha");
  }
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

    sendTokenCookie(res, token);

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
  const { generateToken } = require("../utils/jwtUtils");

  try {
    const { phone, password, captchaAnswer, captchaToken } = req.body;

    if (!phone || !password) {
      return errorRes(res, "Phone and password are required", 400);
    }

    if (!verifyCaptcha(captchaAnswer, captchaToken)) {
      return errorRes(res, "Invalid or expired captcha", 400);
    }

    const user = await UserModel.findByPhone(phone);
    if (!user) return errorRes(res, "Mobile number is not registered. Please sign up.", 401);
    if (!user.is_active) return errorRes(res, "Account is deactivated", 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return errorRes(res, "Incorrect password. Please try again.", 401);

    const token = generateToken({ id: user.id, role: user.role });

    // Get seller profile if role is seller
    let sellerProfile = null;
    let profile_completed = null;
    let services_count = 0;
    if (user.role === "seller") {
      const seller = await SellerModel.findByUserId(user.id);
      sellerProfile = seller;
      profile_completed = seller?.profile_completed ?? 0;
      const [serviceRows] = await pool.query(
        "SELECT COUNT(*) AS count FROM services WHERE seller_id = ? AND is_active = 1",
        [seller?.id || 0]
      );
      services_count = serviceRows[0]?.count || 0;
    }

    const { password: _, ...userData } = user;

    const sellerUserPayload =
      user.role === "seller" && profile_completed !== null
        ? { ...userData, profile_completed, services_count }
        : userData;

    sendTokenCookie(res, token);

    return successRes(
      res,
      { user: sellerUserPayload, sellerProfile, token },
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
    if (req.user && req.user.role === "admin") {
      return successRes(res, { user: req.user });
    }

    const user = await UserModel.findById(req.user.id);

    if (user?.role === "seller") {
      const seller = await SellerModel.findByUserId(user.id);
      const [serviceRows] = await pool.query(
        "SELECT COUNT(*) AS count FROM services WHERE seller_id = ? AND is_active = 1",
        [seller?.id || 0]
      );
      const services_count = serviceRows[0]?.count || 0;
      return successRes(res, {
        user: {
          ...user,
          profile_completed: seller?.profile_completed ?? 0,
          services_count,
          is_premium: seller?.is_premium ?? 0,
          plan: seller?.plan ?? null,
          premium_expires_at: seller?.premium_expires_at ?? null,
          is_available: seller?.is_available ?? 0,
        },
      });
    }

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
      if (!existing) return errorRes(res, "Mobile number is not registered", 404);
    }

    if (type === "register") {
      const existing = await UserModel.findByPhone(normalizedPhone);
      if (existing) {
        const roleName = existing.role === "buyer" ? "customer" : existing.role === "seller" ? "seller" : existing.role;
        return errorRes(res, `Mobile number is already registered as a ${roleName}. Please login.`, 400);
      }
    }

    if (type === "seller-register") {
      const existing = await UserModel.findByPhone(normalizedPhone);
      if (existing) {
        const roleName = existing.role === "buyer" ? "customer" : existing.role === "seller" ? "seller" : existing.role;
        const suggestion = existing.role === "buyer" 
          ? "Please use a different number or log in." 
          : "Please login.";
        return errorRes(res, `Mobile number is already registered as a ${roleName}. ${suggestion}`, 400);
      }
    }

    let sessionId;
    if (process.env.NODE_ENV === "development" && (normalizedPhone.startsWith("98765") || normalizedPhone.startsWith("99999"))) {
      sessionId = "dev-session-id";
    } else {
      const result = await autogenWith2Factor({ phone: normalizedPhone });
      sessionId = result.sessionId;
    }

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

    if (!phone || phone.length !== 10) {
      return errorRes(res, "Valid 10-digit phone number is required", 400);
    }

    let verified = false;
    if (process.env.NODE_ENV === "development" && otp === "123456") {
      verified = true;
    } else {
      const result = await verifyWith2Factor({ sessionId, otp });
      verified = result.verified;
    }
    if (!verified) return errorRes(res, "OTP verification failed", 400);

    if (type === "login") {
      const user = await UserModel.findByPhone(phone);
      if (!user) return errorRes(res, "User not found", 404);
      if (!user.is_active) return errorRes(res, "Account is deactivated", 401);

      const token = generateToken({ id: user.id, role: user.role });

      const { password: _, ...userData } = user;

      let profile_completed = 0;
      let services_count = 0;
      let is_available = 0;
      if (user.role === "seller") {
        const seller = await SellerModel.findByUserId(user.id);
        profile_completed = seller?.profile_completed ?? 0;
        const [serviceRows] = await pool.query(
          "SELECT COUNT(*) AS count FROM services WHERE seller_id = ? AND is_active = 1",
          [seller?.id || 0]
        );
        services_count = serviceRows[0]?.count || 0;
        is_available = seller?.is_available ?? 0;
      }

      sendTokenCookie(res, token);

      return successRes(
        res,
        {
          token,
          user: {
            id: userData.id,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            profile_completed,
            services_count,
            is_available,
          },
        },
        "Login successful",
      );
    }

    if (type === "register") {
      // Registration: create user + wallet only if it doesn't exist.
      const existing = await UserModel.findByPhone(phone);
      if (existing) {
        const roleName = existing.role === "buyer" ? "customer" : existing.role === "seller" ? "seller" : existing.role;
        return errorRes(res, `Mobile number is already registered as a ${roleName}. Please login.`, 400);
      }

      const { name, email, password, role = "buyer" } = req.body || {};

      if (!name) return errorRes(res, "name is required", 400);
      if (!password) return errorRes(res, "password is required", 400);

      // Email duplication check
      if (email) {
        const existingEmail = await UserModel.findByEmail(email);
        if (existingEmail) {
          return errorRes(res, "Email is already registered", 400);
        }
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const userId = await UserModel.create({
          name,
          phone,
          email: email || null,
          hashedPassword,
          role,
        }, conn);

        await WalletModel.create(userId, conn);

        await conn.commit();

        const token = generateToken({ id: userId, role });
        const user = await UserModel.findById(userId);
        const { password: _, ...userData } = user;

        sendTokenCookie(res, token);

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
      } catch (err) {
        await conn.rollback();
        console.error("Register error:", err);
        return errorRes(res, "Registration failed");
      } finally {
        conn.release();
      }
    }

    if (type === "seller-register") {
      // Seller Registration: create seller-capable user + wallet.
      const existing = await UserModel.findByPhone(phone);
      if (existing) {
        const roleName = existing.role === "buyer" ? "customer" : existing.role === "seller" ? "seller" : existing.role;
        const suggestion = existing.role === "buyer" 
          ? "Please use a different number or log in." 
          : "Please login.";
        return errorRes(res, `Mobile number is already registered as a ${roleName}. ${suggestion}`, 400);
      }

      console.log("[verifyOTP seller-register] BODY:", req.body);
      console.log("[verifyOTP seller-register] PHONE(db lookup input)=", phone);

      const { firstName, lastName, email, businessName } = req.body || {};

      const name = `${firstName || ""} ${lastName || ""}`.trim();
      if (!name) return errorRes(res, "Seller name is required", 400);

      // Email duplication check
      if (email) {
        const existingEmail = await UserModel.findByEmail(email);
        if (existingEmail) {
          return errorRes(res, "Email is already registered", 400);
        }
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Create user with role=seller.
        const userId = await UserModel.create({
          name,
          phone,
          email,
          role: "seller",
        }, conn);

        console.log("Created seller user:", userId);
        console.log("Creating seller profile...");

        const sellerBusinessName = businessName || name;
        await SellerModel.create({
          user_id: userId,
          business_name: sellerBusinessName,
          category_id: null,
          bio: "",
          experience_yrs: 0,
        }, conn);

        console.log("Seller profile created");

        await WalletModel.create(userId, conn);

        await conn.commit();

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

        const seller = await SellerModel.findByUserId(userId);
        const profile_completed = seller?.profile_completed ?? 0;

        sendTokenCookie(res, token);

        return successRes(
          res,
          {
            token,
            user: {
              id: userData.id,
              name: userData.name,
              phone: userData.phone,
              role: userData.role,
              profile_completed,
              services_count: 0,
              is_available: seller?.is_available ?? 1,
            },
          },
          "Seller registration successful",
        );
      } catch (err) {
        await conn.rollback();
        console.error("Seller register error:", err);
        return errorRes(res, "Seller registration failed");
      } finally {
        conn.release();
      }
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
    const { identifier, otp, sessionId, new_password } = req.body;

    if (!identifier || !otp || !sessionId || !new_password) {
      return errorRes(res, "All fields are required", 400);
    }

    const phone = normalizeIndianMobile(identifier);

    let verified = false;
    if (process.env.NODE_ENV === "development" && otp === "123456") {
      verified = true;
    } else {
      try {
        const result = await verifyWith2Factor({ sessionId, otp });
        verified = result.verified;
      } catch (err) {
        console.error("Reset password verifyOTP error:", err);
        return errorRes(res, err?.message || "OTP verification failed", 400);
      }
    }
    if (!verified) return errorRes(res, "OTP verification failed", 400);

    const user = await UserModel.findByPhone(phone);
    if (!user) return errorRes(res, "Mobile number is not registered", 404);

    const hashed = await bcrypt.hash(new_password, 12);
    await UserModel.updatePassword(user.id, hashed);

    return successRes(res, null, "Password reset successful");
  } catch (err) {
    console.error("Reset password error:", err);
    return errorRes(res, err?.message || "Password reset failed");
  }
};

// ── Admin Login ──────────────────────────────────────────────────────────────
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorRes(res, "Username and password are required", 400);
    }

    const [rows] = await pool.query(
      "SELECT * FROM admins WHERE username = ? LIMIT 1",
      [username]
    );

    if (!rows.length) {
      return errorRes(res, "Invalid username or password", 401);
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return errorRes(res, "Invalid username or password", 401);
    }

    const token = generateToken({ id: admin.id, role: "admin" });

    sendTokenCookie(res, token);

    return successRes(
      res,
      {
        token,
        user: {
          id: admin.id,
          name: admin.username,
          email: "admin@quickseva.com",
          role: "admin",
        },
      },
      "Admin login successful"
    );
  } catch (err) {
    console.error("Admin login error:", err);
    return errorRes(res, "Admin login failed");
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return successRes(res, null, "Logged out successfully");
  } catch (err) {
    console.error("Logout error:", err);
    return errorRes(res, "Logout failed");
  }
};

exports.verifyWith2Factor = verifyWith2Factor;
