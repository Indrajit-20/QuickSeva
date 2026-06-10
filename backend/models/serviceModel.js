const { pool } = require("../config/db");

const ServiceModel = {
  create: async ({ seller_id, category_id, title, description, price, price_type, duration_hrs, images, tags }) => {
    const [result] = await pool.query(
      `INSERT INTO services (seller_id, category_id, title, description, price, price_type, duration_hrs, images, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [seller_id, category_id, title, description, price, price_type || "fixed",
       duration_hrs || null, JSON.stringify(images || []), JSON.stringify(tags || [])]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT sv.*, s.business_name, s.avg_rating, s.is_available,
              u.name AS seller_name, u.phone AS seller_phone, u.profile_pic AS seller_pic, u.city,
              c.name AS category_name, c.icon AS category_icon
       FROM services sv
       JOIN sellers s ON sv.seller_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON sv.category_id = c.id
       WHERE sv.id = ? AND sv.is_active = 1`,
      [id]
    );
    return rows[0] || null;
  },

  findBySeller: async (seller_id) => {
    const [rows] = await pool.query(
      `SELECT sv.*, c.name AS category_name
       FROM services sv
       LEFT JOIN categories c ON sv.category_id = c.id
       WHERE sv.seller_id = ? AND sv.is_active = 1
       ORDER BY sv.created_at DESC`,
      [seller_id]
    );
    return rows;
  },

  search: async ({ keyword, category_id, min_price, max_price, limit, offset }) => {
    let where = ["sv.is_active = 1", "s.is_available = 1", "u.is_active = 1"];
    const params = [];

    if (keyword) {
      where.push("(sv.title LIKE ? OR sv.description LIKE ?)");
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (category_id) { where.push("sv.category_id = ?"); params.push(category_id); }
    if (min_price)   { where.push("sv.price >= ?");      params.push(min_price); }
    if (max_price)   { where.push("sv.price <= ?");      params.push(max_price); }

    params.push(limit, offset);

    const [rows] = await pool.query(
      `SELECT sv.id, sv.title, sv.price, sv.price_type, sv.images,
              s.id AS seller_id, s.avg_rating, s.business_name,
              u.name AS seller_name, u.city,
              c.name AS category_name, c.icon AS category_icon
       FROM services sv
       JOIN sellers s ON sv.seller_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON sv.category_id = c.id
       WHERE ${where.join(" AND ")}
       ORDER BY s.avg_rating DESC
       LIMIT ? OFFSET ?`,
      params
    );
    return rows;
  },

  update: async (id, fields) => {
    const sets = Object.keys(fields).map((k) => `${k} = ?`).join(", ");
    const values = [...Object.values(fields), id];
    const [result] = await pool.query(`UPDATE services SET ${sets} WHERE id = ?`, values);
    return result.affectedRows;
  },

  delete: async (id, seller_id) => {
    const [result] = await pool.query(
      `UPDATE services SET is_active = 0 WHERE id = ? AND seller_id = ?`,
      [id, seller_id]
    );
    return result.affectedRows;
  },
};

module.exports = ServiceModel;
