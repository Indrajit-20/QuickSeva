const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("./config/db");

function cleanSqlStatement(stmt) {
  return stmt
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

async function executeSqlFile(filePath) {
  console.log(`Running SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, "utf8");
  // Simple SQL splitter by semicolon (handles most files)
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
    console.log("DIAGNOSTICS - USE_RAILWAY:", process.env.USE_RAILWAY);
    console.log("DIAGNOSTICS - DB_NAME:", process.env.DB_NAME);
    console.log("DIAGNOSTICS - DB_HOST:", process.env.DB_HOST);
    const [dbNameRows] = await pool.query("SELECT DATABASE() AS db");
    console.log("ACTIVE DATABASE IN MYSQL:", dbNameRows[0].db);
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
      await pool.query("ALTER TABLE sellers ADD COLUMN service_mode VARCHAR(20) DEFAULT 'offline'");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN instant_service TINYINT(1) DEFAULT 0");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN is_premium TINYINT(1) DEFAULT 0");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN plan VARCHAR(50) NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN premium_expires_at TIMESTAMP NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE sellers ADD COLUMN gst_number VARCHAR(15) NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }

    // Ensure services table has sub_service_id, is_instant, and duration columns
    console.log("Ensuring required columns exist on services table...");
    try {
      await pool.query("ALTER TABLE services ADD COLUMN sub_service_id INT NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE services ADD COLUMN is_instant TINYINT(1) DEFAULT 0");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }
    try {
      await pool.query("ALTER TABLE services ADD COLUMN duration VARCHAR(50) NULL");
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
    }

    // Ensure wallet_transactions.source is VARCHAR(50) instead of ENUM
    console.log("Ensuring wallet_transactions.source column is VARCHAR...");
    try {
      await pool.query("ALTER TABLE wallet_transactions MODIFY COLUMN source VARCHAR(50) NOT NULL");
    } catch (err) {
      console.error("Failed to alter wallet_transactions.source:", err);
    }
    console.log("Cleaning database tables...");
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    await pool.query("TRUNCATE TABLE reviews");
    await pool.query("TRUNCATE TABLE services");
    await pool.query("TRUNCATE TABLE sellers");
    await pool.query("TRUNCATE TABLE wallets");
    await pool.query("TRUNCATE TABLE wallet_transactions");
    await pool.query("TRUNCATE TABLE orders");
    await pool.query("TRUNCATE TABLE notifications");
    await pool.query("TRUNCATE TABLE otp_verifications");
    await pool.query("TRUNCATE TABLE users");
    await pool.query("TRUNCATE TABLE sub_services");
    await pool.query("TRUNCATE TABLE seller_categories");
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

    console.log("Seeding sub-services...");
    const subServices = [
      // Cleaning
      { category: "Cleaning", name: "Deep House Cleaning / पूरे घर की गहरी सफाई", description: "Thorough cleaning of all rooms, bathrooms, and kitchen / सभी कमरों, बाथरूम और रसोई की गहरी सफाई", default_price: 2999.00 },
      { category: "Cleaning", name: "Bathroom Cleaning / बाथरूम की सफाई", description: "Deep stain removal, disinfection, and washing of bathrooms / बाथरूम की गहरी सफाई और कीटाणुशोधन", default_price: 499.00 },
      { category: "Cleaning", name: "Kitchen Cleaning / रसोई की सफाई", description: "Degreasing of slab, cabinets, and deep cleaning / रसोई के स्लैब, कैबिनेट और टाइल्स की गहरी सफाई", default_price: 1199.00 },
      { category: "Cleaning", name: "Sofa & Carpet Cleaning / सोफा और कालीन की सफाई", description: "Dry vacuuming and wet shampooing of sofas/carpets / सोफा और कालीन की ड्राई वैक्यूमिंग और शैम्पू धुलाई", default_price: 799.00 },

      // Electrical
      { category: "Electrical", name: "Fan Installation & Repair / पंखा लगाना और सुधारना", description: "Installation of ceiling/exhaust fans or repair / पंखा लगाना, मरम्मत या कंडेंसर बदलना", default_price: 199.00 },
      { category: "Electrical", name: "Light Fitting & Repair / लाइट लगाना और सुधारना", description: "Fitting bulbs, tubes, fancy lights, or holder repair / नए बल्ब, ट्यूबलाइट लगाना या होल्डर ठीक करना", default_price: 149.00 },
      { category: "Electrical", name: "Switchboard Repair / स्विचबोर्ड की मरम्मत", description: "Fixing switches, sockets, regulators, or main board / बटन, सॉकेट, रेगुलेटर या मेन बोर्ड बदलना", default_price: 179.00 },
      { category: "Electrical", name: "House Wiring Inspection / घर की वायरिंग की जांच", description: "Detecting short circuits and inspecting complete house wiring / शॉर्ट सर्किट की जांच और वायरिंग मरम्मत", default_price: 499.00 },

      // Plumbing
      { category: "Plumbing", name: "Tap Leakage Repair / नल टपकना ठीक करना", description: "Fixing water leaks in bathroom, kitchen, or balcony taps / नल या वाल्व से पानी का रिसाव ठीक करना", default_price: 149.00 },
      { category: "Plumbing", name: "Washbasin & Sink Repair / वाशबेसिन और सिंक सुधारना", description: "Fixing pipe blockages, drain issues, or basin installation / वाशबेसिन, सिंक की पाइप ब्लॉकेज और लीकेज ठीक करना", default_price: 249.00 },
      { category: "Plumbing", name: "Toilet & Flush Repair / टॉयलेट और फ्लश सुधारना", description: "Fixing flush tank, seat replacement, or leakage / फ्लश टैंक, सीट रिप्लेसमेंट या लीकेज ठीक करना", default_price: 299.00 },
      { category: "Plumbing", name: "Water Tank Cleaning / पानी की टंकी की सफाई", description: "Scrubbing and chemical disinfection of water storage tanks / पानी के टैंक की पूरी सफाई और कीटाणुशोधन", default_price: 999.00 },

      // Carpentry
      { category: "Carpentry", name: "Door Lock & Latch Fitting / ताला और कुंडी लगाना", description: "Fitting locks, latches, handles, or eye-pieces / दरवाजे में नया हैंडल, ताला या कुंडी लगाना", default_price: 249.00 },
      { category: "Carpentry", name: "Furniture Assembly / फर्नीचर जोड़ना और मरम्मत", description: "Assembling beds, tables, wardrobes, or general repair / बेड, मेज, अलमारी फिटिंग या मरम्मत", default_price: 599.00 },
      { category: "Carpentry", name: "Drawer & Cabinet Repair / दराज और अलमारी सुधारना", description: "Fixing slider channels, hinges, handles / दराज के चैनल, कब्जे या हैंडल ठीक करना", default_price: 199.00 },
      { category: "Carpentry", name: "Wooden Polish / लकड़ी की पॉलिश", description: "Polishing doors, beds, or tables for new look / दरवाजे या फर्नीचर की वारनिश और पॉलिश", default_price: 1499.00 },

      // AC Repair
      { category: "AC Repair", name: "AC Service & Cleaning / एसी सर्विस और धुलाई", description: "Deep cleaning filter, coils, and outdoor unit / एसी फिल्टर, कॉइल और आउटडोर यूनिट की पूरी धुलाई", default_price: 599.00 },
      { category: "AC Repair", name: "AC Gas Refill / एसी गैस चार्जिंग", description: "Detecting leaks and refilling AC cooling gas / गैस लीकेज चेक करना और नई गैस भरना", default_price: 2199.00 },
      { category: "AC Repair", name: "AC Installation / एसी फिटिंग", description: "Installing split/window AC at your home / स्प्लिट या विंडो एसी लगाना", default_price: 1199.00 },
      { category: "AC Repair", name: "AC Not Cooling Repair / एसी कूलिंग ठीक करना", description: "Troubleshooting compressor, fan, or sensor problems / एसी कंप्रेसर, कंडेंसर या कूलिंग खराबी ठीक करना", default_price: 399.00 },

      // Pest Control
      { category: "Pest Control", name: "General Pest Control / सामान्य कीटनाशक उपचार", description: "Spray treatment for ants, spiders, and crawling insects / चींटी, मकड़ी और रेंगने वाले कीड़ों के लिए स्प्रे", default_price: 799.00 },
      { category: "Pest Control", name: "Cockroach Control / कॉकरोच नियंत्रण", description: "Gel and spray treatment for complete cockroach removal / कॉकरोच भगाने के लिए विशेष जेल और स्प्रे", default_price: 899.00 },
      { category: "Pest Control", name: "Bed Bugs Control / खटमल नियंत्रण", description: "Two-stage chemical spray treatment for bed bugs / खटमल खत्म करने के लिए दो बार स्प्रे उपचार", default_price: 1199.00 },
      { category: "Pest Control", name: "Termite Control / दीमक नियंत्रण", description: "Drill and inject chemical treatment for termites / दीमक नियंत्रण के लिए दीमक नियंत्रण", default_price: 2499.00 },

      // Home Painting
      { category: "Home Painting", name: "One Wall Texture Painting / एक दीवार की टेक्सचर पेंटिंग", description: "Adding design or texture to a highlight wall / एक खास दीवार पर सुंदर डिजाइन पेंटिंग", default_price: 3499.00 },
      { category: "Home Painting", name: "Complete House Painting / पूरे घर का पेंट", description: "Wall putty, primer, and double coat paint / दीवार की पुट्टी, प्राइमर और डबल कोट पुताई", default_price: 15000.00 },
      { category: "Home Painting", name: "Wall Waterproofing / दीवार की वॉटरप्रूफिंग", description: "Treating wall dampness and water seepage / दीवार की सीलन और रिसाव रोकना", default_price: 2499.00 },
      { category: "Home Painting", name: "Door & Window Painting / दरवाजे और खिड़की की पेंटिंग", description: "Enamel paint or varnish on doors and windows / लकड़ी/लोहे के दरवाजे-खिड़कियों का पेंट", default_price: 699.00 },

      // Appliance Repair
      { category: "Appliance Repair", name: "Washing Machine Repair / वाशिंग मशीन सुधारना", description: "Fixing drum, motor, spin, or drainage errors / वाशिंग मशीन के ड्रम, मोटर, स्पिन या ड्रेनेज की मरम्मत", default_price: 349.00 },
      { category: "Appliance Repair", name: "Refrigerator Repair / फ्रिज सुधारना", description: "Fixing gas refill, thermostat, or compressor issues / फ्रिज की गैस भरना, थर्मोस्टेट या कंप्रेसर ठीक करना", default_price: 399.00 },
      { category: "Appliance Repair", name: "Geyser Installation & Repair / गीजर लगाना और सुधारना", description: "Fixing heating element, thermostat, or installing new geyser / गीजर का एलिमेंट, ऑटो-कट बदलना या नया लगाना", default_price: 299.00 },
      { category: "Appliance Repair", name: "Microwave Oven Repair / माइक्रोवेव ओवन सुधारना", description: "Fixing heating, touch panel, or power issues / ओवन की हीटिंग, पैनल या स्विच ठीक करना", default_price: 349.00 },
    ];

    for (let sub of subServices) {
      const categoryId = categoryMap[sub.category];
      await pool.query(
        "INSERT INTO sub_services (category_id, name, description, default_price) VALUES (?, ?, ?, ?)",
        [categoryId, sub.name, sub.description, sub.default_price]
      );
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
    const adminHashedPassword = await bcrypt.hash("Admin@123", 12);

    console.log("Seeding admin user...");
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
