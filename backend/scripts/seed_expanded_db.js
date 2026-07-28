const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

// --- Location Pools ---
const AHMEDABAD_AREAS = [
  { name: "Satellite", city: "Ahmedabad", state: "Gujarat", pincode: "380015", lat: 23.0290, lng: 72.5150 },
  { name: "Bopal", city: "Ahmedabad", state: "Gujarat", pincode: "380058", lat: 23.0284, lng: 72.4687 },
  { name: "South Bopal", city: "Ahmedabad", state: "Gujarat", pincode: "380058", lat: 23.0185, lng: 72.4600 },
  { name: "Navrangpura", city: "Ahmedabad", state: "Gujarat", pincode: "380009", lat: 23.0395, lng: 72.5595 },
  { name: "Vastrapur", city: "Ahmedabad", state: "Gujarat", pincode: "380054", lat: 23.0350, lng: 72.5290 },
  { name: "Prahlad Nagar", city: "Ahmedabad", state: "Gujarat", pincode: "380015", lat: 23.0124, lng: 72.5031 },
  { name: "Thaltej", city: "Ahmedabad", state: "Gujarat", pincode: "380059", lat: 23.0501, lng: 72.5074 },
  { name: "Bodakdev", city: "Ahmedabad", state: "Gujarat", pincode: "380054", lat: 23.0390, lng: 72.5120 },
  { name: "Gota", city: "Ahmedabad", state: "Gujarat", pincode: "382481", lat: 23.0945, lng: 72.5350 },
  { name: "Science City", city: "Ahmedabad", state: "Gujarat", pincode: "380060", lat: 23.0762, lng: 72.5028 },
  { name: "Chandkheda", city: "Ahmedabad", state: "Gujarat", pincode: "382424", lat: 23.1090, lng: 72.5850 },
  { name: "Sabarmati", city: "Ahmedabad", state: "Gujarat", pincode: "380005", lat: 23.0800, lng: 72.5700 },
  { name: "Maninagar", city: "Ahmedabad", state: "Gujarat", pincode: "380008", lat: 22.9980, lng: 72.6020 },
  { name: "Paldi", city: "Ahmedabad", state: "Gujarat", pincode: "380007", lat: 23.0130, lng: 72.5620 },
  { name: "Naranpura", city: "Ahmedabad", state: "Gujarat", pincode: "380013", lat: 23.0550, lng: 72.5480 },
  { name: "Naroda", city: "Ahmedabad", state: "Gujarat", pincode: "382330", lat: 23.0670, lng: 72.6480 },
  { name: "Nikol", city: "Ahmedabad", state: "Gujarat", pincode: "382350", lat: 23.0450, lng: 72.6650 },
  { name: "Ashram Road", city: "Ahmedabad", state: "Gujarat", pincode: "380014", lat: 23.0300, lng: 72.5700 },
  { name: "SG Highway", city: "Ahmedabad", state: "Gujarat", pincode: "380061", lat: 23.0400, lng: 72.5080 },
  { name: "Sector 11", city: "Gandhinagar", state: "Gujarat", pincode: "382011", lat: 23.2180, lng: 72.6390 },
  { name: "Kudasan", city: "Gandhinagar", state: "Gujarat", pincode: "382421", lat: 23.1800, lng: 72.6280 },
  { name: "Sargasan", city: "Gandhinagar", state: "Gujarat", pincode: "382421", lat: 23.1950, lng: 72.6150 }
];

const OTHER_GUJARAT_AREAS = [
  { name: "Alkapuri", city: "Vadodara", state: "Gujarat", pincode: "390007", lat: 22.3120, lng: 73.1670 },
  { name: "Gotri", city: "Vadodara", state: "Gujarat", pincode: "390021", lat: 22.3180, lng: 73.1360 },
  { name: "Akota", city: "Vadodara", state: "Gujarat", pincode: "390020", lat: 22.2900, lng: 73.1650 },
  { name: "Manjalpur", city: "Vadodara", state: "Gujarat", pincode: "390011", lat: 22.2680, lng: 73.1890 },
  { name: "Adajan", city: "Surat", state: "Gujarat", pincode: "395009", lat: 21.1960, lng: 72.7950 },
  { name: "Vesu", city: "Surat", state: "Gujarat", pincode: "395007", lat: 21.1350, lng: 72.7750 },
  { name: "Varachha", city: "Surat", state: "Gujarat", pincode: "395006", lat: 21.2150, lng: 72.8400 },
  { name: "Piplod", city: "Surat", state: "Gujarat", pincode: "395007", lat: 21.1500, lng: 72.7800 },
  { name: "Kalawad Road", city: "Rajkot", state: "Gujarat", pincode: "360005", lat: 22.2850, lng: 70.7750 },
  { name: "Race Course", city: "Rajkot", state: "Gujarat", pincode: "360001", lat: 22.3000, lng: 70.7950 },
  { name: "Waghawadi Road", city: "Bhavnagar", state: "Gujarat", pincode: "364002", lat: 21.7550, lng: 72.1450 },
  { name: "VV Nagar", city: "Anand", state: "Gujarat", pincode: "388120", lat: 22.5500, lng: 72.9250 },
  { name: "Halol Town", city: "Halol", state: "Gujarat", pincode: "389320", lat: 22.5000, lng: 73.4700 }
];

const OTHER_INDIA_AREAS = [
  { name: "Andheri West", city: "Mumbai", state: "Maharashtra", pincode: "400053", lat: 19.1363, lng: 72.8276 },
  { name: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050", lat: 19.0544, lng: 72.8402 },
  { name: "Borivali West", city: "Mumbai", state: "Maharashtra", pincode: "400092", lat: 19.2307, lng: 72.8567 },
  { name: "Kothrud", city: "Pune", state: "Maharashtra", pincode: "411038", lat: 18.5074, lng: 73.8077 },
  { name: "Koregaon Park", city: "Pune", state: "Maharashtra", pincode: "411001", lat: 18.5362, lng: 73.8930 },
  { name: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038", lat: 12.9719, lng: 77.6412 },
  { name: "Koramangala", city: "Bengaluru", state: "Karnataka", pincode: "560095", lat: 12.9352, lng: 77.6244 },
  { name: "Connaught Place", city: "New Delhi", state: "Delhi NCR", pincode: "110001", lat: 28.6304, lng: 77.2177 },
  { name: "Sector 62", city: "Noida", state: "Delhi NCR", pincode: "201309", lat: 28.6219, lng: 77.3639 },
  { name: "DLF Phase 3", city: "Gurugram", state: "Delhi NCR", pincode: "122002", lat: 28.4901, lng: 77.0896 }
];

// --- Name Pools ---
const FIRST_NAMES_MALE = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishan",
  "Shaurya", "Bhavin", "Hardik", "Jignesh", "Chirag", "Mehul", "Tushar", "Nilesh", "Pankaj", "Hitesh",
  "Rakesh", "Gautam", "Dhruv", "Krunal", "Parth", "Harsh", "Siddharth", "Manan", "Nayan", "Dev",
  "Rutvik", "Darshan", "Kevin", "Yash", "Jay", "Meet", "Pritesh", "Pratik", "Ronak", "Sahil",
  "Deep", "Anand", "Vatsal", "Sanjay", "Rajesh", "Vijay", "Ashok", "Kishore", "Dinesh", "Mahesh"
];

const FIRST_NAMES_FEMALE = [
  "Aanya", "Diya", "Ananya", "Pari", "Anika", "Navya", "Angel", "Myra", "Avani", "Saisha",
  "Hetvi", "Mansi", "Pooja", "Neha", "Kinjal", "Dharti", "Krupa", "Urvashi", "Riya", "Nidhi",
  "Forum", "Bansi", "Janvi", "Tejal", "Meera", "Grishma", "Komal", "Priyanka", "Shreya", "Kavya",
  "Bhakti", "Krutika", "Drashti", "Ishita", "Khushi", "Tanvi", "Aditi", "Charmi", "Swati", "Nisha"
];

const SURNAMES = [
  "Patel", "Shah", "Mehta", "Joshi", "Panchal", "Raval", "Trivedi", "Desai", "Parikh", "Vyas",
  "Soni", "Thakkar", "Bhatt", "Solanki", "Chauhan", "Dave", "Mistry", "Gohil", "Vaghela", "Makwana",
  "Parmar", "Kothari", "Modi", "Rathod", "Jadeja", "Zala", "Sheth", "Merchant", "Kapoor", "Sharma"
];

const SERVICES = [
  { name: "Cleaning", label: "Cleaners", basePrice: 399 },
  { name: "Electrical", label: "Electricals", basePrice: 199 },
  { name: "Plumbing", label: "Plumbers", basePrice: 249 },
  { name: "Carpentry", label: "Carpentry", basePrice: 299 },
  { name: "AC Repair", label: "AC Experts", basePrice: 499 },
  { name: "Pest Control", label: "Pest Control", basePrice: 799 },
  { name: "Home Painting", label: "Home Painters", basePrice: 1499 },
  { name: "Appliance Repair", label: "Appliance Care", basePrice: 349 }
];

const PLANS = ["basic", "standard", "pro"];

// Helper for small random coordinate offset
function getOffset(index, axis) {
  const seed = (index * (axis === "lat" ? 37 : 53)) % 1000;
  return Number(((seed - 500) * 0.00008).toFixed(6));
}

async function seedExpandedData() {
  console.log("🚀 Starting database expansion (300 Sellers & 200 Buyers)...");

  try {
    const hashedPassword = await bcrypt.hash("password123", 12);

    // 1. Get Category Map from DB
    const [categories] = await pool.query("SELECT id, name FROM categories");
    if (categories.length === 0) {
      console.error("❌ No categories found in database! Run initialize_db.js first.");
      process.exit(1);
    }
    const categoryMap = {};
    categories.forEach(cat => { categoryMap[cat.name] = cat.id; });

    // 2. Fetch system users to keep (Admin, CT, Test Seller)
    const [keepUsers] = await pool.query(
      "SELECT id, phone FROM users WHERE phone IN ('9999999999', '8160977394', '7777777777') OR role = 'admin'"
    );
    const keepUserIds = keepUsers.map(u => u.id);
    console.log(`Preserving ${keepUsers.length} core system account(s)...`);

    // 3. Clear non-essential users, sellers, services, wallets
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    if (keepUserIds.length > 0) {
      const placeholders = keepUserIds.map(() => '?').join(',');
      await pool.query(`DELETE FROM services WHERE seller_id IN (SELECT id FROM sellers WHERE user_id NOT IN (${placeholders}))`, keepUserIds);
      await pool.query(`DELETE FROM seller_categories WHERE seller_id IN (SELECT id FROM sellers WHERE user_id NOT IN (${placeholders}))`, keepUserIds);
      await pool.query(`DELETE FROM sellers WHERE user_id NOT IN (${placeholders})`, keepUserIds);
      await pool.query(`DELETE FROM wallets WHERE user_id NOT IN (${placeholders})`, keepUserIds);
      await pool.query(`DELETE FROM users WHERE id NOT IN (${placeholders})`, keepUserIds);
    }
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Existing non-core accounts cleared.");

    // --- 4. SEED 300 SELLERS ---
    console.log("Seeding 300 Sellers (150 near Ahmedabad/Gandhinagar, 75 in other Gujarat cities, 75 across India)...");
    
    // We will build a pool of 300 seller locations:
    // Index 0-149: Ahmedabad / Gandhinagar
    // Index 150-224: Other Gujarat
    // Index 225-299: Rest of India
    const sellerLocations = [];
    for (let i = 0; i < 150; i++) {
      sellerLocations.push(AHMEDABAD_AREAS[i % AHMEDABAD_AREAS.length]);
    }
    for (let i = 0; i < 75; i++) {
      sellerLocations.push(OTHER_GUJARAT_AREAS[i % OTHER_GUJARAT_AREAS.length]);
    }
    for (let i = 0; i < 75; i++) {
      sellerLocations.push(OTHER_INDIA_AREAS[i % OTHER_INDIA_AREAS.length]);
    }

    let sellerCount = 0;
    for (let i = 0; i < 300; i++) {
      const area = sellerLocations[i];
      const serviceObj = SERVICES[i % SERVICES.length];
      const surname = SURNAMES[i % SURNAMES.length];
      const firstName = (i % 2 === 0) ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
      const isMale = (i % 2 === 0);

      const lat = Number((area.lat + getOffset(i, "lat")).toFixed(6));
      const lng = Number((area.lng + getOffset(i, "lng")).toFixed(6));
      const phone = String(7100000000 + i * 9871).slice(0, 10);
      const email = `seller_exp_${i + 1}@quickseva.com`;

      const isPremium = (i % 5 < 2); // ~40% premium sellers
      const plan = isPremium ? PLANS[i % PLANS.length] : null;
      const rating = Number((4.1 + (i % 9) * 0.1).toFixed(1));
      const reviews = 15 + ((i * 19) % 180);
      const serviceMode = i % 3 === 0 ? "online" : i % 3 === 1 ? "offline" : "both";
      const instantService = i % 3 === 0 ? 1 : 0;

      // Insert User
      const [userRes] = await pool.query(
        `INSERT INTO users (name, email, phone, gender, password, role, address, city, state, pincode, lat, lng, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, 'seller', ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          `${firstName} ${surname}`,
          email,
          phone,
          isMale ? "male" : "female",
          hashedPassword,
          `${area.name}, ${area.city}, ${area.state}`,
          area.city,
          area.state,
          area.pincode,
          lat,
          lng
        ]
      );
      const userId = userRes.insertId;

      // Insert Wallet
      await pool.query("INSERT INTO wallets (user_id, balance) VALUES (?, 500.00)", [userId]);

      // Insert Seller Profile
      const categoryId = categoryMap[serviceObj.name] || 1;
      const businessName = `${surname} ${serviceObj.label} ${area.name}`;

      const [sellerRes] = await pool.query(
        `INSERT INTO sellers (
          user_id, business_name, category_id, bio, experience_yrs, avg_rating, total_reviews,
          is_verified, is_available, working_radius, latitude, longitude, lat, lng, location_address,
          service_radius, phone, profile_completed, service_mode, instant_service, is_premium, plan, premium_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 10, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [
          userId,
          businessName,
          categoryId,
          `Experienced professional ${serviceObj.name.toLowerCase()} specialist in ${area.name}, ${area.city}.`,
          2 + (i % 12),
          rating,
          reviews,
          lat, lng, lat, lng,
          `${area.name}, ${area.city}, ${area.state}`,
          10 + (i % 3) * 5, // 10, 15, 20 km radius
          phone,
          serviceMode,
          instantService,
          isPremium ? 1 : 0,
          plan,
          isPremium ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) : null
        ]
      );
      const sellerId = sellerRes.insertId;

      // Seller Category map
      await pool.query("INSERT IGNORE INTO seller_categories (seller_id, category_id) VALUES (?, ?)", [sellerId, categoryId]);

      // Insert Services for Seller
      const basicPrice = serviceObj.basePrice + (i % 5) * 50;
      await pool.query(
        `INSERT INTO services (seller_id, category_id, title, description, price, price_type, duration_hrs, duration, is_instant, is_active)
         VALUES (?, ?, ?, ?, ?, 'fixed', 1.5, '1-2 hours', ?, 1)`,
        [
          sellerId,
          categoryId,
          `${serviceObj.name} Standard Service`,
          `Quality ${serviceObj.name.toLowerCase()} service by ${businessName}.`,
          basicPrice,
          instantService
        ]
      );

      await pool.query(
        `INSERT INTO services (seller_id, category_id, title, description, price, price_type, duration_hrs, duration, is_instant, is_active)
         VALUES (?, ?, ?, ?, ?, 'fixed', 2.5, '2-3 hours', 0, 1)`,
        [
          sellerId,
          categoryId,
          `${serviceObj.name} Deep / Premium Service`,
          `Complete inspection, repair and premium finish for ${serviceObj.name.toLowerCase()}.`,
          basicPrice * 2.2
        ]
      );

      sellerCount++;
    }
    console.log(`✅ Inserted ${sellerCount} new sellers successfully!`);


    // --- 5. SEED 200 BUYERS ---
    console.log("Seeding 200 Buyers (110 near Ahmedabad/Gandhinagar, 55 in other Gujarat cities, 35 across India)...");

    const buyerLocations = [];
    for (let i = 0; i < 110; i++) {
      buyerLocations.push(AHMEDABAD_AREAS[i % AHMEDABAD_AREAS.length]);
    }
    for (let i = 0; i < 55; i++) {
      buyerLocations.push(OTHER_GUJARAT_AREAS[i % OTHER_GUJARAT_AREAS.length]);
    }
    for (let i = 0; i < 35; i++) {
      buyerLocations.push(OTHER_INDIA_AREAS[i % OTHER_INDIA_AREAS.length]);
    }

    let buyerCount = 0;
    for (let i = 0; i < 200; i++) {
      const area = buyerLocations[i];
      const surname = SURNAMES[(i + 5) % SURNAMES.length];
      const isMale = (i % 2 === 0);
      const firstName = isMale ? FIRST_NAMES_MALE[(i + 7) % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[(i + 7) % FIRST_NAMES_FEMALE.length];

      const lat = Number((area.lat + getOffset(i + 300, "lat")).toFixed(6));
      const lng = Number((area.lng + getOffset(i + 300, "lng")).toFixed(6));
      const phone = String(9100000000 + i * 9437).slice(0, 10);
      const email = `buyer_${i + 1}@quickseva.com`;

      // Insert User with role 'buyer'
      const [userRes] = await pool.query(
        `INSERT INTO users (name, email, phone, gender, password, role, address, city, state, pincode, lat, lng, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, 'buyer', ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          `${firstName} ${surname}`,
          email,
          phone,
          isMale ? "male" : "female",
          hashedPassword,
          `Flat ${(i % 12) + 101}, ${area.name}, ${area.city}`,
          area.city,
          area.state,
          area.pincode,
          lat,
          lng
        ]
      );
      const userId = userRes.insertId;

      // Insert Wallet for Buyer
      await pool.query("INSERT INTO wallets (user_id, balance) VALUES (?, 1000.00)", [userId]);

      buyerCount++;
    }
    console.log(`✅ Inserted ${buyerCount} buyers successfully!`);

    // --- 6. Verification Summary ---
    const [rolesCount] = await pool.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    const [totalSellers] = await pool.query("SELECT COUNT(*) as count FROM sellers");
    const [totalServices] = await pool.query("SELECT COUNT(*) as count FROM services");
    const [ahmedabadSellers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'seller' AND (city = 'Ahmedabad' OR city = 'Gandhinagar')");
    const [ahmedabadBuyers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'buyer' AND (city = 'Ahmedabad' OR city = 'Gandhinagar')");

    console.log("\n================ DB SUMMARY ================");
    console.log("Users by Role:", rolesCount);
    console.log("Total Seller Profiles in sellers table:", totalSellers[0].count);
    console.log("Total Services Created:", totalServices[0].count);
    console.log("Sellers near Ahmedabad/Gandhinagar:", ahmedabadSellers[0].count);
    console.log("Buyers near Ahmedabad/Gandhinagar:", ahmedabadBuyers[0].count);
    console.log("============================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding expanded DB:", error);
    process.exit(1);
  }
}

seedExpandedData();
