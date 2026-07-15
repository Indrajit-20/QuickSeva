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
  pending:     "border-amber-200  bg-amber-50  text-amber-700",
  accepted:    "border-blue-200   bg-blue-50   text-blue-700",
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  quoted:      "border-purple-200 bg-purple-50 text-purple-700",
  completed:   "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled:   "border-red-200    bg-red-50    text-red-700",
};

export const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

