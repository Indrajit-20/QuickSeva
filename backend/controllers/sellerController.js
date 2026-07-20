const SellerModel = require("../models/sellerModel");
const UserModel = require("../models/userModel");
const WalletModel = require("../models/walletModel");

const { pool } = require("../config/db");
const { successRes, errorRes, paginate } = require("../utils/helpers");
const bcrypt = require("bcryptjs");
const { normalizeIndianMobile } = require("../utils/phoneUtils");
const { verifyWith2Factor } = require("./authController");

// Create seller profile (buyer becomes seller)
exports.createSellerProfile = async (req, res) => {
  try {
    const { business_name, category_id, bio, experience_yrs } = req.body;

    const existing = await SellerModel.findByUserId(req.user.id);
    if (existing) return errorRes(res, "Seller profile already exists", 400);

    // Update user role to seller
    await UserModel.update(req.user.id, { role: "seller" });

    const sellerId = await SellerModel.create({
      user_id: req.user.id,
      business_name,
      category_id,
      bio,
      experience_yrs,
      // Copy from users.phone (source of truth for authentication)
      phone: req.user.phone,
    });

    const seller = await SellerModel.findById(sellerId);
    return successRes(res, { seller }, "Seller profile created", 201);
  } catch (err) {
    console.error("Create seller error:", err);
    return errorRes(res, "Failed to create seller profile");
  }
};

// Get own seller profile
exports.getMySellerProfile = async (req, res) => {
  try {
    let seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) {
      // Auto-create seller profile if it doesn't exist yet (self-healing db state)
      const sellerId = await SellerModel.create({
        user_id: req.user.id,
        business_name: req.user.name || "QuickSeva Partner",
        category_id: null,
        bio: "",
        experience_yrs: 0,
        phone: req.user.phone,
      });
      seller = await SellerModel.findById(sellerId);
    }
    
    // Fetch work images
    const [images] = await pool.query(
      "SELECT id, image_url, uploaded_at FROM seller_work_images WHERE seller_id = ?",
      [seller.id]
    );
    seller.work_images = images || [];

    return successRes(res, { seller });
  } catch (err) {
    console.error("getMySellerProfile error:", err);
    return errorRes(res, "Failed to fetch seller profile");
  }
};

// Get seller profile by ID (public)
exports.getSellerById = async (req, res) => {
  try {
    const seller = await SellerModel.findById(req.params.id);
    if (!seller) return errorRes(res, "Seller not found", 404);

    const wallet = await WalletModel.findByUserId(seller.user_id);
    const balance = wallet ? parseFloat(wallet.balance) : 0.00;

    // Fetch work images
    const [images] = await pool.query(
      "SELECT id, image_url, uploaded_at FROM seller_work_images WHERE seller_id = ?",
      [seller.id]
    );

    // Fetch active booked slots
    const [bookings] = await pool.query(
      "SELECT scheduled_at FROM orders WHERE seller_id = ? AND status != 'cancelled' AND scheduled_at >= NOW()",
      [seller.id]
    );

    const sellerWithBalanceStatus = {
      ...seller,
      hasSufficientBalance: balance >= 1.00,
      work_images: images || [],
      booked_slots: bookings.map((b) => b.scheduled_at) || [],
    };

    return successRes(res, { seller: sellerWithBalanceStatus });
  } catch (err) {
    console.error("getSellerById error:", err);
    return errorRes(res, "Failed to fetch seller");
  }
};

// Update seller profile
exports.updateSellerProfile = async (req, res) => {
  try {
    if (!req.user?.role || req.user.role !== "seller") {
      return {
        success: false,
        message: "Seller access required",
      };
    }

    let seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) {
      const tempBusinessName =
        req.body.business_name || req.user.name || "QuickSeva Partner";
      const sellerId = await SellerModel.create({
        user_id: req.user.id,
        business_name: tempBusinessName,
        category_id: req.body.category_id || null,
        bio: req.body.bio || "",
        experience_yrs: Number(req.body.experience_yrs || 0),
        phone: req.user.phone,
      });
      seller = await SellerModel.findById(sellerId);
    }

    const {
      business_name,
      category_id,
      bio,
      experience_yrs,
      working_radius,
      is_available,
      gst_number,
      profile_completed,
      lat,
      lng,
      address,
      pincode,
      seller_type,
    } = req.body;

    // Keep sellers.phone synchronized with users.phone
    const syncFields = { phone: req.user.phone };
    const fields = { ...syncFields };

    if (business_name !== undefined) fields.business_name = business_name;
    if (category_id !== undefined) fields.category_id = category_id;
    if (bio !== undefined) fields.bio = bio;
    if (experience_yrs !== undefined) fields.experience_yrs = experience_yrs;
    if (working_radius !== undefined) fields.working_radius = working_radius;
    if (is_available !== undefined) fields.is_available = is_available;
    if (gst_number !== undefined) fields.gst_number = gst_number;
    if (seller_type !== undefined) fields.seller_type = seller_type;
    if (profile_completed !== undefined)
      fields.profile_completed = profile_completed;

    if (lat !== undefined && lat !== null) {
      fields.latitude = Number(lat);
      fields.lat = Number(lat);
    }
    if (lng !== undefined && lng !== null) {
      fields.longitude = Number(lng);
      fields.lng = Number(lng);
    }
    if (address !== undefined && address !== null) {
      fields.location_address = String(address).trim();
    }

    await SellerModel.update(seller.id, fields);

    if (lat !== undefined || lng !== undefined || address !== undefined || pincode !== undefined) {
      const userFields = {};
      if (lat !== undefined && lat !== null) userFields.lat = Number(lat);
      if (lng !== undefined && lng !== null) userFields.lng = Number(lng);
      if (address !== undefined && address !== null) userFields.address = String(address).trim();
      if (pincode !== undefined && pincode !== null) userFields.pincode = String(pincode).trim();
      
      await UserModel.update(req.user.id, userFields);
    }

    const updated = await SellerModel.findById(seller.id);
    return successRes(res, { seller: updated }, "Seller profile updated");
  } catch (err) {
    console.error("updateSellerProfile error details:", err);
    return errorRes(res, "Failed to update seller profile");
  }
};

// Toggle availability
exports.toggleAvailability = async (req, res) => {
  try {
    if (!req.user?.role || req.user.role !== "seller") {
      return {
        success: false,
        message: "Seller access required",
      };
    }

    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    const newStatus = seller.is_available ? 0 : 1;
    await SellerModel.update(seller.id, { 
      is_available: newStatus,
      availability_last_updated_at: new Date()
    });
    return successRes(
      res,
      { is_available: !!newStatus },
      newStatus ? "You are now available" : "You are now offline",
    );
  } catch (err) {
    return errorRes(res, "Failed to toggle availability");
  }
};

// Upload documents (ID proof, certificates)
exports.uploadDocuments = async (req, res) => {
  try {
    if (!req.user?.role || req.user.role !== "seller") {
      return {
        success: false,
        message: "Seller access required",
      };
    }

    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    if (!req.files || !req.files.length) {
      return errorRes(res, "No files uploaded", 400);
    }

    const docs = req.files.map((f) => `/uploads/documents/${f.filename}`);
    await SellerModel.update(seller.id, { documents: JSON.stringify(docs) });

    return successRes(
      res,
      { documents: docs },
      "Documents uploaded successfully",
    );
  } catch (err) {
    return errorRes(res, "Failed to upload documents");
  }
};

// ── Public: Seller registration ─────────────────────────────────────────────
exports.registerSeller = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const {
      ownerName,
      businessName,
      email,
      phone,
      password,
      bio = "",
      experience_yrs = 0,
      address,
      lat,
      lng,
      categoryIds,
      city,
      state,
      pincode,
      sellerType = "individual",
      otp,
      sessionId,
    } = req.body || {};

    // Validation
    if (!ownerName || String(ownerName).trim().length < 2) {
      return errorRes(res, "Owner name is required", 400);
    }
    if (!businessName || String(businessName).trim().length < 2) {
      return errorRes(res, "Business name is required", 400);
    }

    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      return errorRes(res, "Email is invalid", 400);
    }

    if (!phone) {
      return errorRes(res, "Phone is required", 400);
    }
    const normalizedPhone = normalizeIndianMobile(phone);
    if (!normalizedPhone) {
      return errorRes(res, "Valid phone number is required", 400);
    }

    if (!password) {
      return errorRes(res, "Password is required", 400);
    }
    if (String(password).length < 6) {
      return errorRes(res, "Password must be at least 6 characters", 400);
    }

    if (!otp) {
      return errorRes(res, "OTP is required", 400);
    }
    if (!sessionId) {
      return errorRes(res, "OTP Session ID is required", 400);
    }

    let verified = false;
    if (process.env.NODE_ENV === "development" && otp === "123456") {
      verified = true;
    } else {
      try {
        const result = await verifyWith2Factor({ sessionId, otp });
        verified = result.verified;
      } catch (err) {
        console.error("Seller verifyOTP error:", err);
        return errorRes(res, err?.message || "OTP verification failed", 400);
      }
    }
    if (!verified) {
      return errorRes(res, "OTP verification failed", 400);
    }

    let finalPassword = password;

    if (!address || String(address).trim().length < 3) {
      return errorRes(res, "Address is required", 400);
    }

    if (lat === undefined || lat === null || lat === "") {
      return errorRes(res, "Latitude is required", 400);
    }
    if (lng === undefined || lng === null || lng === "") {
      return errorRes(res, "Longitude is required", 400);
    }
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum)) {
      return errorRes(res, "Latitude must be numeric", 400);
    }
    if (!Number.isFinite(lngNum)) {
      return errorRes(res, "Longitude must be numeric", 400);
    }

    // categoryIds are optional for registration.
    const normalizedCategoryIds = Array.isArray(categoryIds)
      ? Array.from(new Set(categoryIds))
        .map((c) => parseInt(c, 10))
        .filter((id) => Number.isFinite(id))
      : [];

    await conn.beginTransaction();

    // Duplicate checks
    if (trimmedEmail) {
      const [existingEmailRows] = await conn.query(
        `SELECT id FROM users WHERE email = ? LIMIT 1`,
        [trimmedEmail],
      );
      if (existingEmailRows?.length) {
        await conn.rollback();
        return errorRes(res, "Email already registered", 409);
      }
    }

    const [existingPhoneRows] = await conn.query(
      `SELECT role FROM users WHERE phone = ? LIMIT 1`,
      [normalizedPhone],
    );
    if (existingPhoneRows?.length) {
      await conn.rollback();
      const existingRole = existingPhoneRows[0].role;
      const roleName = existingRole === "buyer" ? "customer" : existingRole === "seller" ? "seller" : existingRole;
      const suggestion = existingRole === "buyer" 
        ? "Please use a different number or log in." 
        : "Please login.";
      return errorRes(res, `Mobile number is already registered as a ${roleName}. ${suggestion}`, 409);
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 12);

    // Create user (city/state/pincode optional)
    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, phone, password, role, address, lat, lng, city, state, pincode)
       VALUES (?, ?, ?, ?, 'seller', ?, ?, ?, ?, ?, ?)`,
      [
        ownerName.trim(),
        trimmedEmail || null,
        normalizedPhone,
        hashedPassword,
        String(address).trim(),
        latNum,
        lngNum,
        city ? String(city).trim() : null,
        state ? String(state).trim() : null,
        pincode ? String(pincode).trim() : null,
      ],
    );

    const userId = userResult.insertId;

    // Create seller row
    const [sellerResult] = await conn.query(
      `INSERT INTO sellers (user_id, business_name, bio, experience_yrs, avg_rating, total_reviews, total_orders,
                              is_verified, is_available, seller_type, working_radius, documents, gst_number, profile_completed,
                              latitude, longitude, lat, lng, location_address)
       VALUES (?, ?, ?, ?, 0.00, 0, 0, 0, 1, ?, 10, NULL, NULL, 1, ?, ?, ?, ?, ?)`,
      [
        userId,
        businessName.trim(),
        bio || null,
        experience_yrs || 0,
        sellerType,
        latNum,
        lngNum,
        latNum,
        lngNum,
        String(address).trim(),
      ],
    );
    const sellerId = sellerResult.insertId;

    // Insert seller categories only if categories are provided.
    if (normalizedCategoryIds.length > 0) {
      for (const categoryId of normalizedCategoryIds) {
        await conn.query(
          `INSERT INTO seller_categories (seller_id, category_id) VALUES (?, ?)`,
          [sellerId, categoryId],
        );
      }
    }

    // Wallet: create if missing
    const [walletRows] = await conn.query(
      `SELECT id FROM wallets WHERE user_id = ? LIMIT 1`,
      [userId],
    );
    if (!walletRows?.length) {
      await conn.query(
        `INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)`,
        [userId],
      );
    }

    await conn.commit();

    const { generateToken } = require("../utils/jwtUtils");
    const token = generateToken({ id: userId, role: "seller" });

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const [userRows] = await conn.query(
      `SELECT id, name, email, phone, role, profile_pic, address, city, state, pincode, lat, lng, gender, dob, is_verified, is_active, created_at
       FROM users WHERE id = ?`,
      [userId]
    );
    const user = userRows[0];

    return successRes(res, { success: true, userId, sellerId, user, token }, null, 201);
  } catch (err) {
    console.error("Seller register error:", err);
    try {
      await conn.rollback();
    } catch {
      // ignore
    }
    return errorRes(res, "Failed to register seller");
  } finally {
    conn.release();
  }
};

// ── Admin ────────────────────────────────────────────────────────────────────
exports.getAllSellers = async (req, res) => {
  try {
    const { page = 1, limit = 20, is_verified } = req.query;
    const { limit: lim, offset } = paginate(page, limit);

    const verifiedFilter =
      is_verified !== undefined ? "WHERE s.is_verified = ?" : "";
    const params =
      is_verified !== undefined
        ? [parseInt(is_verified), lim, offset]
        : [lim, offset];

    const [rows] = await pool.query(
      `SELECT s.id, s.business_name, s.avg_rating, s.total_orders, s.is_verified, s.is_available,
              u.name, u.phone, u.city, c.name AS category_name
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       ${verifiedFilter}
       ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      params,
    );
    return successRes(res, { sellers: rows });
  } catch (err) {
    return errorRes(res, "Failed to fetch sellers");
  }
};

exports.verifySeller = async (req, res) => {
  try {
    await SellerModel.update(req.params.id, { is_verified: 1 });
    return successRes(res, null, "Seller verified successfully");
  } catch (err) {
    return errorRes(res, "Failed to verify seller");
  }
};

exports.getMySellerCategories = async (req, res) => {
  try {
    const [allCats] = await pool.query(
      "SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC"
    );
    return successRes(res, { categories: allCats });
  } catch (err) {
    console.error("Get my seller categories error:", err);
    return errorRes(res, "Failed to fetch seller categories");
  }
};

// Get authenticated seller's availability
exports.getSellerAvailability = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    let availableDays = [];
    if (seller.available_days) {
      availableDays = typeof seller.available_days === "string"
        ? JSON.parse(seller.available_days)
        : seller.available_days;
    } else {
      availableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    }

    let unavailableDates = [];
    if (seller.unavailable_dates) {
      unavailableDates = typeof seller.unavailable_dates === "string"
        ? JSON.parse(seller.unavailable_dates)
        : seller.unavailable_dates;
    }

    return successRes(res, {
      available_days: availableDays,
      unavailable_dates: unavailableDates,
    });
  } catch (err) {
    console.error("getSellerAvailability error:", err);
    return errorRes(res, "Failed to fetch availability");
  }
};

// Update availability
exports.updateSellerAvailability = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    const { available_days, unavailable_dates } = req.body;

    // Strict validation for available_days
    if (available_days !== undefined) {
      if (!Array.isArray(available_days)) {
        return errorRes(res, "available_days must be an array of day names", 400);
      }

      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const daySet = new Set();
      for (const day of available_days) {
        if (!validDays.includes(day)) {
          return errorRes(res, `Invalid day name: ${day}`, 400);
        }
        if (daySet.has(day)) {
          return errorRes(res, `Duplicate day name: ${day}`, 400);
        }
        daySet.add(day);
      }
    }

    // Strict validation for unavailable_dates
    if (unavailable_dates !== undefined) {
      if (!Array.isArray(unavailable_dates)) {
        return errorRes(res, "unavailable_dates must be an array of date strings", 400);
      }

      // Check format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const dateStr of unavailable_dates) {
        if (typeof dateStr !== "string" || !dateRegex.test(dateStr)) {
          return errorRes(res, `Invalid date format (must be YYYY-MM-DD): ${dateStr}`, 400);
        }
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          return errorRes(res, `Invalid calendar date: ${dateStr}`, 400);
        }
      }
    }

    const fieldsToUpdate = {};
    if (available_days !== undefined) {
      fieldsToUpdate.available_days = JSON.stringify(available_days);
    }
    if (unavailable_dates !== undefined) {
      fieldsToUpdate.unavailable_dates = JSON.stringify(unavailable_dates);
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await SellerModel.update(seller.id, fieldsToUpdate);
    }

    return successRes(res, null, "Availability updated successfully");
  } catch (err) {
    console.error("updateSellerAvailability error:", err);
    return errorRes(res, "Failed to update availability");
  }
};

// Purchase premium package
exports.purchasePackage = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { planId } = req.body;
    
    // Validate plan
    const planPrices = {
      basic: { price: 55, days: 7, name: "Basic" },
      standard: { price: 155, days: 15, name: "Standard" },
      pro: { price: 355, days: 30, name: "Pro" }
    };
    
    if (!planPrices[planId]) {
      await conn.rollback();
      return errorRes(res, "Invalid plan ID", 400);
    }
    
    const plan = planPrices[planId];
    
    // Get seller profile
    const [[seller]] = await conn.query(
      "SELECT * FROM sellers WHERE user_id = ? FOR UPDATE",
      [req.user.id]
    );
    
    if (!seller) {
      await conn.rollback();
      return errorRes(res, "Seller profile not found", 404);
    }
    
    // Get wallet
    const [[wallet]] = await conn.query(
      "SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE",
      [req.user.id]
    );
    
    if (!wallet) {
      await conn.rollback();
      return errorRes(res, "Wallet not found", 404);
    }
    
    if (parseFloat(wallet.balance) < plan.price) {
      await conn.rollback();
      return errorRes(res, "Insufficient wallet balance", 400);
    }
    
    // Calculate new expiration date and purchase type
    let purchaseType = "new";
    let expiresAt;
    let forfeitedDays = 0;
    const now = new Date();
    
    const currentExpiry = seller.premium_expires_at ? new Date(seller.premium_expires_at) : null;
    const isCurrentActive = currentExpiry && currentExpiry.getTime() > now.getTime();
    
    if (isCurrentActive && seller.plan) {
      const getPlanRank = (pid) => {
        if (pid === "basic") return 1;
        if (pid === "standard") return 2;
        if (pid === "pro") return 3;
        return 0;
      };
      
      const currentRank = getPlanRank(seller.plan);
      const selectedRank = getPlanRank(planId);
      
      if (selectedRank === currentRank) {
        purchaseType = "extend";
        expiresAt = new Date(currentExpiry.getTime() + plan.days * 24 * 60 * 60 * 1000);
      } else {
        if (selectedRank > currentRank) {
          purchaseType = "upgrade";
        } else {
          purchaseType = "downgrade";
        }
        // upgrades/downgrades start immediately, forfeiting remaining days
        forfeitedDays = Math.ceil((currentExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        expiresAt = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);
      }
    } else {
      expiresAt = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);
    }
    
    // 1. Debit wallet
    const newBalance = parseFloat(wallet.balance) - plan.price;
    await conn.query(
      "UPDATE wallets SET balance = ? WHERE id = ?",
      [newBalance, wallet.id]
    );
    
    // 2. Insert wallet transaction
    const descriptionObj = {
      planId: planId,
      expiresAt: expiresAt.toISOString(),
      purchaseType: purchaseType,
      price: plan.price,
      forfeitedDays: forfeitedDays
    };
    
    const [txResult] = await conn.query(
      `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, source, reference_id, description)
       VALUES (?, 'debit', ?, ?, 'package_purchase', ?, ?)`,
      [wallet.id, plan.price, newBalance, planId, JSON.stringify(descriptionObj)]
    );
    
    // 3. Update seller premium info
    await conn.query(
      `UPDATE sellers 
       SET is_premium = 1, plan = ?, premium_expires_at = ? 
       WHERE id = ?`,
      [planId, expiresAt, seller.id]
    );
    
    await conn.commit();
    
    // Get updated transaction info to return
    const [[transaction]] = await pool.query(
      "SELECT * FROM wallet_transactions WHERE id = ?",
      [txResult.insertId]
    );
    
    return successRes(res, {
      premium: {
        plan: planId,
        premium_expires_at: expiresAt.toISOString(),
        is_premium: 1
      },
      walletBalance: newBalance,
      transaction: transaction
    }, "Plan purchased successfully");
    
  } catch (err) {
    await conn.rollback();
    console.error("Error purchasing package:", err);
    return errorRes(res, "Failed to complete package purchase");
  } finally {
    conn.release();
  }
};

// Get package purchase history
exports.getPackageHistory = async (req, res) => {
  try {
    // Find seller
    const [sellers] = await pool.query(
      "SELECT id FROM sellers WHERE user_id = ?",
      [req.user.id]
    );
    if (sellers.length === 0) {
      return errorRes(res, "Seller profile not found", 404);
    }
    
    // Fetch wallet transactions for package_purchase source
    const [transactions] = await pool.query(
      `SELECT wt.* FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       WHERE w.user_id = ? AND wt.source = 'package_purchase'
       ORDER BY wt.created_at DESC`,
      [req.user.id]
    );
    
    const history = transactions.map(tx => {
      let details = {};
      try {
        details = JSON.parse(tx.description);
      } catch (err) {
        // Fallback for simple/legacy descriptions
        details = {
          planId: tx.reference_id || 'basic',
          price: tx.amount,
          expiresAt: new Date(new Date(tx.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          purchaseType: 'new'
        };
      }
      
      return {
        receiptId: `QS-PKG-${tx.id}`,
        plan: details.planId || tx.reference_id,
        price: Number(tx.amount),
        purchasedAt: tx.created_at,
        expiresAt: details.expiresAt,
        type: details.purchaseType || 'new',
        walletTransactionId: tx.id,
        balanceAfter: Number(tx.balance_after),
        forfeitedDays: details.forfeitedDays || 0
      };
    });
    
    return successRes(res, history);
  } catch (err) {
    console.error("Error fetching package history:", err);
    return errorRes(res, "Failed to fetch package history");
  }
};

// Upload seller profile picture
exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return errorRes(res, "No file uploaded", 400);
    }

    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    const relativePath = `/uploads/profiles/${req.file.filename}`;
    
    // Update profile_picture_url in sellers table
    await SellerModel.update(seller.id, { profile_picture_url: relativePath });

    // Update profile_pic in users table so user session avatar updates
    await UserModel.update(req.user.id, { profile_pic: relativePath });

    return successRes(res, { profile_picture_url: relativePath }, "Profile picture updated successfully");
  } catch (err) {
    console.error("uploadProfilePic error:", err);
    return errorRes(res, "Failed to upload profile picture");
  }
};

// Upload work portfolio images
exports.uploadWorkImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorRes(res, "No files uploaded", 400);
    }

    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    const insertedImages = [];
    for (const file of req.files) {
      const relativePath = `/uploads/work/${file.filename}`;
      const [result] = await pool.query(
        "INSERT INTO seller_work_images (seller_id, image_url) VALUES (?, ?)",
        [seller.id, relativePath]
      );
      insertedImages.push({
        id: result.insertId,
        image_url: relativePath,
      });
    }

    return successRes(res, { work_images: insertedImages }, "Work images uploaded successfully");
  } catch (err) {
    console.error("uploadWorkImages error:", err);
    return errorRes(res, "Failed to upload work images");
  }
};

// Delete a work portfolio image
exports.deleteWorkImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    // Verify ownership of the image
    const [rows] = await pool.query(
      "SELECT * FROM seller_work_images WHERE id = ? AND seller_id = ?",
      [imageId, seller.id]
    );

    if (rows.length === 0) {
      return errorRes(res, "Image not found or access denied", 404);
    }

    const img = rows[0];

    // Remove from database
    await pool.query("DELETE FROM seller_work_images WHERE id = ?", [imageId]);

    // Delete physical file from file system
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "..", img.image_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return successRes(res, null, "Portfolio image deleted successfully");
  } catch (err) {
    console.error("deleteWorkImage error:", err);
    return errorRes(res, "Failed to delete portfolio image");
  }
};

