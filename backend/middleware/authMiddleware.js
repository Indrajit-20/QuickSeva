const { verifyToken } = require("../utils/jwtUtils");
const { pool } = require("../config/db");
const { errorRes } = require("../utils/helpers");

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorRes(res, "Unauthorized: No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    let user;
    if (decoded.role === "admin") {
      const [rows] = await pool.query(
        "SELECT id, username AS name, 'admin' AS role, 1 AS is_active FROM admins WHERE id = ?",
        [decoded.id]
      );
      if (!rows.length) {
        return errorRes(res, "Unauthorized: Admin not found", 401);
      }
      user = rows[0];
    } else {
      const [rows] = await pool.query(
        "SELECT id, name, email, phone, role, is_active FROM users WHERE id = ?",
        [decoded.id]
      );
      if (!rows.length || !rows[0].is_active) {
        return errorRes(res, "Unauthorized: User not found or inactive", 401);
      }
      user = rows[0];
    }

    req.user = user;
    next();
  } catch (err) {
    return errorRes(res, "Unauthorized: Invalid or expired token", 401);
  }
};

// Role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorRes(res, `Access denied for role: ${req.user.role}`, 403);
    }
    next();
  };
};

// Only sellers
const sellerOnly = authorize("seller", "admin");

// Only admins
const adminOnly = authorize("admin");

module.exports = { protect, authorize, sellerOnly, adminOnly };
