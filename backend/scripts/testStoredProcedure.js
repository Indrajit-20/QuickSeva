const mysql = require("mysql2/promise");
require("dotenv").config({
  path: process.env.USE_RAILWAY === 'true' ? '.env.railway' : '.env.local'
});

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "quickseva_db",
    });

    console.log("Connected to database:", process.env.DB_HOST + "/" + (process.env.DB_NAME || "quickseva_db"));

    // 1. Fetch an existing seller to use as a test case
    const [sellers] = await conn.query("SELECT id, business_name FROM sellers LIMIT 1");
    if (sellers.length === 0) {
      console.log("❌ No sellers found in the database. Please seed the database first.");
      await conn.end();
      return;
    }

    const testSeller = sellers[0];
    console.log(`\nTesting stored procedure "GetSellerReviews" for seller: "${testSeller.business_name}" (ID: ${testSeller.id})`);

    // 2. Call the stored procedure
    // Note: CALL in mysql2 returns an array where result[0] is the rows returned by the procedure.
    const [result] = await conn.query("CALL GetSellerReviews(?)", [testSeller.id]);
    const reviews = result[0];

    console.log(`\n✅ Stored procedure executed successfully! Found ${reviews.length} reviews.`);
    if (reviews.length === 0) {
      console.log(" (No reviews yet for this seller. You can add one via the app frontend or run database seeders.)");
    } else {
      reviews.forEach((r, index) => {
        console.log(`\nReview #${index + 1}:`);
        console.log(`- Reviewer: ${r.reviewer_name}`);
        console.log(`- Rating: ${r.rating} ⭐`);
        console.log(`- Comment: ${r.comment || "(No comment)"}`);
        console.log(`- Created At: ${r.created_at}`);
      });
    }

    await conn.end();
  } catch (error) {
    console.error("❌ Error executing stored procedure:", error);
  }
})();
