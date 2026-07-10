const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

function cleanSqlStatement(stmt) {
  return stmt
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

async function executeSqlFile(filePath) {
  console.log(`Running SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (let statement of statements) {
    const cleanStatement = cleanSqlStatement(statement);
    if (!cleanStatement) {
      continue;
    }
    if (
      cleanStatement.toUpperCase().startsWith("USE ") ||
      cleanStatement.toUpperCase().startsWith("CREATE DATABASE ")
    ) {
      continue;
    }
    try {
      await pool.query(cleanStatement);
    } catch (err) {
      if (
        err.code === 'ER_DUP_FIELDNAME' ||
        err.code === 'ER_TABLE_EXISTS_ERROR' ||
        err.code === 'ER_DUP_KEYNAME' ||
        err.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
        (err.code === 'ER_CANT_CREATE_TABLE' && err.errno === 1005 && err.sqlMessage && err.sqlMessage.includes('121'))
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
    console.log("Starting DB Schema setup and migrations...");
    const baseDir = path.join(__dirname, "..");

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

    // 3. Ensure columns exist on sellers table
    console.log("Ensuring required columns exist on sellers table...");
    const sellerAlterQueries = [
      "ALTER TABLE sellers ADD COLUMN lat DECIMAL(10,8) NULL",
      "ALTER TABLE sellers ADD COLUMN lng DECIMAL(11,8) NULL",
      "ALTER TABLE sellers ADD COLUMN service_mode VARCHAR(20) DEFAULT 'offline'",
      "ALTER TABLE sellers ADD COLUMN instant_service TINYINT(1) DEFAULT 0",
      "ALTER TABLE sellers ADD COLUMN is_premium TINYINT(1) DEFAULT 0",
      "ALTER TABLE sellers ADD COLUMN plan VARCHAR(50) NULL",
      "ALTER TABLE sellers ADD COLUMN premium_expires_at TIMESTAMP NULL",
      "ALTER TABLE sellers ADD COLUMN gst_number VARCHAR(15) NULL",
      "ALTER TABLE sellers ADD COLUMN phone VARCHAR(20) NULL"
    ];

    for (const q of sellerAlterQueries) {
      try {
        await pool.query(q);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') console.error(`Alter warning: ${err.message}`);
      }
    }

    // 4. Ensure required columns exist on services table
    console.log("Ensuring required columns exist on services table...");
    const serviceAlterQueries = [
      "ALTER TABLE services ADD COLUMN sub_service_id INT NULL",
      "ALTER TABLE services ADD COLUMN is_instant TINYINT(1) DEFAULT 0",
      "ALTER TABLE services ADD COLUMN duration VARCHAR(50) NULL"
    ];

    for (const q of serviceAlterQueries) {
      try {
        await pool.query(q);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') console.error(`Alter warning: ${err.message}`);
      }
    }

    // 5. Ensure wallet_transactions.source column is VARCHAR
    console.log("Ensuring wallet_transactions.source column is VARCHAR...");
    try {
      await pool.query("ALTER TABLE wallet_transactions MODIFY COLUMN source VARCHAR(50) NOT NULL");
    } catch (err) {
      console.error("Failed to alter wallet_transactions.source:", err.message);
    }

    // 6. Clean database tables
    console.log("Cleaning database tables...");
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    await pool.query("TRUNCATE TABLE reviews");
    await pool.query("TRUNCATE TABLE services");
    await pool.query("TRUNCATE TABLE seller_work_images");
    await pool.query("TRUNCATE TABLE sellers");
    await pool.query("TRUNCATE TABLE seller_categories");
    await pool.query("TRUNCATE TABLE wallets");
    await pool.query("TRUNCATE TABLE wallet_transactions");
    await pool.query("TRUNCATE TABLE orders");
    await pool.query("TRUNCATE TABLE lead_charges");
    await pool.query("TRUNCATE TABLE notifications");
    await pool.query("TRUNCATE TABLE otp_verifications");
    await pool.query("TRUNCATE TABLE users");
    await pool.query("TRUNCATE TABLE sub_services");
    await pool.query("TRUNCATE TABLE categories");
    await pool.query("TRUNCATE TABLE policies");
    await pool.query("TRUNCATE TABLE admins");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    // 7. Seed categories to match frontend SERVICE_FILTERS exactly
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

    console.log("Seeding sub-services...");
    const subServices = [
      { category: "Cleaning", name: "Deep House Cleaning / पूरे घर की गहरी सफाई", description: "Thorough cleaning of all rooms, bathrooms, and kitchen", default_price: 2999.00 },
      { category: "Cleaning", name: "Bathroom Cleaning / बाथरूम की सफाई", description: "Deep stain removal, disinfection, and washing of bathrooms", default_price: 499.00 },
      { category: "Cleaning", name: "Kitchen Cleaning / रसोई की सफाई", description: "Degreasing of slab, cabinets, and deep cleaning", default_price: 1199.00 },
      { category: "Cleaning", name: "Sofa & Carpet Cleaning / सोफा और कालीन की सफाई", description: "Dry vacuuming and wet shampooing of sofas/carpets", default_price: 799.00 },

      { category: "Electrical", name: "Fan Installation & Repair / पंखा लगाना और सुधारना", description: "Installation of ceiling/exhaust fans or repair", default_price: 199.00 },
      { category: "Electrical", name: "Light Fitting & Repair / लाइट लगाना और सुधारना", description: "Fitting bulbs, tubes, fancy lights, or holder repair", default_price: 149.00 },
      { category: "Electrical", name: "Switchboard Repair / स्विचबोर्ड की मरम्मत", description: "Fixing switches, sockets, regulators, or main board", default_price: 179.00 },
      { category: "Electrical", name: "House Wiring Inspection / घर की वायरिंग की जांच", description: "Detecting short circuits and inspecting complete house wiring", default_price: 499.00 },

      { category: "Plumbing", name: "Tap Leakage Repair / नल टपकना ठीक करना", description: "Fixing water leaks in bathroom, kitchen, or balcony taps", default_price: 149.00 },
      { category: "Plumbing", name: "Washbasin & Sink Repair / वाशबेसिन और सिंक सुधारना", description: "Fixing pipe blockages, drain issues, or basin installation", default_price: 249.00 },
      { category: "Plumbing", name: "Toilet & Flush Repair / टॉयलेट और फ्लश सुधारना", description: "Fixing flush tank, seat replacement, or leakage", default_price: 299.00 },
      { category: "Plumbing", name: "Water Tank Cleaning / पानी की टंकी की सफाई", description: "Scrubbing and chemical disinfection of water storage tanks", default_price: 999.00 },

      { category: "Carpentry", name: "Door Lock & Latch Fitting / ताला और कुंडी लगाना", description: "Fitting locks, latches, handles, or eye-pieces", default_price: 249.00 },
      { category: "Carpentry", name: "Furniture Assembly / फर्नीचर जोड़ना और मरम्मत", description: "Assembling beds, tables, wardrobes, or general repair", default_price: 599.00 },
      { category: "Carpentry", name: "Drawer & Cabinet Repair / दराज और अलमारी सुधारना", description: "Fixing slider channels, hinges, handles", default_price: 199.00 },
      { category: "Carpentry", name: "Wooden Polish / लकड़ी की पॉलिश", description: "Polishing doors, beds, or tables for new look", default_price: 1499.00 },

      { category: "AC Repair", name: "AC Service & Cleaning / एसी सर्विस और धुलाई", description: "Deep cleaning filter, coils, and outdoor unit", default_price: 599.00 },
      { category: "AC Repair", name: "AC Gas Refill / एसी गैस चार्जिंग", description: "Detecting leaks and refilling AC cooling gas", default_price: 2199.00 },
      { category: "AC Repair", name: "AC Installation / एसी फिटिंग", description: "Installing split/window AC at your home", default_price: 1199.00 },
      { category: "AC Repair", name: "AC Not Cooling Repair / एसी कूलिंग ठीक करना", description: "Troubleshooting compressor, fan, or sensor problems", default_price: 399.00 },

      { category: "Pest Control", name: "General Pest Control / सामान्य कीटनाशक उपचार", description: "Spray treatment for ants, spiders, and crawling insects", default_price: 799.00 },
      { category: "Pest Control", name: "Cockroach Control / कॉकरोच नियंत्रण", description: "Gel and spray treatment for complete cockroach removal", default_price: 899.00 },
      { category: "Pest Control", name: "Bed Bugs Control / खटमल नियंत्रण", description: "Two-stage chemical spray treatment for bed bugs", default_price: 1199.00 },
      { category: "Pest Control", name: "Termite Control / दीमक नियंत्रण", description: "Drill and inject chemical treatment for termites", default_price: 2499.00 },

      { category: "Home Painting", name: "One Wall Texture Painting / एक दीवार की टेक्सचर पेंटिंग", description: "Adding design or texture to a highlight wall", default_price: 3499.00 },
      { category: "Home Painting", name: "Complete House Painting / पूरे घर का पेंट", description: "Wall putty, primer, and double coat paint", default_price: 15000.00 },
      { category: "Home Painting", name: "Wall Waterproofing / दीवार की वॉटरप्रूफिंग", description: "Treating wall dampness and water seepage", default_price: 2499.00 },
      { category: "Home Painting", name: "Door & Window Painting / दरवाजे और खिड़की की पेंटिंग", description: "Enamel paint or varnish on doors and windows", default_price: 699.00 },

      { category: "Appliance Repair", name: "Washing Machine Repair / वाशिंग मशीन सुधारना", description: "Fixing drum, motor, spin, or drainage errors", default_price: 349.00 },
      { category: "Appliance Repair", name: "Refrigerator Repair / फ्रिज सुधारना", description: "Fixing gas refill, thermostat, or compressor issues", default_price: 399.00 },
      { category: "Appliance Repair", name: "Geyser Installation & Repair / गीजर लगाना और सुधारना", description: "Fixing heating element, thermostat, or installing new geyser", default_price: 299.00 },
      { category: "Appliance Repair", name: "Microwave Oven Repair / माइक्रोवेव ओवन सुधारना", description: "Fixing heating, touch panel, or power issues", default_price: 349.00 },
    ];

    for (let sub of subServices) {
      const categoryId = categoryMap[sub.category];
      await pool.query(
        "INSERT INTO sub_services (category_id, name, description, default_price) VALUES (?, ?, ?, ?)",
        [categoryId, sub.name, sub.description, sub.default_price]
      );
    }

    // 8. Seed Admins & Policies
    console.log("Seeding admins and policies...");
    const adminHashedPassword = await bcrypt.hash("Admin@123", 12);
    const [adminRes] = await pool.query(
      "INSERT INTO admins (username, password) VALUES (?, ?)",
      ["admin", adminHashedPassword]
    );
    const adminId = adminRes.insertId;

    await pool.query(
      "INSERT INTO policies (`key`, title, content, updated_by) VALUES (?, ?, ?, ?)",
      [
        "privacy_policy",
        "Privacy Policy",
        "<h1>Privacy Policy</h1><p>Welcome to QuickSeva. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p><p>By using our service, you agree to the collection and use of information in accordance with this policy.</p>",
        adminId
      ]
    );

    await pool.query(
      "INSERT INTO policies (`key`, title, content, updated_by) VALUES (?, ?, ?, ?)",
      [
        "terms_of_service",
        "Terms of Service",
        "<h1>Terms of Service</h1><p>Welcome to QuickSeva. By accessing or using our services, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access our services.</p><p>We reserve the right to revise or update these terms at any time. Your continued use of the website after changes are posted constitutes acceptance of those changes.</p>",
        adminId
      ]
    );

    // 9. Seed Admin User in users table
    console.log("Seeding admin user in users table...");
    const [adminUserRes] = await pool.query(
      `INSERT INTO users (name, email, phone, password, role, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
      [
        "System Admin",
        "admin@quickseva.com",
        "9999999999",
        adminHashedPassword,
        "admin"
      ]
    );
    await pool.query(
      "INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)",
      [adminUserRes.insertId]
    );

    // Shared password hash to speed up seeding
    const hashedPassword = await bcrypt.hash("password123", 12);

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

    const seededOffset = (index, axis) => {
      const raw = ((index * (axis === "lat" ? 37 : 53)) % 2001) / 1000 - 1;
      return Number((raw * 0.01).toFixed(5));
    };

    // 10. Seed 300 Buyers
    console.log("Seeding 300 buyers...");
    const buyerFirstNames = [
      "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya",
      "Diya", "Ananya", "Aadhya", "Pihu", "Khushi", "Saanvi", "Shruti", "Kavya", "Riya", "Aanya",
      "Rahul", "Amit", "Sanjay", "Vijay", "Rajesh", "Ramesh", "Deepak", "Anil", "Sunil", "Alok"
    ];
    const buyerGenders = ["male", "female"];

    for (let index = 0; index < 300; index++) {
      const area = AREAS[index % AREAS.length];
      const firstName = buyerFirstNames[index % buyerFirstNames.length];
      const surname = SURNAMES[index % SURNAMES.length];
      const gender = buyerGenders[index % buyerGenders.length];
      const dob = `199${index % 10}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`;

      const lat = Number((area.lat + seededOffset(index + 200, "lat")).toFixed(6));
      const lng = Number((area.lng + seededOffset(index + 200, "lng")).toFixed(6));
      const phone = "8000000" + String(index).padStart(3, '0');

      const [userRes] = await pool.query(
        `INSERT INTO users (name, email, phone, gender, dob, password, role, address, city, state, pincode, lat, lng, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'buyer', ?, 'Ahmedabad', 'Gujarat', '380001', ?, ?, 1, 1)`,
        [
          `${firstName} ${surname}`,
          `buyer${index}@quickseva.com`,
          phone,
          gender,
          dob,
          hashedPassword,
          `${area.name}, Ahmedabad, Gujarat`,
          lat,
          lng
        ]
      );
      await pool.query(
        "INSERT INTO wallets (user_id, balance) VALUES (?, 500.00)",
        [userRes.insertId]
      );
    }

    // 11. Seed 300 Sellers
    console.log("Seeding 300 sellers...");
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

    for (let index = 0; index < 300; index++) {
      const area = AREAS[index % AREAS.length];
      const service = SERVICES[index % SERVICES.length];
      const surname = SURNAMES[index % SURNAMES.length];
      const isPremium = index % 10 < 3;
      const plan = isPremium ? PLANS[index % PLANS.length] : null;

      const lat = Number((area.lat + seededOffset(index, "lat")).toFixed(6));
      const lng = Number((area.lng + seededOffset(index, "lng")).toFixed(6));

      const rating = Number((4.3 + (index % 7) * 0.1).toFixed(1));
      const reviews = 50 + ((index * 37) % 250);
      const phone = "9000000" + String(index).padStart(3, '0');

      // Create User
      const [userRes] = await pool.query(
        `INSERT INTO users (name, email, phone, password, role, address, city, state, lat, lng, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'Ahmedabad', 'Gujarat', ?, ?, 1, 1)`,
        [
          `${surname} ${SERVICE_LABELS[service]} Owner`,
          `seller${index}@quickseva.com`,
          phone,
          hashedPassword,
          "seller",
          `${area.name}, Ahmedabad, Gujarat`,
          lat,
          lng
        ]
      );
      const userId = userRes.insertId;

      // Create Wallet
      await pool.query(
        "INSERT INTO wallets (user_id, balance) VALUES (?, 100.00)",
        [userId]
      );

      // Create Seller
      const categoryId = categoryMap[service];
      const serviceMode = index % 3 === 0 ? "online" : index % 3 === 1 ? "offline" : "both";
      const instantService = index % 4 === 0;

      const [sellerRes] = await pool.query(
        `INSERT INTO sellers (
          user_id, business_name, category_id, bio, experience_yrs, avg_rating, total_reviews,
          is_verified, is_available, working_radius, latitude, longitude, lat, lng, location_address,
          service_radius, profile_completed, service_mode, instant_service, is_premium, plan, premium_expires_at, phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
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
          5 + (index % 4) * 5, // service_radius
          serviceMode,
          instantService ? 1 : 0,
          isPremium ? 1 : 0,
          plan,
          isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          phone
        ]
      );
      const sellerId = sellerRes.insertId;

      // Seed seller categories
      await pool.query(
        "INSERT INTO seller_categories (seller_id, category_id) VALUES (?, ?)",
        [sellerId, categoryId]
      );

      // Create Services
      // Basic Service
      const isInstantBasic = index % 4 === 0;
      const vChargeBasic = 100 + (index % 3) * 50; // ₹100, ₹150, or ₹200
      await pool.query(
        `INSERT INTO services (seller_id, category_id, title, description, price, price_type, duration_hrs, duration, is_instant, visiting_charge, is_active)
         VALUES (?, ?, ?, ?, ?, 'fixed', 1.5, ?, ?, ?, 1)`,
        [
          sellerId,
          categoryId,
          service,
          `Regular ${service.toLowerCase()} service for home and office needs.`,
          299 + (index % 5) * 50,
          "1-2 hours",
          isInstantBasic ? 1 : 0,
          vChargeBasic
        ]
      );

      // Deep Service
      const vChargeDeep = 150 + (index % 3) * 50; // ₹150, ₹200, or ₹250
      await pool.query(
        `INSERT INTO services (seller_id, category_id, title, description, price, price_type, duration_hrs, duration, is_instant, visiting_charge, is_active)
         VALUES (?, ?, ?, ?, ?, 'fixed', 2.5, ?, 0, ?, 1)`,
        [
          sellerId,
          categoryId,
          `${service} Deep Service`,
          `Detailed ${service.toLowerCase()} with inspection and finishing.`,
          599 + (index % 6) * 75,
          "2-3 hours",
          vChargeDeep
        ]
      );
    }

    console.log("--------------------------------------------------");
    console.log("✅ Database initialized successfully!");
    console.log("✅ Seeded 1 Admin User");
    console.log("✅ Seeded 300 Buyers (role = 'buyer')");
    console.log("✅ Seeded 300 Sellers (role = 'seller')");
    console.log("--------------------------------------------------");

  } catch (err) {
    console.error("❌ Setup DB and Seed failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
