/**
 * Migration script: Add availability_last_updated_at column to sellers table
 * Run with: node scripts/addAvailabilityColumn.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "quickseva_db",
  });

  try {
    console.log("🔌 Connected to MySQL...");

    // Check if column already exists
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'sellers'
        AND COLUMN_NAME = 'availability_last_updated_at'
    `);

    if (rows.length > 0) {
      console.log("✅ Column 'availability_last_updated_at' already exists. Nothing to do.");
    } else {
      console.log("⚙️  Adding column 'availability_last_updated_at' to sellers table...");
      await connection.query(`
        ALTER TABLE sellers
        ADD COLUMN availability_last_updated_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log("✅ Column added successfully!");

      // Backfill existing rows with current timestamp
      const [updateResult] = await connection.query(`
        UPDATE sellers
        SET availability_last_updated_at = NOW()
        WHERE availability_last_updated_at IS NULL
      `);
      console.log(`✅ Backfilled ${updateResult.affectedRows} existing seller row(s).`);
    }
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log("🔌 Connection closed.");
  }
}

runMigration();
