const { pool } = require("../config/db");

const SellerModel = {
  // Create seller profile
  create: async ({
    user_id,
    business_name,
    category_id,
    bio,
    experience_yrs,
    phone,
    profile_completed = 1,
  }, conn = pool) => {
    const [result] = await conn.query(
      `INSERT INTO sellers (user_id, business_name, category_id, bio, experience_yrs, phone, profile_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        business_name,
        category_id || null,
        bio,
        experience_yrs || 0,
        phone || null,
        profile_completed,
      ],
    );
    return result.insertId;
  },

  // Find by seller ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT s.*, COALESCE(NULLIF(s.phone, ''), u.phone) AS phone, u.name, u.email, u.phone AS user_phone, u.profile_pic, u.address, u.city, u.lat, u.lng, u.pincode,
              c.name AS category_name, c.icon AS category_icon
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  // Find by user ID
  findByUserId: async (user_id) => {
    const [rows] = await pool.query(
      `SELECT s.*, u.name, u.phone, u.profile_pic, u.city, u.lat, u.lng, u.pincode,
              c.name AS category_name
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.user_id = ?`,
      [user_id],
    );
    return rows[0] || null;
  },

  // Update seller profile
  update: async (id, fields) => {
    const sets = Object.keys(fields)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = [...Object.values(fields), id];
    const [result] = await pool.query(
      `UPDATE sellers SET ${sets} WHERE id = ?`,
      values,
    );
    return result.affectedRows;
  },

  // Find nearby sellers using Haversine formula
  findNearby: async ({
    lat,
    lng,
    radius = 10,
    category_id,
    limit = 20,
    offset = 0,
  }) => {
    const catFilter = category_id ? "AND s.category_id = ?" : "";
    const params = [lat, lng, lat, radius, limit, offset];
    if (category_id) params.splice(4, 0, category_id);

    // NOTE: We LEFT JOIN services so each provider can include a services[] array.
    // Nearby page filtering (price/duration/is_instant) depends on this structure.
    const [rows] = await pool.query(
      `SELECT
        s.id,
        s.business_name,
        s.avg_rating,
        s.total_reviews,
        s.is_available,
        u.name,
        u.profile_pic,
        u.city,
        c.name AS category_name,
        c.icon AS category_icon,
        COALESCE(s.latitude, u.lat) AS lat,
        COALESCE(s.longitude, u.lng) AS lng,
        (6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(COALESCE(s.latitude, u.lat))) *
          COS(RADIANS(COALESCE(s.longitude, u.lng)) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(COALESCE(s.latitude, u.lat)))
        )) AS distance_km,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', sv.id,
            'name', sv.title,
            'price', sv.price,
            'duration', sv.duration,
            'duration_hrs', sv.duration_hrs,
            'is_instant', sv.is_instant
          )
        ) AS services_json
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN services sv
        ON sv.seller_id = s.id
        AND sv.is_active = 1
      WHERE (s.latitude IS NOT NULL OR u.lat IS NOT NULL)
        AND u.is_active = 1 AND s.is_available = 1
        ${catFilter}
      HAVING distance_km <= ?
      GROUP BY s.id
      ORDER BY distance_km ASC
      LIMIT ? OFFSET ?`,
      params,
    );

    // Convert JSON array string -> JS array
    return rows.map((r) => {
      let services = [];
      try {
        services = r.services_json ? JSON.parse(r.services_json) : [];
      } catch {
        services = [];
      }

      // If there were no services, JSON_ARRAYAGG can still include a single null object.
      services = Array.isArray(services)
        ? services.filter((sv) => sv && sv.id != null)
        : [];

      return {
        ...r,
        service: undefined,
        serviceMode: undefined,
        instantService: undefined,
        rating: r.avg_rating,
        reviews: r.total_reviews,
        services,
      };
    });
  },

  // Update rating after review
  updateRating: async (seller_id) => {
    await pool.query(
      `UPDATE sellers s
       SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE seller_id = ?),
           total_reviews = (SELECT COUNT(*) FROM reviews WHERE seller_id = ?)
       WHERE s.id = ?`,
      [seller_id, seller_id, seller_id],
    );
  },
};

module.exports = SellerModel;
