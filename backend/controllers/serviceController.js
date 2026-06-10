const ServiceModel = require("../models/serviceModel");
const SellerModel = require("../models/sellerModel");
const { successRes, errorRes, paginate } = require("../utils/helpers");

// Create a service
exports.createService = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile required", 403);

    const { category_id, title, description, price, price_type, duration_hrs, tags } = req.body;
    const images = req.files ? req.files.map((f) => `/uploads/services/${f.filename}`) : [];

    const serviceId = await ServiceModel.create({
      seller_id: seller.id,
      category_id,
      title,
      description,
      price,
      price_type,
      duration_hrs,
      images,
      tags: tags ? JSON.parse(tags) : [],
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
    return successRes(res, { service });
  } catch (err) {
    return errorRes(res, "Failed to fetch service");
  }
};

// Get all services by a seller (public)
exports.getServicesBySeller = async (req, res) => {
  try {
    const services = await ServiceModel.findBySeller(req.params.sellerId);
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

    const { title, description, price, price_type, duration_hrs, category_id } = req.body;
    const fields = {};

    if (title        !== undefined) fields.title        = title;
    if (description  !== undefined) fields.description  = description;
    if (price        !== undefined) fields.price        = price;
    if (price_type   !== undefined) fields.price_type   = price_type;
    if (duration_hrs !== undefined) fields.duration_hrs = duration_hrs;
    if (category_id  !== undefined) fields.category_id  = category_id;

    if (req.files && req.files.length) {
      fields.images = JSON.stringify(req.files.map((f) => `/uploads/services/${f.filename}`));
    }

    await ServiceModel.update(req.params.id, fields);
    const updated = await ServiceModel.findById(req.params.id);
    return successRes(res, { service: updated }, "Service updated");
  } catch (err) {
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

    return successRes(res, null, "Service deleted");
  } catch (err) {
    return errorRes(res, "Failed to delete service");
  }
};
