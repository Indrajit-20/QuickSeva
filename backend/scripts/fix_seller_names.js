const { pool } = require("../config/db");

const PREFIXES = [
  "Shree Ganesh", "Royal", "Apex", "Reliable", "Star", "Express", "Urban", "Prime",
  "Rapid", "Golden", "Om Sai", "Master", "Quick", "Smart", "National", "Elite",
  "Pro", "Super", "Clean & Shine", "Care", "Ultra", "Max", "Metro", "Classic",
  "Everest", "Supreme", "Silver", "Diamond", "Vanguard", "Pioneer", "Bright",
  "Precision", "Zenith", "Trust", "Active", "Direct", "First Choice", "Ideal",
  "Global", "Shakti", "Mahadev", "Balaji", "Krishna", "Sunrise", "Pacific"
];

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna",
  "Ishaan", "Shaurya", "Rohan", "Dev", "Kabir", "Anay", "Dhairya", "Karan", "Yash",
  "Pritesh", "Amit", "Rajesh", "Suresh", "Ramesh", "Prakash", "Sanjay", "Vijay",
  "Manish", "Sunil", "Deepak", "Anil", "Vikram", "Rahul", "Gautam", "Alok", "Sameer"
];

const SURNAMES = [
  "Sharma", "Patel", "Mehta", "Shah", "Modi", "Joshi", "Kapoor", "Trivedi", "Desai",
  "Panchal", "Raval", "Soni", "Vyas", "Thakkar", "Parikh", "Bhatt", "Chauhan", "Dave",
  "Mistry", "Solanki", "Rathod", "Jadeja", "Gohil", "Chavda", "Makwana", "Vaghela"
];

const CATEGORY_NAMES = {
  1: "Cleaning",
  2: "Electricals",
  3: "Plumbers",
  4: "Carpentry",
  5: "AC Experts",
  6: "Pest Control",
  7: "Home Painters",
  8: "Appliance Repair"
};

async function fixSellerNames() {
  try {
    const [sellers] = await pool.query(
      `SELECT s.id, s.category_id, s.location_address, u.name AS userName 
       FROM sellers s 
       JOIN users u ON s.user_id = u.id`
    );

    console.log(`Updating ${sellers.length} sellers with unique business names...`);

    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const prefix = PREFIXES[i % PREFIXES.length];
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const surname = SURNAMES[i % SURNAMES.length];
      const catLabel = CATEGORY_NAMES[seller.category_id] || "Services";

      let area = "";
      if (seller.location_address) {
        area = seller.location_address.split(",")[0].trim();
      }

      let uniqueBusinessName = "";
      if (i % 3 === 0) {
        uniqueBusinessName = `${prefix} ${catLabel} ${area ? `(${area})` : ""}`.trim();
      } else if (i % 3 === 1) {
        uniqueBusinessName = `${firstName} ${surname} ${catLabel}`.trim();
      } else {
        uniqueBusinessName = `${surname} & Sons ${catLabel} ${area ? `- ${area}` : ""}`.trim();
      }

      const ownerFullName = `${firstName} ${surname}`;

      await pool.query(
        `UPDATE sellers SET business_name = ? WHERE id = ?`,
        [uniqueBusinessName, seller.id]
      );

      await pool.query(
        `UPDATE users u JOIN sellers s ON s.user_id = u.id SET u.name = ? WHERE s.id = ?`,
        [ownerFullName, seller.id]
      );
    }

    console.log("✅ Successfully updated all seller business names and owner names!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating seller names:", err);
    process.exit(1);
  }
}

fixSellerNames();
