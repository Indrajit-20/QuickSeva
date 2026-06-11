const SellerModel = require("../models/sellerModel");
const UserModel = require("../models/userModel");
const { pool } = require("../config/db");
const { successRes, errorRes, paginate } = require("../utils/helpers");

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
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);
    return successRes(res, { seller });
  } catch (err) {
    return errorRes(res, "Failed to fetch seller profile");
  }
};

// Get seller profile by ID (public)
exports.getSellerById = async (req, res) => {
  try {
    const seller = await SellerModel.findById(req.params.id);
    if (!seller) return errorRes(res, "Seller not found", 404);
    return successRes(res, { seller });
  } catch (err) {
    return errorRes(res, "Failed to fetch seller");
  }
};

// Update seller profile
exports.updateSellerProfile = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    const {
      business_name,
      category_id,
      bio,
      experience_yrs,
      working_radius,
      is_available,
    } = req.body;
    const fields = {};

    if (business_name !== undefined) fields.business_name = business_name;
    if (category_id !== undefined) fields.category_id = category_id;
    if (bio !== undefined) fields.bio = bio;
    if (experience_yrs !== undefined) fields.experience_yrs = experience_yrs;
    if (working_radius !== undefined) fields.working_radius = working_radius;
    if (is_available !== undefined) fields.is_available = is_available;

    await SellerModel.update(seller.id, fields);
    const updated = await SellerModel.findById(seller.id);
    return successRes(res, { seller: updated }, "Seller profile updated");
  } catch (err) {
    return errorRes(res, "Failed to update seller profile");
  }
};

// Toggle availability
exports.toggleAvailability = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    const newStatus = seller.is_available ? 0 : 1;
    await SellerModel.update(seller.id, { is_available: newStatus });
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
