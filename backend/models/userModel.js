const { pool } = require("../config/db");
const { normalizeIndianMobile } = require("../utils/phoneUtils");

const UserModel = {
  // Create a new user
  create: async ({ name, email, phone, hashedPassword, role = "buyer" }, conn = pool) => {
    const normalizedPhone = normalizeIndianMobile(phone);
    let passHash = hashedPassword;
    if (!passHash) {
      const crypto = require("crypto");
      const bcrypt = require("bcryptjs");
      const randomPassword = crypto.randomBytes(16).toString("hex");
      passHash = await bcrypt.hash(randomPassword, 12);
    }
    const [result] = await conn.query(
      `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
      [name, email || null, normalizedPhone, passHash, role],
    );
    return result.insertId;
  },

  // Find by ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, profile_pic, address, city, state, pincode, lat, lng, gender, dob, bio, is_verified, is_active, company_name, trade_specialization, is_verified_contractor, created_at
       FROM users WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  // Find by phone
  findByPhone: async (phone) => {
    const normalizedPhone = normalizeIndianMobile(phone);
    if (!normalizedPhone) return null;

    const [rows] = await pool.query(
      `SELECT * FROM users WHERE phone = ? LIMIT 1`,
      [normalizedPhone],
    );
    return rows[0] || null;
  },

  // Find by email
  findByEmail: async (email) => {
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email],
    );
    return rows[0] || null;
  },

  // Update user profile
  update: async (id, fields) => {
    const sets = Object.keys(fields)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = [...Object.values(fields), id];
    const [result] = await pool.query(
      `UPDATE users SET ${sets} WHERE id = ?`,
      values,
    );
    return result.affectedRows;
  },

  // Update password
  updatePassword: async (id, hashedPassword) => {
    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [
      hashedPassword,
      id,
    ]);
  },

  // Verify user
  verify: async (id) => {
    await pool.query(`UPDATE users SET is_verified = 1 WHERE id = ?`, [id]);
  },

  // Get all users (admin)
  getAll: async (limit, offset) => {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, city, is_verified, is_active, created_at
       FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM users`,
    );
    return { users: rows, total };
  },
};

module.exports = UserModel;
