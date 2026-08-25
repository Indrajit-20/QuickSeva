const { pool } = require("../config/db");
const { successRes, errorRes } = require("../utils/helpers");

const DEFAULT_POLICIES = {
  privacy_policy: {
    title: "Privacy Policy",
    content:
      "<p>Welcome to QuickSeva. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p><p>By using our service, you agree to the collection and use of information in accordance with this policy.</p>",
  },
  terms_of_service: {
    title: "Terms of Service",
    content:
      "<p>Welcome to QuickSeva. By accessing or using our services, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access our services.</p><p>We reserve the right to revise or update these terms at any time. Your continued use of the website after changes are posted constitutes acceptance of those changes.</p>",
  },
  refund_policy: {
    title: "Refund & Cancellation Policy",
    content:
      "<p>Welcome to QuickSeva. We aim to provide transparent and fair guidelines regarding service booking cancellations, wallet topups, and refund processing.</p><p>Customers may cancel pending bookings prior to provider confirmation for a full wallet refund. Lead charges and platform service fees are subject to verification by our support team.</p>",
  },
};

// Get policy by key
const getPolicy = async (req, res) => {
  try {
    const { key } = req.params;

    let [rows] = await pool.query(
      `SELECT p.id, p.key, p.title, p.content, p.updated_at, u.name AS updated_by_name 
       FROM policies p 
       LEFT JOIN users u ON p.updated_by = u.id 
       WHERE p.key = ?`,
      [key]
    );

    if (!rows.length) {
      if (DEFAULT_POLICIES[key]) {
        // Auto-seed default policy if missing in DB
        const defaultPol = DEFAULT_POLICIES[key];
        await pool.query(
          "INSERT INTO policies (`key`, title, content) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content)",
          [key, defaultPol.title, defaultPol.content]
        );

        [rows] = await pool.query(
          `SELECT p.id, p.key, p.title, p.content, p.updated_at, u.name AS updated_by_name 
           FROM policies p 
           LEFT JOIN users u ON p.updated_by = u.id 
           WHERE p.key = ?`,
          [key]
        );
      } else {
        return errorRes(res, `Policy with key '${key}' not found`, 404);
      }
    }

    if (rows[0] && rows[0].content) {
      // Clean up duplicate leading h1 heading if present
      rows[0].content = rows[0].content.replace(/^<h1>.*?<\/h1>\s*/i, "");
    }

    return successRes(res, rows[0], "Policy retrieved successfully");
  } catch (error) {
    console.error("Error retrieving policy:", error);
    return errorRes(res, "Failed to retrieve policy");
  }
};

// Update policy by key
const updatePolicy = async (req, res) => {
  try {
    const { key } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return errorRes(res, "Title and Content are required", 400);
    }

    // Insert or update policy
    await pool.query(
      `INSERT INTO policies (\`key\`, title, content, updated_by) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), updated_by = VALUES(updated_by)`,
      [key, title, content, req.user?.id || null]
    );

    // Fetch updated policy details
    const [updatedRows] = await pool.query(
      `SELECT p.id, p.key, p.title, p.content, p.updated_at, u.name AS updated_by_name 
       FROM policies p 
       LEFT JOIN users u ON p.updated_by = u.id 
       WHERE p.key = ?`,
      [key]
    );

    return successRes(res, updatedRows[0], "Policy updated successfully");
  } catch (error) {
    console.error("Error updating policy:", error);
    return errorRes(res, "Failed to update policy");
  }
};

const getSystemSettingsPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT `key`, `value` FROM system_settings WHERE `key` IN ('platform_fee_model', 'platform_fee_percentage')"
    );

    const settings = {
      platform_fee_model: "seller",
      platform_fee_percentage: "5.00"
    };

    rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    // Force platform fee model to be 'seller' so buyers are never charged a platform fee
    settings.platform_fee_model = "seller";

    return successRes(res, settings, "Public settings retrieved successfully");
  } catch (error) {
    console.error("Error retrieving public settings:", error);
    return errorRes(res, "Failed to retrieve public settings");
  }
};

module.exports = {
  getPolicy,
  updatePolicy,
  getSystemSettingsPublic,
};

