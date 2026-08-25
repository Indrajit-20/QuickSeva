// Central Indian States & Cities Master Dataset for QuickSeva
// Includes 28 States & UTs with major commercial & residential hubs

export const INDIAN_LOCATIONS_MASTER = {
  "Maharashtra": [
    "Mumbai", "Pune", "Thane", "Navi Mumbai", "Nagpur", "Nashik", "Aurangabad", 
    "Solapur", "Kolhapur", "Amravati", "Nanded", "Sangli", "Jalgaon", "Akola"
  ],
  "Gujarat": [
    "Kalol", "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", 
    "Gandhinagar", "Junagadh", "Anand", "Navsari", "Morbi", "Bharuch"
  ],
  "Delhi NCR": [
    "New Delhi", "Delhi", "Noida", "Greater Noida", "Gurugram", "Ghaziabad", "Faridabad"
  ],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", 
    "Davangere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", 
    "Tiruppur", "Erode", "Vellore", "Tirunelveli", "Thanjavur"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Kharagpur"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", 
    "Noida", "Ghaziabad", "Bareilly", "Aligarh", "Moradabad", "Gorakhpur"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Chandigarh"
  ],
  "Haryana": [
    "Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Panchkula"
  ],
  "Kerala": [
    "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Nainital"
  ],
  "Himachal Pradesh": [
    "Shimla", "Dharamshala", "Solan", "Mandi", "Kullu"
  ],
  "Goa": [
    "Panaji", "Margao", "Vasco da Gama", "Mapusa"
  ],
  "Jammu & Kashmir": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"
  ]
};

// Helper: List all available states
export function getIndianStates() {
  return Object.keys(INDIAN_LOCATIONS_MASTER);
}

// Helper: Get cities for a specified state
export function getCitiesForState(stateName) {
  if (!stateName || stateName === "All States" || stateName === "All India") {
    const allCities = Object.values(INDIAN_LOCATIONS_MASTER).flat();
    return ["All Cities", ...new Set(allCities)];
  }
  const stateCities = INDIAN_LOCATIONS_MASTER[stateName] || [];
  return [`All Cities (${stateName})`, ...stateCities];
}
