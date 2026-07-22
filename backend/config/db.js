const mysql = require("mysql2/promise");
require('dotenv').config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : (process.env.USE_RAILWAY === 'true' ? '.env.railway' : '.env.local')
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "quickseva_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+05:30", // IST
});

// Test connection
const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ MySQL Connected: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    conn.release();
  } catch (error) {
    console.error("❌ MySQL Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
