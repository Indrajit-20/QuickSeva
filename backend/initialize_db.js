const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("./config/db");

async function executeSqlFile(filePath) {
  console.log(`Running SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, "utf8");
  // Simple SQL splitter by semicolon (handles most files)
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (let statement of statements) {
    if (statement.toUpperCase().startsWith("USE ")) {
      continue;
    }
    try {
      await pool.query(statement);
    } catch (err) {
      if (
        err.code === 'ER_DUP_FIELDNAME' ||
        err.code === 'ER_TABLE_EXISTS_ERROR' ||
        err.code === 'ER_DUP_KEYNAME'
      ) {
        continue;
      }
      console.error(`Error executing: ${statement.substring(0, 100)}...`);
      console.error(err);
      throw err;
    }
  }
}

async function run() {
  try {
    const baseDir = __dirname;

    // 1. Run database.sql
    await executeSqlFile(path.join(baseDir, "database.sql"));

    // 2. Run migrations in order
    const migrationsDir = path.join(baseDir, "migrations");
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (let file of migrationFiles) {
      await executeSqlFile(path.join(migrationsDir, file));
    }

    // 3. Ensure sellers table has lat/lng columns
    console.log("Ensuring lat and lng exist on sellers table...");
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN lat DECIMAL(10,8) NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN lng DECIMAL(11,8) NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN IF NOT EXISTS service_mode VARCHAR(20) DEFAULT 'offline'");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN IF NOT EXISTS instant_service TINYINT(1) DEFAULT 0");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN IF NOT EXISTS is_premium TINYINT(1) DEFAULT 0");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN IF NOT EXISTS plan VARCHAR(50) NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }

    // Ensure services table has sub_service_id, is_instant, and duration columns
    console.log("Ensuring required columns exist on services table...");
    try {
      await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS sub_service_id INT NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS is_instant TINYINT(1) DEFAULT 0");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS duration VARCHAR(50) NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }

    // 4. Clear existing sellers, services, users
    console.log("Cleaning database tables...");
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    await pool.query("TRUNCATE TABLE reviews");
    await pool.query("TRUNCATE TABLE services");
    await pool.query("TRUNCATE TABLE sellers");
    await pool.query("TRUNCATE TABLE wallets");
    await pool.query("TRUNCATE TABLE users");
    await pool.query("TRUNCATE TABLE categories");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    // 5. Seed categories to match frontend SERVICE_FILTERS exactly
    console.log("Seeding categories...");
    const categories = [
      { name: "Cleaning", icon: "🧹", description: "Home and office cleaning services" },
      { name: "Electrical", icon: "⚡", description: "Electrical installation and repair" },
      { name: "Plumbing", icon: "🔧", description: "Plumbing and pipe repair services" },
      { name: "Carpentry", icon: "🪚", description: "Furniture and woodwork services" },
      { name: "AC Repair", icon: "❄️", description: "AC installation, repair and service" },
      { name: "Pest Control", icon: "🐜", description: "Pest control and fumigation" },
      { name: "Home Painting", icon: "🎨", description: "Interior and exterior painting" },
      { name: "Appliance Repair", icon: "🔌", description: "Washing machine, fridge, TV repair" },
    ];

    const categoryMap = {};
    for (let cat of categories) {
      const [res] = await pool.query(
        "INSERT INTO categories (name, icon, description) VALUES (?, ?, ?)",
        [cat.name, cat.icon, cat.description]
      );
      categoryMap[cat.name] = res.insertId;
    }

    // 6. Generate 100 sellers from frontend logic
    console.log("Generating 100 sellers...");
    const SERVICES = [
      "Cleaning",
      "Electrical",
      "Plumbing",
      "Carpentry",
      "AC Repair",
      "Pest Control",
      "Home Painting",
      "Appliance Repair",
    ];

    const AREAS = [
      { name: "Bopal", lat: 23.0284, lng: 72.4687 },
      { name: "Satellite", lat: 23.029, lng: 72.515 },
      { name: "Navrangpura", lat: 23.0395, lng: 72.5595 },
      { name: "Maninagar", lat: 22.9915, lng: 72.605 },
      { name: "Gota", lat: 23.1003, lng: 72.54 },
      { name: "Chandkheda", lat: 23.1063, lng: 72.585 },
      { name: "Nikol", lat: 23.036, lng: 72.65 },
      { name: "Vatva", lat: 22.96, lng: 72.635 },
      { name: "Prahlad Nagar", lat: 23.012, lng: 72.505 },
      { name: "Thaltej", lat: 23.0508, lng: 72.5025 },
      { name: "SG Highway", lat: 23.0456, lng: 72.5071 },
      { name: "Naranpura", lat: 23.06, lng: 72.565 },
      { name: "Vastral", lat: 23.015, lng: 72.67 },
      { name: "Vejalpur", lat: 23.0, lng: 72.53 },
      { name: "Isanpur", lat: 22.98, lng: 72.62 },
      { name: "Naroda", lat: 23.08, lng: 72.65 },
      { name: "Odhav", lat: 23.02, lng: 72.68 },
      { name: "Paldi", lat: 23.015, lng: 72.575 },
      { name: "Ambawadi", lat: 23.032, lng: 72.558 },
      { name: "Shahibaug", lat: 23.065, lng: 72.595 },
      { name: "Ghatlodiya", lat: 23.078, lng: 72.535 },
      { name: "Sola", lat: 23.07, lng: 72.52 },
      { name: "Bodakdev", lat: 23.044, lng: 72.495 },
      { name: "Shela", lat: 23.01, lng: 72.44 },
      { name: "Motera", lat: 23.1, lng: 72.6 },
      { name: "Sabarmati", lat: 23.085, lng: 72.58 },
      { name: "Bapunagar", lat: 23.05, lng: 72.63 },
      { name: "New Ranip", lat: 23.092, lng: 72.57 },
      { name: "Tragad", lat: 23.11, lng: 72.64 },
      { name: "Vastrapur", lat: 23.035, lng: 72.525 },
    ];

    const SURNAMES = [
      "Sharma", "Patel", "Mehta", "Shah", "Modi",
      "Joshi", "Kapoor", "Trivedi", "Desai", "Panchal",
      "Raval", "Soni", "Vyas", "Thakkar", "Parikh",
      "Bhatt", "Chauhan", "Dave", "Mistry", "Solanki"
    ];

    const SERVICE_LABELS = {
      Cleaning: "Cleaners",
      Electrical: "Electricals",
      Plumbing: "Plumbers",
      Carpentry: "Carpentry",
      "AC Repair": "AC Experts",
      "Pest Control": "Pest Control",
      "Home Painting": "Home Painters",
      "Appliance Repair": "Appliance Repair",
    };

    const PLANS = ["basic", "standard", "pro"];

    const seededOffset = (index, axis) => {
      const raw = ((index * (axis === "lat" ? 37 : 53)) % 2001) / 1000 - 1;
      return Number((raw * 0.01).toFixed(5));
    };

    const seededPhone = (index) => {
      const number = 7000000000 + ((index * 7919 + 12345) % 2999999999);
      return String(number).slice(0, 10);
    };

    const hashedPassword = await bcrypt.hash("password123", 12);

    for (let index = 0; index < 100; index++) {
      const area = AREAS[index % AREAS.length];
      const service = SERVICES[index % SERVICES.length];
      const surname = SURNAMES[index % SURNAMES.length];
      const isPremium = index % 10 < 3;
      const plan = isPremium ? PLANS[index % PLANS.length] : null;

      const lat = Number((area.lat + seededOffset(index, "lat")).toFixed(6));
      const lng = Number((area.lng + seededOffset(index, "lng")).toFixed(6));

      const rating = Number((4.3 + (index % 7) * 0.1).toFixed(1));
      const reviews = 50 + ((index * 37) % 250);

      // 6a. Create User
      const [userRes] = await pool.query(
        `INSERT INTO users (name, email, phone, password, role, address, city, lat, lng, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          `${surname} ${SERVICE_LABELS[service]} Owner`,
          `seller${index}@quickseva.com`,
          seededPhone(index),
          hashedPassword,
          "seller",
          `${area.name}, Ahmedabad, Gujarat`,
          "Ahmedabad",
          lat,
          lng
        ]
      );
      const userId = userRes.insertId;

      // 6b. Create Wallet
      await pool.query(
        "INSERT INTO wallets (user_id, balance) VALUES (?, 100.00)",
        [userId]
      );

      // 6c. Create Seller
      const categoryId = categoryMap[service];
      const serviceMode = index % 3 === 0 ? "online" : index % 3 === 1 ? "offline" : "both";
      const instantService = index % 4 === 0;

      const [sellerRes] = await pool.query(
        `INSERT INTO sellers (
          user_id, business_name, category_id, bio, experience_yrs, avg_rating, total_reviews,
          is_verified, is_available, working_radius, latitude, longitude, lat, lng, location_address,
          service_radius, profile_completed, service_mode, instant_service, is_premium, plan, premium_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [
          userId,
          `${surname} ${SERVICE_LABELS[service]} ${area.name}`,
          categoryId,
          `Top-notch professional ${service.toLowerCase()} services.`,
          3 + (index % 10),
          rating,
          reviews,
          5, // working_radius
          lat, // latitude
          lng, // longitude
          lat, // lat
          lng, // lng
          `${area.name}, Ahmedabad, Gujarat`,
          5 + (index % 4) * 5, // service_radius: 5, 10, 15, 20
          serviceMode,
          instantService ? 1 : 0,
          isPremium ? 1 : 0,
          plan,
          isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
        ]
      );
      const sellerId = sellerRes.insertId;

      // 6d. Create Services
      // Basic Service
      const isInstantBasic = index % 4 === 0;
      await pool.query(
        `INSERT INTO services (seller_id, category_id, title, description, price, price_type, duration_hrs, duration, is_instant, is_active)
         VALUES (?, ?, ?, ?, ?, 'fixed', 1.5, ?, ?, 1)`,
        [
          sellerId,
          categoryId,
          service,
          `Regular ${service.toLowerCase()} service for home and office needs.`,
          299 + (index % 5) * 50,
          "1-2 hours",
          isInstantBasic ? 1 : 0
        ]
      );

      // Deep Service
      await pool.query(
        `INSERT INTO services (seller_id, category_id, title, description, price, price_type, duration_hrs, duration, is_instant, is_active)
         VALUES (?, ?, ?, ?, ?, 'fixed', 2.5, ?, 0, 1)`,
        [
          sellerId,
          categoryId,
          `${service} Deep Service`,
          `Detailed ${service.toLowerCase()} with inspection and finishing.`,
          599 + (index % 6) * 75,
          "2-3 hours"
        ]
      );
    }

    console.log("Database initialized and 100 sellers seeded successfully!");

  } catch (err) {
    console.error("Setup DB failed:", err);
  } finally {
    process.exit();
  }
}

run();
