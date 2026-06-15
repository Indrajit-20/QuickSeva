const OrderModel = require("../models/orderModel");
const SellerModel = require("../models/sellerModel");
const WalletModel = require("../models/walletModel");
const { pool } = require("../config/db");
const {
  successRes,
  errorRes,
  paginate,
  generateOrderNumber,
} = require("../utils/helpers");

// Place a new order
exports.placeOrder = async (req, res) => {
  try {
    const {
      seller_id,
      service_id,
      total_amount,
      payment_method,
      address,
      lat,
      lng,
      scheduled_at,
      notes,
    } = req.body;

    const seller = await SellerModel.findById(seller_id);
    if (!seller) return errorRes(res, "Seller not found", 404);
    if (!seller.is_available)
      return errorRes(res, "Seller is currently unavailable", 400);

    const platform_fee = (parseFloat(total_amount) * 0.05).toFixed(2); // 5% fee
    const order_number = generateOrderNumber();

    // If wallet payment, debit immediately
    if (payment_method === "wallet") {
      await WalletModel.debit(
        req.user.id,
        total_amount,
        "order",
        order_number,
        `Payment for order ${order_number}`,
      );
    }

    const orderId = await OrderModel.create({
      order_number,
      buyer_id: req.user.id,
      seller_id,
      service_id,
      total_amount,
      platform_fee,
      payment_method,
      address,
      lat,
      lng,
      scheduled_at,
      notes,
    });

    if (payment_method === "wallet") {
      await OrderModel.updatePaymentStatus(orderId, "paid");
    }

    // Create notification for seller
    const sellerUser = await pool.query(
      `SELECT user_id FROM sellers WHERE id = ?`,
      [seller_id],
    );
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, ref_id)
       VALUES (?, ?, ?, 'order', ?)`,
      [
        sellerUser[0][0].user_id,
        "New Order!",
        `You have a new order #${order_number}`,
        orderId,
      ],
    );

    const order = await OrderModel.findById(orderId);
    return successRes(res, { order }, "Order placed successfully", 201);
  } catch (err) {
    console.error("Place order error:", err.message);
    if (err.message === "Insufficient wallet balance") {
      return errorRes(res, "Insufficient wallet balance", 400);
    }
    return errorRes(res, "Failed to place order");
  }
};

// Get buyer's orders
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { limit: lim, offset } = paginate(page, limit);
    const orders = await OrderModel.findByBuyer(
      req.user.id,
      status,
      lim,
      offset,
    );
    return successRes(res, { orders, page: parseInt(page) });
  } catch (err) {
    return errorRes(res, "Failed to fetch orders");
  }
};

// Get seller's orders
exports.getSellerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { limit: lim, offset } = paginate(page, limit);

    const seller = await SellerModel.findByUserId(req.user.id);
    if (!seller) return errorRes(res, "Seller profile not found", 403);

    const orders = await OrderModel.findBySeller(
      seller.id,
      status,
      lim,
      offset,
    );
    return successRes(res, { orders, page: parseInt(page) });
  } catch (err) {
    return errorRes(res, "Failed to fetch orders");
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return errorRes(res, "Order not found", 404);

    // Check ownership
    // Only allow buyer or seller to view their order.
    // Seller access is enforced strictly via authorize("seller") on seller routes.
    // Admin-only browsing should use dedicated admin APIs.
    const seller = await SellerModel.findByUserId(req.user.id);

    const isBuyer = order.buyer_id === req.user.id;
    const isSeller = seller && order.seller_id === seller.id;

    if (!isBuyer && !isSeller) {
      return errorRes(res, "Unauthorized", 403);
    }

    return successRes(res, { order });
  } catch (err) {
    return errorRes(res, "Failed to fetch order");
  }
};

// Accept order (seller)
exports.acceptOrder = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    const order = await OrderModel.findById(req.params.id);

    if (!order || order.seller_id !== seller.id)
      return errorRes(res, "Order not found", 404);
    if (order.status !== "pending")
      return errorRes(res, "Order cannot be accepted now", 400);

    await OrderModel.updateStatus(req.params.id, "accepted");

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
      [
        order.buyer_id,
        "Order Accepted!",
        `Your order #${order.order_number} was accepted`,
        order.id,
      ],
    );

    return successRes(res, null, "Order accepted");
  } catch (err) {
    return errorRes(res, "Failed to accept order");
  }
};

// Start order (seller)
exports.startOrder = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    const order = await OrderModel.findById(req.params.id);

    if (!order || order.seller_id !== seller.id)
      return errorRes(res, "Order not found", 404);
    if (order.status !== "accepted")
      return errorRes(res, "Order must be accepted first", 400);

    await OrderModel.updateStatus(req.params.id, "in_progress", {
      started_at: new Date(),
    });
    return successRes(res, null, "Order started");
  } catch (err) {
    return errorRes(res, "Failed to start order");
  }
};

// Complete order (seller)
exports.completeOrder = async (req, res) => {
  try {
    const seller = await SellerModel.findByUserId(req.user.id);
    const order = await OrderModel.findById(req.params.id);

    if (!order || order.seller_id !== seller.id)
      return errorRes(res, "Order not found", 404);
    if (order.status !== "in_progress")
      return errorRes(res, "Order not in progress", 400);

    await OrderModel.updateStatus(req.params.id, "completed", {
      completed_at: new Date(),
    });

    // Credit seller wallet (amount minus platform fee)
    const sellerAmount =
      parseFloat(order.total_amount) - parseFloat(order.platform_fee);
    await WalletModel.credit(
      seller.user_id,
      sellerAmount.toFixed(2),
      "order",
      order.order_number,
      `Payment for order #${order.order_number}`,
    );

    // Update seller order count
    await pool.query(
      `UPDATE sellers SET total_orders = total_orders + 1 WHERE id = ?`,
      [seller.id],
    );

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
      [
        order.buyer_id,
        "Order Completed!",
        `Your order #${order.order_number} is completed. Please rate.`,
        order.id,
      ],
    );

    return successRes(res, null, "Order completed");
  } catch (err) {
    return errorRes(res, "Failed to complete order");
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { cancel_reason } = req.body;
    const order = await OrderModel.findById(req.params.id);
    if (!order) return errorRes(res, "Order not found", 404);

    const isBuyer = order.buyer_id === req.user.id;
    const seller = await SellerModel.findByUserId(req.user.id);
    const isSeller = seller && order.seller_id === seller.id;

    if (!isBuyer && !isSeller) {
      return errorRes(res, "Unauthorized", 403);
    }

    if (!req.user.role || req.user.role !== "seller") {
      // Cancel endpoint is seller-only.
      return errorRes(
        res,
        { success: false, message: "Seller access required" },
        403,
      );
    }

    if (!["pending", "accepted"].includes(order.status)) {
      return errorRes(res, "Order cannot be cancelled at this stage", 400);
    }

    await OrderModel.updateStatus(req.params.id, "cancelled", {
      cancel_reason,
    });

    // Refund wallet if paid via wallet
    if (order.payment_method === "wallet" && order.payment_status === "paid") {
      await WalletModel.credit(
        order.buyer_id,
        order.total_amount,
        "refund",
        order.order_number,
        `Refund for cancelled order #${order.order_number}`,
      );
      await OrderModel.updatePaymentStatus(req.params.id, "refunded");
    }

    return successRes(res, null, "Order cancelled");
  } catch (err) {
    return errorRes(res, "Failed to cancel order");
  }
};
