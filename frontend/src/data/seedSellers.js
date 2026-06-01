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
  "Sharma",
  "Patel",
  "Mehta",
  "Shah",
  "Modi",
  "Joshi",
  "Kapoor",
  "Trivedi",
  "Desai",
  "Panchal",
  "Raval",
  "Soni",
  "Vyas",
  "Thakkar",
  "Parikh",
  "Bhatt",
  "Chauhan",
  "Dave",
  "Mistry",
  "Solanki",
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

const createSeller = (index) => {
  const area = AREAS[index % AREAS.length];
  const service = SERVICES[index % SERVICES.length];
  const surname = SURNAMES[index % SURNAMES.length];
  const isPremium = index % 10 < 3;
  const plan = isPremium ? PLANS[index % PLANS.length] : null;
  const now = Date.now();

  return {
    id: now + index + 1,
    name: `${surname} ${SERVICE_LABELS[service]} ${area.name}`,
    phone: seededPhone(index),
    service,
    services: [
      {
        id: `seed-${index}-basic`,
        name: service,
        description: `Regular ${service.toLowerCase()} service for home and office needs`,
        price: 299 + (index % 5) * 50,
        duration: "1-2 hours",
        availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      },
      {
        id: `seed-${index}-deep`,
        name: `${service} Deep Service`,
        description: `Detailed ${service.toLowerCase()} with inspection and finishing`,
        price: 599 + (index % 6) * 75,
        duration: "2-3 hours",
        availability: ["Mon", "Wed", "Fri", "Sun"],
      },
    ],
    lat: Number((area.lat + seededOffset(index, "lat")).toFixed(6)),
    lng: Number((area.lng + seededOffset(index, "lng")).toFixed(6)),
    address: `${area.name}, Ahmedabad, Gujarat`,
    registeredAt: new Date(now - index * 86400000).toISOString(),
    isPremium,
    plan,
    premiumExpiresAt: isPremium
      ? new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null,
  };
};

export function seedFakeSellers() {
  try {
    const raw = localStorage.getItem("sellers");
    const existing = raw ? JSON.parse(raw) : [];

    if (Array.isArray(existing) && existing.length >= 10) return;

    const sellers = Array.from({ length: 100 }, (_, index) =>
      createSeller(index),
    );

    localStorage.setItem("sellers", JSON.stringify(sellers));
  } catch {
    const sellers = Array.from({ length: 100 }, (_, index) =>
      createSeller(index),
    );
    localStorage.setItem("sellers", JSON.stringify(sellers));
  }
}
