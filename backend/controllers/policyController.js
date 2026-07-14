const { pool } = require("../config/db");
const { successRes, errorRes } = require("../utils/helpers");

// Get policy by key
const getPolicy = async (req, res) => {
  try {
    const { key } = req.params;

    const [rows] = await pool.query(
      `SELECT p.id, p.key, p.title, p.content, p.updated_at, u.name AS updated_by_name 
       FROM policies p 
       LEFT JOIN users u ON p.updated_by = u.id 
       WHERE p.key = ?`,
      [key]
    );

    if (!rows.length) {
      return errorRes(res, `Policy with key '${key}' not found`, 404);
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

    // Check if policy exists
    const [existing] = await pool.query("SELECT id FROM policies WHERE `key` = ?", [key]);
    if (!existing.length) {
      return errorRes(res, `Policy with key '${key}' not found`, 404);
    }

    // Update policy
    await pool.query(
      "UPDATE policies SET title = ?, content = ?, updated_by = ? WHERE `key` = ?",
      [title, content, req.user.id, key]
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

