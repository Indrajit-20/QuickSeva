const { pool } = require("../config/db");
const logger = require("./logger");

/**
 * Automatically registers all database stored procedures at startup.
 * By using raw pool.query commands on the entire SQL block, we avoid
 * delimiter syntax issues and automate deployment for local and online (Railway) DBs.
 */
const ensureStoredProcedures = async (conn = pool) => {
  try {
    // 1. Drop existing procedure if it exists (allows updates to apply on restarts)
    await conn.query("DROP PROCEDURE IF EXISTS GetSellerReviews");

    // 2. Create the procedure
    await conn.query(`
      CREATE PROCEDURE GetSellerReviews(IN sellerId INT)
      BEGIN
          SELECT r.*, u.name AS reviewer_name, u.profile_pic AS reviewer_profile_pic
          FROM reviews r
          JOIN users u ON r.buyer_id = u.id
          WHERE r.seller_id = sellerId;
      END
    `);

    logger.info("✅ Stored procedures verified/created");
  } catch (err) {
    logger.error("❌ Failed to ensure stored procedures:", err);
    throw err;
  }
};

module.exports = { ensureStoredProcedures };
