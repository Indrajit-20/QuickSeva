const { pool } = require("../config/db");

const CategoryModel = {
  getAll: async () => {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC`
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE id = ? AND is_active = 1`, [id]
    );
    return rows[0] || null;
  },
};

module.exports = CategoryModel;
