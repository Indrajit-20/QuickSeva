const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

const REAL_CONTRACTORS = [
  // 🎨 PAINTING CONTRACTORS
  { name: "Rajesh Sharma", company: "Apex Painting & Decorators", trade: "Painting Contractor", city: "Mumbai", phone: "9820011001", address: "Andheri West, Mumbai, Maharashtra", bio: "Over 12 years of experience in residential 3BHK interior painting, texture coats, and exterior waterproof painting contracts." },
  { name: "Santosh Patil", company: "Mahalaxmi Painting Works", trade: "Painting Contractor", city: "Pune", phone: "9820011002", address: "Kothrud, Pune, Maharashtra", bio: "Specialist in Asian Paints Royale finish, wallpaper installation, and waterproofing for societies." },
  { name: "Amit Verma", company: "Verma Colors & Waterproofing", trade: "Painting Contractor", city: "Delhi", phone: "9820011003", address: "Lajpat Nagar, New Delhi", bio: "Commercial & residential painting contractor handling turnkey painting projects for flats and offices." },
  { name: "Kiran Gowda", company: "Royal Finishes & Painters", trade: "Painting Contractor", city: "Bengaluru", phone: "9820011004", address: "Koramangala, Bengaluru, Karnataka", bio: "Premium interior texture, stencil designs, and anti-dampness painting solutions." },
  { name: "Venkat Reddy", company: "Sri Balaji Painting Services", trade: "Painting Contractor", city: "Hyderabad", phone: "9820011005", address: "Banjara Hills, Hyderabad, Telangana", bio: "Turnkey painting contractors with a team of 15 skilled painters for fast project completion." },

  // 🏗️ CIVIL & MASONRY CONTRACTORS
  { name: "Sunil Deshmukh", company: "Deshmukh Civil & Construction Co.", trade: "Civil & Masonry Contractor", city: "Mumbai", phone: "9820011006", address: "Dadar East, Mumbai, Maharashtra", bio: "Civil renovation, structural repairs, slab casting, and complete brickwork masonry contracts." },
  { name: "Ramesh Pawar", company: "Pawar Construction & Masonry", trade: "Civil & Masonry Contractor", city: "Pune", phone: "9820011007", address: "Hadapsar, Pune, Maharashtra", bio: "Industrial & residential civil contractors with masons and labor teams." },
  { name: "Mahesh Yadav", company: "Yadav Civil Infra Solutions", trade: "Civil & Masonry Contractor", city: "Delhi", phone: "9820011008", address: "Dwarka Sector 10, New Delhi", bio: "Villa construction, house expansion, masonry wall plastering, and RCC work." },
  { name: "Suresh Rao", company: "Rao Structural & Civil Works", trade: "Civil & Masonry Contractor", city: "Bengaluru", phone: "9820011009", address: "Whitefield, Bengaluru, Karnataka", bio: "Civil foundation, plastering, concrete works, and house remodeling." },
  { name: "Pravin Kulkarni", company: "Kulkarni Builders & Masons", trade: "Civil & Masonry Contractor", city: "Thane", phone: "9820011010", address: "Ghodbunder Road, Thane West", bio: "Turnkey home renovation, plaster repair, and structural masonry work." },

  // ⚡ ELECTRICAL CONTRACTORS
  { name: "Vijay Kumar", company: "Vijay Electrical Site Contracting", trade: "Electrical Site Contractor", city: "Mumbai", phone: "9820011011", address: "Borivali West, Mumbai, Maharashtra", bio: "Licensed electrical contractor for DB box setup, commercial wiring, and LED panel lighting." },
  { name: "Dinesh Joshi", company: "Joshi Electricals & Wiring", trade: "Electrical Site Contractor", city: "Pune", phone: "9820011012", address: "Viman Nagar, Pune, Maharashtra", bio: "Complete house concealed wiring, earthing, generator connection, and switchboard fittings." },
  { name: "Manoj Singh", company: "National Electrical Solutions", trade: "Electrical Site Contractor", city: "Delhi", phone: "9820011013", address: "Rohini Sector 7, New Delhi", bio: "3-Phase industrial wiring, transformer installation, and high-tension electrical contracting." },
  { name: "Rohan Nair", company: "Nair Power & Electricals", trade: "Electrical Site Contractor", city: "Bengaluru", phone: "9820011014", address: "Indiranagar, Bengaluru, Karnataka", bio: "Smart home automation wiring, inverter backup installation, and circuit breaker panels." },
  { name: "Srinivas Rao", company: "Sri Rama Electrical Works", trade: "Electrical Site Contractor", city: "Hyderabad", phone: "9820011015", address: "Madhapur, Hyderabad, Telangana", bio: "Commercial office space wiring and residential electrical maintenance contracts." },

  // 🚰 PLUMBING & SANITARY CONTRACTORS
  { name: "Ganesh Kadam", company: "Kadam Plumbing & Pipe Fitting", trade: "Plumbing & Piping Contractor", city: "Mumbai", phone: "9820011016", address: "Thane West, Maharashtra", bio: "CPVC & UPVC pipe fittings, bathroom sanitaryware installation, and drainage system repair." },
  { name: "Anand Shinde", company: "Shinde Sanitary & Plumbing", trade: "Plumbing & Piping Contractor", city: "Pune", phone: "9820011017", address: "Baner, Pune, Maharashtra", bio: "Water pump installation, overhead tank fitting, and leakage fixing specialists." },
  { name: "Pankaj Saxena", company: "Saxena Plumbing Contracts", trade: "Plumbing & Piping Contractor", city: "Delhi", phone: "9820011018", address: "Janakpuri, New Delhi", bio: "Turnkey plumbing contractor for high-rise residential buildings and individual villas." },
  { name: "Baskar Pillai", company: "Pillai Plumbing Solutions", trade: "Plumbing & Piping Contractor", city: "Bengaluru", phone: "9820011019", address: "HSR Layout, Bengaluru, Karnataka", bio: "Solar water heater plumbing, concealed shower fittings, and pipeline repairs." },
  { name: "Mohan Reddy", company: "Reddy Plumbing & Drainage", trade: "Plumbing & Piping Contractor", city: "Hyderabad", phone: "9820011020", address: "Gachibowli, Hyderabad, Telangana", bio: "Drainage pipeline laying, sewer block clearance, and bathroom fixture installation." },

  // 🪚 CARPENTRY & WOODWORK CONTRACTORS
  { name: "Deepak Suthar", company: "Suthar Modular Kitchen & Woodwork", trade: "Carpentry & Modular Work", city: "Mumbai", phone: "9820011021", address: "Goregaon East, Mumbai, Maharashtra", bio: "Custom modular kitchen, wardrobe fabrication, TV unit, and teak wood door carpentry." },
  { name: "Kailash Jangid", company: "Jangid Furniture & Interiors", trade: "Carpentry & Modular Work", city: "Pune", phone: "9820011022", address: "Wakad, Pune, Maharashtra", bio: "Plywood wardrobe, veneer polishing, false ceiling woodwork, and bed frame fabrication." },
  { name: "Suraj Carpenter", company: "Suraj Woodcraft Contractors", trade: "Carpentry & Modular Work", city: "Delhi", phone: "9820011023", address: "Mayur Vihar, New Delhi", bio: "Complete wooden interior contracts, door frame fitting, and laminate installation." },

  // 🧱 TILES & MARBLE FLOORING CONTRACTORS
  { name: "Suresh Marble", company: "Suresh Tiles & Flooring Specialist", trade: "Tile, Marble & Granite", city: "Mumbai", phone: "9820011024", address: "Malad West, Mumbai, Maharashtra", bio: "Italian marble polishing, vitrified tile laying, epoxy grouting, and granite kitchen platform installation." },
  { name: "Ramesh Choudhary", company: "Choudhary Flooring & Tiles", trade: "Tile, Marble & Granite", city: "Pune", phone: "9820011025", address: "Pimple Saudagar, Pune, Maharashtra", bio: "Bathroom tile fitting, outdoor paver blocks, and Kota stone flooring contracts." },
  { name: "Vikram Rathore", company: "Rathore Marble & Tile Works", trade: "Tile, Marble & Granite", city: "Bengaluru", phone: "9820011026", address: "Electronic City, Bengaluru, Karnataka", bio: "Precision tile cutting, wall dado tiles, and marble floor honing & mirror polish." },

  // ❄️ HVAC & AIR CONDITIONING CONTRACTORS
  { name: "Imran Khan", company: "CoolTech HVAC & Ducting Contracts", trade: "HVAC & Commercial AC Work", city: "Mumbai", phone: "9820011027", address: "Kurla West, Mumbai, Maharashtra", bio: "VRF/VRV central AC system installation, copper piping, ducting, and cassette AC fitting." },
  { name: "Sameer Shaikh", company: "Shaikh Air Conditioning Services", trade: "HVAC & Commercial AC Work", city: "Pune", phone: "9820011028", address: "Camp, Pune, Maharashtra", bio: "Commercial chiller plants, cassette AC, and split AC copper piping contracts." },

  // ☔ WATERPROOFING CONTRACTORS
  { name: "Nitin More", company: "Kavya Waterproofing Specialists", trade: "Waterproofing & Damp Proofing", city: "Mumbai", phone: "9820011029", address: "Chembur, Mumbai, Maharashtra", bio: "Terrace brickbat coba, polyurethane coating, basement waterproofing, and wall leakage injection." },
  { name: "Prashant Jadhav", company: "Jadhav Terrace & Wall Proofing", trade: "Waterproofing & Damp Proofing", city: "Pune", phone: "9820011030", address: "Karve Nagar, Pune, Maharashtra", bio: "Dr. Fixit certified terrace waterproofing, bathroom floor membrane, and parapet wall sealant." },

  // 🏢 MULTI-SKILLED GENERAL CONTRACTORS
  { name: "Rajendra Thorat", company: "Mahalaxmi Multi-Trade Builders", trade: "Turnkey General Contractor", city: "Mumbai", phone: "9820011031", address: "Vashi, Navi Mumbai, Maharashtra", bio: "Turnkey home & commercial office renovation handling civil, electrical, plumbing, painting, and woodwork." },
  { name: "Prakash Hegde", company: "Hegde Construction & Renovation", trade: "Turnkey General Contractor", city: "Bengaluru", phone: "9820011032", address: "Jayanagar, Bengaluru, Karnataka", bio: "End-to-end villa construction and commercial interior renovation contracts." },
];

const REAL_QUOTE_LEADS = [
  // Painting Leads
  { service_type: "Painting Contractor", customer_name: "Dr. Arvind Kulkarni", customer_phone: "9870011221", city: "Mumbai", notes: "Need complete interior painting for 3BHK flat (1400 sq.ft) with Asian Paints Royale & 1 wall texture design in living room." },
  { service_type: "Painting Contractor", customer_name: "Sunita Deshmukh", customer_phone: "9870011222", city: "Pune", notes: "Looking for reliable painting contractor for 2BHK flat repainting before Diwali. Plastic emulsion paint preferred." },
  { service_type: "Painting Contractor", customer_name: "Vikram Malhotra", customer_phone: "9870011223", city: "Delhi", notes: "Exterior building waterproof paint contract for 4-story bungalow in Lajpat Nagar." },
  { service_type: "Painting Contractor", customer_name: "Priya Nair", customer_phone: "9870011224", city: "Bengaluru", notes: "Interior repainting for 3BHK flat in Koramangala. Requires damp-proof primer coat on 2 bedroom walls." },
  { service_type: "Painting Contractor", customer_name: "Sanjay Patel", customer_phone: "9870011225", city: "Mumbai", notes: "Commercial showroom interior painting 800 sq.ft in Andheri West. Quick 3-day turnaround required." },

  // Civil & Masonry Leads
  { service_type: "Civil & Masonry Contractor", customer_name: "Rajesh Gupta", customer_phone: "9870011226", city: "Mumbai", notes: "Need experienced civil masons for kitchen wall demolition, new brick partition wall, and plastering work." },
  { service_type: "Civil & Masonry Contractor", customer_name: "Anand Kulkarni", customer_phone: "9870011227", city: "Pune", notes: "Terrace parapet wall brickwork and plastering contract in Kothrud society." },
  { service_type: "Civil & Masonry Contractor", customer_name: "Meenakshi Sundaram", customer_phone: "9870011228", city: "Bengaluru", notes: "Villa compound wall construction 60 running feet with foundation & RCC columns in Whitefield." },

  // Electrical Leads
  { service_type: "Electrical Site Contractor", customer_name: "Karan Johar", customer_phone: "9870011229", city: "Mumbai", notes: "Concealed electrical wiring for 2500 sq.ft commercial office space in BKC. Main DB box & MCB setup." },
  { service_type: "Electrical Site Contractor", customer_name: "Smita Shah", customer_phone: "9870011230", city: "Pune", notes: "Complete rewiring for 30-year-old 2BHK flat in Deccan Gymkhana. Modular switchboards & earthing required." },

  // Plumbing Leads
  { service_type: "Plumbing & Piping Contractor", customer_name: "Rohan Mehta", customer_phone: "9870011231", city: "Mumbai", notes: "Complete bathroom plumbing renovation. CPVC internal piping, wall mixer installation, and concealed flush tank." },
  { service_type: "Plumbing & Piping Contractor", customer_name: "Geeta Rao", customer_phone: "9870011232", city: "Hyderabad", notes: "Terrace water tank pipeline replacement & pressure pump fitting for 3-story house." },

  // Carpentry Leads
  { service_type: "Carpentry & Modular Work", customer_name: "Deepali Joshi", customer_phone: "9870011233", city: "Pune", notes: "Custom acrylic modular kitchen with Blum tandem drawers & 2 floor-to-ceiling wardrobes in Wakad." },
  { service_type: "Carpentry & Modular Work", customer_name: "Amitabh Roy", customer_phone: "9870011234", city: "Mumbai", notes: "Teak wood main door fabrication, door frame fitting, and veneer polishing for new flat in Malad." },

  // Tile & Flooring Leads
  { service_type: "Tile, Marble & Granite", customer_name: "Nitin Gadkari", customer_phone: "9870011235", city: "Mumbai", notes: "1200 sq.ft vitrified tile floor laying (80x80 cm tiles) & granite kitchen counter slab cutting/fitting." },
  { service_type: "Tile, Marble & Granite", customer_name: "Pooja Hegde", customer_phone: "9870011236", city: "Bengaluru", notes: "Bathroom wall dado tiles & Italian marble floor polishing in HSR Layout villa." },

  // HVAC Leads
  { service_type: "HVAC & Commercial AC Work", customer_name: "Rahul Bajaj", customer_phone: "9870011237", city: "Mumbai", notes: "Ductable AC copper piping & cassette unit installation for 3000 sq.ft restaurant in Lower Parel." },

  // Waterproofing Leads
  { service_type: "Waterproofing & Damp Proofing", customer_name: "Suresh Prabhu", customer_phone: "9870011238", city: "Thane", notes: "2500 sq.ft terrace brickbat coba waterproofing & elastomeric coating before monsoon season." },
];

const REAL_SITE_POSTS = [
  {
    title: "Need 8 Experienced Painters for 4-Story Residential Building",
    company_name: "Apex Painting & Decorators",
    contact_name: "Rajesh Sharma",
    contact_phone: "9820011001",
    site_address: "SV Road, Near Station, Andheri West",
    city: "Mumbai",
    start_date: "2026-08-25",
    end_date: "2026-09-15",
    amenities: ["Food 🍱", "Stay 🛖", "Travel 🚌"],
    description: "High-rise exterior painting contract. Safety belts and scaffolding provided. Daily wage ₹850/day + food allowance.",
    requirements: [
      { role_title: "Master Painter", quantity: 4, wage_amount: 950, wage_type: "per_day", skills_required: "Exterior spray painting & texture work" },
      { role_title: "Helper Painter", quantity: 4, wage_amount: 700, wage_type: "per_day", skills_required: "Sanding, masking tape & primer application" },
    ],
  },
  {
    title: "Civil Masons & Labor Team Needed for Villa Foundation & Brickwork",
    company_name: "Deshmukh Civil & Construction Co.",
    contact_name: "Sunil Deshmukh",
    contact_phone: "9820011006",
    site_address: "Ghodbunder Road, Near Hypercity",
    city: "Thane",
    start_date: "2026-08-22",
    end_date: "2026-10-10",
    amenities: ["Stay 🛖", "Safety Kit 🪖", "Overtime ⏰"],
    description: "Villa construction site. Mason team needed for red brick masonry wall construction and plastering.",
    requirements: [
      { role_title: "Head Mason (Karigar)", quantity: 3, wage_amount: 1100, wage_type: "per_day", skills_required: "Bricklaying, plumb line, plastering" },
      { role_title: "Civil Helper (Beldar)", quantity: 6, wage_amount: 750, wage_type: "per_day", skills_required: "Mortar mixing, brick carrying" },
    ],
  },
  {
    title: "Licensed Electricians Required for Commercial Office DB Box Wiring",
    company_name: "Vijay Electrical Site Contracting",
    contact_name: "Vijay Kumar",
    contact_phone: "9820011011",
    site_address: "BKC G-Block, Bandra East",
    city: "Mumbai",
    start_date: "2026-08-20",
    end_date: "2026-09-05",
    amenities: ["Food 🍱", "Safety Kit 🪖"],
    description: "Commercial IT office wiring contract. Concealed cable tray laying, MCB DB box dressing, and LED panel light fitting.",
    requirements: [
      { role_title: "Electrician (ITI Certified)", quantity: 5, wage_amount: 1000, wage_type: "per_day", skills_required: "DB dressing, conduit wiring, testing" },
    ],
  },
];

async function seedContractorsAndLeads() {
  console.log("🚀 Starting Real Contractor & Lead Data Seeding...");
  const conn = await pool.getConnection();

  try {
    // Ensure bio and pincode columns exist on users table
    try {
      await conn.query("ALTER TABLE users ADD COLUMN bio TEXT NULL");
    } catch (e) {}
    try {
      await conn.query("ALTER TABLE users ADD COLUMN pincode VARCHAR(10) NULL");
    } catch (e) {}

    await conn.beginTransaction();

    const hashedPassword = await bcrypt.hash("Password@123", 10);
    const contractorUserIds = [];

    // 1. Seed Contractors into users table
    console.log(`📦 Seeding ${REAL_CONTRACTORS.length} Real Contractor Accounts...`);
    for (const c of REAL_CONTRACTORS) {
      // Check if phone exists
      const [existing] = await conn.query("SELECT id FROM users WHERE phone = ?", [c.phone]);

      let userId;
      if (existing.length > 0) {
        userId = existing[0].id;
        await conn.query(
          `UPDATE users SET 
            name = ?, company_name = ?, trade_specialization = ?, role = 'contractor', 
            city = ?, address = ?, bio = ?, is_verified_contractor = 1, is_active = 1
           WHERE id = ?`,
          [c.name, c.company, c.trade, c.city, c.address, c.bio, userId]
        );
      } else {
        const [res] = await conn.query(
          `INSERT INTO users (name, company_name, trade_specialization, role, phone, password, city, address, bio, is_verified_contractor, is_active)
           VALUES (?, ?, ?, 'contractor', ?, ?, ?, ?, ?, 1, 1)`,
          [c.name, c.company, c.trade, c.phone, hashedPassword, c.city, c.address, c.bio]
        );
        userId = res.insertId;
      }
      contractorUserIds.push({ id: userId, city: c.city, trade: c.trade });
    }

    console.log(`✅ ${REAL_CONTRACTORS.length} Contractor Accounts active in database.`);

    // 2. Seed Customer Quote Leads (distribute evenly across contractors & general leads)
    console.log(`📩 Seeding ${REAL_QUOTE_LEADS.length} Realistic Customer Quote Leads...`);
    for (let i = 0; i < REAL_QUOTE_LEADS.length; i++) {
      const q = REAL_QUOTE_LEADS[i];
      // Assign to matching contractor or assign general (null)
      const targetContractor = contractorUserIds[i % contractorUserIds.length];

      await conn.query(
        `INSERT INTO contractor_quote_requests (contractor_id, customer_name, customer_phone, city, service_type, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          targetContractor ? targetContractor.id : null,
          q.customer_name,
          q.customer_phone,
          q.city,
          q.service_type,
          q.notes,
          i % 3 === 0 ? "contacted" : i % 5 === 0 ? "completed" : "pending",
        ]
      );
    }

    console.log(`✅ ${REAL_QUOTE_LEADS.length} Customer Quote Leads seeded.`);

    // 3. Seed Contractor Work Site Requirements
    console.log(`🏗️ Seeding ${REAL_SITE_POSTS.length} Work Site Labor Requirement Posts...`);
    for (const post of REAL_SITE_POSTS) {
      // Find contractor ID by phone
      const [uRows] = await conn.query("SELECT id FROM users WHERE phone = ?", [post.contact_phone]);
      const contractorId = uRows[0]?.id || null;

      const [pRes] = await conn.query(
        `INSERT INTO contractor_posts 
          (contractor_id, post_type, title, company_name, contact_name, contact_phone, whatsapp_phone, site_address, city, start_date, end_date, amenities, description, status, is_featured)
         VALUES (?, 'demand_workers', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1)`,
        [
          contractorId,
          post.title,
          post.company_name,
          post.contact_name,
          post.contact_phone,
          post.contact_phone,
          post.site_address,
          post.city,
          post.start_date,
          post.end_date,
          JSON.stringify(post.amenities),
          post.description,
        ]
      );

      const postId = pRes.insertId;

      for (const req of post.requirements) {
        await conn.query(
          `INSERT INTO contractor_post_requirements (post_id, role_title, quantity, wage_amount, wage_type, skills_required)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [postId, req.role_title, req.quantity, req.wage_amount, req.wage_type, req.skills_required]
        );
      }
    }

    await conn.commit();
    console.log("🎉 Database seeding completed successfully! All real contractor data, customer quote leads, and site posts are live.");
  } catch (err) {
    await conn.rollback();
    console.error("❌ Seeding failed:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedContractorsAndLeads();
