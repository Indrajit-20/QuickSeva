const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "quickseva_db",
  });

  console.log("Connected to:", process.env.DB_HOST + ":" + (process.env.DB_PORT || 3306) + "/" + (process.env.DB_NAME || "quickseva_db"));

  const [rows] = await conn.query(
    "SHOW COLUMNS FROM sellers LIKE 'availability_last_updated_at'"
  );
  console.log("Column exists?", rows.length > 0 ? "YES ✅" : "NO ❌");
  if (rows.length > 0) console.log("Column definition:", JSON.stringify(rows[0]));

  // Also show all columns in sellers table
  const [allCols] = await conn.query("SHOW COLUMNS FROM sellers");
  console.log("\nAll sellers columns:");
  allCols.forEach(c => console.log(" -", c.Field));

  await conn.end();
})();
