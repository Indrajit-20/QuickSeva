const mysql = require("mysql2/promise");
require('dotenv').config({ path: '.env.production' });

async function clearDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log("Connected to database. Clearing all tables and procedures...");

  // 1. Drop all tables
  const [tables] = await connection.query("SHOW TABLES");
  const tableNameKey = `Tables_in_${process.env.DB_NAME}`;
  
  if (tables.length > 0) {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const row of tables) {
      const tableName = row[tableNameKey];
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`Dropped table: ${tableName}`);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  // 2. Drop all procedures
  const [procedures] = await connection.query(
    "SELECT routine_name FROM information_schema.routines WHERE routine_schema = ? AND routine_type = 'PROCEDURE'",
    [process.env.DB_NAME]
  );
  
  for (const proc of procedures) {
    const procName = proc.routine_name;
    await connection.query(`DROP PROCEDURE IF EXISTS \`${procName}\``);
    console.log(`Dropped procedure: ${procName}`);
  }

  console.log("Database cleared successfully!");
  await connection.end();
}

clearDB().catch(console.error);
