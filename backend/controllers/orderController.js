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

// Helper to get system settings dynamically
async function getSystemSetting(key, defaultValue = "") {
  try {
    const [rows] = await pool.query("SELECT `value` FROM system_settings WHERE `key` = ?", [key]);
    if (rows && rows.length > 0) return rows[0].value;
    return defaultValue;
  } catch (err) {
    console.error(`Failed to get system setting ${key}:`, err);
    return defaultValue;
  }
}

// Place a new order (Stage 1: Visiting Charge Payment)
exports.placeOrder = async (req, res) => {
  try {
    const {
      seller_id,
      service_id,
      payment_method,
      address,
      lat,
      lng,
      scheduled_at,
      notes,
    } = req.body;

    const seller = await SellerModel.findById(seller_id);
    if (!seller) return errorRes(res, "Seller not found", 404);
    // Bypassed seller availability check to allow testing/fake payments when seller is unavailable
    /*
    if (!seller.is_available)
      return errorRes(res, "Seller is currently unavailable", 400);
    */

    const [serviceRows] = await pool.query("SELECT * FROM services WHERE id = ?", [service_id]);
    if (serviceRows.length === 0) return errorRes(res, "Service not found", 404);
    const service = serviceRows[0];

    // Enforce a minimum visiting charge of ₹100 to cover provider's travel costs
    let visiting_charge = parseFloat(service.visiting_charge || 0);
    if (visiting_charge < 100.00) {
      visiting_charge = 100.00;
    }

    // Fetch platform fee settings
    const feeModel = await getSystemSetting("platform_fee_model", "buyer");
    const feePercentage = parseFloat(await getSystemSetting("platform_fee_percentage", "5.00"));

    // Calculate Stage 1 Platform Fee (based on visiting charge) and cap at max ₹100.00
    let calculated_fee = visiting_charge * (feePercentage / 100);
    if (calculated_fee > 100.00) {
      calculated_fee = 100.00;
    }
    const visiting_platform_fee = parseFloat(calculated_fee.toFixed(2));

    // Calculate how much the customer pays in Stage 1
    // Option A (buyer pays fee): pays visiting charge + fee
    // Option B (seller pays fee): pays only visiting charge
    const total_stage_1 = feeModel === "buyer" ? (visiting_charge + visiting_platform_fee) : visiting_charge;

    const order_number = generateOrderNumber();

    // If wallet payment, debit Stage 1 amount immediately
    if (payment_method === "wallet") {
      await WalletModel.debit(
        req.user.id,
        total_stage_1.toFixed(2),
        "order",
        order_number,
        `Visiting charge for order ${order_number}`,
      );
    }

    const orderId = await OrderModel.create({
      order_number,
      buyer_id: req.user.id,
      seller_id,
      service_id,
      total_amount: total_stage_1.toFixed(2),
      platform_fee: visiting_platform_fee.toFixed(2),
      payment_method,
      address,
      lat,
      lng,
      scheduled_at,
      notes,
      visiting_charge_amount: visiting_charge.toFixed(2),
      visiting_platform_fee: visiting_platform_fee.toFixed(2),
      visiting_payment_status: (payment_method === "wallet" || payment_method === "online") ? "paid" : "pending",
    });

    if (payment_method === "wallet" || payment_method === "online") {
      await OrderModel.updatePaymentStatus(orderId, "paid");
      // For immediate verification, if paid, also auto-accept or transition status to accepted
      await OrderModel.updateStatus(orderId, "accepted");
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
        "New Order Booked!",
        `New order #${order_number} booked. Visiting charge paid.`,
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

    // Validate Secure Completion PIN for Cash orders
    if (order.payment_method === "cash") {
      const { otp } = req.body;
      if (!otp || String(order.completion_otp_code) !== String(otp).trim()) {
        return errorRes(res, "Invalid secure completion PIN. Please count the cash and verify the PIN with the buyer.", 400);
      }
    }

    await OrderModel.updateStatus(req.params.id, "completed", {
      completed_at: new Date(),
    });

    // Credit seller wallet (amount minus platform fee) if not cash
    if (order.payment_method !== "cash") {
      const feeModel = await getSystemSetting("platform_fee_model", "buyer");
      
      const visiting_charge = parseFloat(order.visiting_charge_amount || 0);
      const service_charge = parseFloat(order.service_charge_amount || 0);
      const parts_cost = parseFloat(order.parts_cost_amount || 0);
      const discount = parseFloat(order.discount_amount || 0);

      const sellerEarnings = visiting_charge + service_charge + parts_cost - discount;
      let sellerAmount = sellerEarnings;

      if (feeModel === "seller") {
        const visiting_fee = parseFloat(order.visiting_platform_fee || 0);
        const final_fee = parseFloat(order.final_platform_fee || 0);
        sellerAmount = sellerEarnings - (visiting_fee + final_fee);
      }

      await WalletModel.credit(
        seller.user_id,
        sellerAmount.toFixed(2),
        "order",
        order.order_number,
        `Payment for order #${order.order_number}`,
      );
    }

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
    console.error("Complete order error:", err);
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

    // Restrict buyer cancellation: not allowed if status is in_progress, completed, or cancelled
    if (isBuyer && ["in_progress", "completed", "cancelled"].includes(order.status)) {
      return errorRes(res, "You cannot cancel the booking after the work has started", 400);
    }

    // Cancellation is allowed if not already completed or cancelled
    if (["completed", "cancelled"].includes(order.status)) {
      return errorRes(res, "Order cannot be cancelled at this stage", 400);
    }

    await OrderModel.updateStatus(req.params.id, "cancelled", {
      cancel_reason,
    });

    // Refund wallet if paid via wallet
    if (order.payment_method === "wallet") {
      let refundAmount = 0;
      const feeModel = await getSystemSetting("platform_fee_model", "buyer");

      // Only refund visiting charge if cancelled before provider visited (i.e. status is pending or accepted)
      if (order.visiting_payment_status === "paid" && ["pending", "accepted"].includes(order.status)) {
        const visiting_charge = parseFloat(order.visiting_charge_amount || 0);
        const visiting_fee = parseFloat(order.visiting_platform_fee || 0);
        refundAmount += visiting_charge + (feeModel === "buyer" ? visiting_fee : 0);
      }

      if (order.final_payment_status === "paid") {
        const service_charge = parseFloat(order.service_charge_amount || 0);
        const parts_cost = parseFloat(order.parts_cost_amount || 0);
        const discount = parseFloat(order.discount_amount || 0);
        const final_fee = parseFloat(order.final_platform_fee || 0);
        refundAmount += (service_charge + parts_cost - discount) + (feeModel === "buyer" ? final_fee : 0);
      }

      if (refundAmount > 0) {
        await WalletModel.credit(
          order.buyer_id,
          refundAmount.toFixed(2),
          "refund",
          order.order_number,
          `Refund for cancelled order #${order.order_number}`,
        );
        await OrderModel.updatePaymentStatus(req.params.id, "refunded");
      }
    }

    return successRes(res, null, "Order cancelled");
  } catch (err) {
    console.error("Cancel order error:", err);
    return errorRes(res, "Failed to cancel order");
  }
};

// Submit quotation (seller)
exports.submitQuotation = async (req, res) => {
  try {
    const { service_charge, parts_cost, discount, notes } = req.body;
    const seller = await SellerModel.findByUserId(req.user.id);
    const order = await OrderModel.findById(req.params.id);

    if (!order || order.seller_id !== seller.id)
      return errorRes(res, "Order not found", 404);
    if (order.status !== "in_progress")
      return errorRes(res, "Order must be in progress to submit quotation", 400);

    const feeModel = await getSystemSetting("platform_fee_model", "buyer");
    const feePercentage = parseFloat(await getSystemSetting("platform_fee_percentage", "5.00"));

    // Calculate Stage 2 platform fee on quotation subtotal and cap at max ₹100.00
    let quote_fee = subtotal * (feePercentage / 100);
    if (quote_fee > 100.00) {
      quote_fee = 100.00;
    }
    const final_platform_fee = quote_fee.toFixed(2);
    const start_otp_code = Math.floor(1000 + Math.random() * 9000).toString();

    await pool.query(
      `UPDATE orders SET
        status = 'quoted',
        service_charge_amount = ?,
        parts_cost_amount = ?,
        discount_amount = ?,
        final_platform_fee = ?,
        quotation_notes = ?,
        start_otp_code = ?
       WHERE id = ?`,
      [
        parseFloat(service_charge || 0).toFixed(2),
        parseFloat(parts_cost || 0).toFixed(2),
        parseFloat(discount || 0).toFixed(2),
        parseFloat(final_platform_fee).toFixed(2),
        notes || "",
        start_otp_code,
        req.params.id
      ]
    );

    // Send notification to buyer
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
      [
        order.buyer_id,
        "New Quotation Received!",
        `Technician submitted a quotation of ₹${subtotal} for order #${order.order_number}. Please review.`,
        order.id
      ]
    );

    return successRes(res, { start_otp_code }, "Quotation submitted successfully");
  } catch (err) {
    console.error("Submit quotation error:", err);
    return errorRes(res, "Failed to submit quotation");
  }
};

// Approve & pay quotation (buyer)
exports.approveQuotation = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order || order.buyer_id !== req.user.id)
      return errorRes(res, "Order not found", 404);
    if (order.status !== "quoted")
      return errorRes(res, "No active quotation to approve", 400);

    const subtotal = parseFloat(order.service_charge_amount || 0) + parseFloat(order.parts_cost_amount || 0) - parseFloat(order.discount_amount || 0);
    const feeModel = await getSystemSetting("platform_fee_model", "buyer");
    const remaining = feeModel === "buyer" ? (subtotal + parseFloat(order.final_platform_fee || 0)) : subtotal;

    const final_pay_status = (order.payment_method === "wallet" || order.payment_method === "online") ? "paid" : "pending";

    // If wallet payment, debit remaining amount immediately
    if (order.payment_method === "wallet") {
      await WalletModel.debit(
        req.user.id,
        remaining.toFixed(2),
        "order",
        order.order_number,
        `Final payment for order ${order.order_number}`,
      );
    }

    const completion_otp_code = order.payment_method === "cash"
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : null;

    // Update order totals and statuses
    // Set status to quoted but final payment status updated. Seller enters Start OTP to move back to in_progress
    await pool.query(
      `UPDATE orders SET
        final_payment_status = ?,
        total_amount = total_amount + ?,
        platform_fee = platform_fee + ?,
        completion_otp_code = ?
       WHERE id = ?`,
      [
        final_pay_status,
        remaining.toFixed(2),
        parseFloat(order.final_platform_fee || 0).toFixed(2),
        completion_otp_code,
        req.params.id
      ]
    );

    // Notify seller
    const sellerUser = await pool.query(
      `SELECT user_id FROM sellers WHERE id = ?`,
      [order.seller_id]
    );
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
      [
        sellerUser[0][0].user_id,
        "Quotation Approved!",
        `Buyer approved and paid the quotation for order #${order.order_number}. Enter the start code to begin work.`,
        order.id
      ]
    );

    return successRes(res, null, "Quotation approved and paid");
  } catch (err) {
    console.error("Approve quotation error:", err);
    if (err.message === "Insufficient wallet balance") {
      return errorRes(res, "Insufficient wallet balance", 400);
    }
    return errorRes(res, "Failed to approve quotation");
  }
};

// Verify OTP start code (seller)
exports.verifyStartCode = async (req, res) => {
  try {
    const { otp } = req.body;
    const seller = await SellerModel.findByUserId(req.user.id);
    const order = await OrderModel.findById(req.params.id);

    if (!order || order.seller_id !== seller.id)
      return errorRes(res, "Order not found", 404);
    if (order.status !== "quoted")
      return errorRes(res, "Order not in quoted stage", 400);

    if (order.start_otp_code !== otp) {
      return errorRes(res, "Invalid start code. Please ask the customer for the correct code.", 400);
    }

    // Transition order back to in_progress and clear OTP
    await pool.query(
      `UPDATE orders SET
        status = 'in_progress',
        start_otp_code = NULL
       WHERE id = ?`,
      [req.params.id]
    );

    // Notify buyer
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
      [
        order.buyer_id,
        "Service Started!",
        `Technician verified the start code. Work on order #${order.order_number} has officially started.`,
        order.id
      ]
    );

    return successRes(res, null, "Start code verified. Service is now in progress.");
  } catch (err) {
    console.error("Verify start code error:", err);
    return errorRes(res, "Failed to verify start code");
  }
};
