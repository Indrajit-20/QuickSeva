const ServiceModel = require("../models/serviceModel");
const SellerModel = require("../models/sellerModel");
const { successRes, errorRes, paginate } = require("../utils/helpers");
const { pool } = require("../config/db");

// Create a service
exports.createService = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile required", 403);

    const { category_id, sub_service_id, title, description, price, price_type, duration_hrs, tags } = req.body;

    if (!category_id) {
      return errorRes(res, "Category is required", 400);
    }
    if (!title || !title.trim()) {
      return errorRes(res, "Service title is required", 400);
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return errorRes(res, "Price must be a positive number", 400);
    }

    const validPriceTypes = ["fixed", "hourly", "negotiable"];
    if (!validPriceTypes.includes(price_type)) {
      return errorRes(res, "Invalid price type", 400);
    }

    // Auto-register seller under category if not already registered
    const [catCheck] = await pool.query(
      "SELECT 1 FROM seller_categories WHERE seller_id = ? AND category_id = ?",
      [seller.id, category_id]
    );
    if (catCheck.length === 0) {
      await pool.query(
        "INSERT INTO seller_categories (seller_id, category_id) VALUES (?, ?)",
        [seller.id, category_id]
      );
      console.log(`[Auto-Register] Registered category ${category_id} for seller ${seller.id}`);
    }

    const images = req.files ? req.files.map((f) => `/uploads/services/${f.filename}`) : [];

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = [];
      }
    }

    const serviceId = await ServiceModel.create({
      seller_id: seller.id,
      category_id,
      sub_service_id: sub_service_id || null,
      title,
      description: description || null,
      price: numPrice,
      price_type,
      duration_hrs: duration_hrs || null,
      images,
      tags: parsedTags,
    });

    const service = await ServiceModel.findById(serviceId);
    return successRes(res, { service }, "Service created successfully", 201);
  } catch (err) {
    console.error("Create service error:", err);
    return errorRes(res, "Failed to create service");
  }
};

// Get all services for logged-in seller
exports.getMyServices = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 404);

    const services = await ServiceModel.findBySeller(seller.id);
    return successRes(res, { services });
  } catch (err) {
    return errorRes(res, "Failed to fetch services");
  }
};

// Get a service by ID (public)
exports.getServiceById = async (req, res) => {
  try {
    const service = await ServiceModel.findById(req.params.id);
    if (!service) return errorRes(res, "Service not found", 404);

    // Hide inactive services from public views
    if (!service.is_active) {
      const isOwnerOrAdmin = req.user && (
        req.user.role === "admin" ||
        await SellerModel.findByUserId(req.user.id).then(seller => seller && seller.id === service.seller_id)
      );
      if (!isOwnerOrAdmin) {
        return errorRes(res, "Service not found", 404);
      }
    }

    return successRes(res, { service });
  } catch (err) {
    console.error("Get service by ID error:", err);
    return errorRes(res, "Failed to fetch service");
  }
};

// Get all services by a seller (public)
exports.getServicesBySeller = async (req, res) => {
  try {
    const services = await ServiceModel.findBySeller(req.params.sellerId, true);
    return successRes(res, { services });
  } catch (err) {
    return errorRes(res, "Failed to fetch services");
  }
};

// Search services (public)
exports.searchServices = async (req, res) => {
  try {
    const { keyword, category_id, min_price, max_price, page = 1, limit = 10 } = req.query;
    const { limit: lim, offset } = paginate(page, limit);

    const services = await ServiceModel.search({
      keyword, category_id, min_price, max_price, limit: lim, offset,
    });

    return successRes(res, { services, page: parseInt(page), limit: lim });
  } catch (err) {
    return errorRes(res, "Search failed");
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 403);

    const service = await ServiceModel.findById(req.params.id);
    if (!service || service.seller_id !== seller.id) {
      return errorRes(res, "Service not found or unauthorized", 403);
    }

    const { title, description, price, price_type, duration_hrs, category_id, sub_service_id, is_active } = req.body;
    const fields = {};

    if (is_active !== undefined) fields.is_active = is_active ? 1 : 0;
    if (sub_service_id !== undefined) fields.sub_service_id = sub_service_id || null;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return errorRes(res, "Service title is required", 400);
      }
      fields.title = title.trim();
    }
    if (description !== undefined) fields.description = description;

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return errorRes(res, "Price must be a positive number", 400);
      }
      fields.price = numPrice;
    }

    if (price_type !== undefined) {
      const validPriceTypes = ["fixed", "hourly", "negotiable"];
      if (!validPriceTypes.includes(price_type)) {
        return errorRes(res, "Invalid price type", 400);
      }
      fields.price_type = price_type;
    }

    if (duration_hrs !== undefined) fields.duration_hrs = duration_hrs;

    if (category_id !== undefined) {
      const [catCheck] = await pool.query(
        "SELECT 1 FROM seller_categories WHERE seller_id = ? AND category_id = ?",
        [seller.id, category_id]
      );
      if (catCheck.length === 0) {
        await pool.query(
          "INSERT INTO seller_categories (seller_id, category_id) VALUES (?, ?)",
          [seller.id, category_id]
        );
        console.log(`[Auto-Register] Registered category ${category_id} for seller ${seller.id} on update`);
      }
      fields.category_id = category_id;
    }

    if (req.files && req.files.length) {
      fields.images = JSON.stringify(req.files.map((f) => `/uploads/services/${f.filename}`));
    }

    await ServiceModel.update(req.params.id, fields);
    const updated = await ServiceModel.findById(req.params.id);
    return successRes(res, { service: updated }, "Service updated");
  } catch (err) {
    console.error("Update service error:", err);
    return errorRes(res, "Failed to update service");
  }
};

// Delete (soft delete) service
exports.deleteService = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 403);

    const affected = await ServiceModel.delete(req.params.id, seller.id);
    if (!affected) return errorRes(res, "Service not found or unauthorized", 403);

    // Count active services for this seller after deletion
    const [serviceRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM services WHERE seller_id = ? AND is_active = 1",
      [seller.id]
    );
    const services_count = serviceRows[0]?.count || 0;

    return successRes(res, { services_count }, "Service deleted successfully");
  } catch (err) {
    console.error("Delete service error:", err);
    return errorRes(res, "Failed to delete service");
  }
};

// Fetch sub-services for a category
exports.getSubServicesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM sub_services WHERE category_id = ? ORDER BY name ASC",
      [categoryId]
    );
    return successRes(res, { sub_services: rows });
  } catch (err) {
    console.error("Get sub-services error:", err);
    return errorRes(res, "Failed to fetch sub-services");
  }
};
