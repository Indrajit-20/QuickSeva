const { pool } = require("../config/db");

const LeadChargeModel = {
  // Create lead charge record (caller must handle UNIQUE duplication semantics)
  create: async ({ buyer_id, seller_id, service_id, lead_source, amount }) => {
    const [result] = await pool.query(
      `INSERT INTO lead_charges (buyer_id, seller_id, service_id, lead_source, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [buyer_id, seller_id, service_id, lead_source, amount],
    );
    return result.insertId;
  },

  // Check if a lead charge already exists for this buyer->seller
  existsFor: async ({ buyer_id, seller_id }) => {
    const [rows] = await pool.query(
      `SELECT id FROM lead_charges
       WHERE buyer_id = ? AND seller_id = ?
       LIMIT 1`,
      [buyer_id, seller_id],
    );
    return rows.length > 0 ? rows[0] : null;
  },
};

module.exports = LeadChargeModel;
