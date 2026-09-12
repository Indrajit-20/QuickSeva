const { pool } = require("../config/db");
const { successRes, errorRes, paginate } = require("../utils/helpers");
const WalletModel = require("../models/walletModel");
const SellerModel = require("../models/sellerModel");

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

// Helper: Build user filter conditions
const buildUserFilterQuery = (queryObj) => {
  const { is_active, role, search, startDate, endDate } = queryObj;
  const conditions = [];
  const params = [];

  if (is_active !== undefined && is_active !== "" && is_active !== "all") {
    conditions.push("u.is_active = ?");
    params.push(parseInt(is_active, 10));
  }

  if (role && role !== "all") {
    conditions.push("u.role = ?");
    params.push(role);
  }

  if (search && search.trim()) {
    conditions.push("(u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)");
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (startDate) {
    conditions.push("u.created_at >= ?");
    params.push(`${startDate} 00:00:00`);
  }

  if (endDate) {
    conditions.push("u.created_at <= ?");
    params.push(`${endDate} 23:59:59`);
  }

  const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";
  return { whereClause, params };
};

// Get list of users with wallet balances (Paginated & Filtered)
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const offset = (page - 1) * limit;

    const { whereClause, params } = buildUserFilterQuery(req.query);

    // Get total matching users for pagination
    const countSql = `SELECT COUNT(*) AS total FROM users u ${whereClause}`;
    const [[{ total }]] = await pool.query(countSql, params);

    // Fetch paginated user rows with explicit numeric limit & offset
    const dataSql = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, IFNULL(w.balance, 0.00) AS wallet_balance
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [users] = await pool.query(dataSql, params);

    const totalPages = Math.ceil(total / limit) || 1;

    return successRes(res, {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Admin getUsers error:", err);
    return errorRes(res, "Failed to fetch users list");
  }
};

// Get list of sellers with detailed profile and verification files (Paginated & Filtered)
exports.getSellers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const { is_verified, is_active, search, category_id, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (is_verified !== undefined && is_verified !== "") {
      conditions.push("s.is_verified = ?");
      params.push(parseInt(is_verified, 10));
    }

    if (is_active !== undefined && is_active !== "") {
      conditions.push("u.is_active = ?");
      params.push(parseInt(is_active, 10));
    }

    if (search && search.trim()) {
      conditions.push("(s.business_name LIKE ? OR u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (category_id) {
      conditions.push("s.category_id = ?");
      params.push(parseInt(category_id, 10));
    }

    if (startDate) {
      conditions.push("s.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("s.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    // Count total matching sellers
    const countSql = `
      SELECT COUNT(*) AS total
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
    `;
    const [[{ total }]] = await pool.query(countSql, params);

    // Fetch paginated results
    const dataSql = `
      SELECT s.id, s.business_name, s.avg_rating, s.total_orders, s.total_reviews,
             s.is_verified, s.is_available, s.documents, s.gst_number, s.seller_type,
             s.plan, s.created_at AS seller_since,
             u.id as user_id, u.name, u.email, u.phone, u.city, u.state,
             u.address, u.pincode, u.is_active,
             c.name AS category_name, c.id AS category_id
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [sellers] = await pool.query(dataSql, params);

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

    const totalPages = Math.ceil(total / limit) || 1;

    return successRes(res, {
      sellers: parsedSellers,
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    console.error("Admin getSellers error:", err);
    return errorRes(res, "Failed to fetch sellers list");
  }
};


// Get disputed bookings
exports.getDisputes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { status, search, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    // Filter by status: default to 'disputed' if status is missing or empty, unless explicitly 'all'
    if (status && status !== "all") {
      if (status === "resolved") {
        conditions.push("o.status IN ('cancelled', 'completed')");
      } else {
        conditions.push("o.status = ?");
        params.push(status);
      }
    } else if (!status) {
      conditions.push("o.status = 'disputed'");
    }

    if (search && search.trim()) {
      conditions.push("(o.order_number LIKE ? OR u.name LIKE ? OR su.name LIKE ? OR s.business_name LIKE ? OR sv.title LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("o.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("o.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    // Count matching disputes
    const countSql = `
      SELECT COUNT(*) AS total
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      JOIN sellers s ON o.seller_id = s.id
      JOIN users su ON s.user_id = su.id
      LEFT JOIN services sv ON o.service_id = sv.id
      ${whereClause}
    `;
    const [[{ total }]] = await pool.query(countSql, params);

    // Fetch paginated results
    const dataSql = `
      SELECT o.id, o.order_number, o.status, o.total_amount, o.platform_fee, o.payment_method, o.payment_status,
             o.notes, o.cancel_reason, o.created_at, o.updated_at,
             u.name AS buyer_name, u.phone AS buyer_phone, u.id AS buyer_id,
             s.business_name, s.id AS seller_id, su.name AS seller_name, su.phone AS seller_phone, su.id AS seller_user_id,
             sv.title AS service_title
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      JOIN sellers s ON o.seller_id = s.id
      JOIN users su ON s.user_id = su.id
      LEFT JOIN services sv ON o.service_id = sv.id
      ${whereClause}
      ORDER BY o.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [disputes] = await pool.query(dataSql, params);

    const totalPages = Math.ceil(total / limit) || 1;

    return successRes(res, {
      disputes,
      pagination: { total, page, limit, totalPages },
    });
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

// ── EXPORT & IMPORT UTILITIES ──

// Helper: Convert objects array to CSV string with UTF-8 BOM for Excel
const convertToCSV = (headers, rows) => {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map((h) => escapeCell(h.label)).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCell(row[h.key])).join(",")
  );

  return "\uFEFF" + [headerRow, ...dataRows].join("\n");
};

// Export Users CSV (Filtered or All)
exports.exportUsersCSV = async (req, res) => {
  try {
    const { whereClause, params } = buildUserFilterQuery(req.query);

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, IFNULL(w.balance, 0.00) AS wallet_balance
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       ${whereClause}
       ORDER BY u.created_at DESC`,
      params
    );

    const headers = [
      { label: "User ID", key: "id" },
      { label: "Full Name", key: "name" },
      { label: "Email Address", key: "email" },
      { label: "Phone Number", key: "phone" },
      { label: "Role", key: "role" },
      { label: "Account Status", key: "status" },
      { label: "Wallet Balance (₹)", key: "wallet_balance" },
      { label: "Joined Date", key: "created_at" },
    ];

    const formattedRows = users.map((u) => ({
      ...u,
      status: u.is_active ? "Active" : "Blocked",
      wallet_balance: parseFloat(u.wallet_balance).toFixed(2),
      created_at: new Date(u.created_at).toLocaleString("en-IN"),
    }));

    const csvData = convertToCSV(headers, formattedRows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="QuickSeva_Users_Report.csv"');
    return res.status(200).send(csvData);
  } catch (err) {
    console.error("Export users error:", err);
    return errorRes(res, "Failed to export users report");
  }
};

// Export Sellers CSV (with same filters as getSellers)
exports.exportSellersCSV = async (req, res) => {
  try {
    const { is_verified, is_active, search, category_id, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (is_verified !== undefined && is_verified !== "") {
      conditions.push("s.is_verified = ?");
      params.push(parseInt(is_verified, 10));
    }

    if (is_active !== undefined && is_active !== "") {
      conditions.push("u.is_active = ?");
      params.push(parseInt(is_active, 10));
    }

    if (search && search.trim()) {
      conditions.push("(s.business_name LIKE ? OR u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (category_id) {
      conditions.push("s.category_id = ?");
      params.push(parseInt(category_id, 10));
    }

    if (startDate) {
      conditions.push("s.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("s.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    const [sellers] = await pool.query(
      `SELECT s.id, s.business_name, u.name AS owner_name, u.email, u.phone,
              c.name AS category_name, s.avg_rating, s.total_reviews,
              s.is_verified, s.is_available, s.plan, u.is_active, s.created_at
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       ${whereClause}
       ORDER BY s.created_at DESC`,
      params
    );

    const headers = [
      { label: "Seller ID", key: "id" },
      { label: "Business Name", key: "business_name" },
      { label: "Owner Name", key: "owner_name" },
      { label: "Email", key: "email" },
      { label: "Phone", key: "phone" },
      { label: "Category", key: "category_name" },
      { label: "Average Rating", key: "avg_rating" },
      { label: "Total Reviews", key: "total_reviews" },
      { label: "Verification Status", key: "is_verified" },
      { label: "Account Status", key: "account_status" },
      { label: "Subscription Plan", key: "plan" },
      { label: "Joined Date", key: "created_at" },
    ];

    const formattedRows = sellers.map((s) => ({
      ...s,
      category_name: s.category_name || "Uncategorized",
      avg_rating: parseFloat(s.avg_rating || 0).toFixed(1),
      is_verified: s.is_verified ? "Verified" : "Pending",
      account_status: s.is_active ? "Active" : "Suspended",
      plan: s.plan ? s.plan.toUpperCase() : "FREE",
      created_at: new Date(s.created_at).toLocaleString("en-IN"),
    }));

    const csvData = convertToCSV(headers, formattedRows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="QuickSeva_Sellers_Report.csv"');
    return res.status(200).send(csvData);
  } catch (err) {
    console.error("Export sellers error:", err);
    return errorRes(res, "Failed to export sellers report");
  }
};


// Export Disputes CSV
exports.exportDisputesCSV = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (status && status !== "all") {
      if (status === "resolved") {
        conditions.push("o.status IN ('cancelled', 'completed')");
      } else {
        conditions.push("o.status = ?");
        params.push(status);
      }
    } else if (!status) {
      conditions.push("o.status = 'disputed'");
    }

    if (search && search.trim()) {
      conditions.push("(o.order_number LIKE ? OR u.name LIKE ? OR su.name LIKE ? OR s.business_name LIKE ? OR sv.title LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("o.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("o.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    const [disputes] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.platform_fee, o.payment_method, o.payment_status,
              o.notes, o.cancel_reason, o.created_at, o.updated_at,
              u.name AS buyer_name, u.phone AS buyer_phone,
              s.business_name, su.name AS seller_name, su.phone AS seller_phone,
              sv.title AS service_title
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       JOIN sellers s ON o.seller_id = s.id
       JOIN users su ON s.user_id = su.id
       LEFT JOIN services sv ON o.service_id = sv.id
       ${whereClause}
       ORDER BY o.updated_at DESC`,
      params
    );

    const headers = [
      { label: "Dispute ID", key: "id" },
      { label: "Order Number", key: "order_number" },
      { label: "Status", key: "status" },
      { label: "Payment Status", key: "payment_status" },
      { label: "Payment Method", key: "payment_method" },
      { label: "Total Amount (₹)", key: "total_amount" },
      { label: "Platform Fee (₹)", key: "platform_fee" },
      { label: "Net Payout (₹)", key: "net_payout" },
      { label: "Buyer Name", key: "buyer_name" },
      { label: "Buyer Phone", key: "buyer_phone" },
      { label: "Business Name", key: "business_name" },
      { label: "Seller Contact", key: "seller_name" },
      { label: "Seller Phone", key: "seller_phone" },
      { label: "Service Title", key: "service_title" },
      { label: "Dispute Reason", key: "dispute_reason" },
      { label: "Booked Date", key: "created_at" },
      { label: "Last Updated", key: "updated_at" },
    ];

    const formattedRows = disputes.map((d) => {
      const totalAmt = parseFloat(d.total_amount || 0);
      const platFee = parseFloat(d.platform_fee || 0);
      return {
        ...d,
        total_amount: totalAmt.toFixed(2),
        platform_fee: platFee.toFixed(2),
        net_payout: (totalAmt - platFee).toFixed(2),
        service_title: d.service_title || "Custom Service Job",
        dispute_reason: d.cancel_reason || d.notes || "N/A",
        created_at: new Date(d.created_at).toLocaleString("en-IN"),
        updated_at: new Date(d.updated_at).toLocaleString("en-IN"),
      };
    });

    const csvData = convertToCSV(headers, formattedRows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="QuickSeva_Disputes_Report.csv"');
    return res.status(200).send(csvData);
  } catch (err) {
    console.error("Export disputes error:", err);
    return errorRes(res, "Failed to export disputes report");
  }
};


// Export Bookings CSV
// Get all bookings (paginated + filtered)
exports.getBookings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search, status, payment_method, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (status && status !== "all") {
      conditions.push("o.status = ?");
      params.push(status);
    }

    if (payment_method && payment_method !== "all") {
      conditions.push("o.payment_method = ?");
      params.push(payment_method);
    }

    if (search && search.trim()) {
      conditions.push("(o.order_number LIKE ? OR u.name LIKE ? OR s.business_name LIKE ? OR sv.title LIKE ? OR u.phone LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("o.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("o.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    const countSql = `
      SELECT COUNT(*) AS total
      FROM orders o
      LEFT JOIN users u ON o.buyer_id = u.id
      LEFT JOIN sellers s ON o.seller_id = s.id
      LEFT JOIN services sv ON o.service_id = sv.id
      ${whereClause}
    `;
    const [[{ total }]] = await pool.query(countSql, params);

    const dataSql = `
      SELECT o.id, o.order_number, o.status, o.payment_method, o.payment_status,
             o.total_amount, o.platform_fee, o.notes, o.cancel_reason,
             o.scheduled_date, o.created_at, o.updated_at,
             u.id AS buyer_id, u.name AS buyer_name, u.phone AS buyer_phone,
             s.id AS seller_id, s.business_name,
             su.name AS seller_name, su.phone AS seller_phone,
             sv.title AS service_title
      FROM orders o
      LEFT JOIN users u ON o.buyer_id = u.id
      LEFT JOIN sellers s ON o.seller_id = s.id
      LEFT JOIN users su ON s.user_id = su.id
      LEFT JOIN services sv ON o.service_id = sv.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [orders] = await pool.query(dataSql, params);

    const totalPages = Math.ceil(total / limit) || 1;

    return successRes(res, {
      orders,
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    console.error("Admin getBookings error:", err);
    return errorRes(res, "Failed to fetch bookings");
  }
};

exports.exportBookingsCSV = async (req, res) => {
  try {
    const { search, status, payment_method, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (status && status !== "all") {
      conditions.push("o.status = ?");
      params.push(status);
    }

    if (payment_method && payment_method !== "all") {
      conditions.push("o.payment_method = ?");
      params.push(payment_method);
    }

    if (search && search.trim()) {
      conditions.push("(o.order_number LIKE ? OR u.name LIKE ? OR s.business_name LIKE ? OR sv.title LIKE ? OR u.phone LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("o.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("o.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_method, o.payment_status,
              o.total_amount, o.platform_fee, o.scheduled_date, o.created_at,
              u.name AS buyer_name, u.phone AS buyer_phone,
              s.business_name, su.name AS seller_name, su.phone AS seller_phone,
              sv.title AS service_title
       FROM orders o
       LEFT JOIN users u ON o.buyer_id = u.id
       LEFT JOIN sellers s ON o.seller_id = s.id
       LEFT JOIN users su ON s.user_id = su.id
       LEFT JOIN services sv ON o.service_id = sv.id
       ${whereClause}
       ORDER BY o.created_at DESC`,
      params
    );

    const headers = [
      { label: "Order ID", key: "id" },
      { label: "Order Number", key: "order_number" },
      { label: "Status", key: "status" },
      { label: "Payment Method", key: "payment_method" },
      { label: "Payment Status", key: "payment_status" },
      { label: "Total Amount (₹)", key: "total_amount" },
      { label: "Platform Fee (₹)", key: "platform_fee" },
      { label: "Net Payout (₹)", key: "net_payout" },
      { label: "Service Title", key: "service_title" },
      { label: "Buyer Name", key: "buyer_name" },
      { label: "Buyer Phone", key: "buyer_phone" },
      { label: "Business Name", key: "business_name" },
      { label: "Seller Name", key: "seller_name" },
      { label: "Seller Phone", key: "seller_phone" },
      { label: "Scheduled Date", key: "scheduled_date" },
      { label: "Booked On", key: "created_at" },
    ];

    const formattedRows = orders.map((o) => {
      const total = parseFloat(o.total_amount || 0);
      const fee = parseFloat(o.platform_fee || 0);
      return {
        ...o,
        total_amount: total.toFixed(2),
        platform_fee: fee.toFixed(2),
        net_payout: (total - fee).toFixed(2),
        service_title: o.service_title || "Custom Service",
        status: String(o.status || "").toUpperCase(),
        payment_method: String(o.payment_method || "").toUpperCase(),
        payment_status: String(o.payment_status || "").toUpperCase(),
        scheduled_date: o.scheduled_date ? new Date(o.scheduled_date).toLocaleDateString("en-IN") : "N/A",
        created_at: new Date(o.created_at).toLocaleString("en-IN"),
      };
    });

    const csvData = convertToCSV(headers, formattedRows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="QuickSeva_Bookings_Report.csv"');
    return res.status(200).send(csvData);
  } catch (err) {
    console.error("Export bookings error:", err);
    return errorRes(res, "Failed to export bookings report");
  }
};

// Bulk Import Services
exports.bulkImportServices = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return errorRes(res, "Invalid payload. Array of service items is required.", 400);
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 1;

      if (!item.title || !item.seller_id || !item.price) {
        errors.push(`Row ${rowNum}: Title, seller_id, and price are required.`);
        failedCount++;
        continue;
      }

      try {
        await pool.query(
          `INSERT INTO services (seller_id, category_id, title, description, price, duration, is_active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            item.seller_id,
            item.category_id || null,
            String(item.title).trim(),
            item.description || "",
            parseFloat(item.price) || 0,
            item.duration || "1 hour",
          ]
        );
        successCount++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
        failedCount++;
      }
    }

    return successRes(res, {
      total: items.length,
      successCount,
      failedCount,
      errors,
    }, `Bulk import completed: ${successCount} imported successfully, ${failedCount} failed.`);
  } catch (err) {
    console.error("Bulk import services error:", err);
    return errorRes(res, "Failed to perform bulk import");
  }
};

// Bulk WhatsApp Broadcasting to Sellers or Buyers
exports.sendBulkWhatsApp = async (req, res) => {
  try {
    const { targetGroup, customPhoneNumbers, messageTemplate, delayMs } = req.body;

    if (!messageTemplate || !messageTemplate.trim()) {
      return errorRes(res, "Message template is required", 400);
    }

    let recipients = [];

    if (targetGroup === "sellers") {
      const [rows] = await pool.query(
        `SELECT DISTINCT s.phone, s.business_name AS name FROM sellers s WHERE s.phone IS NOT NULL AND s.phone != ''`
      );
      recipients = rows;
    } else if (targetGroup === "buyers") {
      const [rows] = await pool.query(
        `SELECT DISTINCT u.phone, u.name FROM users u WHERE u.phone IS NOT NULL AND u.phone != '' AND u.role = 'user'`
      );
      recipients = rows;
    } else if (targetGroup === "all") {
      const [rows] = await pool.query(
        `SELECT DISTINCT u.phone, u.name FROM users u WHERE u.phone IS NOT NULL AND u.phone != ''`
      );
      recipients = rows;
    } else if (Array.isArray(customPhoneNumbers) && customPhoneNumbers.length > 0) {
      recipients = customPhoneNumbers.map(p => ({ phone: p, name: "Valued Customer" }));
    } else {
      return errorRes(res, "Invalid target group or empty phone list", 400);
    }

    if (recipients.length === 0) {
      return errorRes(res, "No valid recipients found with registered phone numbers", 400);
    }

    const { sendBulkWhatsAppMessages } = require("../services/whatsappService");

    // Execute bulk broadcast in background so HTTP response is returned immediately
    sendBulkWhatsAppMessages({
      recipients,
      messageTemplate,
      delayMs: delayMs || 2000,
    }).then(result => {
      console.log(`[Bulk WhatsApp] Completed broadcast to ${result.total} recipients (${result.sentCount} sent, ${result.failedCount} failed)`);
    }).catch(err => {
      console.error("[Bulk WhatsApp] Broadcast error:", err);
    });

    return successRes(res, {
      totalRecipients: recipients.length,
      targetGroup,
      status: "processing_in_background",
      estimatedDurationSeconds: Math.ceil((recipients.length * (delayMs || 2000)) / 1000),
    }, `Bulk WhatsApp broadcast initiated for ${recipients.length} recipients`);
  } catch (err) {
    console.error("Bulk WhatsApp error:", err);
    return errorRes(res, "Failed to initiate bulk WhatsApp broadcast");
  }
};

// Get Contractor Verification Requests Queue
exports.getContractorVerifications = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    let sql = `
      SELECT id, name, company_name, phone, email, city, state, trade_specialization, is_verified_contractor,
             gstin, pan_number, license_number, verification_doc_url, verification_status, verification_notes, created_at
      FROM users
      WHERE (role = 'contractor' OR is_verified_contractor = 1 OR trade_specialization IS NOT NULL)
    `;
    const params = [];
    if (status && status !== "all") {
      sql += ` AND verification_status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(sql, params);
    return successRes(res, { verifications: rows }, "Contractor verifications fetched successfully");
  } catch (err) {
    console.error("getContractorVerifications error:", err);
    return errorRes(res, "Failed to fetch contractor verifications", 500);
  }
};

// Review Contractor Verification (Approve / Reject)
exports.reviewContractorVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'

    if (!["approve", "reject"].includes(action)) {
      return errorRes(res, "Action must be 'approve' or 'reject'", 400);
    }

    const isVerified = action === "approve" ? 1 : 0;
    const verificationStatus = action === "approve" ? "verified" : "rejected";

    const [resDb] = await pool.query(
      `UPDATE users
       SET is_verified_contractor = ?,
           verification_status = ?,
           verification_notes = ?
       WHERE id = ?`,
      [isVerified, verificationStatus, notes || null, id]
    );

    if (resDb.affectedRows === 0) {
      return errorRes(res, "Contractor not found", 404);
    }

    return successRes(res, null, `Contractor verification ${verificationStatus} successfully`);
  } catch (err) {
    console.error("reviewContractorVerification error:", err);
    return errorRes(res, "Failed to update contractor verification status", 500);
  }
};

// Get All Contractor Site Posts for Admin Moderation
exports.getAdminContractorPosts = async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT p.*, 
             u.name AS contractor_user_name,
             u.phone AS contractor_user_phone,
             u.profile_pic AS contractor_profile_pic,
             (SELECT COUNT(*) FROM contractor_applications app WHERE app.post_id = p.id) AS applications_count
      FROM contractor_posts p
      LEFT JOIN users u ON p.contractor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status === "active") {
      sql += ` AND p.status = 'active'`;
    } else if (status === "closed") {
      sql += ` AND p.status = 'closed'`;
    } else if (status === "featured") {
      sql += ` AND p.is_featured = 1`;
    }

    if (search) {
      sql += ` AND (p.title LIKE ? OR p.city LIKE ? OR p.contact_name LIKE ? OR u.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY p.is_featured DESC, p.created_at DESC`;

    const [posts] = await pool.query(sql, params);

    // Attach requirements line items to each post & normalize is_featured
    for (let post of posts) {
      const [reqs] = await pool.query(
        `SELECT * FROM contractor_post_requirements WHERE post_id = ?`,
        [post.id]
      );
      post.requirements = reqs;
      const featVal = post.is_featured?.[0] ?? post.is_featured;
      post.is_featured = (Number(featVal) === 1 || featVal === true || featVal === "1") ? 1 : 0;
    }

    return successRes(res, { posts }, "Admin contractor posts fetched successfully");
  } catch (err) {
    console.error("getAdminContractorPosts error:", err);
    return errorRes(res, "Failed to fetch contractor site posts", 500);
  }
};

// Update Contractor Post Status (Feature, Unfeature, Close, Reopen, Delete)
exports.updateAdminContractorPostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'toggle_featured', 'close', 'reopen', 'delete'

    const [[post]] = await pool.query(`SELECT * FROM contractor_posts WHERE id = ?`, [id]);
    if (!post) {
      return errorRes(res, "Site requirement post not found", 404);
    }

    if (action === "toggle_featured") {
      const featVal = post.is_featured?.[0] ?? post.is_featured;
      const isCurrentlyFeatured = (Number(featVal) === 1 || featVal === true || featVal === "1");
      const newFeatured = isCurrentlyFeatured ? 0 : 1;
      await pool.query(`UPDATE contractor_posts SET is_featured = ? WHERE id = ?`, [newFeatured, id]);
      return successRes(res, { is_featured: newFeatured }, `Site post ${newFeatured ? "featured" : "unfeatured"} successfully`);
    } else if (action === "close") {
      await pool.query(`UPDATE contractor_posts SET status = 'closed' WHERE id = ?`, [id]);
      return successRes(res, null, "Site post marked as closed");
    } else if (action === "reopen") {
      await pool.query(`UPDATE contractor_posts SET status = 'active' WHERE id = ?`, [id]);
      return successRes(res, null, "Site post re-opened successfully");
    } else if (action === "delete") {
      await pool.query(`DELETE FROM contractor_posts WHERE id = ?`, [id]);
      return successRes(res, null, "Site post deleted successfully");
    } else {
      return errorRes(res, "Invalid action", 400);
    }
  } catch (err) {
    console.error("updateAdminContractorPostStatus error:", err);
    return errorRes(res, "Failed to update contractor post status", 500);
  }
};

// Get All Client Quote Requests for Admin Oversight
exports.getAdminQuoteRequests = async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT q.*, 
             u.name AS contractor_name,
             u.company_name AS contractor_company_name,
             u.phone AS contractor_phone,
             u.trade_specialization AS contractor_trade
      FROM contractor_quote_requests q
      LEFT JOIN users u ON q.contractor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "all") {
      sql += ` AND q.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (q.customer_name LIKE ? OR q.customer_phone LIKE ? OR q.city LIKE ? OR u.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY q.created_at DESC`;

    const [requests] = await pool.query(sql, params);
    return successRes(res, { requests }, "Admin quote requests fetched successfully");
  } catch (err) {
    console.error("getAdminQuoteRequests error:", err);
    return errorRes(res, "Failed to fetch client quote requests", 500);
  }
};

// Update Client Quote Request Status
exports.updateAdminQuoteRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'pending', 'contacted', 'completed', 'cancelled'

    if (!["pending", "contacted", "completed", "cancelled"].includes(status)) {
      return errorRes(res, "Invalid status choice", 400);
    }

    const [resDb] = await pool.query(
      `UPDATE contractor_quote_requests SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (resDb.affectedRows === 0) {
      return errorRes(res, "Quote request not found", 404);
    }

    return successRes(res, null, `Quote request status updated to ${status}`);
  } catch (err) {
    console.error("updateAdminQuoteRequestStatus error:", err);
    return errorRes(res, "Failed to update quote request status", 500);
  }
};

// Get Contractor Analytics & Leaderboard for Admin
exports.getAdminContractorAnalytics = async (req, res) => {
  try {
    const [[totalContractors]] = await pool.query(
      `SELECT COUNT(*) AS count FROM users WHERE role = 'contractor'`
    );
    const [[verifiedContractors]] = await pool.query(
      `SELECT COUNT(*) AS count FROM users WHERE role = 'contractor' AND (verification_status = 'verified' OR is_verified_contractor = 1)`
    );
    const [[pendingContractors]] = await pool.query(
      `SELECT COUNT(*) AS count FROM users WHERE role = 'contractor' AND verification_status = 'pending'`
    );
    const [[totalPosts]] = await pool.query(
      `SELECT COUNT(*) AS count FROM contractor_posts`
    );
    const [[totalApplications]] = await pool.query(
      `SELECT COUNT(*) AS count FROM contractor_applications`
    );
    const [[totalQuoteRequests]] = await pool.query(
      `SELECT COUNT(*) AS count FROM contractor_quote_requests`
    );

    // Leaderboard query ranking top contractors
    const [leaderboard] = await pool.query(`
      SELECT u.id, u.name, u.company_name, u.phone, u.trade_specialization, u.city,
             u.is_verified_contractor, u.verification_status,
             (SELECT COUNT(*) FROM contractor_posts p WHERE p.contractor_id = u.id) AS posts_count,
             (SELECT COUNT(*) FROM contractor_applications app 
              JOIN contractor_posts p ON app.post_id = p.id 
              WHERE p.contractor_id = u.id) AS total_applications_received,
             (SELECT COUNT(*) FROM contractor_quote_requests q WHERE q.contractor_id = u.id) AS quote_leads_received
      FROM users u
      WHERE u.role = 'contractor'
      ORDER BY total_applications_received DESC, posts_count DESC, u.created_at DESC
      LIMIT 20
    `);

    return successRes(res, {
      stats: {
        totalContractors: totalContractors.count,
        verifiedContractors: verifiedContractors.count,
        pendingContractors: pendingContractors.count,
        totalPosts: totalPosts.count,
        totalApplications: totalApplications.count,
        totalQuoteRequests: totalQuoteRequests.count,
        complianceRate: totalContractors.count > 0 
          ? Math.round((verifiedContractors.count / totalContractors.count) * 100) 
          : 0,
      },
      leaderboard,
    }, "Contractor analytics and leaderboard fetched successfully");
  } catch (err) {
    console.error("getAdminContractorAnalytics error:", err);
    return errorRes(res, "Failed to fetch contractor analytics", 500);
  }
};

// Get Wallet & Payment Transactions (Paginated, Filtered, Summarized)
exports.getPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { type, search, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (type && type !== "all") {
      conditions.push("wt.type = ?");
      params.push(type);
    }

    if (search && search.trim()) {
      conditions.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR wt.reference_id LIKE ? OR wt.description LIKE ? OR wt.source LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("wt.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("wt.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    // Stats query across all matching records
    const statsSql = `
      SELECT 
        COUNT(*) AS totalCount,
        IFNULL(SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE 0 END), 0) AS totalCredit,
        IFNULL(SUM(CASE WHEN wt.type = 'debit' THEN wt.amount ELSE 0 END), 0) AS totalDebit,
        IFNULL(SUM(wt.amount), 0) AS totalVolume
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      ${whereClause}
    `;
    const [[stats]] = await pool.query(statsSql, params);

    // Paginated records query
    const dataSql = `
      SELECT wt.id, wt.wallet_id, wt.type, wt.amount, wt.balance_after, wt.source, wt.reference_id, wt.description, wt.created_at,
             u.id AS user_id, u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.role AS user_role
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY wt.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [transactions] = await pool.query(dataSql, params);

    const total = stats.totalCount || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return successRes(res, {
      transactions,
      stats: {
        totalVolume: parseFloat(stats.totalVolume).toFixed(2),
        totalCredit: parseFloat(stats.totalCredit).toFixed(2),
        totalDebit: parseFloat(stats.totalDebit).toFixed(2),
        totalCount: stats.totalCount,
      },
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    console.error("Admin getPayments error:", err);
    return errorRes(res, "Failed to fetch wallet & payment transactions");
  }
};

// Export Payments & Wallet Transactions CSV
exports.exportPaymentsCSV = async (req, res) => {
  try {
    const { type, search, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (type && type !== "all") {
      conditions.push("wt.type = ?");
      params.push(type);
    }

    if (search && search.trim()) {
      conditions.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR wt.reference_id LIKE ? OR wt.description LIKE ? OR wt.source LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("wt.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("wt.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    const [rows] = await pool.query(
      `SELECT wt.id, wt.type, wt.amount, wt.balance_after, wt.source, wt.reference_id, wt.description, wt.created_at,
              u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.role AS user_role
       FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       JOIN users u ON w.user_id = u.id
       ${whereClause}
       ORDER BY wt.created_at DESC`,
      params
    );

    const headers = [
      { label: "Txn ID", key: "id" },
      { label: "User Name", key: "user_name" },
      { label: "User Phone", key: "user_phone" },
      { label: "User Role", key: "user_role" },
      { label: "Type", key: "type" },
      { label: "Amount (₹)", key: "amount" },
      { label: "Balance After (₹)", key: "balance_after" },
      { label: "Source", key: "source" },
      { label: "Reference ID", key: "reference_id" },
      { label: "Description", key: "description" },
      { label: "Date", key: "created_at" },
    ];

    const formattedData = rows.map((r) => ({
      ...r,
      type: (r.type || "").toUpperCase(),
      amount: parseFloat(r.amount).toFixed(2),
      balance_after: parseFloat(r.balance_after).toFixed(2),
      created_at: new Date(r.created_at).toLocaleString(),
    }));

    return generateCSVResponse(res, formattedData, headers, "QuickSeva_Wallet_Transactions_Report.csv");
  } catch (err) {
    console.error("Admin exportPaymentsCSV error:", err);
    return errorRes(res, "Failed to export wallet transactions CSV");
  }
};

// Get Reviews (Paginated, Filtered, Summarized)
exports.getReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { rating, search, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (rating && rating !== "all") {
      conditions.push("r.rating = ?");
      params.push(parseInt(rating, 10));
    }

    if (search && search.trim()) {
      conditions.push("(u.name LIKE ? OR u.phone LIKE ? OR s.business_name LIKE ? OR su.name LIKE ? OR r.comment LIKE ? OR o.order_number LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("r.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("r.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    // Stats query across all matching reviews
    const statsSql = `
      SELECT 
        COUNT(*) AS totalCount,
        IFNULL(AVG(r.rating), 0) AS avgRating,
        SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS count5,
        SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS count4,
        SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS count3,
        SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS count2,
        SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS count1
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      JOIN sellers s ON r.seller_id = s.id
      JOIN users su ON s.user_id = su.id
      LEFT JOIN orders o ON r.order_id = o.id
      ${whereClause}
    `;
    const [[stats]] = await pool.query(statsSql, params);

    // Paginated reviews query
    const dataSql = `
      SELECT r.id, r.order_id, r.buyer_id, r.seller_id, r.rating, r.comment, r.reply, r.images, r.created_at,
             u.name AS buyer_name, u.phone AS buyer_phone, u.profile_pic AS buyer_pic,
             s.business_name, su.name AS seller_name, su.phone AS seller_phone,
             o.order_number
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      JOIN sellers s ON r.seller_id = s.id
      JOIN users su ON s.user_id = su.id
      LEFT JOIN orders o ON r.order_id = o.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [reviews] = await pool.query(dataSql, params);

    const total = stats.totalCount || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return successRes(res, {
      reviews,
      stats: {
        avgRating: parseFloat(stats.avgRating).toFixed(1),
        totalCount: stats.totalCount,
        ratingCounts: {
          5: stats.count5 || 0,
          4: stats.count4 || 0,
          3: stats.count3 || 0,
          2: stats.count2 || 0,
          1: stats.count1 || 0,
        },
      },
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    console.error("Admin getReviews error:", err);
    return errorRes(res, "Failed to fetch customer reviews");
  }
};

// Delete Review (Admin moderation)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const [[review]] = await pool.query("SELECT seller_id FROM reviews WHERE id = ?", [id]);
    if (!review) {
      return errorRes(res, "Review not found", 404);
    }

    await pool.query("DELETE FROM reviews WHERE id = ?", [id]);
    // Recalculate seller rating
    await SellerModel.updateRating(review.seller_id);

    return successRes(res, null, "Review deleted and seller rating recalculated successfully");
  } catch (err) {
    console.error("Admin deleteReview error:", err);
    return errorRes(res, "Failed to delete review");
  }
};

// Export Reviews CSV
exports.exportReviewsCSV = async (req, res) => {
  try {
    const { rating, search, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (rating && rating !== "all") {
      conditions.push("r.rating = ?");
      params.push(parseInt(rating, 10));
    }

    if (search && search.trim()) {
      conditions.push("(u.name LIKE ? OR u.phone LIKE ? OR s.business_name LIKE ? OR su.name LIKE ? OR r.comment LIKE ? OR o.order_number LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("r.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("r.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.reply, r.created_at,
              u.name AS buyer_name, u.phone AS buyer_phone,
              s.business_name, su.name AS seller_name,
              o.order_number
       FROM reviews r
       JOIN users u ON r.buyer_id = u.id
       JOIN sellers s ON r.seller_id = s.id
       JOIN users su ON s.user_id = su.id
       LEFT JOIN orders o ON r.order_id = o.id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      params
    );

    const headers = [
      { label: "Review ID", key: "id" },
      { label: "Order #", key: "order_number" },
      { label: "Buyer Name", key: "buyer_name" },
      { label: "Buyer Phone", key: "buyer_phone" },
      { label: "Business Name", key: "business_name" },
      { label: "Seller Name", key: "seller_name" },
      { label: "Rating (Stars)", key: "rating" },
      { label: "Comment", key: "comment" },
      { label: "Seller Reply", key: "reply" },
      { label: "Date", key: "created_at" },
    ];

    const formattedData = rows.map((r) => ({
      ...r,
      order_number: r.order_number || "N/A",
      comment: r.comment || "",
      reply: r.reply || "",
      created_at: new Date(r.created_at).toLocaleString(),
    }));

    return generateCSVResponse(res, formattedData, headers, "QuickSeva_Reviews_Report.csv");
  } catch (err) {
    console.error("Admin exportReviewsCSV error:", err);
    return errorRes(res, "Failed to export reviews CSV");
  }
};

// Get Buyer Leads (Paginated, Filtered, Summarized)
exports.getLeads = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { status, category, search, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (status && status !== "all") {
      conditions.push("fl.status = ?");
      params.push(status);
    }

    if (category && category !== "all") {
      conditions.push("fl.category = ?");
      params.push(category);
    }

    if (search && search.trim()) {
      conditions.push("(fl.customer_name LIKE ? OR fl.contact_number LIKE ? OR fl.category LIKE ? OR fl.pincode LIKE ? OR fl.address LIKE ? OR fl.description LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("fl.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("fl.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    // Stats query across matching leads
    const statsSql = `
      SELECT 
        COUNT(*) AS totalLeads,
        SUM(CASE WHEN fl.status = 'OPEN' THEN 1 ELSE 0 END) AS openLeads,
        SUM(CASE WHEN fl.status = 'PENDING' THEN 1 ELSE 0 END) AS pendingLeads,
        SUM(CASE WHEN fl.status = 'CLOSED' THEN 1 ELSE 0 END) AS closedLeads
      FROM fallback_leads fl
      ${whereClause}
    `;
    const [[stats]] = await pool.query(statsSql, params);

    // Paginated leads query
    const dataSql = `
      SELECT fl.id, fl.customer_name, fl.contact_number, fl.category, fl.pincode, fl.address, fl.description, fl.status, fl.created_at, fl.updated_at,
             (SELECT COUNT(*) FROM seller_lead_notifications sln WHERE sln.lead_id = fl.id) AS notified_sellers_count
      FROM fallback_leads fl
      ${whereClause}
      ORDER BY fl.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [leads] = await pool.query(dataSql, params);

    const total = stats.totalLeads || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return successRes(res, {
      leads,
      stats: {
        totalLeads: stats.totalLeads || 0,
        openLeads: stats.openLeads || 0,
        pendingLeads: stats.pendingLeads || 0,
        closedLeads: stats.closedLeads || 0,
      },
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    console.error("Admin getLeads error:", err);
    return errorRes(res, "Failed to fetch buyer leads");
  }
};

// Update Lead Status
exports.updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["OPEN", "PENDING", "CLOSED"].includes(status)) {
      return errorRes(res, "Invalid status. Must be OPEN, PENDING, or CLOSED", 400);
    }

    const [result] = await pool.query(
      "UPDATE fallback_leads SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return errorRes(res, "Lead not found", 404);
    }

    return successRes(res, null, `Lead #${id} status updated to ${status}`);
  } catch (err) {
    console.error("Admin updateLeadStatus error:", err);
    return errorRes(res, "Failed to update lead status");
  }
};

// Export Leads CSV
exports.exportLeadsCSV = async (req, res) => {
  try {
    const { status, category, search, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (status && status !== "all") {
      conditions.push("fl.status = ?");
      params.push(status);
    }

    if (category && category !== "all") {
      conditions.push("fl.category = ?");
      params.push(category);
    }

    if (search && search.trim()) {
      conditions.push("(fl.customer_name LIKE ? OR fl.contact_number LIKE ? OR fl.category LIKE ? OR fl.pincode LIKE ? OR fl.address LIKE ? OR fl.description LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (startDate) {
      conditions.push("fl.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("fl.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length ? " WHERE " + conditions.join(" AND ") : "";

    const [rows] = await pool.query(
      `SELECT fl.id, fl.customer_name, fl.contact_number, fl.category, fl.pincode, fl.address, fl.description, fl.status, fl.created_at,
              (SELECT COUNT(*) FROM seller_lead_notifications sln WHERE sln.lead_id = fl.id) AS notified_sellers_count
       FROM fallback_leads fl
       ${whereClause}
       ORDER BY fl.created_at DESC`,
      params
    );

    const headers = [
      { label: "Lead ID", key: "id" },
      { label: "Customer Name", key: "customer_name" },
      { label: "Contact Number", key: "contact_number" },
      { label: "Category", key: "category" },
      { label: "Pincode", key: "pincode" },
      { label: "Address", key: "address" },
      { label: "Description", key: "description" },
      { label: "Status", key: "status" },
      { label: "Sellers Notified", key: "notified_sellers_count" },
      { label: "Created At", key: "created_at" },
    ];

    const formattedData = rows.map((r) => ({
      ...r,
      address: r.address || "",
      description: r.description || "",
      created_at: new Date(r.created_at).toLocaleString(),
    }));

    return generateCSVResponse(res, formattedData, headers, "QuickSeva_Buyer_Leads_Report.csv");
  } catch (err) {
    console.error("Admin exportLeadsCSV error:", err);
    return errorRes(res, "Failed to export buyer leads CSV");
  }
};
