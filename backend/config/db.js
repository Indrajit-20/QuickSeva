const mysql = require("mysql2/promise");
require('dotenv').config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : (process.env.USE_RAILWAY === 'true' ? '.env.railway' : '.env.local')
});

const isSSLRequired = process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1');

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "quickseva_db",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000, // 60 seconds
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // Send TCP keepalive every 10 seconds
  ssl: isSSLRequired ? { rejectUnauthorized: false } : false,
  timezone: "+05:30", // IST
});

// Resilient DB Connection check with retry logic
const connectDB = async (retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await pool.getConnection();
      console.log(`✅ MySQL Connected: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
      conn.release();
      return;
    } catch (error) {
      console.error(`❌ MySQL Connection Attempt ${i}/${retries} Failed: ${error.message}`);
      if (i < retries) {
        console.log(`⏳ Retrying MySQL connection in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error("⚠️ Max MySQL connection retries reached. Server will remain running and retry on incoming requests.");
      }
    }
  }
};

module.exports = { pool, connectDB };

