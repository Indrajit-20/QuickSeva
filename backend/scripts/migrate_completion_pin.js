const { pool } = require("../config/db");

async function run() {
  try {
    console.log("Starting migration to add completion_otp_code to orders...");
    
    // Check if column already exists
    const [columns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'completion_otp_code'");
    
    if (columns.length > 0) {
      console.log("Column 'completion_otp_code' already exists. Skipping.");
    } else {
      await pool.query("ALTER TABLE orders ADD COLUMN completion_otp_code VARCHAR(4) DEFAULT NULL");
      console.log("Successfully added column 'completion_otp_code' to orders table.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
