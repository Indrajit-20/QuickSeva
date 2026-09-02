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
  { name: "Ghatlodiya", city: "Ahmedabad", state: "Gujarat", pincode: "380061", lat: 23.0780, lng: 72.5350 },
  { name: "Sola", city: "Ahmedabad", state: "Gujarat", pincode: "380060", lat: 23.0700, lng: 72.5200 },
  { name: "Motera", city: "Ahmedabad", state: "Gujarat", pincode: "380005", lat: 23.1000, lng: 72.6000 },
  { name: "Vejalpur", city: "Ahmedabad", state: "Gujarat", pincode: "380051", lat: 23.0000, lng: 72.5300 },
  { name: "Ambawadi", city: "Ahmedabad", state: "Gujarat", pincode: "380015", lat: 23.0320, lng: 72.5580 },
  { name: "Ranip", city: "Ahmedabad", state: "Gujarat", pincode: "382480", lat: 23.0800, lng: 72.5700 },
  { name: "Shahibaug", city: "Ahmedabad", state: "Gujarat", pincode: "380004", lat: 23.0650, lng: 72.5950 },
  { name: "Isanpur", city: "Ahmedabad", state: "Gujarat", pincode: "382443", lat: 22.9800, lng: 72.6200 },
  { name: "Vatva", city: "Ahmedabad", state: "Gujarat", pincode: "382440", lat: 22.9600, lng: 72.6350 },
  { name: "Bapunagar", city: "Ahmedabad", state: "Gujarat", pincode: "380024", lat: 23.0500, lng: 72.6300 },
  { name: "Chandlodiya", city: "Ahmedabad", state: "Gujarat", pincode: "382481", lat: 23.0720, lng: 72.5450 },
  { name: "Shela", city: "Ahmedabad", state: "Gujarat", pincode: "380058", lat: 23.0100, lng: 72.4400 },
  { name: "Usmanpura", city: "Ahmedabad", state: "Gujarat", pincode: "380013", lat: 23.0450, lng: 72.5680 },
  { name: "Ellis Bridge", city: "Ahmedabad", state: "Gujarat", pincode: "380006", lat: 23.0240, lng: 72.5700 }
];

const OTHER_CITIES_AREAS = [
  // Gandhinagar
  { name: "Sector 11", city: "Gandhinagar", state: "Gujarat", pincode: "382011", lat: 23.2180, lng: 72.6390 },
  { name: "Kudasan", city: "Gandhinagar", state: "Gujarat", pincode: "382421", lat: 23.1800, lng: 72.6280 },
  { name: "Sargasan", city: "Gandhinagar", state: "Gujarat", pincode: "382421", lat: 23.1950, lng: 72.6150 },
  // Vadodara
  { name: "Alkapuri", city: "Vadodara", state: "Gujarat", pincode: "390007", lat: 22.3120, lng: 73.1670 },
  { name: "Gotri", city: "Vadodara", state: "Gujarat", pincode: "390021", lat: 22.3180, lng: 73.1360 },
  { name: "Manjalpur", city: "Vadodara", state: "Gujarat", pincode: "390011", lat: 22.2680, lng: 73.1890 },
  // Surat
  { name: "Adajan", city: "Surat", state: "Gujarat", pincode: "395009", lat: 21.1960, lng: 72.7950 },
  { name: "Vesu", city: "Surat", state: "Gujarat", pincode: "395007", lat: 21.1350, lng: 72.7750 },
  { name: "Varachha", city: "Surat", state: "Gujarat", pincode: "395006", lat: 21.2150, lng: 72.8400 },
  // Rajkot
  { name: "Kalawad Road", city: "Rajkot", state: "Gujarat", pincode: "360005", lat: 22.2850, lng: 70.7750 },
  { name: "Race Course", city: "Rajkot", state: "Gujarat", pincode: "360001", lat: 22.3000, lng: 70.7950 },
  // Mumbai
  { name: "Andheri West", city: "Mumbai", state: "Maharashtra", pincode: "400053", lat: 19.1363, lng: 72.8276 },
  { name: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050", lat: 19.0544, lng: 72.8402 },
  { name: "Borivali West", city: "Mumbai", state: "Maharashtra", pincode: "400092", lat: 19.2307, lng: 72.8567 },
  // Pune
  { name: "Kothrud", city: "Pune", state: "Maharashtra", pincode: "411038", lat: 18.5074, lng: 73.8077 },
  { name: "Viman Nagar", city: "Pune", state: "Maharashtra", pincode: "411014", lat: 18.5679, lng: 73.9143 },
  // Delhi NCR
  { name: "Connaught Place", city: "New Delhi", state: "Delhi", pincode: "110001", lat: 28.6304, lng: 77.2177 },
  { name: "DLF Phase 3", city: "Gurugram", state: "Haryana", pincode: "122002", lat: 28.4901, lng: 77.0896 },
  // Bengaluru
  { name: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038", lat: 12.9719, lng: 77.6412 },
  { name: "Koramangala", city: "Bengaluru", state: "Karnataka", pincode: "560095", lat: 12.9352, lng: 77.6244 },
  // Hyderabad
  { name: "Gachibowli", city: "Hyderabad", state: "Telangana", pincode: "500032", lat: 17.4401, lng: 78.3489 }
];

// --- Name Pools ---
const FIRST_NAMES_MALE = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishan",
  "Shaurya", "Bhavin", "Hardik", "Jignesh", "Chirag", "Mehul", "Tushar", "Nilesh", "Pankaj", "Hitesh",
  "Rakesh", "Gautam", "Dhruv", "Krunal", "Parth", "Harsh", "Siddharth", "Manan", "Nayan", "Dev",
  "Rutvik", "Darshan", "Kevin", "Yash", "Jay", "Meet", "Pritesh", "Pratik", "Ronak", "Sahil",
  "Deep", "Anand", "Vatsal", "Sanjay", "Rajesh", "Vijay", "Ashok", "Kishore", "Dinesh", "Mahesh",
  "Chetan", "Bhavesh", "Alok", "Amit", "Sumit", "Rahul", "Vikas", "Sunil", "Anil", "Kamlesh"
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
  "Parmar", "Kothari", "Modi", "Rathod", "Jadeja", "Zala", "Sheth", "Merchant", "Kapoor", "Sharma",
  "Gupta", "Verma", "Singh", "Yadav", "Kulkarni", "Deshmukh", "Pawar", "Reddy", "Nair", "Rao"
];

const CONTRACTOR_TRADES = [
  "Painting Contractor",
  "Civil & Masonry Contractor",
  "Electrical Site Contractor",
  "Plumbing & Piping Contractor",
  "Carpentry & Modular Work",
  "Tile, Marble & Granite",
  "HVAC & Commercial AC Work",
  "Waterproofing & Damp Proofing",
  "Turnkey General Contractor"
];

const BUSINESS_PREFIXES = [
  "Apex", "Royal", "Shree", "Mahalaxmi", "Universal", "National", "Star", "Prime",
  "Golden", "Sunrise", "Reliable", "Precision", "Quality", "Paramount", "Elite", "Smart"
];

// Helper to get small coordinate offset for variety
function getOffset(index, axis) {
  const seed = (index * (axis === "lat" ? 37 : 53)) % 1000;
  return Number(((seed - 500) * 0.00008).toFixed(6));
}

async function seed3000Data() {
  console.log("🚀 Starting Bulk Dataset Seeding for 3,000 Accounts (1000 Buyers, 1000 Sellers, 1000 Contractors)...");
  console.log("📍 Target: 500+ Ahmedabad accounts for each role!");

  const conn = await pool.getConnection();

  try {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Fetch existing category mapping
    const [catRows] = await conn.query("SELECT id, name FROM categories");
    const categoryIds = catRows.map(c => c.id);
    if (categoryIds.length === 0) {
      throw new Error("No categories found in database. Please run initial setup first.");
    }

    // Prepare arrays for bulk execution
    // 1. Generate 1,000 BUYERS
    console.log("📦 Generating 1,000 Buyer accounts...");
    const buyerUsers = [];
    for (let i = 1; i <= 1000; i++) {
      const isAhmedabad = i <= 500; // 500 in Ahmedabad, 500 elsewhere
      const locationPool = isAhmedabad ? AHMEDABAD_AREAS : OTHER_CITIES_AREAS;
      const loc = locationPool[(i - 1) % locationPool.length];

      const isMale = i % 2 === 0;
      const firstName = isMale ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
      const surname = SURNAMES[(i * 7) % SURNAMES.length];
      const name = `${firstName} ${surname}`;
      const email = `buyer_3k_${i}@quickseva.com`;
      const phone = `910${String(i).padStart(7, "0")}`;
      const address = `${loc.name}, ${loc.city}, ${loc.state}`;
      const lat = Number((loc.lat + getOffset(i, "lat")).toFixed(6));
      const lng = Number((loc.lng + getOffset(i, "lng")).toFixed(6));

      buyerUsers.push([
        name, null, null, email, phone, hashedPassword, 'buyer',
        address, loc.city, loc.state, loc.pincode, lat, lng,
        1, 0, 1, 'verified', `Regular home user looking for local home services in ${loc.city}`
      ]);
    }

    // 2. Generate 1,000 SELLERS
    console.log("📦 Generating 1,000 Seller accounts...");
    const sellerUsers = [];
    const sellerProfiles = []; // Will store metadata to insert after users are created
    for (let i = 1; i <= 1000; i++) {
      const isAhmedabad = i <= 500;
      const locationPool = isAhmedabad ? AHMEDABAD_AREAS : OTHER_CITIES_AREAS;
      const loc = locationPool[(i - 1) % locationPool.length];

      const isMale = i % 2 === 0;
      const firstName = isMale ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
      const surname = SURNAMES[(i * 11) % SURNAMES.length];
      const name = `${firstName} ${surname}`;
      const email = `seller_3k_${i}@quickseva.com`;
      const phone = `920${String(i).padStart(7, "0")}`;
      const address = `${loc.name}, ${loc.city}, ${loc.state}`;
      const lat = Number((loc.lat + getOffset(i, "lat")).toFixed(6));
      const lng = Number((loc.lng + getOffset(i, "lng")).toFixed(6));

      const categoryId = categoryIds[(i - 1) % categoryIds.length];
      const prefix = BUSINESS_PREFIXES[i % BUSINESS_PREFIXES.length];
      const businessName = `${prefix} ${surname} Services`;

      sellerUsers.push([
        name, businessName, null, email, phone, hashedPassword, 'seller',
        address, loc.city, loc.state, loc.pincode, lat, lng,
        1, 0, 1, 'verified', `Professional service provider in ${loc.name}, ${loc.city}`
      ]);

      sellerProfiles.push({
        businessName,
        categoryId,
        bio: `Top rated provider in ${loc.name}, ${loc.city} offering quick response and high quality work.`,
        experienceYrs: 3 + (i % 15),
        avgRating: Number((4.0 + (i % 10) * 0.1).toFixed(2)),
        totalReviews: 12 + (i % 80),
        totalOrders: 25 + (i % 200),
        workingRadius: 15,
        gstNumber: `24ABCDE${String(i).padStart(4, "0")}1Z5`
      });
    }

    // 3. Generate 1,000 CONTRACTORS
    console.log("📦 Generating 1,000 Contractor accounts...");
    const contractorUsers = [];
    for (let i = 1; i <= 1000; i++) {
      const isAhmedabad = i <= 500;
      const locationPool = isAhmedabad ? AHMEDABAD_AREAS : OTHER_CITIES_AREAS;
      const loc = locationPool[(i - 1) % locationPool.length];

      const firstName = FIRST_NAMES_MALE[(i * 3) % FIRST_NAMES_MALE.length];
      const surname = SURNAMES[(i * 13) % SURNAMES.length];
      const name = `${firstName} ${surname}`;
      const trade = CONTRACTOR_TRADES[(i - 1) % CONTRACTOR_TRADES.length];
      const prefix = BUSINESS_PREFIXES[i % BUSINESS_PREFIXES.length];
      const companyName = `${prefix} ${surname} ${trade.replace("Contractor", "Co.")}`;

      const email = `contractor_3k_${i}@quickseva.com`;
      const phone = `930${String(i).padStart(7, "0")}`;
      const address = `${loc.name}, ${loc.city}, ${loc.state}`;
      const lat = Number((loc.lat + getOffset(i, "lat")).toFixed(6));
      const lng = Number((loc.lng + getOffset(i, "lng")).toFixed(6));

      contractorUsers.push([
        name, companyName, trade, email, phone, hashedPassword, 'contractor',
        address, loc.city, loc.state, loc.pincode, lat, lng,
        1, 1, 1, 'verified', `Turnkey contractor specializing in ${trade} across ${loc.city}. Experienced site management & labor workforce.`
      ]);
    }

    // Insert all users in batches into database
    console.log("💾 Executing SQL Bulk Inserts into `users` table...");
    const userInsertQuery = `
      INSERT INTO users (
        name, company_name, trade_specialization, email, phone, password, role,
        address, city, state, pincode, lat, lng,
        is_verified, is_verified_contractor, is_active, verification_status, bio
      ) VALUES ?
      ON DUPLICATE KEY UPDATE 
        name=VALUES(name), city=VALUES(city), state=VALUES(state), pincode=VALUES(pincode), 
        lat=VALUES(lat), lng=VALUES(lng), is_active=1
    `;

    // Process in batches of 500 to keep SQL statements optimal
    const allUsersToInsert = [...buyerUsers, ...sellerUsers, ...contractorUsers];
    for (let b = 0; b < allUsersToInsert.length; b += 500) {
      const batch = allUsersToInsert.slice(b, b + 500);
      await conn.query(userInsertQuery, [batch]);
    }
    console.log("✅ Successfully seeded 3,000 Users in users table!");

    // Fetch user IDs for sellers & contractors to create child records
    const [sellerUserRows] = await conn.query("SELECT id, email FROM users WHERE role = 'seller' AND email LIKE 'seller_3k_%'");
    const sellerEmailToId = {};
    sellerUserRows.forEach(u => { sellerEmailToId[u.email] = u.id; });

    const [contractorUserRows] = await conn.query("SELECT id, email, name, company_name, phone, city, state, pincode, lat, lng, address FROM users WHERE role = 'contractor' AND email LIKE 'contractor_3k_%'");
    
    // Create Seller records in `sellers` table
    console.log("💾 Creating Seller Profiles & Services...");
    const sellersToInsert = [];
    for (let i = 1; i <= 1000; i++) {
      const email = `seller_3k_${i}@quickseva.com`;
      const userId = sellerEmailToId[email];
      if (!userId) continue;
      const meta = sellerProfiles[i - 1];

      sellersToInsert.push([
        userId, meta.businessName, meta.categoryId, meta.bio,
        meta.experienceYrs, meta.avgRating, meta.totalReviews, meta.totalOrders,
        1, 1, 'individual', meta.workingRadius, meta.gstNumber
      ]);
    }

    const sellerInsertQuery = `
      INSERT INTO sellers (
        user_id, business_name, category_id, bio,
        experience_yrs, avg_rating, total_reviews, total_orders,
        is_verified, is_available, seller_type, working_radius, gst_number
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        business_name=VALUES(business_name), category_id=VALUES(category_id), avg_rating=VALUES(avg_rating)
    `;

    for (let b = 0; b < sellersToInsert.length; b += 500) {
      const batch = sellersToInsert.slice(b, b + 500);
      await conn.query(sellerInsertQuery, [batch]);
    }

    // Link seller_categories & create Services for each seller
    const [createdSellers] = await conn.query("SELECT id, user_id, category_id, business_name FROM sellers WHERE user_id IN (?)", [Object.values(sellerEmailToId)]);
    
    const sellerCategoryInserts = [];
    const serviceInserts = [];
    for (const seller of createdSellers) {
      sellerCategoryInserts.push([seller.id, seller.category_id]);
      
      // Add a service for each seller
      const serviceTitle = `${seller.business_name} - Expert Service`;
      const price = 299 + (seller.id % 15) * 50;
      serviceInserts.push([
        seller.id, seller.category_id, null, serviceTitle,
        `Professional doorstep service with quality guarantee and verified equipment.`,
        price, 'fixed', 1.5, JSON.stringify(["verified", "doorstep", "guaranteed"]), 1
      ]);
    }

    if (sellerCategoryInserts.length > 0) {
      await conn.query("INSERT IGNORE INTO seller_categories (seller_id, category_id) VALUES ?", [sellerCategoryInserts]);
    }

    if (serviceInserts.length > 0) {
      const serviceQuery = `
        INSERT INTO services (seller_id, category_id, sub_service_id, title, description, price, price_type, duration_hrs, tags, is_active)
        VALUES ?
      `;
      for (let b = 0; b < serviceInserts.length; b += 500) {
        await conn.query(serviceQuery, [serviceInserts.slice(b, b + 500)]);
      }
    }
    console.log("✅ Created 1,000 Seller profiles and Services!");

    // Create Wallets for all 3,000 created users
    console.log("💾 Initializing Wallets for all created accounts...");
    const [allNewUsers] = await conn.query("SELECT id FROM users WHERE email LIKE '%_3k_%'");
    const walletInserts = allNewUsers.map(u => [u.id, 500 + (u.id % 20) * 100]);

    if (walletInserts.length > 0) {
      const walletQuery = "INSERT INTO wallets (user_id, balance) VALUES ? ON DUPLICATE KEY UPDATE balance=VALUES(balance)";
      for (let b = 0; b < walletInserts.length; b += 500) {
        await conn.query(walletQuery, [walletInserts.slice(b, b + 500)]);
      }
    }
    console.log("✅ Initialized 3,000 Wallets!");

    // Create sample Contractor Posts & Quote Requests in Ahmedabad for test coverage
    console.log("💾 Seeding Ahmedabad Contractor Site Posts & Customer Leads...");
    const ahmedabadContractors = contractorUserRows.filter(c => c.city === 'Ahmedabad');

    if (ahmedabadContractors.length > 0) {
      const postInserts = [];
      const quoteInserts = [];

      for (let i = 0; i < Math.min(60, ahmedabadContractors.length); i++) {
        const c = ahmedabadContractors[i];
        
        postInserts.push([
          c.id, 'demand_workers', `Required Workers for ${c.company_name} Site`, c.company_name,
          c.name, c.phone, c.phone, c.address, 'Ahmedabad', 'Gujarat', c.pincode,
          c.lat, c.lng, '2026-09-05', '2026-10-15', JSON.stringify(["Food 🍱", "Stay 🛖", "Overtime ⏰"]),
          `Need 5-10 skilled labor workers for ongoing project in ${c.address}. Daily payment available.`,
          'active', 1
        ]);

        quoteInserts.push([
          c.id, `Test Customer ${i + 1}`, `98980${String(i).padStart(5, "0")}`, 'Ahmedabad',
          'Painting & Civil Renovation', `Need turnkey contract quote for 3BHK flat in ${c.address}.`,
          'pending'
        ]);
      }

      if (postInserts.length > 0) {
        const postQuery = `
          INSERT INTO contractor_posts (
            contractor_id, post_type, title, company_name, contact_name, contact_phone, whatsapp_phone,
            site_address, city, state, pincode, lat, lng, start_date, end_date, amenities, description, status, is_featured
          ) VALUES ?
        `;
        await conn.query(postQuery, [postInserts]);
      }

      if (quoteInserts.length > 0) {
        const quoteQuery = `
          INSERT INTO contractor_quote_requests (contractor_id, customer_name, customer_phone, city, service_type, notes, status)
          VALUES ?
        `;
        await conn.query(quoteQuery, [quoteInserts]);
      }
    }
    console.log("✅ Created Ahmedabad Contractor Site Posts & Quotes!");

    // Log final stats summary
    const [finalCounts] = await conn.query(`
      SELECT role, 
             SUM(CASE WHEN city = 'Ahmedabad' THEN 1 ELSE 0 END) AS ahmedabad_count,
             COUNT(*) AS total_count
      FROM users
      GROUP BY role
    `);

    console.log("\n==========================================");
    console.log("🎉 SEEDING COMPLETE SUMMARY:");
    console.log("==========================================");
    console.table(finalCounts);
    console.log("==========================================");

  } catch (err) {
    console.error("❌ Seeding Error:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed3000Data();
