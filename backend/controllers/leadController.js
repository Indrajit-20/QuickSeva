const { pool } = require("../config/db");
const { successRes, errorRes } = require("../utils/helpers");

const PRO_PLAN_ID = "pro";
const PRO_PLAN_PRICE = 355;

const ensureLeadTables = async (conn = pool) => {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS fallback_leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(120) NOT NULL,
      contact_number VARCHAR(20) NOT NULL,
      category VARCHAR(120) NOT NULL,
      pincode VARCHAR(10) NOT NULL,
      description TEXT,
      latitude DECIMAL(10, 8) NULL,
      longitude DECIMAL(11, 8) NULL,
      radius_km INT DEFAULT 5,
      status ENUM('OPEN', 'PENDING', 'CLOSED') DEFAULT 'OPEN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_fallback_leads_category_pincode (category, pincode),
      INDEX idx_fallback_leads_status (status)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS seller_lead_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id INT NOT NULL,
      seller_id INT NOT NULL,
      user_id INT NOT NULL,
      status ENUM('NEW', 'VIEWED', 'CONTACTED', 'CLOSED') DEFAULT 'NEW',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_seller_lead_notification (lead_id, seller_id),
      INDEX idx_seller_lead_notifications_seller (seller_id, status, created_at),
      FOREIGN KEY (lead_id) REFERENCES fallback_leads(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

const cleanText = (value) => String(value || "").trim();

exports.submitLead = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const payload = {
      customerName: cleanText(req.body.customerName),
      contactNumber: cleanText(req.body.contactNumber).replace(/[^\d+]/g, ""),
      category: cleanText(req.body.category),
      pincode: cleanText(req.body.pincode).replace(/\D/g, "").slice(0, 6),
      description: cleanText(req.body.description),
      latitude: req.body.latitude === undefined ? null : Number(req.body.latitude),
      longitude: req.body.longitude === undefined ? null : Number(req.body.longitude),
      radiusKm: Number(req.body.radiusKm || 5),
    };

    if (!payload.customerName || !payload.contactNumber || !payload.category || !payload.pincode) {
      return errorRes(res, "Customer name, contact number, category, and pincode are required", 400);
    }

    await conn.beginTransaction();
    await ensureLeadTables(conn);

    const [leadResult] = await conn.query(
      `INSERT INTO fallback_leads
       (customer_name, contact_number, category, pincode, description, latitude, longitude, radius_km, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
      [
        payload.customerName,
        payload.contactNumber,
        payload.category,
        payload.pincode,
        payload.description,
        Number.isFinite(payload.latitude) ? payload.latitude : null,
        Number.isFinite(payload.longitude) ? payload.longitude : null,
        Number.isFinite(payload.radiusKm) ? payload.radiusKm : 5,
      ],
    );

    const leadId = leadResult.insertId;

    const [premiumSellers] = await conn.query(
      `SELECT DISTINCT s.id AS seller_id, s.user_id
       FROM sellers s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN categories c ON c.id = s.category_id
       LEFT JOIN seller_categories sc ON sc.seller_id = s.id
       LEFT JOIN categories sc_c ON sc_c.id = sc.category_id
       WHERE s.is_available = 1
         AND u.is_active = 1
         AND (u.pincode = ? OR COALESCE(s.location_address, u.address, '') LIKE ?)
         AND (
           LOWER(c.name) = LOWER(?)
           OR LOWER(sc_c.name) = LOWER(?)
           OR EXISTS (
             SELECT 1
             FROM services svc
             LEFT JOIN categories svc_c ON svc_c.id = svc.category_id
             WHERE svc.seller_id = s.id
               AND svc.is_active = 1
               AND (LOWER(svc.title) LIKE ? OR LOWER(svc_c.name) = LOWER(?))
           )
         )`,
      [
        payload.pincode,
        `%${payload.pincode}%`,
        payload.category,
        payload.category,
        `%${payload.category.toLowerCase()}%`,
        payload.category,
      ],
    );

    for (const seller of premiumSellers) {
      await conn.query(
        `INSERT IGNORE INTO seller_lead_notifications (lead_id, seller_id, user_id, status)
         VALUES (?, ?, ?, 'NEW')`,
        [leadId, seller.seller_id, seller.user_id],
      );

      await conn.query(
        `INSERT INTO notifications (user_id, title, message, type, ref_id)
         VALUES (?, ?, ?, 'system', ?)`,
        [
          seller.user_id,
          `New ${payload.category} lead`,
          `${payload.customerName} needs ${payload.category} service in ${payload.pincode}.`,
          leadId,
        ],
      );
    }

    await conn.commit();

    return successRes(
      res,
      {
        leadId,
        status: "OPEN",
        matchedPremiumSellers: premiumSellers.length,
        planPrice: PRO_PLAN_PRICE,
      },
      "Lead submitted successfully",
      200,
    );
  } catch (err) {
    await conn.rollback();
    console.error("submitLead error:", err);
    return errorRes(res, "Failed to submit lead");
  } finally {
    conn.release();
  }
};

exports.getSellerLeads = async (req, res) => {
  try {
    await ensureLeadTables();

    let sellerId = req.query.sellerId ? Number(req.query.sellerId) : null;
    if (!sellerId && req.user?.id) {
      const [[seller]] = await pool.query("SELECT id FROM sellers WHERE user_id = ?", [req.user.id]);
      sellerId = seller?.id || null;
    }

    if (!sellerId) return errorRes(res, "sellerId is required", 400);

    const [rows] = await pool.query(
      `SELECT
         sln.id AS notificationId,
         sln.status AS notificationStatus,
         sln.created_at AS notifiedAt,
         fl.id AS leadId,
         fl.customer_name AS customerName,
         fl.contact_number AS contactNumber,
         fl.category,
         fl.pincode,
         fl.description,
         fl.latitude,
         fl.longitude,
         fl.radius_km AS radiusKm,
         fl.status,
         fl.created_at AS createdAt
       FROM seller_lead_notifications sln
       JOIN fallback_leads fl ON fl.id = sln.lead_id
       WHERE sln.seller_id = ?
       ORDER BY sln.created_at DESC
       LIMIT 50`,
      [sellerId],
    );

    // Update status to 'VIEWED' for all 'NEW' notifications since seller is viewing them
    await pool.query(
      "UPDATE seller_lead_notifications SET status = 'VIEWED' WHERE seller_id = ? AND status = 'NEW'",
      [sellerId]
    );

    return successRes(res, {
      leads: rows.map((lead) => ({
        ...lead,
        latitude: lead.latitude === null ? null : Number(lead.latitude),
        longitude: lead.longitude === null ? null : Number(lead.longitude),
        radiusKm: Number(lead.radiusKm || 0),
      })),
    });
  } catch (err) {
    console.error("getSellerLeads error:", err);
    return errorRes(res, "Failed to fetch seller leads");
  }
};

exports.getUnreadLeadsCount = async (req, res) => {
  try {
    await ensureLeadTables();

    let sellerId = null;
    if (req.user?.id) {
      const [[seller]] = await pool.query("SELECT id FROM sellers WHERE user_id = ?", [req.user.id]);
      sellerId = seller?.id || null;
    }

    if (!sellerId) return successRes(res, { count: 0 });

    const [[result]] = await pool.query(
      "SELECT COUNT(*) AS count FROM seller_lead_notifications WHERE seller_id = ? AND status = 'NEW'",
      [sellerId]
    );

    return successRes(res, { count: result?.count || 0 });
  } catch (err) {
    console.error("getUnreadLeadsCount error:", err);
    return errorRes(res, "Failed to fetch unread leads count");
  }
};
