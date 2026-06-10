const ReviewModel = require("../models/reviewModel");
const OrderModel = require("../models/orderModel");
const SellerModel = require("../models/sellerModel");
const { successRes, errorRes, paginate } = require("../utils/helpers");

// Submit a review after order completion
exports.submitReview = async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    const images = req.files ? req.files.map((f) => `/uploads/reviews/${f.filename}`) : [];

    const order = await OrderModel.findById(order_id);
    if (!order) return errorRes(res, "Order not found", 404);
    if (order.buyer_id !== req.user.id) return errorRes(res, "Unauthorized", 403);
    if (order.status !== "completed") return errorRes(res, "Can only review completed orders", 400);

    // Check already reviewed
    const existing = await ReviewModel.findByOrder(order_id);
    if (existing) return errorRes(res, "Order already reviewed", 400);

    const reviewId = await ReviewModel.create({
      order_id,
      buyer_id: req.user.id,
      seller_id: order.seller_id,
      rating,
      comment,
      images,
    });

    // Update seller average rating
    await SellerModel.updateRating(order.seller_id);

    const review = await ReviewModel.findByOrder(order_id);
    return successRes(res, { review }, "Review submitted", 201);
  } catch (err) {
    console.error("Submit review error:", err);
    return errorRes(res, "Failed to submit review");
  }
};

// Get reviews for a seller
exports.getSellerReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { limit: lim, offset } = paginate(page, limit);
    const { reviews, total } = await ReviewModel.findBySeller(req.params.sellerId, lim, offset);
    return successRes(res, { reviews, total, page: parseInt(page) });
  } catch (err) {
    return errorRes(res, "Failed to fetch reviews");
  }
};

// Seller reply to review
exports.replyToReview = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 403);

    const { reply } = req.body;
    const affected = await ReviewModel.addReply(req.params.id, seller.id, reply);
    if (!affected) return errorRes(res, "Review not found or unauthorized", 404);

    return successRes(res, null, "Reply added");
  } catch (err) {
    return errorRes(res, "Failed to add reply");
  }
};
