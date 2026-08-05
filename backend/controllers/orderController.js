const crypto = require("crypto");
const OrderModel = require("../models/orderModel");
const SellerModel = require("../models/sellerModel");
const { pool } = require("../config/db");
const {
  successRes,
  errorRes,
  paginate,
  generateOrderNumber,
} = require("../utils/helpers");
const { emitToUser, emitToOrder } = require("../utils/socketService");

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
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    if (payment_method === "wallet") {
      return errorRes(res, "Wallet payments are not supported for bookings", 400);
    }

    const seller = await SellerModel.findById(seller_id);
    if (!seller) return errorRes(res, "Seller not found", 404);
    if (!seller.is_available) {
      return errorRes(res, "This service provider is currently offline and not accepting new bookings.", 400);
    }

    // Validate seller leave dates and weekly off-days
    if (scheduled_at) {
      const scheduledDate = new Date(scheduled_at);
      const dateString = scheduledDate.toISOString().split("T")[0];

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = dayNames[scheduledDate.getDay()];

      let availableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      if (seller.available_days) {
        availableDays = typeof seller.available_days === "string" ? JSON.parse(seller.available_days) : seller.available_days;
      }

      let unavailableDates = [];
      if (seller.unavailable_dates) {
        unavailableDates = typeof seller.unavailable_dates === "string" ? JSON.parse(seller.unavailable_dates) : seller.unavailable_dates;
      }

      if (unavailableDates.includes(dateString)) {
        return errorRes(res, `The seller is on leave on ${dateString}. Please select another date.`, 400);
      }

      if (!availableDays.includes(dayName)) {
        return errorRes(res, `The seller does not work on ${dayName}s. Please pick another day.`, 400);
      }

      const slotDuration = Number(seller.slot_duration_mins || 60);
      const capacity = Number(seller.slot_capacity || 1);
      const isAgency = seller.account_type === "agency" || seller.seller_type === "agency" || capacity > 1;

      if (isAgency) {
        // Multi-capacity check for agency accounts
        const [existingBookings] = await pool.query(
          `SELECT COUNT(*) AS count FROM orders 
           WHERE seller_id = ? 
             AND status != 'cancelled' 
             AND ABS(TIMESTAMPDIFF(MINUTE, ?, scheduled_at)) < ?`,
          [seller_id, scheduled_at, slotDuration]
        );
        const count = existingBookings?.[0]?.count || 0;
        if (count >= capacity) {
          return errorRes(
            res,
            `This time slot has reached its maximum team capacity (${capacity} bookings). Please select a different time slot.`,
            400
          );
        }
      } else {
        // Individual seller check (capacity = 1)
        const [conflictingOrders] = await pool.query(
          `SELECT id, scheduled_at FROM orders 
           WHERE seller_id = ? 
             AND status != 'cancelled' 
             AND ABS(TIMESTAMPDIFF(MINUTE, ?, scheduled_at)) < ? 
           LIMIT 1`,
          [seller_id, scheduled_at, slotDuration]
        );

        if (conflictingOrders && conflictingOrders.length > 0) {
          const conflictTime = new Date(conflictingOrders[0].scheduled_at);
          const formattedTime = conflictTime.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true,
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return errorRes(
            res,
            `This slot is unavailable. The seller already has a booking around ${formattedTime}. Please select another available time slot.`,
            400
          );
        }
      }
    }

    const [serviceRows] = await pool.query("SELECT * FROM services WHERE id = ?", [service_id]);
    if (serviceRows.length === 0) return errorRes(res, "Service not found", 404);
    const service = serviceRows[0];

    // Enforce a minimum visiting charge of ₹100 to cover provider's travel costs
    let visiting_charge = parseFloat(service.visiting_charge || 0);
    if (visiting_charge < 100.00) {
      visiting_charge = 100.00;
    }

    // Fetch platform fee settings
    const feeModel = "seller"; // Force seller model so buyers are never charged a platform fee
    const feePercentage = parseFloat(await getSystemSetting("platform_fee_percentage", "5.00"));

    // Calculate Stage 1 Platform Fee (based on visiting charge) and cap at max ₹100.00
    let calculated_fee = visiting_charge * (feePercentage / 100);
    if (calculated_fee > 100.00) {
      calculated_fee = 100.00;
    }
    const visiting_platform_fee = parseFloat(calculated_fee.toFixed(2));

    // Calculate how much the customer pays in Stage 1
    const total_stage_1 = feeModel === "buyer" ? (visiting_charge + visiting_platform_fee) : visiting_charge;

    // Stage 1 (Visiting Charge) is always paid online upfront during booking
    const isVisitingPaid = !!razorpay_payment_id;
    if (total_stage_1 > 0 || isVisitingPaid) {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return errorRes(res, "Visiting charge payment online verification details are required", 400);
      }
      
      if (process.env.RAZORPAY_KEY_SECRET) {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(body)
          .digest("hex");
        
        if (expectedSignature !== razorpay_signature) {
          return errorRes(res, "Payment signature verification failed", 400);
        }
      }
    }

    const order_number = generateOrderNumber();

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
      visiting_payment_status: isVisitingPaid ? "paid" : "pending",
    });

    if (isVisitingPaid) {
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
    if (sellerUser[0]?.[0]?.user_id) {
      emitToUser(sellerUser[0][0].user_id, "order_updated", { orderId, order, event: "order_created", status: "accepted" });
      emitToUser(sellerUser[0][0].user_id, "new_notification", {
        title: "New Order Booked!",
        message: `New order #${order_number} booked. Visiting charge paid.`,
        type: "order",
        ref_id: orderId,
      });
    }
    emitToUser(req.user.id, "order_updated", { orderId, order, event: "order_created", status: "accepted" });
    emitToUser(req.user.id, "new_notification", {
      title: "Order Placed Successfully",
      message: `Your booking #${order_number} has been confirmed.`,
      type: "order",
      ref_id: orderId,
    });
    return successRes(res, { order }, "Order placed successfully", 201);
  } catch (err) {
    console.error("Place order error:", err.message);
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

    emitToUser(order.buyer_id, "order_updated", { orderId: order.id, status: "accepted" });
    emitToUser(order.buyer_id, "new_notification", {
      title: "Order Accepted!",
      message: `Your order #${order.order_number} was accepted by the service provider.`,
      type: "order",
      ref_id: order.id,
    });
    emitToUser(req.user.id, "order_updated", { orderId: order.id, status: "accepted" });
    emitToOrder(order.id, "order_updated", { orderId: order.id, status: "accepted" });

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

    emitToUser(order.buyer_id, "order_updated", { orderId: order.id, status: "in_progress" });
    emitToUser(req.user.id, "order_updated", { orderId: order.id, status: "in_progress" });
    emitToOrder(order.id, "order_updated", { orderId: order.id, status: "in_progress" });

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

    // Verify completion PIN for cash orders
    if (order.payment_method === "cash") {
      const { otp } = req.body;
      if (!otp) {
        return errorRes(res, "Completion PIN is required for cash payments", 400);
      }
      if (order.completion_otp_code !== otp) {
        return errorRes(res, "Invalid completion PIN. Please ask the customer for the correct code.", 400);
      }
    }

    await OrderModel.updateStatus(req.params.id, "completed", {
      completed_at: new Date(),
    });


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

    emitToUser(order.buyer_id, "order_updated", { orderId: order.id, status: "completed" });
    emitToUser(order.buyer_id, "new_notification", {
      title: "Order Completed!",
      message: `Your order #${order.order_number} is completed. Please rate your experience.`,
      type: "order",
      ref_id: order.id,
    });
    emitToUser(req.user.id, "order_updated", { orderId: order.id, status: "completed" });
    emitToOrder(order.id, "order_updated", { orderId: order.id, status: "completed" });

    return successRes(res, null, "Order completed");
  } catch (err) {
    console.error("Complete order error:", err);
    return errorRes(res, "Failed to complete order");
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const reason = req.body.cancel_reason || req.body.reason;
    const order = await OrderModel.findById(req.params.id);
    if (!order) return errorRes(res, "Order not found", 404);

    const isBuyer = order.buyer_id === req.user.id;
    const seller = await SellerModel.findByUserId(req.user.id);
    const isSeller = seller && order.seller_id === seller.id;

    if (!isBuyer && !isSeller) {
      return errorRes(res, "Unauthorized", 403);
    }

    // Require reason if seller is cancelling
    if (isSeller && (!reason || !reason.trim())) {
      return errorRes(res, "Reason for cancellation is required.", 400);
    }

    // Restrict buyer cancellation: not allowed if status is in_progress, completed, or cancelled, or if quotation has been paid
    if (isBuyer && (["in_progress", "completed", "cancelled"].includes(order.status) || order.final_payment_status === "paid")) {
      return errorRes(res, "You cannot cancel the booking after the work has started or quotation has been paid", 400);
    }

    // Cancellation is allowed if not already completed or cancelled
    if (["completed", "cancelled"].includes(order.status)) {
      return errorRes(res, "Order cannot be cancelled at this stage", 400);
    }

    await OrderModel.updateStatus(req.params.id, "cancelled", {
      cancel_reason: reason || (isBuyer ? "Cancelled by buyer" : "Cancelled by seller"),
    });

    let refundAmount = 0;
    let isLateCancellation = false;

    // Check if buyer cancelled within 2 hours of scheduled time
    if (isBuyer && order.scheduled_at) {
      const scheduledTime = new Date(order.scheduled_at).getTime();
      const currentTime = Date.now();
      isLateCancellation = (scheduledTime - currentTime) < 2 * 60 * 60 * 1000;
    }

    if (order.payment_method === "online") {
      const feeModel = await getSystemSetting("platform_fee_model", "seller");

      // Only refund visiting charge if cancelled before provider visited (i.e. status is pending or accepted)
      if (order.visiting_payment_status === "paid" && ["pending", "accepted"].includes(order.status)) {
        if (!isLateCancellation) {
          const visiting_charge = parseFloat(order.visiting_charge_amount || 0);
          const visiting_fee = parseFloat(order.visiting_platform_fee || 0);
          refundAmount += visiting_charge + (feeModel === "buyer" ? visiting_fee : 0);
          await OrderModel.updatePaymentStatus(req.params.id, "refunded");
        }
      }

      // If cancelled after provider visited (i.e. status is in_progress or quoted)
      if (order.visiting_payment_status === "paid" && ["in_progress", "quoted"].includes(order.status)) {
        if (!isBuyer) {
          // Seller cancelled after visit: refund visiting charge to buyer
          const visiting_charge = parseFloat(order.visiting_charge_amount || 0);
          const visiting_fee = parseFloat(order.visiting_platform_fee || 0);
          refundAmount += visiting_charge + (feeModel === "buyer" ? visiting_fee : 0);
          await OrderModel.updatePaymentStatus(req.params.id, "refunded");
        }
      }

      if (order.final_payment_status === "paid") {
        const service_charge = parseFloat(order.service_charge_amount || 0);
        const parts_cost = parseFloat(order.parts_cost_amount || 0);
        const discount = parseFloat(order.discount_amount || 0);
        const final_fee = parseFloat(order.final_platform_fee || 0);
        refundAmount += (service_charge + parts_cost - discount) + (feeModel === "buyer" ? final_fee : 0);
        await pool.query("UPDATE orders SET final_payment_status = 'refunded' WHERE id = ?", [order.id]);
      }
    }

    // Fetch seller user ID if not already available
    let sellerUserId = null;
    if (isSeller) {
      sellerUserId = req.user.id;
    } else {
      const [sellerRows] = await pool.query("SELECT user_id FROM sellers WHERE id = ?", [order.seller_id]);
      sellerUserId = sellerRows[0]?.user_id;
    }

    const displayReason = reason || (isBuyer ? "Cancelled by buyer" : "Cancelled by seller");

    // Send notifications to both buyer and seller
    if (isBuyer) {
      // 1. Notify Seller
      let sellerMessage = `Order #${order.order_number} has been cancelled by the customer. Reason: "${displayReason}".`;
      if (isLateCancellation && order.payment_method === "online") {
        sellerMessage += ` Customer cancelled late, payment has been retained and will be settled to you directly.`;
      }
      if (sellerUserId) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
          [sellerUserId, "Order Cancelled by Customer", sellerMessage, order.id]
        );
      }

      // 2. Notify Buyer (Confirming cancellation + refund status)
      let buyerMessage = `Your booking #${order.order_number} has been cancelled successfully.`;
      if (refundAmount > 0) {
        buyerMessage += ` Refund of ₹${refundAmount.toFixed(2)} has been initiated directly to your bank account/UPI via Razorpay. It will reflect in 5-7 business days.`;
      } else if (order.payment_method === "online" && isLateCancellation) {
        buyerMessage += ` Since the booking was cancelled less than 2 hours before the schedule, the visiting charge of ₹${parseFloat(order.visiting_charge_amount || 0).toFixed(2)} was not refunded.`;
      }
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
        [order.buyer_id, "Booking Cancelled", buyerMessage, order.id]
      );

    } else if (isSeller) {
      // 1. Notify Buyer
      let buyerMessage = `Order #${order.order_number} has been cancelled by the service provider. Reason: "${displayReason}".`;
      if (refundAmount > 0) {
        buyerMessage += ` A full refund of ₹${refundAmount.toFixed(2)} has been initiated directly to your bank account/UPI via Razorpay. It will reflect in 5-7 business days.`;
      }
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
        [order.buyer_id, "Order Cancelled by Provider", buyerMessage, order.id]
      );

      // 2. Notify Seller (Confirming cancellation)
      if (sellerUserId) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
          [sellerUserId, "Booking Cancelled", `You have cancelled booking #${order.order_number}. Reason: "${displayReason}".`, order.id]
        );
      }
    }

    emitToUser(order.buyer_id, "order_updated", { orderId: order.id, status: "cancelled" });
    emitToUser(order.buyer_id, "new_notification", {
      title: "Booking Cancelled",
      message: isSeller ? `Order #${order.order_number} was cancelled by the provider.` : `Your booking #${order.order_number} has been cancelled.`,
      type: "order",
      ref_id: order.id,
    });
    if (sellerUserId) {
      emitToUser(sellerUserId, "order_updated", { orderId: order.id, status: "cancelled" });
      emitToUser(sellerUserId, "new_notification", {
        title: "Booking Cancelled",
        message: isBuyer ? `Order #${order.order_number} was cancelled by the customer.` : `Booking #${order.order_number} was cancelled.`,
        type: "order",
        ref_id: order.id,
      });
    }
    emitToOrder(order.id, "order_updated", { orderId: order.id, status: "cancelled" });

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
    if (!["in_progress", "quoted", "quote_rejected", "cancelled"].includes(order.status))
      return errorRes(res, "Quotation cannot be created or revised at this stage", 400);

    const sCharge = parseFloat(service_charge || 0);
    const pCost = parseFloat(parts_cost || 0);
    const disc = parseFloat(discount || 0);

    if (isNaN(sCharge) || sCharge < 0) {
      return errorRes(res, "Service charge must be a non-negative number", 400);
    }
    if (isNaN(pCost) || pCost < 0) {
      return errorRes(res, "Parts cost must be a non-negative number", 400);
    }
    if (isNaN(disc) || disc < 0) {
      return errorRes(res, "Discount must be a non-negative number", 400);
    }
    if (disc > (sCharge + pCost)) {
      return errorRes(res, "Discount cannot exceed the sum of service charge and parts cost", 400);
    }

    const subtotal = sCharge + pCost - disc;

    const feeModel = await getSystemSetting("platform_fee_model", "seller");
    const feePercentage = parseFloat(await getSystemSetting("platform_fee_percentage", "5.00"));

    // No platform fee for Stage 2 (final quotation)
    const final_platform_fee = "0.00";
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

    emitToUser(order.buyer_id, "order_updated", { orderId: order.id, status: "quoted" });
    emitToUser(req.user.id, "order_updated", { orderId: order.id, status: "quoted" });
    emitToOrder(order.id, "order_updated", { orderId: order.id, status: "quoted" });

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

    // Block multiple approvals:
    if (order.final_payment_status === "paid" || order.completion_otp_code !== null) {
      return errorRes(res, "Quotation has already been approved", 400);
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    const subtotal = parseFloat(order.service_charge_amount || 0) + parseFloat(order.parts_cost_amount || 0) - parseFloat(order.discount_amount || 0);
    const remaining = subtotal; // No platform fee on final bill (Stage 2)

    // Verify online payment if required
    if (order.payment_method === "online" && remaining > 0) {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return errorRes(res, "Missing payment details for online quotation approval", 400);
      }
      
      if (process.env.RAZORPAY_KEY_SECRET) {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(body)
          .digest("hex");
        
        if (expectedSignature !== razorpay_signature) {
          return errorRes(res, "Payment signature verification failed", 400);
        }
      }
    }

    const final_pay_status = (order.payment_method === "online") ? "paid" : "pending";

    const completion_otp_code = order.payment_method === "cash"
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : null;

    // Update order totals and statuses
    // Set status to in_progress directly. No start OTP needed.
    await pool.query(
      `UPDATE orders SET
        status = 'in_progress',
        final_payment_status = ?,
        total_amount = total_amount + ?,
        platform_fee = platform_fee + ?,
        completion_otp_code = ?
       WHERE id = ?`,
      [
        final_pay_status,
        remaining.toFixed(2),
        "0.00", // No Stage 2 platform fee added
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

    emitToUser(order.buyer_id, "order_updated", { orderId: order.id, status: "in_progress", final_payment_status: final_pay_status });
    if (sellerUser[0]?.[0]?.user_id) {
      emitToUser(sellerUser[0][0].user_id, "order_updated", { orderId: order.id, status: "in_progress", final_payment_status: final_pay_status });
    }
    emitToOrder(order.id, "order_updated", { orderId: order.id, status: "in_progress", final_payment_status: final_pay_status });

    return successRes(res, null, "Quotation approved and paid");
  } catch (err) {
    console.error("Approve quotation error:", err);
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

// Dispute order (Option A flow)
exports.disputeOrder = async (req, res) => {
  try {
    const reason = req.body.dispute_reason || req.body.reason || "Disputed by buyer";
    const order = await OrderModel.findById(req.params.id);
    if (!order) return errorRes(res, "Order not found", 404);

    const isBuyer = order.buyer_id === req.user.id;
    if (!isBuyer) {
      return errorRes(res, "Unauthorized", 403);
    }

    if (!["accepted", "in_progress", "quoted"].includes(order.status)) {
      return errorRes(res, "Order cannot be disputed at this stage", 400);
    }

    await OrderModel.updateStatus(req.params.id, "disputed", {
      cancel_reason: reason,
    });

    // Notify the seller
    const [sellerUserRows] = await pool.query("SELECT user_id FROM sellers WHERE id = ?", [order.seller_id]);
    const sellerUserId = sellerUserRows[0]?.user_id;
    if (sellerUserId) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
        [
          sellerUserId,
          "Order Disputed",
          `Order #${order.order_number} has been disputed by the customer.`,
          order.id,
        ]
      );
    }

    return successRes(res, null, "Order has been placed in dispute");
  } catch (err) {
    console.error("Dispute order error:", err);
    return errorRes(res, "Failed to dispute order");
  }
};

// Switch payment method from Online to Cash (buyer or seller)
exports.switchToCash = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return errorRes(res, "Order not found", 404);

    // Verify authorized user (either the buyer or the seller of this order)
    const isBuyer = order.buyer_id === req.user.id;
    const seller = await SellerModel.findByUserId(req.user.id).catch(() => null);
    const isSeller = seller && order.seller_id === seller.id;

    if (!isBuyer && !isSeller) {
      return errorRes(res, "Unauthorized", 403);
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return errorRes(res, "Cannot change payment method for completed or cancelled bookings", 400);
    }

    const completion_otp_code = order.completion_otp_code || Math.floor(1000 + Math.random() * 9000).toString();

    await pool.query(
      `UPDATE orders SET
        payment_method = 'cash',
        completion_otp_code = ?
       WHERE id = ?`,
      [completion_otp_code, req.params.id]
    );

    // Notify the other party
    const recipientId = isBuyer ? (await pool.query("SELECT user_id FROM sellers WHERE id = ?", [order.seller_id]))[0][0].user_id : order.buyer_id;
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
      [
        recipientId,
        "Payment Method Changed!",
        `Payment method for order #${order.order_number} was switched to Cash on Delivery.`,
        order.id
      ]
    );

    return successRes(res, { completion_otp_code }, "Switched to Cash payment successfully");
  } catch (err) {
    console.error("Switch to cash error:", err);
    return errorRes(res, "Failed to switch payment method");
  }
};

// Switch payment method dynamically between Online and Cash
exports.switchPaymentMethod = async (req, res) => {
  try {
    const { payment_method } = req.body;
    if (!["online", "cash"].includes(payment_method)) {
      return errorRes(res, "Invalid payment method. Must be 'online' or 'cash'", 400);
    }
    const order = await OrderModel.findById(req.params.id);
    if (!order) return errorRes(res, "Order not found", 404);

    const isBuyer = order.buyer_id === req.user.id;
    const seller = await SellerModel.findByUserId(req.user.id).catch(() => null);
    const isSeller = seller && order.seller_id === seller.id;

    if (!isBuyer && !isSeller) {
      return errorRes(res, "Unauthorized", 403);
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return errorRes(res, "Cannot change payment method for completed or cancelled bookings", 400);
    }

    let completion_otp_code = order.completion_otp_code;
    if (payment_method === "cash" && !completion_otp_code) {
      completion_otp_code = Math.floor(1000 + Math.random() * 9000).toString();
    }

    await pool.query(
      `UPDATE orders SET payment_method = ?, completion_otp_code = ? WHERE id = ?`,
      [payment_method, completion_otp_code, req.params.id]
    );

    const [sellerRows] = await pool.query("SELECT user_id FROM sellers WHERE id = ?", [order.seller_id]);
    const sellerUserId = sellerRows[0]?.user_id;

    const targetUserId = isBuyer ? sellerUserId : order.buyer_id;
    if (targetUserId) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
        [
          targetUserId,
          "Payment Method Changed!",
          `Payment method for order #${order.order_number} was changed to ${payment_method.toUpperCase()}.`,
          order.id
        ]
      );
    }

    emitToUser(order.buyer_id, "order_updated", { orderId: order.id, payment_method });
    if (sellerUserId) {
      emitToUser(sellerUserId, "order_updated", { orderId: order.id, payment_method });
    }
    emitToOrder(order.id, "order_updated", { orderId: order.id, payment_method });

    return successRes(res, { payment_method, completion_otp_code }, `Payment method switched to ${payment_method}`);
  } catch (err) {
    console.error("Switch payment method error:", err);
    return errorRes(res, "Failed to switch payment method");
  }
};

// Reject quotation (buyer)
exports.rejectQuotation = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await OrderModel.findById(req.params.id);
    if (!order || order.buyer_id !== req.user.id) {
      return errorRes(res, "Order not found", 404);
    }
    if (order.status !== "quoted" && order.status !== "quote_rejected") {
      return errorRes(res, "No active quotation to reject", 400);
    }

    const rejectionReason = reason?.trim() || "Customer requested price revision or declined the quotation.";

    await pool.query(
      `UPDATE orders SET status = 'quote_rejected', quotation_notes = ? WHERE id = ?`,
      [`REJECTED BY BUYER: ${rejectionReason}`, req.params.id]
    );

    const [sellerRows] = await pool.query("SELECT user_id FROM sellers WHERE id = ?", [order.seller_id]);
    const sellerUserId = sellerRows[0]?.user_id;

    if (sellerUserId) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
        [
          sellerUserId,
          "Quotation Declined!",
          `Customer declined quotation for order #${order.order_number}. Reason: "${rejectionReason}". You can revise your quotation or cancel the order.`,
          order.id
        ]
      );
    }

    emitToUser(order.buyer_id, "order_updated", { orderId: order.id, status: "quote_rejected" });
    if (sellerUserId) {
      emitToUser(sellerUserId, "order_updated", { orderId: order.id, status: "quote_rejected" });
    }
    emitToOrder(order.id, "order_updated", { orderId: order.id, status: "quote_rejected" });

    return successRes(res, null, "Quotation rejected. Technician has been notified to revise.");
  } catch (err) {
    console.error("Reject quotation error:", err);
    return errorRes(res, "Failed to reject quotation");
  }
};
