const SellerModel = require("../models/sellerModel");
const CategoryModel = require("../models/categoryModel");
const { successRes, errorRes, paginate } = require("../utils/helpers");

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
