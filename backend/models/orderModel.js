const { pool } = require("../config/db");

const OrderModel = {
  create: async ({
    order_number,
    buyer_id,
    seller_id,
    service_id,
    total_amount,
    platform_fee,
    payment_method,
    address,
    lat,
    lng,
    scheduled_at,
    notes,
  }) => {
    const [result] = await pool.query(
      `INSERT INTO orders
       (order_number, buyer_id, seller_id, service_id, total_amount, platform_fee,
        payment_method, address, lat, lng, scheduled_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        buyer_id,
        seller_id,
        service_id || null,
        total_amount,
        platform_fee || 0,
        payment_method || "cash",
        address,
        lat || null,
        lng || null,
        scheduled_at || null,
        notes || null,
      ],
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT o.*,
              u.name AS buyer_name, u.phone AS buyer_phone, u.profile_pic AS buyer_pic,
              s.business_name, s.id AS seller_id,
              su.name AS seller_name, su.phone AS seller_phone, su.profile_pic AS seller_pic,
              sv.title AS service_title
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       JOIN sellers s ON o.seller_id = s.id
       JOIN users su ON s.user_id = su.id
       LEFT JOIN services sv ON o.service_id = sv.id
       WHERE o.id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  findByBuyer: async (buyer_id, status, limit, offset) => {
    const statusFilter = status ? "AND o.status = ?" : "";
    const params = status
      ? [buyer_id, status, limit, offset]
      : [buyer_id, limit, offset];

    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_method,
              o.scheduled_at, o.created_at, o.address,
              s.business_name, s.id AS seller_id, su.profile_pic AS seller_pic, sv.title AS service_title
       FROM orders o
       JOIN sellers s ON o.seller_id = s.id
       JOIN users su ON s.user_id = su.id
       LEFT JOIN services sv ON o.service_id = sv.id
       WHERE o.buyer_id = ? ${statusFilter}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      params,
    );
    return rows;
  },

  findBySeller: async (seller_id, status, limit, offset) => {
    const statusFilter = status ? "AND o.status = ?" : "";
    const params = status
      ? [seller_id, status, limit, offset]
      : [seller_id, limit, offset];

    const [rows] = await pool.query(
      `SELECT
          o.order_number AS order_id,
          o.status,
          o.total_amount,
          o.payment_method,
          o.created_at AS date,
          u.name AS customer_name,
          u.phone AS customer_phone,
          sv.title AS service_name,
          s.business_name AS seller_business
        FROM orders o
        JOIN users u ON o.buyer_id = u.id
        JOIN sellers s ON o.seller_id = s.id
        LEFT JOIN services sv ON o.service_id = sv.id
        WHERE o.seller_id = ? ${statusFilter}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?`,
      params,
    );
    return rows;
  },

  updateStatus: async (id, status, extra = {}) => {
    const extras = Object.keys(extra)
      .map((k) => `, ${k} = ?`)
      .join("");
    const values = [...Object.values(extra), status, id];
    const [result] = await pool.query(
      `UPDATE orders SET status = ? ${extras} WHERE id = ?`,
      [status, ...Object.values(extra), id],
    );
    return result.affectedRows;
  },

  updatePaymentStatus: async (id, payment_status) => {
    await pool.query(`UPDATE orders SET payment_status = ? WHERE id = ?`, [
      payment_status,
      id,
    ]);
  },
};

module.exports = OrderModel;
