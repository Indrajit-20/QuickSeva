const SellerModel = require("../models/sellerModel");
const CategoryModel = require("../models/categoryModel");
const { successRes, errorRes, paginate } = require("../utils/helpers");
const { pool } = require("../config/db");

// Get nearby sellers/services based on lat/lng
exports.getNearbySellers = async (req, res) => {
  try {
    const {
      lat, lng,
      radius = 10,
      category_id,
      page = 1,
      limit = 20,
    } = req.query;

    if (!lat || !lng) {
      return errorRes(res, "lat and lng are required", 400);
    }

    const { limit: lim, offset } = paginate(page, limit);

    const sellers = await SellerModel.findNearby({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseFloat(radius),
      category_id,
      limit: lim,
      offset,
    });

    return successRes(res, {
      sellers,
      count: sellers.length,
      radius_km: parseFloat(radius),
      page: parseInt(page),
    });
  } catch (err) {
    console.error("Nearby sellers error:", err);
    return errorRes(res, "Failed to fetch nearby sellers");
  }
};

// Get all categories (for filter chips in frontend)
exports.getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.getAll();
    return successRes(res, { categories });
  } catch (err) {
    return errorRes(res, "Failed to fetch categories");
  }
};

// Get nearby sellers by category
exports.getNearbyByCategory = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 20 } = req.query;
    const { category_id } = req.params;

    if (!lat || !lng) return errorRes(res, "lat and lng are required", 400);

    const { limit: lim, offset } = paginate(page, limit);

    const sellers = await SellerModel.findNearby({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseFloat(radius),
      category_id,
      limit: lim,
      offset,
    });

    return successRes(res, { sellers, count: sellers.length });
  } catch (err) {
    return errorRes(res, "Failed to fetch nearby sellers by category");
  }
};

// Get public statistics for the landing page
exports.getPublicStats = async (req, res) => {
  try {
    const [[{ totalCustomers }]] = await pool.query(
      "SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'buyer' AND is_active = 1"
    );
    const [[{ totalSellers }]] = await pool.query(
      "SELECT COUNT(*) as totalSellers FROM users WHERE role = 'seller' AND is_active = 1"
    );
    const [[{ totalOrders }]] = await pool.query(
      "SELECT COUNT(*) as totalOrders FROM orders"
    );
    const [[{ totalServices }]] = await pool.query(
      "SELECT COUNT(*) as totalServices FROM services WHERE is_active = 1"
    );

    return successRes(res, {
      totalCustomers: totalCustomers || 0,
      totalSellers: totalSellers || 0,
      totalOrders: totalOrders || 0,
      totalServices: totalServices || 0,
    });
  } catch (err) {
    console.error("Public stats error:", err);
    // Return standard fallback values if the database queries fail or db is empty
    return successRes(res, {
      totalCustomers: 500,
      totalSellers: 150,
      totalOrders: 1200,
      totalServices: 80,
    });
  }
};

// Get recent user/seller registrations for social proof toast
exports.getRecentActivities = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.role, u.city, u.created_at, s.business_name, c.name AS category_name
      FROM users u
      LEFT JOIN sellers s ON u.id = s.user_id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE u.is_active = 1
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    return successRes(res, { activities: rows });
  } catch (err) {
    console.error("Recent activities error:", err);
    return successRes(res, { activities: [] });
  }
};

