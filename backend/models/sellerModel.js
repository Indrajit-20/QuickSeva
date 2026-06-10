const { pool } = require("../config/db");

const SellerModel = {
  // Create seller profile
  create: async ({ user_id, business_name, category_id, bio, experience_yrs }) => {
    const [result] = await pool.query(
      `INSERT INTO sellers (user_id, business_name, category_id, bio, experience_yrs)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, business_name, category_id, bio, experience_yrs || 0]
    );
    return result.insertId;
  },

  // Find by seller ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT s.*, u.name, u.email, u.phone, u.profile_pic, u.address, u.city, u.lat, u.lng,
              c.name AS category_name, c.icon AS category_icon
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Find by user ID
  findByUserId: async (user_id) => {
    const [rows] = await pool.query(
      `SELECT s.*, u.name, u.phone, u.profile_pic, u.city, u.lat, u.lng,
              c.name AS category_name
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.user_id = ?`,
      [user_id]
    );
    return rows[0] || null;
  },

  // Update seller profile
  update: async (id, fields) => {
    const sets = Object.keys(fields).map((k) => `${k} = ?`).join(", ");
    const values = [...Object.values(fields), id];
    const [result] = await pool.query(
      `UPDATE sellers SET ${sets} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  },

  // Find nearby sellers using Haversine formula
  findNearby: async ({ lat, lng, radius = 10, category_id, limit = 20, offset = 0 }) => {
    const catFilter = category_id ? "AND s.category_id = ?" : "";
    const params = [lat, lng, lat, radius, limit, offset];
    if (category_id) params.splice(4, 0, category_id);

    const [rows] = await pool.query(
      `SELECT s.id, s.business_name, s.avg_rating, s.total_reviews, s.is_available,
              u.name, u.profile_pic, u.city,
              c.name AS category_name, c.icon AS category_icon,
              (6371 * ACOS(
                COS(RADIANS(?)) * COS(RADIANS(u.lat)) *
                COS(RADIANS(u.lng) - RADIANS(?)) +
                SIN(RADIANS(?)) * SIN(RADIANS(u.lat))
              )) AS distance_km
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE u.lat IS NOT NULL AND u.lng IS NOT NULL
         AND u.is_active = 1 AND s.is_available = 1
         ${catFilter}
       HAVING distance_km <= ?
       ORDER BY distance_km ASC
       LIMIT ? OFFSET ?`,
      params
    );
    return rows;
  },

  // Update rating after review
  updateRating: async (seller_id) => {
    await pool.query(
      `UPDATE sellers s
       SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE seller_id = ?),
           total_reviews = (SELECT COUNT(*) FROM reviews WHERE seller_id = ?)
       WHERE s.id = ?`,
      [seller_id, seller_id, seller_id]
    );
  },
};

module.exports = SellerModel;
