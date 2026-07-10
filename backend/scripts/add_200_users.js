const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

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

const buyerFirstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya",
  "Diya", "Ananya", "Aadhya", "Pihu", "Khushi", "Saanvi", "Shruti", "Kavya", "Riya", "Aanya",
  "Rahul", "Amit", "Sanjay", "Vijay", "Rajesh", "Ramesh", "Deepak", "Anil", "Sunil", "Alok"
];

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

const seededOffset = (index, axis) => {
  const raw = ((index * (axis === "lat" ? 37 : 53)) % 2001) / 1000 - 1;
  return Number((raw * 0.01).toFixed(5));
};

async function getMaxIndex() {
  const [users] = await pool.query("SELECT email FROM users WHERE role IN ('buyer', 'seller')");
  let maxBuyerIndex = -1;
  let maxSellerIndex = -1;
  for (let u of users) {
    const buyerMatch = u.email.match(/^buyer(\d+)@/);
    if (buyerMatch) {
      const idx = parseInt(buyerMatch[1], 10);
      if (idx > maxBuyerIndex) maxBuyerIndex = idx;
    }
    const sellerMatch = u.email.match(/^seller(\d+)@/);
    if (sellerMatch) {
      const idx = parseInt(sellerMatch[1], 10);
      if (idx > maxSellerIndex) maxSellerIndex = idx;
    }
  }
  return { maxBuyerIndex, maxSellerIndex };
}

async function run() {
  try {
    const { maxBuyerIndex, maxSellerIndex } = await getMaxIndex();
    console.log(`Current highest buyer index: ${maxBuyerIndex}`);
    console.log(`Current highest seller index: ${maxSellerIndex}`);

    const startBuyerIndex = maxBuyerIndex + 1;
    const startSellerIndex = maxSellerIndex + 1;

    console.log(`Starting to seed buyers from index ${startBuyerIndex} to ${startBuyerIndex + 199}`);
    console.log(`Starting to seed sellers from index ${startSellerIndex} to ${startSellerIndex + 199}`);

    // Get categories mapping to get their IDs
    const [cats] = await pool.query("SELECT id, name FROM categories");
    const categoryMap = {};
    for (let c of cats) {
      categoryMap[c.name] = c.id;
    }

    const hashedPassword = await bcrypt.hash("password123", 12);
    const buyerGenders = ["male", "female"];

    // 1. Seed 200 Buyers
    for (let i = 0; i < 200; i++) {
      const index = startBuyerIndex + i;
      const area = AREAS[index % AREAS.length];
      const firstName = buyerFirstNames[index % buyerFirstNames.length];
      const surname = SURNAMES[index % SURNAMES.length];
      const gender = buyerGenders[index % buyerGenders.length];
      const dob = `199${index % 10}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`;

      const lat = Number((area.lat + seededOffset(index + 200, "lat")).toFixed(6));
      const lng = Number((area.lng + seededOffset(index + 200, "lng")).toFixed(6));
      const phone = "8" + String(index).padStart(9, '0');
      const email = `buyer${index}@quickseva.com`;

      const [userRes] = await pool.query(
        `INSERT INTO users (name, email, phone, gender, dob, password, role, address, city, state, pincode, lat, lng, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'buyer', ?, 'Ahmedabad', 'Gujarat', '380001', ?, ?, 1, 1)`,
        [
          `${firstName} ${surname}`,
          email,
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

    // 2. Seed 200 Sellers
    for (let i = 0; i < 200; i++) {
      const index = startSellerIndex + i;
      const area = AREAS[index % AREAS.length];
      const service = SERVICES[index % SERVICES.length];
      const surname = SURNAMES[index % SURNAMES.length];
      const isPremium = index % 10 < 3;
      const plan = isPremium ? PLANS[index % PLANS.length] : null;

      const lat = Number((area.lat + seededOffset(index, "lat")).toFixed(6));
      const lng = Number((area.lng + seededOffset(index, "lng")).toFixed(6));

      const rating = Number((4.3 + (index % 7) * 0.1).toFixed(1));
      const reviews = 50 + ((index * 37) % 250);
      const phone = "9" + String(index).padStart(9, '0');
      const email = `seller${index}@quickseva.com`;

      // Create User
      const [userRes] = await pool.query(
        `INSERT INTO users (name, email, phone, password, role, address, city, state, lat, lng, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'Ahmedabad', 'Gujarat', ?, ?, 1, 1)`,
        [
          `${surname} ${SERVICE_LABELS[service]} Owner`,
          email,
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

      const categoryId = categoryMap[service];
      if (!categoryId) {
        continue;
      }

      const serviceMode = index % 3 === 0 ? "online" : index % 3 === 1 ? "offline" : "both";
      const instantService = index % 4 === 0;

      // Create Seller
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

    console.log("✅ Successfully added 200 more buyers and 200 more sellers!");
  } catch (err) {
    console.error("❌ Seeding additional users failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
