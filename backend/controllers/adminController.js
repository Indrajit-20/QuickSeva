const { pool } = require("../config/db");
const { successRes, errorRes, paginate } = require("../utils/helpers");
const WalletModel = require("../models/walletModel");

// Get admin dashboard stats
exports.getStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) as totalUsers FROM users");
    const [[{ activeUsers }]] = await pool.query("SELECT COUNT(*) as activeUsers FROM users WHERE is_active = 1");
    const [[{ totalServices }]] = await pool.query("SELECT COUNT(*) as totalServices FROM services WHERE is_active = 1");
    const [[{ completedServices }]] = await pool.query("SELECT COUNT(*) as completedServices FROM orders WHERE status = 'completed'");
    const [[{ pendingServices }]] = await pool.query("SELECT COUNT(*) as pendingServices FROM orders WHERE status IN ('pending', 'accepted', 'in_progress')");
    const [[{ disputedServices }]] = await pool.query("SELECT COUNT(*) as disputedServices FROM orders WHERE status = 'disputed'");
    const [[{ revenue }]] = await pool.query("SELECT IFNULL(SUM(platform_fee), 0) as revenue FROM orders");

    // Fetch dynamic recent activity log by merging registrations, bookings, and transactions
    const [latestUsers] = await pool.query(
      `SELECT 'signup' AS type, CONCAT('New user registered: ', name) AS action, created_at 
       FROM users ORDER BY created_at DESC LIMIT 5`
    );

    const [latestOrders] = await pool.query(
      `SELECT 'order' AS type, CONCAT('Order ', order_number, ' (', status, ')') AS action, created_at 
       FROM orders ORDER BY created_at DESC LIMIT 5`
    );

    const [latestTx] = await pool.query(
      `SELECT 'wallet' AS type, CONCAT('Wallet transaction: ₹', amount, ' (', source, ')') AS action, created_at 
       FROM wallet_transactions ORDER BY created_at DESC LIMIT 5`
    );

    // Merge and sort
    const recentActivity = [...latestUsers, ...latestOrders, ...latestTx]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    return successRes(res, {
      stats: {
        totalUsers,
        activeUsers,
        totalServices,
        completedServices,
        pendingServices,
        disputedServices,
        revenue: parseFloat(revenue),
      },
      recentActivity,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return errorRes(res, "Failed to fetch admin stats");
  }
};

// Get list of users with wallet balances
exports.getUsers = async (req, res) => {
  try {
    const { is_active, search } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, IFNULL(w.balance, 0.00) AS wallet_balance
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
    `;
    const params = [];
    const conditions = [];

    if (is_active !== undefined) {
      conditions.push("u.is_active = ?");
      params.push(parseInt(is_active));
    }

    if (search) {
      conditions.push("(u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY u.created_at DESC";

    const [users] = await pool.query(query, params);
    return successRes(res, { users });
  } catch (err) {
    console.error("Admin getUsers error:", err);
    return errorRes(res, "Failed to fetch users list");
  }
};

// Get list of sellers with detailed profile and verification files
exports.getSellers = async (req, res) => {
  try {
    const { is_verified, search } = req.query;
    let query = `
      SELECT s.id, s.business_name, s.avg_rating, s.total_orders, s.is_verified, s.is_available, s.documents, s.gst_number, s.seller_type,
             u.id as user_id, u.name, u.email, u.phone, u.city, u.state, u.address, u.pincode, u.is_active,
             c.name AS category_name
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (is_verified !== undefined) {
      conditions.push("s.is_verified = ?");
      params.push(parseInt(is_verified));
    }

    if (search) {
      conditions.push("(s.business_name LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY s.created_at DESC";

    const [sellers] = await pool.query(query, params);

    // Parse documents JSON
    const parsedSellers = sellers.map((seller) => {
      let docs = [];
      try {
        docs = typeof seller.documents === "string" ? JSON.parse(seller.documents) : (seller.documents || []);
      } catch (e) {
        docs = [];
      }
      return { ...seller, documents: docs };
    });

    return successRes(res, { sellers: parsedSellers });
  } catch (err) {
    console.error("Admin getSellers error:", err);
    return errorRes(res, "Failed to fetch sellers list");
  }
};

// Get disputed bookings
exports.getDisputes = async (req, res) => {
  try {
    const [disputes] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.platform_fee, o.payment_method, o.payment_status,
              o.notes, o.cancel_reason, o.created_at, o.updated_at,
              u.name AS buyer_name, u.phone AS buyer_phone, u.id AS buyer_id,
              s.business_name, s.id AS seller_id, su.name AS seller_name, su.phone AS seller_phone, su.id AS seller_user_id,
              sv.title AS service_title
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       JOIN sellers s ON o.seller_id = s.id
       JOIN users su ON s.user_id = su.id
       LEFT JOIN services sv ON o.service_id = sv.id
       WHERE o.status = 'disputed'
       ORDER BY o.updated_at DESC`
    );
    return successRes(res, { disputes });
  } catch (err) {
    console.error("Admin getDisputes error:", err);
    return errorRes(res, "Failed to fetch disputed orders");
  }
};

// Resolve dispute (complete payout or refund)
exports.resolveDispute = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'refund' or 'complete'

    if (!["refund", "complete"].includes(action)) {
      return errorRes(res, "Invalid resolution action. Use 'refund' or 'complete'.", 400);
    }

    await conn.beginTransaction();

    // Find order
    const [[order]] = await conn.query(
      `SELECT o.id, o.buyer_id, o.seller_id, o.total_amount, o.platform_fee, o.payment_method, o.payment_status,
              s.user_id as seller_user_id
       FROM orders o
       JOIN sellers s ON o.seller_id = s.id
       WHERE o.id = ? FOR UPDATE`,
      [orderId]
    );

    if (!order) {
      await conn.rollback();
      return errorRes(res, "Order not found", 404);
    }

    if (action === "refund") {
      // 1. Cancel order
      await conn.query(
        "UPDATE orders SET status = 'cancelled', payment_status = 'refunded' WHERE id = ?",
        [orderId]
      );

      // 2. Refund buyer's wallet if booking was paid
      if (order.payment_status === "paid" || order.payment_method === "wallet") {
        await conn.query(
          "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
          [order.total_amount, order.buyer_id]
        );

        // Fetch balance
        const [[wallet]] = await conn.query("SELECT balance FROM wallets WHERE user_id = ?", [order.buyer_id]);

        await conn.query(
          `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, source, reference_id, description)
           VALUES ((SELECT id FROM wallets WHERE user_id = ?), 'credit', ?, ?, 'dispute_refund', ?, ?)`,
          [order.buyer_id, order.total_amount, wallet.balance, orderId.toString(), `Refund resolved for Order #${order.id}`]
        );
      }
    } else if (action === "complete") {
      // 1. Mark order as completed
      await conn.query(
        "UPDATE orders SET status = 'completed', payment_status = 'paid' WHERE id = ?",
        [orderId]
      );

      // 2. Pay seller (Total amount minus commission/platform_fee)
      const payoutAmount = parseFloat(order.total_amount) - parseFloat(order.platform_fee || 0);

      await conn.query(
        "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
        [payoutAmount, order.seller_user_id]
      );

      const [[wallet]] = await conn.query("SELECT balance FROM wallets WHERE user_id = ?", [order.seller_user_id]);

      await conn.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, source, reference_id, description)
         VALUES ((SELECT id FROM wallets WHERE user_id = ?), 'credit', ?, ?, 'dispute_payout', ?, ?)`,
        [order.seller_user_id, payoutAmount, wallet.balance, orderId.toString(), `Payout resolved for Order #${order.id}`]
      );
    }

    await conn.commit();
    return successRes(res, null, `Dispute resolved successfully as: ${action}`);
  } catch (err) {
    await conn.rollback();
    console.error("Resolve dispute error:", err);
    return errorRes(res, "Failed to resolve dispute");
  } finally {
    conn.release();
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    return successRes(res, { categories });
  } catch (err) {
    console.error("Get categories error:", err);
    return errorRes(res, "Failed to fetch categories");
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name || !icon) {
      return errorRes(res, "Name and icon are required", 400);
    }

    const [result] = await pool.query(
      "INSERT INTO categories (name, icon, description) VALUES (?, ?, ?)",
      [name, icon, description || ""]
    );

    return successRes(res, { categoryId: result.insertId }, "Category created successfully", 201);
  } catch (err) {
    console.error("Create category error:", err);
    return errorRes(res, "Failed to create category");
  }
};

// Toggle category active status
exports.toggleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [[category]] = await pool.query("SELECT is_active FROM categories WHERE id = ?", [id]);
    if (!category) return errorRes(res, "Category not found", 404);

    const newStatus = category.is_active ? 0 : 1;
    await pool.query("UPDATE categories SET is_active = ? WHERE id = ?", [newStatus, id]);

    return successRes(res, null, `Category ${newStatus ? "activated" : "deactivated"}`);
  } catch (err) {
    console.error("Toggle category error:", err);
    return errorRes(res, "Failed to update category status");
  }
};
