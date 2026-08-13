const { pool } = require("../config/db");

const ContractorModel = {
  // Create site post with multiple labor requirements
  createPost: async (postData, requirements = []) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const {
        contractor_id,
        post_type = "demand_workers",
        title,
        company_name,
        contact_name,
        contact_phone,
        whatsapp_phone,
        site_address,
        city,
        state,
        pincode,
        lat,
        lng,
        start_date,
        end_date,
        amenities,
        description,
        is_featured = 0,
      } = postData;

      const amenitiesJson = Array.isArray(amenities)
        ? JSON.stringify(amenities)
        : amenities || null;

      const [postResult] = await conn.query(
        `INSERT INTO contractor_posts 
        (contractor_id, post_type, title, company_name, contact_name, contact_phone, whatsapp_phone, site_address, city, state, pincode, lat, lng, start_date, end_date, amenities, description, is_featured, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          contractor_id || null,
          post_type,
          title,
          company_name || null,
          contact_name,
          contact_phone,
          whatsapp_phone || contact_phone,
          site_address,
          city,
          state || null,
          pincode || null,
          lat || null,
          lng || null,
          start_date,
          end_date,
          amenitiesJson,
          description || null,
          is_featured ? 1 : 0,
        ]
      );

      const postId = postResult.insertId;

      if (Array.isArray(requirements) && requirements.length > 0) {
        for (const req of requirements) {
          if (!req.role_title) continue;
          await conn.query(
            `INSERT INTO contractor_post_requirements 
            (post_id, role_title, quantity, wage_amount, wage_type, skills_required)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
              postId,
              req.role_title,
              Number(req.quantity) || 1,
              Number(req.wage_amount) || 0.0,
              req.wage_type || "per_day",
              req.skills_required || null,
            ]
          );
        }
      }

      await conn.commit();
      return postId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Auto-expire outdated posts
  autoExpirePosts: async () => {
    await pool.query(
      `UPDATE contractor_posts SET status = 'expired' WHERE end_date < CURDATE() AND status = 'active'`
    );
  },

  // Get public feed of posts with filters
  getPublicPosts: async ({ city, role, post_type, search, limit = 20, offset = 0 }) => {
    await ContractorModel.autoExpirePosts();

    let sql = `
      SELECT p.*, 
        u.profile_pic AS contractor_pic,
        u.is_verified_contractor,
        (SELECT COUNT(*) FROM contractor_applications a WHERE a.post_id = p.id) AS applications_count
      FROM contractor_posts p
      LEFT JOIN users u ON p.contractor_id = u.id
      WHERE p.status = 'active'
    `;

    const params = [];

    if (post_type) {
      sql += ` AND p.post_type = ?`;
      params.push(post_type);
    }

    if (city && city !== "All") {
      sql += ` AND LOWER(p.city) LIKE LOWER(?)`;
      params.push(`%${city}%`);
    }

    if (search) {
      sql += ` AND (LOWER(p.title) LIKE LOWER(?) OR LOWER(p.site_address) LIKE LOWER(?) OR LOWER(p.city) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      sql += ` AND EXISTS (SELECT 1 FROM contractor_post_requirements req WHERE req.post_id = p.id AND LOWER(req.role_title) LIKE LOWER(?))`;
      params.push(`%${role}%`);
    }

    sql += ` ORDER BY p.is_featured DESC, p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);

    if (!rows || rows.length === 0) return [];

    const postIds = rows.map((r) => r.id);
    const [reqRows] = await pool.query(
      `SELECT * FROM contractor_post_requirements WHERE post_id IN (?)`,
      [postIds]
    );

    const reqsByPostId = {};
    for (const req of reqRows) {
      if (!reqsByPostId[req.post_id]) reqsByPostId[req.post_id] = [];
      reqsByPostId[req.post_id].push(req);
    }

    // Parse JSON fields if returned as string
    return rows.map((row) => ({
      ...row,
      amenities: typeof row.amenities === "string" ? JSON.parse(row.amenities || "[]") : (row.amenities || []),
      requirements: reqsByPostId[row.id] || [],
    }));
  },

  // Get single post details
  getPostById: async (id) => {
    await ContractorModel.autoExpirePosts();

    const [rows] = await pool.query(
      `SELECT p.*, 
        u.name AS contractor_user_name,
        u.profile_pic AS contractor_pic,
        u.is_verified_contractor,
        u.phone AS user_phone
      FROM contractor_posts p
      LEFT JOIN users u ON p.contractor_id = u.id
      WHERE p.id = ?`,
      [id]
    );

    if (!rows.length) return null;

    const post = rows[0];

    const [requirements] = await pool.query(
      `SELECT * FROM contractor_post_requirements WHERE post_id = ?`,
      [id]
    );

    await pool.query(`UPDATE contractor_posts SET views_count = views_count + 1 WHERE id = ?`, [id]);

    return {
      ...post,
      amenities: typeof post.amenities === "string" ? JSON.parse(post.amenities || "[]") : (post.amenities || []),
      requirements,
    };
  },

  // Submit quote request (Customer -> Contractor)
  createQuoteRequest: async (quoteData) => {
    const { contractor_id, customer_name, customer_phone, city, service_type, notes } = quoteData;
    const [result] = await pool.query(
      `INSERT INTO contractor_quote_requests (contractor_id, customer_name, customer_phone, city, service_type, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [contractor_id, customer_name, customer_phone, city, service_type, notes || null]
    );
    return result.insertId;
  },

  // Submit application (Agency/Worker -> Contractor Post)
  createApplication: async (appData) => {
    const { post_id, applicant_name, applicant_phone, applicant_type, workers_count, notes } = appData;
    const [result] = await pool.query(
      `INSERT INTO contractor_applications (post_id, applicant_name, applicant_phone, applicant_type, workers_count, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [post_id, applicant_name, applicant_phone, applicant_type || "agency", Number(workers_count) || 1, notes || null]
    );
    return result.insertId;
  },

  // Get posts created by a contractor
  getPostsByContractor: async (contractorId) => {
    const [rows] = await pool.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM contractor_applications a WHERE a.post_id = p.id) AS applications_count
       FROM contractor_posts p
       WHERE p.contractor_id = ?
       ORDER BY p.created_at DESC`,
      [contractorId]
    );

    return rows.map((row) => ({
      ...row,
      amenities: typeof row.amenities === "string" ? JSON.parse(row.amenities || "[]") : (row.amenities || []),
    }));
  },

  // Update post status (active / closed)
  updatePostStatus: async (postId, contractorId, status) => {
    const [res] = await pool.query(
      `UPDATE contractor_posts SET status = ? WHERE id = ? AND contractor_id = ?`,
      [status, postId, contractorId]
    );
    return res.affectedRows > 0;
  },

  // Get applicants for a post
  getApplicationsForPost: async (postId) => {
    const [rows] = await pool.query(
      `SELECT * FROM contractor_applications WHERE post_id = ? ORDER BY created_at DESC`,
      [postId]
    );
    return rows;
  },

  // Get quote requests received by contractor
  getQuoteRequestsForContractor: async (contractorId) => {
    const [rows] = await pool.query(
      `SELECT * FROM contractor_quote_requests WHERE contractor_id = ? ORDER BY created_at DESC`,
      [contractorId]
    );
    return rows;
  },

  // Get Directory of Contractors for Customers to Browse
  getContractorDirectory: async ({ city, trade, search, limit = 20, offset = 0 }) => {
    let sql = `
      SELECT id, name, company_name, phone, phone AS whatsapp_phone, profile_pic, city, state, trade_specialization, is_verified_contractor, created_at
      FROM users
      WHERE role = 'contractor' AND is_active = 1
    `;
    const params = [];

    if (city && city !== "All") {
      sql += ` AND LOWER(city) LIKE LOWER(?)`;
      params.push(`%${city}%`);
    }

    if (trade) {
      sql += ` AND LOWER(trade_specialization) LIKE LOWER(?)`;
      params.push(`%${trade}%`);
    }

    if (search) {
      sql += ` AND (LOWER(name) LIKE LOWER(?) OR LOWER(company_name) LIKE LOWER(?) OR LOWER(trade_specialization) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY is_verified_contractor DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);
    return rows;
  },
};

module.exports = ContractorModel;
