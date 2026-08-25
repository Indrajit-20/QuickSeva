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
        u.company_name AS user_company_name,
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
  getPostsByContractor: async (contractorId, userPhone = "") => {
    if (contractorId && userPhone) {
      try {
        await pool.query(
          `UPDATE contractor_posts SET contractor_id = ? WHERE contractor_id IS NULL AND (contact_phone = ? OR whatsapp_phone = ?)`,
          [contractorId, userPhone, userPhone]
        );
      } catch (e) {
        console.error("Failed to auto-claim contractor posts:", e);
      }
    }

    const [rows] = await pool.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM contractor_applications a WHERE a.post_id = p.id) AS applications_count
       FROM contractor_posts p
       WHERE p.contractor_id = ? OR (p.contractor_id IS NULL AND (p.contact_phone = ? OR p.whatsapp_phone = ?))
       ORDER BY p.created_at DESC`,
      [contractorId, userPhone || "", userPhone || ""]
    );

    return rows.map((row) => ({
      ...row,
      amenities: typeof row.amenities === "string" ? JSON.parse(row.amenities || "[]") : (row.amenities || []),
    }));
  },

  // Update contractor post details and requirements
  updatePost: async (postId, contractorId, postData) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const {
        title,
        site_address,
        city,
        pincode,
        start_date,
        end_date,
        description,
        contact_name,
        contact_phone,
        whatsapp_phone,
        requirements,
      } = postData;

      const [res] = await conn.query(
        `UPDATE contractor_posts 
         SET title = IFNULL(?, title),
             site_address = IFNULL(?, site_address),
             city = IFNULL(?, city),
             pincode = IFNULL(?, pincode),
             start_date = IFNULL(?, start_date),
             end_date = IFNULL(?, end_date),
             description = IFNULL(?, description),
             contact_name = IFNULL(?, contact_name),
             contact_phone = IFNULL(?, contact_phone),
             whatsapp_phone = IFNULL(?, whatsapp_phone)
         WHERE id = ? AND contractor_id = ?`,
        [
          title !== undefined ? title : null,
          site_address !== undefined ? site_address : null,
          city !== undefined ? city : null,
          pincode !== undefined ? pincode : null,
          start_date !== undefined ? start_date : null,
          end_date !== undefined ? end_date : null,
          description !== undefined ? description : null,
          contact_name !== undefined ? contact_name : null,
          contact_phone !== undefined ? contact_phone : null,
          whatsapp_phone !== undefined ? whatsapp_phone : null,
          postId,
          contractorId,
        ]
      );

      // If requirements array is provided, sync contractor_post_requirements
      if (Array.isArray(requirements)) {
        await conn.query(`DELETE FROM contractor_post_requirements WHERE post_id = ?`, [postId]);

        for (const req of requirements) {
          if (!req.role_title || !req.role_title.trim()) continue;
          await conn.query(
            `INSERT INTO contractor_post_requirements 
            (post_id, role_title, quantity, wage_amount, wage_type, skills_required)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
              postId,
              req.role_title.trim(),
              Number(req.quantity) || 1,
              Number(req.wage_amount) || 0.0,
              req.wage_type || "per_day",
              req.skills_required || null,
            ]
          );
        }
      }

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Update post status (active / closed)
  updatePostStatus: async (postId, contractorId, status) => {
    const [res] = await pool.query(
      `UPDATE contractor_posts SET status = ? WHERE id = ? AND contractor_id = ?`,
      [status, postId, contractorId]
    );
    return res.affectedRows > 0;
  },

  // Delete contractor post permanently
  deletePost: async (postId, contractorId) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM contractor_post_requirements WHERE post_id = ?`, [postId]);
      await conn.query(`DELETE FROM contractor_applications WHERE post_id = ?`, [postId]);
      const [res] = await conn.query(
        `DELETE FROM contractor_posts WHERE id = ? AND contractor_id = ?`,
        [postId, contractorId]
      );
      await conn.commit();
      return res.affectedRows > 0;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Get applicants for a post
  getApplicationsForPost: async (postId) => {
    const [rows] = await pool.query(
      `SELECT * FROM contractor_applications WHERE post_id = ? ORDER BY created_at DESC`,
      [postId]
    );
    return rows;
  },

  // Update application status (pending, contacted, hired, rejected)
  updateApplicationStatus: async (appId, status) => {
    const [res] = await pool.query(
      `UPDATE contractor_applications SET status = ? WHERE id = ?`,
      [status, appId]
    );
    return res.affectedRows > 0;
  },

  // Submit Verification Documents & Credentials for Contractor
  submitVerificationDetails: async (contractorId, { gstin, pan_number, license_number, verification_doc_url }) => {
    try {
      const [res] = await pool.query(
        `UPDATE users 
         SET gstin = IFNULL(?, gstin),
             pan_number = IFNULL(?, pan_number),
             license_number = IFNULL(?, license_number),
             verification_doc_url = IFNULL(?, verification_doc_url),
             verification_status = 'pending'
         WHERE id = ?`,
        [
          gstin || null,
          pan_number || null,
          license_number || null,
          verification_doc_url || null,
          contractorId,
        ]
      );
      return res.affectedRows > 0;
    } catch (err) {
      if (err.code === "ER_BAD_FIELD_ERROR" || err.errno === 1054) {
        // Ensure columns exist on users table if migration had not run
        try {
          await pool.query(`ALTER TABLE users ADD COLUMN gstin VARCHAR(20) NULL`);
        } catch (e) {}
        try {
          await pool.query(`ALTER TABLE users ADD COLUMN pan_number VARCHAR(20) NULL`);
        } catch (e) {}
        try {
          await pool.query(`ALTER TABLE users ADD COLUMN license_number VARCHAR(100) NULL`);
        } catch (e) {}
        try {
          await pool.query(`ALTER TABLE users ADD COLUMN verification_doc_url VARCHAR(255) NULL`);
        } catch (e) {}
        try {
          await pool.query(`ALTER TABLE users ADD COLUMN verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified'`);
        } catch (e) {}

        const [res] = await pool.query(
          `UPDATE users 
           SET gstin = IFNULL(?, gstin),
               pan_number = IFNULL(?, pan_number),
               license_number = IFNULL(?, license_number),
               verification_doc_url = IFNULL(?, verification_doc_url),
               verification_status = 'pending'
           WHERE id = ?`,
          [
            gstin || null,
            pan_number || null,
            license_number || null,
            verification_doc_url || null,
            contractorId,
          ]
        );
        return res.affectedRows > 0;
      }
      throw err;
    }
  },

  // Get Quote requests received by contractor (direct or general market leads)
  getQuoteRequestsForContractor: async (contractorId) => {
    const [rows] = await pool.query(
      `SELECT * FROM contractor_quote_requests 
       WHERE contractor_id = ? OR contractor_id IS NULL OR contractor_id = 0
       ORDER BY created_at DESC`,
      [contractorId]
    );
    return rows;
  },

  // Update lead / quote request status
  updateQuoteStatus: async (quoteId, contractorId, status) => {
    const [res] = await pool.query(
      `UPDATE contractor_quote_requests 
       SET status = ? 
       WHERE id = ? AND (contractor_id = ? OR contractor_id IS NULL OR contractor_id = 0)`,
      [status, quoteId, contractorId]
    );
    return res.affectedRows > 0;
  },

  // Get Directory of Contractors for Customers to Browse
  getContractorDirectory: async ({ city, trade, search, limit = 20, offset = 0 }) => {
    let sql = `
      SELECT id, name, company_name, phone, phone AS whatsapp_phone, profile_pic, city, state, trade_specialization, is_verified_contractor, verification_status, created_at
      FROM users
      WHERE (role = 'contractor' OR is_verified_contractor = 1 OR (trade_specialization IS NOT NULL AND trade_specialization != '')) AND is_active = 1
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

    sql += ` ORDER BY created_at DESC, is_verified_contractor DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Get Public Profile of a Contractor
  getContractorPublicProfile: async (contractorId) => {
    const [rows] = await pool.query(
      `SELECT id, name, company_name, phone, phone AS whatsapp_phone, profile_pic, address, city, state, pincode, trade_specialization, bio, is_verified_contractor, verification_status, gstin, pan_number, license_number, created_at
       FROM users
       WHERE id = ? AND (role = 'contractor' OR is_verified_contractor = 1 OR (trade_specialization IS NOT NULL AND trade_specialization != '')) AND is_active = 1`,
      [contractorId]
    );

    if (!rows.length) return null;
    const contractor = rows[0];

    const [posts] = await pool.query(
      `SELECT id, title, post_type, city, start_date, end_date, created_at
       FROM contractor_posts
       WHERE contractor_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 5`,
      [contractorId]
    );

    contractor.active_posts = posts;

    // Fetch work portfolio images without dynamic DDL
    try {
      const [images] = await pool.query(
        `SELECT id, image_url, title, created_at FROM contractor_work_images WHERE contractor_id = ? ORDER BY created_at DESC`,
        [contractorId]
      );
      contractor.work_images = images || [];
    } catch (imgErr) {
      contractor.work_images = [];
    }

    return contractor;
  },

  // Add work portfolio images
  addWorkImages: async (contractorId, files) => {
    const inserted = [];
    for (const file of files) {
      const relativePath = `/uploads/work/${file.filename}`;
      const [res] = await pool.query(
        `INSERT INTO contractor_work_images (contractor_id, image_url) VALUES (?, ?)`,
        [contractorId, relativePath]
      );
      inserted.push({
        id: res.insertId,
        image_url: relativePath,
      });
    }
    return inserted;
  },

  // Delete work image
  deleteWorkImage: async (contractorId, imageId) => {
    const [res] = await pool.query(
      `DELETE FROM contractor_work_images WHERE id = ? AND contractor_id = ?`,
      [imageId, contractorId]
    );
    return res.affectedRows > 0;
  },

  // Get work images for contractor
  getWorkImages: async (contractorId) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, image_url, title, created_at FROM contractor_work_images WHERE contractor_id = ? ORDER BY created_at DESC`,
        [contractorId]
      );
      return rows || [];
    } catch (err) {
      return [];
    }
  },
};

module.exports = ContractorModel;
