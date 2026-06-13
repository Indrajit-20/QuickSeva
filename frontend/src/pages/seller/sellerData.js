export const mockOrders = [
  {
    order_id: "ORD001",
    customer_name: "Rahul Sharma",
    customer_phone: "9876543210",
    service_name: "AC Repair",
    seller_business: "Cool Air Services",
    status: "completed",
    total_amount: 800,
    payment_method: "UPI",
    date: "2026-06-12",
    // legacy keys used by existing UI fallback
    id: "ORD001",
    customer: "Rahul Sharma",
    service: "AC Repair",
    amount: 800,
  },
  {
    order_id: "ORD002",
    customer_name: "Priya Patel",
    customer_phone: "9988776655",
    service_name: "Cleaning",
    seller_business: "Neat Home Cleaners",
    status: "pending",
    total_amount: 500,
    payment_method: "Cash",
    date: "2026-06-13",
    id: "ORD002",
    customer: "Priya Patel",
    service: "Cleaning",
    amount: 500,
  },
  {
    order_id: "ORD003",
    customer_name: "Amit Joshi",
    customer_phone: "9012345678",
    service_name: "Plumbing",
    seller_business: "Blue Plumbing Works",
    status: "completed",
    total_amount: 650,
    payment_method: "Card",
    date: "2026-06-11",
    id: "ORD003",
    customer: "Amit Joshi",
    service: "Plumbing",
    amount: 650,
  },
  {
    order_id: "ORD004",
    customer_name: "Neha Modi",
    customer_phone: "9123456789",
    service_name: "Electrician",
    seller_business: "Spark Electricians",
    status: "cancelled",
    total_amount: 400,
    payment_method: "Cash",
    date: "2026-06-10",
    id: "ORD004",
    customer: "Neha Modi",
    service: "Electrician",
    amount: 400,
  },
];

export const mockServices = [
  {
    id: 1,
    name: "AC Repair",
    description: "Full AC service and repair",
    price: 800,
    duration: "2-3 hours",
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  {
    id: 2,
    name: "AC Installation",
    description: "New AC installation",
    price: 1500,
    duration: "3-4 hours",
    availability: ["Mon", "Wed", "Fri", "Sat"],
  },
];

export const serviceOptions = [
  "AC Repair",
  "Plumbing",
  "Cleaning",
  "Electrician",
  "Home Painting",
  "Carpentry",
  "Pest Control",
  "Appliance Repair",
];

export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const loadArray = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const statusClasses = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-red-400/30 bg-red-400/10 text-red-300",
};

export const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;
