const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

async function setup() {
  console.log("🚀 Starting test seller setup for pincode 389320...");

  try {
    const hashedPassword = await bcrypt.hash("password123", 12);

    // 1. Configure the logged-in user "CT" (8160977394) to be in pincode 389320
    const [ctUsers] = await pool.query("SELECT id FROM users WHERE phone = ?", ["8160977394"]);
    if (ctUsers.length > 0) {
      const ctUserId = ctUsers[0].id;
      console.log(`Found CT user (ID: ${ctUserId}). Updating location/pincode...`);
      await pool.query(
        "UPDATE users SET pincode = '389320', address = 'SH87, Halol, Halol Taluka, Gujarat, 389320' WHERE id = ?",
        [ctUserId]
      );

      // Make sure CT is a premium seller for Home Painting (Category ID 7)
      const [ctSellers] = await pool.query("SELECT id FROM sellers WHERE user_id = ?", [ctUserId]);
      let ctSellerId;
      if (ctSellers.length > 0) {
        ctSellerId = ctSellers[0].id;
        console.log(`Updating existing seller profile for CT (Seller ID: ${ctSellerId})...`);
        await pool.query(
          "UPDATE sellers SET category_id = 7, is_premium = 1, plan = 'premium', premium_expires_at = '2030-01-01 00:00:00', is_available = 1, is_verified = 1 WHERE id = ?",
          [ctSellerId]
        );
      } else {
        console.log("Creating new seller profile for CT...");
        const [res] = await pool.query(
          `INSERT INTO sellers (user_id, business_name, category_id, is_premium, plan, premium_expires_at, is_available, is_verified)
           VALUES (?, 'CT Home Services', 7, 1, 'premium', '2030-01-01 00:00:00', 1, 1)`,
          [ctUserId]
        );
        ctSellerId = res.insertId;
      }
      await pool.query("INSERT IGNORE INTO seller_categories (seller_id, category_id) VALUES (?, 7)", [ctSellerId]);
    } else {
      console.log("⚠️ CT user (8160977394) not found in users table. Make sure you are registered and logged in first.");
    }

    // 2. Create/Update a separate test seller "Halol Painters Owner" (7777777777)
    // This allows you to test sending a lead and logging in as a separate provider to receive it.
    const [testUsers] = await pool.query("SELECT id FROM users WHERE phone = ?", ["7777777777"]);
    let testUserId;
    if (testUsers.length > 0) {
      testUserId = testUsers[0].id;
      console.log(`Found existing test user (ID: ${testUserId}). Updating...`);
      await pool.query(
        "UPDATE users SET pincode = '389320', address = 'Halol Crossing, Gujarat, 389320' WHERE id = ?",
        [testUserId]
      );
    } else {
      console.log("Creating new test user 'Halol Painters Owner'...");
      const [res] = await pool.query(
        `INSERT INTO users (name, email, phone, gender, password, role, address, city, state, pincode, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, 'seller', ?, 'Halol', 'Gujarat', '389320', 1, 1)`,
        [
          "Halol Painters Owner",
          "halolpainters@quickseva.com",
          "7777777777",
          "male",
          hashedPassword,
          "Halol Crossing, Gujarat, 389320"
        ]
      );
      testUserId = res.insertId;
      await pool.query("INSERT INTO wallets (user_id, balance) VALUES (?, 1000.00)", [testUserId]);
    }

    // Create/update seller profile for the test user
    const [testSellers] = await pool.query("SELECT id FROM sellers WHERE user_id = ?", [testUserId]);
    let testSellerId;
    if (testSellers.length > 0) {
      testSellerId = testSellers[0].id;
      await pool.query(
        "UPDATE sellers SET category_id = 7, is_premium = 1, plan = 'premium', premium_expires_at = '2030-01-01 00:00:00', is_available = 1, is_verified = 1 WHERE id = ?",
        [testSellerId]
      );
    } else {
      const [res] = await pool.query(
        `INSERT INTO sellers (user_id, business_name, category_id, is_premium, plan, premium_expires_at, is_available, is_verified)
         VALUES (?, 'Halol Premium Painters', 7, 1, 'premium', '2030-01-01 00:00:00', 1, 1)`,
        [testUserId]
      );
      testSellerId = res.insertId;
    }
    await pool.query("INSERT IGNORE INTO seller_categories (seller_id, category_id) VALUES (?, 7)", [testSellerId]);

    console.log("✅ Setup successful!");
    console.log("\n📋 Summary of changes for testing:");
    console.log("1. User 'CT' (8160977394) is now set to Pincode '389320' and has a premium seller profile in 'Home Painting'.");
    console.log("2. New premium seller 'Halol Painters Owner' (7777777777) is created in Pincode '389320' for 'Home Painting'.");
    console.log("\n💡 How to verify:");
    console.log("- Go to the front-end homepage, select 'Home Painting' in '389320' (Halol).");
    console.log("- Submit the fallback lead form.");
    console.log("- The system will find 2 premium partners (CT and Halol Painters).");
    console.log("- Log in as Halol Painters (phone: 7777777777, password: password123) and check the 'Lead Alerts' dashboard to view the lead!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running setup:", error);
    process.exit(1);
  }
}

setup();
