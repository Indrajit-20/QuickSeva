const { pool } = require("../config/db");

const ReviewModel = {
  create: async ({ order_id, buyer_id, seller_id, rating, comment, images }) => {
    const [result] = await pool.query(
      `INSERT INTO reviews (order_id, buyer_id, seller_id, rating, comment, images)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, buyer_id, seller_id, rating, comment || null, JSON.stringify(images || [])]
    );
    return result.insertId;
  },

  findByOrder: async (order_id) => {
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS buyer_name, u.profile_pic AS buyer_pic
       FROM reviews r JOIN users u ON r.buyer_id = u.id
       WHERE r.order_id = ?`,
      [order_id]
    );
    return rows[0] || null;
  },

  findBySeller: async (seller_id, limit, offset) => {
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS buyer_name, u.profile_pic AS buyer_pic, o.order_number
       FROM reviews r
       JOIN users u ON r.buyer_id = u.id
       JOIN orders o ON r.order_id = o.id
       WHERE r.seller_id = ?
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [seller_id, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM reviews WHERE seller_id = ?`, [seller_id]
    );
    return { reviews: rows, total };
  },

  addReply: async (review_id, seller_id, reply) => {
    const [result] = await pool.query(
      `UPDATE reviews SET reply = ? WHERE id = ? AND seller_id = ?`,
      [reply, review_id, seller_id]
    );
    return result.affectedRows;
  },
};

module.exports = ReviewModel;
