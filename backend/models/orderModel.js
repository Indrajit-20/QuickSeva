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
    visiting_charge_amount,
    visiting_platform_fee,
    visiting_payment_status,
  }) => {
    const [result] = await pool.query(
      `INSERT INTO orders
       (order_number, buyer_id, seller_id, service_id, total_amount, platform_fee,
        payment_method, address, lat, lng, scheduled_at, notes,
        visiting_charge_amount, visiting_platform_fee, visiting_payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        visiting_charge_amount || 0,
        visiting_platform_fee || 0,
        visiting_payment_status || 'pending',
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
      `SELECT o.*,
              s.business_name, s.id AS seller_id, su.profile_pic AS seller_pic,
              su.phone AS seller_phone, su.name AS seller_name, sv.title AS service_title,
              bu.name AS buyer_name, bu.phone AS buyer_phone
       FROM orders o
       JOIN sellers s ON o.seller_id = s.id
       JOIN users su ON s.user_id = su.id
       JOIN users bu ON o.buyer_id = bu.id
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
          o.*,
          o.order_number AS order_id,
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
