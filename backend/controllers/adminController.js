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

// Export Users CSV
exports.exportUsersCSV = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, IFNULL(w.balance, 0.00) AS wallet_balance
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       ORDER BY u.created_at DESC`
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

// Export Sellers CSV
exports.exportSellersCSV = async (req, res) => {
  try {
    const [sellers] = await pool.query(
      `SELECT s.id, s.business_name, u.name AS owner_name, u.email, u.phone,
              c.name AS category_name, s.avg_rating, s.total_reviews,
              s.is_verified, s.is_available, s.plan, s.created_at
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       ORDER BY s.created_at DESC`
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
      { label: "Subscription Plan", key: "plan" },
      { label: "Joined Date", key: "created_at" },
    ];

    const formattedRows = sellers.map((s) => ({
      ...s,
      category_name: s.category_name || "Uncategorized",
      avg_rating: parseFloat(s.avg_rating || 0).toFixed(1),
      is_verified: s.is_verified ? "Verified" : "Pending",
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

// Export Bookings CSV
exports.exportBookingsCSV = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, u.name AS customer_name, s.business_name AS seller_name,
              o.service_name, o.total_amount, o.platform_fee, o.status, o.created_at
       FROM orders o
       LEFT JOIN users u ON o.buyer_id = u.id
       LEFT JOIN sellers s ON o.seller_id = s.id
       ORDER BY o.created_at DESC`
    );

    const headers = [
      { label: "Order ID", key: "id" },
      { label: "Order Number", key: "order_number" },
      { label: "Customer Name", key: "customer_name" },
      { label: "Seller Name", key: "seller_name" },
      { label: "Service Title", key: "service_name" },
      { label: "Total Amount (₹)", key: "total_amount" },
      { label: "Platform Fee (₹)", key: "platform_fee" },
      { label: "Order Status", key: "status" },
      { label: "Date & Time", key: "created_at" },
    ];

    const formattedRows = orders.map((o) => ({
      ...o,
      customer_name: o.customer_name || "N/A",
      seller_name: o.seller_name || "N/A",
      total_amount: parseFloat(o.total_amount || 0).toFixed(2),
      platform_fee: parseFloat(o.platform_fee || 0).toFixed(2),
      status: String(o.status || "").toUpperCase(),
      created_at: new Date(o.created_at).toLocaleString("en-IN"),
    }));

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

    // Attach requirements line items to each post
    for (let post of posts) {
      const [reqs] = await pool.query(
        `SELECT * FROM contractor_post_requirements WHERE post_id = ?`,
        [post.id]
      );
      post.requirements = reqs;
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
      const newFeatured = post.is_featured ? 0 : 1;
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
