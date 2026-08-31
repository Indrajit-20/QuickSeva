const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

// Categories & Services Map
const CATEGORIES = [
  { name: "Cleaning", icon: "🧹", label: "Cleaners" },
  { name: "Electrical", icon: "⚡", label: "Electricals" },
  { name: "Plumbing", icon: "🔧", label: "Plumbers" },
  { name: "Carpentry", icon: "🪚", label: "Carpentry" },
  { name: "AC Repair", icon: "❄️", label: "AC Experts" },
  { name: "Pest Control", icon: "🐜", label: "Pest Control" },
  { name: "Home Painting", icon: "🎨", label: "Home Painters" },
  { name: "Appliance Repair", icon: "🔌", label: "Appliance Repair" },
];

const CONTRACTOR_SPECIALIZATIONS = [
  "Painting Contractor",
  "Civil & Masonry",
  "Electrical Contractor",
  "Plumbing Contractor",
  "Interior Design & Fabrication",
  "Tiling & Flooring",
  "Shuttering & Centering",
  "Waterproofing Specialist"
];

// Names Pool
const SURNAMES = [
  "Patel", "Shah", "Sharma", "Mehta", "Joshi", "Trivedi", "Panchal", "Soni", "Vyas", "Thakkar",
  "Parikh", "Bhatt", "Chauhan", "Dave", "Mistry", "Solanki", "Desai", "Modi", "Kapoor", "Raval",
  "Varma", "Singh", "Gupta", "Agarwal", "Kumar", "Reddy", "Rao", "Nair", "Pillai", "Banerjee",
  "Chatterjee", "Mukherjee", "Bose", "Das", "Sen", "Dutta", "Kulkarni", "Deshpande", "Patil", "Shinde"
];

const FIRST_NAMES_MALE = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya",
  "Rahul", "Amit", "Sanjay", "Vijay", "Rajesh", "Ramesh", "Deepak", "Anil", "Sunil", "Alok",
  "Dev", "Harsh", "Jay", "Parth", "Manan", "Nayan", "Yash", "Kirtan", "Rohan", "Sameer", "Vikram", "Vishal"
];

const FIRST_NAMES_FEMALE = [
  "Diya", "Ananya", "Aadhya", "Pihu", "Khushi", "Saanvi", "Shruti", "Kavya", "Riya", "Aanya",
  "Pooja", "Neha", "Priya", "Sneha", "Swati", "Divya", "Meera", "Ritu", "Rekha", "Anita", "Geeta", "Nisha"
];

// Locations Pool
const AHMEDABAD_AREAS = [
  { name: "Satellite", city: "Ahmedabad", state: "Gujarat", pincode: "380015", lat: 23.0290, lng: 72.5150 },
  { name: "Bopal", city: "Ahmedabad", state: "Gujarat", pincode: "380058", lat: 23.0284, lng: 72.4687 },
  { name: "Navrangpura", city: "Ahmedabad", state: "Gujarat", pincode: "380009", lat: 23.0395, lng: 72.5595 },
  { name: "Vastrapur", city: "Ahmedabad", state: "Gujarat", pincode: "380015", lat: 23.0350, lng: 72.5250 },
  { name: "Prahlad Nagar", city: "Ahmedabad", state: "Gujarat", pincode: "380015", lat: 23.0120, lng: 72.5050 },
  { name: "Thaltej", city: "Ahmedabad", state: "Gujarat", pincode: "380059", lat: 23.0508, lng: 72.5025 },
  { name: "Bodakdev", city: "Ahmedabad", state: "Gujarat", pincode: "380054", lat: 23.0440, lng: 72.4950 },
  { name: "Nikol", city: "Ahmedabad", state: "Gujarat", pincode: "380049", lat: 23.0360, lng: 72.6500 },
  { name: "Odhav", city: "Ahmedabad", state: "Gujarat", pincode: "382415", lat: 23.0200, lng: 72.6800 },
  { name: "Naroda", city: "Ahmedabad", state: "Gujarat", pincode: "382330", lat: 23.0800, lng: 72.6500 },
  { name: "Gota", city: "Ahmedabad", state: "Gujarat", pincode: "382481", lat: 23.0900, lng: 72.5300 },
  { name: "Chandkheda", city: "Ahmedabad", state: "Gujarat", pincode: "382424", lat: 23.1063, lng: 72.5850 },
  { name: "Motera", city: "Ahmedabad", state: "Gujarat", pincode: "380005", lat: 23.1000, lng: 72.6000 },
  { name: "Maninagar", city: "Ahmedabad", state: "Gujarat", pincode: "380008", lat: 22.9970, lng: 72.6010 },
  { name: "Paldi", city: "Ahmedabad", state: "Gujarat", pincode: "380007", lat: 23.0150, lng: 72.5750 },
  { name: "Ambawadi", city: "Ahmedabad", state: "Gujarat", pincode: "380015", lat: 23.0320, lng: 72.5580 },
  { name: "Vejalpur", city: "Ahmedabad", state: "Gujarat", pincode: "380051", lat: 23.0000, lng: 72.5300 },
  { name: "Ranip", city: "Ahmedabad", state: "Gujarat", pincode: "382480", lat: 23.0800, lng: 72.5700 },
  { name: "Shahibaug", city: "Ahmedabad", state: "Gujarat", pincode: "380004", lat: 23.0650, lng: 72.5950 },
  { name: "Ghatlodiya", city: "Ahmedabad", state: "Gujarat", pincode: "380061", lat: 23.0780, lng: 72.5350 },
  { name: "Sola", city: "Ahmedabad", state: "Gujarat", pincode: "380060", lat: 23.0700, lng: 72.5200 },
  { name: "Science City", city: "Ahmedabad", state: "Gujarat", pincode: "380060", lat: 23.0850, lng: 72.5050 },
  { name: "SG Highway", city: "Ahmedabad", state: "Gujarat", pincode: "380054", lat: 23.0456, lng: 72.5071 },
  { name: "South Bopal", city: "Ahmedabad", state: "Gujarat", pincode: "380058", lat: 23.0180, lng: 72.4550 },
  { name: "Shela", city: "Ahmedabad", state: "Gujarat", pincode: "380058", lat: 23.0100, lng: 72.4400 },
  { name: "Isanpur", city: "Ahmedabad", state: "Gujarat", pincode: "382443", lat: 22.9800, lng: 72.6200 },
  { name: "Vatva", city: "Ahmedabad", state: "Gujarat", pincode: "382440", lat: 22.9600, lng: 72.6350 },
  { name: "Bapunagar", city: "Ahmedabad", state: "Gujarat", pincode: "380024", lat: 23.0500, lng: 72.6300 },
  { name: "Nava Naroda", city: "Ahmedabad", state: "Gujarat", pincode: "382330", lat: 23.0850, lng: 72.6650 },
  { name: "Chandlodiya", city: "Ahmedabad", state: "Gujarat", pincode: "382481", lat: 23.0720, lng: 72.5450 }
];

const GUJARAT_AREAS = [
  // Surat
  { name: "Adajan", city: "Surat", state: "Gujarat", pincode: "395009", lat: 21.1960, lng: 72.7950 },
  { name: "Vesu", city: "Surat", state: "Gujarat", pincode: "395007", lat: 21.1350, lng: 72.7750 },
  { name: "Varachha", city: "Surat", state: "Gujarat", pincode: "395006", lat: 21.2150, lng: 72.8400 },
  { name: "Katargam", city: "Surat", state: "Gujarat", pincode: "395004", lat: 21.2250, lng: 72.8200 },
  { name: "Piplod", city: "Surat", state: "Gujarat", pincode: "395007", lat: 21.1600, lng: 72.7700 },
  // Vadodara
  { name: "Alkapuri", city: "Vadodara", state: "Gujarat", pincode: "390007", lat: 22.3120, lng: 73.1670 },
  { name: "Gotri", city: "Vadodara", state: "Gujarat", pincode: "390021", lat: 22.3180, lng: 73.1360 },
  { name: "Manjalpur", city: "Vadodara", state: "Gujarat", pincode: "390011", lat: 22.2700, lng: 73.1900 },
  { name: "Karelibaug", city: "Vadodara", state: "Gujarat", pincode: "390018", lat: 22.3250, lng: 73.1950 },
  { name: "Fatehgunj", city: "Vadodara", state: "Gujarat", pincode: "390002", lat: 22.3200, lng: 73.1850 },
  // Rajkot
  { name: "Kalawad Road", city: "Rajkot", state: "Gujarat", pincode: "360005", lat: 22.2850, lng: 70.7700 },
  { name: "150 Feet Ring Road", city: "Rajkot", state: "Gujarat", pincode: "360006", lat: 22.2900, lng: 70.7850 },
  { name: "Yagnik Road", city: "Rajkot", state: "Gujarat", pincode: "360001", lat: 22.3000, lng: 70.8000 },
  // Gandhinagar
  { name: "Sector 6", city: "Gandhinagar", state: "Gujarat", pincode: "382006", lat: 23.2200, lng: 72.6500 },
  { name: "Sector 11", city: "Gandhinagar", state: "Gujarat", pincode: "382011", lat: 23.2250, lng: 72.6400 },
  { name: "Kudasan", city: "Gandhinagar", state: "Gujarat", pincode: "382421", lat: 23.1850, lng: 72.6250 },
  { name: "Sargasan", city: "Gandhinagar", state: "Gujarat", pincode: "382421", lat: 23.1900, lng: 72.6100 },
  // Anand, Bhavnagar, Jamnagar, Junagadh, Mehsana, Nadiad, Vapi, Valsad, Bharuch
  { name: "VV Nagar", city: "Anand", state: "Gujarat", pincode: "388120", lat: 22.5500, lng: 72.9200 },
  { name: "Waghawadi Road", city: "Bhavnagar", state: "Gujarat", pincode: "364002", lat: 21.7600, lng: 72.1500 },
  { name: "Park Colony", city: "Jamnagar", state: "Gujarat", pincode: "361008", lat: 22.4700, lng: 70.0600 },
  { name: "Moti Baug", city: "Junagadh", state: "Gujarat", pincode: "362001", lat: 21.5200, lng: 70.4600 },
  { name: "Radhanpur Road", city: "Mehsana", state: "Gujarat", pincode: "384002", lat: 23.6000, lng: 72.3800 },
  { name: "College Road", city: "Nadiad", state: "Gujarat", pincode: "387001", lat: 22.6900, lng: 72.8600 },
  { name: "GIDC", city: "Vapi", state: "Gujarat", pincode: "396195", lat: 20.3700, lng: 72.9000 },
  { name: "Tithal Road", city: "Valsad", state: "Gujarat", pincode: "396001", lat: 20.6100, lng: 72.9300 },
  { name: "Zadeshwar Road", city: "Bharuch", state: "Gujarat", pincode: "392011", lat: 21.7000, lng: 73.0000 }
];

const REST_INDIA_AREAS = [
  // Mumbai
  { name: "Andheri West", city: "Mumbai", state: "Maharashtra", pincode: "400053", lat: 19.1363, lng: 72.8276 },
  { name: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050", lat: 19.0544, lng: 72.8402 },
  { name: "Thane West", city: "Thane", state: "Maharashtra", pincode: "400601", lat: 19.2183, lng: 72.9781 },
  { name: "Borivali West", city: "Mumbai", state: "Maharashtra", pincode: "400092", lat: 19.2307, lng: 72.8567 },
  { name: "Powai", city: "Mumbai", state: "Maharashtra", pincode: "400076", lat: 19.1176, lng: 72.9060 },
  // Pune
  { name: "Kothrud", city: "Pune", state: "Maharashtra", pincode: "411038", lat: 18.5074, lng: 73.8077 },
  { name: "Viman Nagar", city: "Pune", state: "Maharashtra", pincode: "411014", lat: 18.5679, lng: 73.9143 },
  { name: "Baner", city: "Pune", state: "Maharashtra", pincode: "411045", lat: 18.5590, lng: 73.7868 },
  { name: "Wakad", city: "Pune", state: "Maharashtra", pincode: "411057", lat: 18.5987, lng: 73.7624 },
  // Delhi NCR
  { name: "Connaught Place", city: "New Delhi", state: "Delhi", pincode: "110001", lat: 28.6315, lng: 77.2167 },
  { name: "Saket", city: "New Delhi", state: "Delhi", pincode: "110017", lat: 28.5244, lng: 77.2066 },
  { name: "Dwarka", city: "New Delhi", state: "Delhi", pincode: "110075", lat: 28.5921, lng: 77.0460 },
  { name: "Noida Sector 62", city: "Noida", state: "Uttar Pradesh", pincode: "201309", lat: 28.6219, lng: 77.3639 },
  { name: "DLF Phase 3", city: "Gurugram", state: "Haryana", pincode: "122002", lat: 28.4595, lng: 77.0266 },
  // Bengaluru
  { name: "HSR Layout", city: "Bengaluru", state: "Karnataka", pincode: "560102", lat: 12.9121, lng: 77.6445 },
  { name: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038", lat: 12.9784, lng: 77.6408 },
  { name: "Koramangala", city: "Bengaluru", state: "Karnataka", pincode: "560034", lat: 12.9352, lng: 77.6244 },
  { name: "Whitefield", city: "Bengaluru", state: "Karnataka", pincode: "560066", lat: 12.9698, lng: 77.7500 },
  // Hyderabad
  { name: "Gachibowli", city: "Hyderabad", state: "Telangana", pincode: "500032", lat: 17.4401, lng: 78.3489 },
  { name: "HITEC City", city: "Hyderabad", state: "Telangana", pincode: "500081", lat: 17.4435, lng: 78.3772 },
  { name: "Jubilee Hills", city: "Hyderabad", state: "Telangana", pincode: "500033", lat: 17.4319, lng: 78.4071 },
  // Chennai
  { name: "Velachery", city: "Chennai", state: "Tamil Nadu", pincode: "600042", lat: 12.9815, lng: 80.2180 },
  { name: "Anna Nagar", city: "Chennai", state: "Tamil Nadu", pincode: "600040", lat: 13.0850, lng: 80.2100 },
  // Kolkata
  { name: "Salt Lake", city: "Kolkata", state: "West Bengal", pincode: "700091", lat: 22.5800, lng: 88.4200 },
  { name: "Park Street", city: "Kolkata", state: "West Bengal", pincode: "700016", lat: 22.5500, lng: 88.3500 }
];

// Helper: Seeded offset to create unique nearby GPS points
const getOffset = (idx, key) => {
  const seed = (idx * 7919 + (key === "lat" ? 31337 : 48271)) % 10000;
  return Number(((seed / 10000.0) * 0.04 - 0.02).toFixed(6));
};

async function runSeeding() {
  console.log("🚀 Starting Large Scale Dataset Seeding (1300+ Accounts)...");

  // 1. Fetch categories
  const [catRows] = await pool.query("SELECT id, name FROM categories");
  const categoryMap = {};
  for (let c of catRows) {
    categoryMap[c.name] = c.id;
  }

  const hashedPassword = await bcrypt.hash("password123", 10);
  const PLANS = ["starter", "pro", "enterprise"];
  let addedCount = 0;

  // Function to process a batch of location items
  async function generateBatch(areaPool, totalTarget, startPhonePrefix, batchName) {
    console.log(`\n📍 Processing ${batchName}: Target ${totalTarget} accounts...`);

    for (let i = 0; i < totalTarget; i++) {
      const area = areaPool[i % areaPool.length];
      const isMale = i % 2 === 0;
      const firstName = isMale
        ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length]
        : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
      const surname = SURNAMES[(i * 3 + 7) % SURNAMES.length];
      const fullName = `${firstName} ${surname}`;

      const phone = `${startPhonePrefix}${String(i).padStart(5, "0")}`;
      const email = `user_${batchName.toLowerCase().replace(/\s+/g, "_")}_${i}@quickseva.com`;

      // Check if phone or email already exists
      const [existing] = await pool.query("SELECT id FROM users WHERE phone = ? OR email = ?", [phone, email]);
      if (existing.length > 0) continue;

      const lat = Number((area.lat + getOffset(i, "lat")).toFixed(6));
      const lng = Number((area.lng + getOffset(i, "lng")).toFixed(6));

      // Roles distribution: 50% Seller, 35% Buyer, 15% Contractor
      const roleSelector = i % 20;
      let role = "buyer";
      if (roleSelector < 10) role = "seller";
      else if (roleSelector < 17) role = "buyer";
      else role = "contractor";

      const isContractor = role === "contractor";
      const spec = isContractor ? CONTRACTOR_SPECIALIZATIONS[i % CONTRACTOR_SPECIALIZATIONS.length] : null;

      // 1. Insert into users
      const [userRes] = await pool.query(
        `INSERT INTO users (name, email, phone, gender, password, role, address, city, state, pincode, lat, lng, is_verified, is_active, trade_specialization, is_verified_contractor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
        [
          fullName,
          email,
          phone,
          isMale ? "male" : "female",
          hashedPassword,
          role === "contractor" ? "buyer" : role, // user.role can be buyer/seller/admin; contractors have trade_specialization
          `${area.name}, ${area.city}, ${area.state}`,
          area.city,
          area.state,
          area.pincode,
          lat,
          lng,
          spec,
          isContractor ? 1 : 0
        ]
      );
      const userId = userRes.insertId;

      // 2. Create Wallet
      const initBalance = 100 + ((i * 37) % 500);
      await pool.query("INSERT INTO wallets (user_id, balance) VALUES (?, ?)", [userId, initBalance]);

      // 3. If Seller -> Insert Seller Profile & Services
      if (role === "seller") {
        const catObj = CATEGORIES[i % CATEGORIES.length];
        const catId = categoryMap[catObj.name] || 1;
        const rating = Number((4.2 + (i % 8) * 0.1).toFixed(1));
        const reviews = 25 + ((i * 19) % 300);
        const isPremium = i % 5 === 0;
        const plan = isPremium ? PLANS[i % PLANS.length] : null;

        const [sellerRes] = await pool.query(
          `INSERT INTO sellers (
            user_id, business_name, category_id, bio, experience_yrs, avg_rating, total_reviews,
            is_verified, is_available, working_radius, latitude, longitude, lat, lng, location_address,
            service_radius, profile_completed, service_mode, instant_service, is_premium, plan, phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 15, ?, ?, ?, ?, ?, 15, 1, 'both', ?, ?, ?, ?)`,
          [
            userId,
            `${surname} ${catObj.label} (${area.name})`,
            catId,
            `Professional ${catObj.name.toLowerCase()} expert with 5+ years of verified service in ${area.name}, ${area.city}.`,
            3 + (i % 12),
            rating,
            reviews,
            lat,
            lng,
            lat,
            lng,
            `${area.name}, ${area.city}, ${area.state}`,
            i % 3 === 0 ? 1 : 0,
            isPremium ? 1 : 0,
            plan,
            phone
          ]
        );
        const sellerId = sellerRes.insertId;

        // Link seller_categories
        await pool.query("INSERT IGNORE INTO seller_categories (seller_id, category_id) VALUES (?, ?)", [sellerId, catId]);

        // Add 2 services per seller
        await pool.query(
          `INSERT INTO services (seller_id, category_id, title, description, price, duration, is_active, is_instant)
           VALUES (?, ?, ?, ?, ?, '1-2 Hours', 1, ?)`,
          [
            sellerId,
            catId,
            `Standard ${catObj.name} Service in ${area.name}`,
            `Complete top-quality ${catObj.name.toLowerCase()} service with satisfaction guarantee.`,
            299 + ((i * 50) % 1500),
            i % 3 === 0 ? 1 : 0
          ]
        );

        await pool.query(
          `INSERT INTO services (seller_id, category_id, title, description, price, duration, is_active, is_instant)
           VALUES (?, ?, ?, ?, ?, '2-3 Hours', 1, 0)`,
          [
            sellerId,
            catId,
            `Premium ${catObj.name} Deep Inspection & Repair`,
            `Advanced deep inspection and full repair service by certified technicians.`,
            799 + ((i * 100) % 2500)
          ]
        );
      }

      // 4. If Contractor -> Create demo contractor post for demand/work
      if (isContractor && i % 3 === 0) {
        await pool.query(
          `INSERT INTO contractor_posts (
            contractor_id, post_type, title, company_name, contact_name, contact_phone, whatsapp_phone,
            site_address, city, state, pincode, start_date, end_date, amenities, description, status
          ) VALUES (?, 'demand_workers', ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-09-01', '2026-09-15', '["Food","Accommodation / Stay"]', ?, 'open')`,
          [
            userId,
            `Need 5 Workers for ${spec} Project in ${area.city}`,
            `${surname} Constructions`,
            fullName,
            phone,
            phone,
            `${area.name}, ${area.city}`,
            area.city,
            area.state,
            area.pincode,
            `Looking for skilled workers for an ongoing ${spec} project in ${area.name}, ${area.city}. Good daily pay + food.`
          ]
        );
      }

      addedCount++;
    }
  }

  // Generate 500 in Ahmedabad
  await generateBatch(AHMEDABAD_AREAS, 500, "98250", "Ahmedabad");

  // Generate 300 in Rest of Gujarat
  await generateBatch(GUJARAT_AREAS, 300, "98980", "Gujarat");

  // Generate 500 in Rest of India
  await generateBatch(REST_INDIA_AREAS, 500, "98100", "India");

  console.log(`\n🎉 SUCCESSFULLY ADDED ${addedCount} REALISTIC ACCOUNTS!`);
  const [[{ userTotal }]] = await pool.query("SELECT COUNT(*) as userTotal FROM users");
  const [[{ sellerTotal }]] = await pool.query("SELECT COUNT(*) as sellerTotal FROM sellers");
  console.log(`📊 TOTAL USERS IN DB: ${userTotal}`);
  console.log(`📊 TOTAL SELLERS IN DB: ${sellerTotal}`);
  process.exit(0);
}

runSeeding().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
