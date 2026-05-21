export const mockOrders = [
  {
    id: "ORD001",
    customer: "Rahul Shah",
    service: "AC Repair",
    amount: 800,
    status: "completed",
    date: "2025-05-18",
  },
  {
    id: "ORD002",
    customer: "Priya Patel",
    service: "Cleaning",
    amount: 500,
    status: "pending",
    date: "2025-05-19",
  },
  {
    id: "ORD003",
    customer: "Amit Joshi",
    service: "Plumbing",
    amount: 650,
    status: "completed",
    date: "2025-05-17",
  },
  {
    id: "ORD004",
    customer: "Neha Modi",
    service: "Electrician",
    amount: 400,
    status: "cancelled",
    date: "2025-05-16",
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
