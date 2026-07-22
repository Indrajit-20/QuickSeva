const { pool } = require("../config/db");

const Service = {
  // Create new service
  create: async ({ seller_id, category_id, sub_service_id, title, description, price, price_type }) => {
    const [result] = await pool.query(
      `INSERT INTO services (seller_id, category_id, sub_service_id, title, description, price, price_type, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        seller_id,
        category_id || null,
        sub_service_id || null,
        title,
        description || null,
        price,
        price_type || "fixed"
      ]
    );
    return result.insertId;
  },

  // Find all services by seller (including inactive by default, but can filter activeOnly)
  findBySeller: async (seller_id, activeOnly = false) => {
    const filter = activeOnly ? "AND sv.is_active = 1" : "";
    const [rows] = await pool.query(
      `SELECT sv.*, c.name AS category_name, c.icon AS category_icon, ss.name AS sub_service_name
       FROM services sv
       LEFT JOIN categories c ON sv.category_id = c.id
       LEFT JOIN sub_services ss ON sv.sub_service_id = ss.id
       WHERE sv.seller_id = ? ${filter}
       ORDER BY sv.created_at DESC`,
      [seller_id]
    );
    return rows;
  },

  // Find service by ID (including inactive)
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT sv.*, c.name AS category_name, c.icon AS category_icon, ss.name AS sub_service_name
       FROM services sv
       LEFT JOIN categories c ON sv.category_id = c.id
       LEFT JOIN sub_services ss ON sv.sub_service_id = ss.id
       WHERE sv.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Public search query method
  search: async ({ keyword, category_id, category, min_price, max_price, state, city, limit, offset }) => {
    let where = ["sv.is_active = 1", "s.is_available = 1", "u.is_active = 1"];
    const params = [];

    if (keyword) {
      where.push("(sv.title LIKE ? OR sv.description LIKE ?)");
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (category_id) { where.push("sv.category_id = ?"); params.push(category_id); }
    if (category)    { where.push("c.name = ?");         params.push(category); }
    if (min_price)   { where.push("sv.price >= ?");      params.push(min_price); }
    if (max_price)   { where.push("sv.price <= ?");      params.push(max_price); }
    if (state)       { where.push("u.state = ?");        params.push(state); }
    if (city)        { where.push("u.city = ?");         params.push(city); }

    params.push(limit, offset);

    const [rows] = await pool.query(
      `SELECT sv.id, sv.title, sv.price, sv.price_type, sv.images,
              s.id AS seller_id, s.avg_rating, s.business_name, s.is_premium,
              u.name AS seller_name, u.city, u.state, u.address, u.phone, u.lat, u.lng,
              c.name AS category_name, c.icon AS category_icon,
              ss.name AS sub_service_name
       FROM services sv
       JOIN sellers s ON sv.seller_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON sv.category_id = c.id
       LEFT JOIN sub_services ss ON sv.sub_service_id = ss.id
       WHERE ${where.join(" AND ")}
       ORDER BY s.avg_rating DESC
       LIMIT ? OFFSET ?`,
      params
    );
    return rows;
  },

  // Update service fields
  update: async (id, fields) => {
    const sets = Object.keys(fields).map((k) => `${k} = ?`).join(", ");
    const values = [...Object.values(fields), id];
    const [result] = await pool.query(
      `UPDATE services SET ${sets} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  },

  // Hard delete a service from MySQL
  delete: async (id, seller_id) => {
    const [result] = await pool.query(
      `DELETE FROM services WHERE id = ? AND seller_id = ?`,
      [id, seller_id]
    );
    return result.affectedRows;
  }
};

module.exports = Service;
