const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

function cleanSqlStatement(stmt) {
  return stmt
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

async function executeSqlFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\nExecuting migration file: ${fileName}`);
  const sql = fs.readFileSync(filePath, "utf8");
  
  // Split statements by semicolon at the end of a line
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let successCount = 0;
  let skippedCount = 0;

  for (let statement of statements) {
    const cleanStatement = cleanSqlStatement(statement);
    if (!cleanStatement) {
      continue;
    }
    
    // Skip database creation commands if present in migration
    if (
      cleanStatement.toUpperCase().startsWith("USE ") ||
      cleanStatement.toUpperCase().startsWith("CREATE DATABASE ")
    ) {
      continue;
    }
    
    try {
      await pool.query(cleanStatement);
      successCount++;
    } catch (err) {
      // Catch and ignore common duplicate errors
      if (
        err.code === 'ER_DUP_FIELDNAME' ||              // Column already exists
        err.code === 'ER_TABLE_EXISTS_ERROR' ||         // Table already exists
        err.code === 'ER_DUP_KEYNAME' ||                // Index/Constraint already exists
        err.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||     // Key to drop doesn't exist
        err.code === 'ER_DUP_ENTRY' ||                  // Unique key constraint duplicate row
        (err.code === 'ER_CANT_CREATE_TABLE' && err.errno === 1005 && err.sqlMessage && err.sqlMessage.includes('121'))
      ) {
        skippedCount++;
        continue;
      }
      
      console.error(`❌ Error executing statement in ${fileName}:`);
      console.error(`Statement: ${statement.substring(0, 150)}...`);
      console.error(err.message);
      throw err;
    }
  }
  console.log(`👉 Finished ${fileName}: ${successCount} statements executed, ${skippedCount} skipped (already exists).`);
}

async function run() {
  try {
    const [dbNameRows] = await pool.query("SELECT DATABASE() AS db");
    const activeDb = dbNameRows[0].db;
    const host = process.env.DB_HOST || "localhost";
    console.log(`🚀 Starting database migrations on ${host}/${activeDb}...`);

    const migrationsDir = path.join(__dirname, "../migrations");
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (let file of migrationFiles) {
      await executeSqlFile(path.join(migrationsDir, file));
    }

    console.log("\n✅ All migrations processed successfully!");
  } catch (error) {
    console.error("\n❌ Migrations failed:", error.message);
  } finally {
    process.exit();
  }
}

run();
