import { useEffect, useState, useRef } from "react";
import { Send, User, Phone, MapPin, BriefcaseBusiness, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const initialState = {
  customerName: "",
  contactNumber: "",
  address: "",
  description: "",
};

const STANDARD_CATEGORIES = [
  "Cleaning Essentials",
  "AC Repair",
  "Electrician",
  "Plumbing",
  "Pest Control",
  "Carpentry",
  "Appliance Repair & Service",
  "Home Painting"
];

export default function NoProvidersLeadForm({
  category,
  pincode,
  radiusKm,
  buyerPos,
}) {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [targetCategory, setTargetCategory] = useState(category || "");
  const [targetPincode, setTargetPincode] = useState(pincode || "");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(category || "");
  const [isOpen, setIsOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setTargetCategory(category || "");
    setSearchQuery(category || "");
    setStatus({ type: "", message: "" });
  }, [category, pincode]);

  // Fetch dynamic categories from the backend database
  useEffect(() => {
    const fetchDbCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/nearby/categories`);
        const data = await res.json();
        if (data?.success && Array.isArray(data?.data?.categories)) {
          setDbCategories(data.data.categories.map((c) => c.name));
        }
      } catch (err) {
        console.error("Failed to fetch database categories:", err);
      }
    };
    fetchDbCategories();
  }, []);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Autofill logged-in user details if available
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name || "",
        contactNumber: prev.contactNumber || user.phone || "",
        address: prev.address || user.address || "",
      }));
      if (!targetPincode && user.pincode) {
        setTargetPincode(user.pincode);
      }
    }
  }, [user]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch(`${API_BASE_URL}/submit-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: targetCategory,
          pincode: targetPincode,
          radiusKm,
          latitude: buyerPos?.lat ?? null,
          longitude: buyerPos?.lng ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Unable to submit request");
      }

      setForm((prev) => ({
        customerName: user?.name || "",
        contactNumber: user?.phone || "",
        address: user?.address || "",
        description: "",
      }));
      setSearchQuery(targetCategory);
      const count = data.data?.matchedPremiumSellers || 0;
      setStatus({
        type: "success",
        message: `✅ Request submitted! ${count > 0 ? count : "Local"} verified technicians were notified and will contact you shortly.`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "Unable to submit request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Build category list, appending the search term if it's not standard
  const categoriesList = dbCategories.length > 0 ? dbCategories : STANDARD_CATEGORIES;
  const finalCategoriesList = [...categoriesList];
  if (category && !finalCategoriesList.some(cat => cat.toLowerCase() === category.toLowerCase())) {
    finalCategoriesList.unshift(category);
  }

  // Filter categories list based on user's query
  const filteredCategories = finalCategoriesList.filter((cat) =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-left">
      {/* Clean QuickSeva Signature Header */}
      <div className="bg-slate-50/80 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0 shadow-xs">
            <BriefcaseBusiness className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
                Broadcast Lead Request to Technicians
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-extrabold tracking-wider uppercase">
                ⚡ 0 Direct Partners
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-snug">
              No online providers within {radiusKm || 5}km. Submit your requirement below and local verified experts will contact you!
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4" noValidate>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-600" />
              Customer Name
            </label>
            <input
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              Contact Number
            </label>
            <input
              value={form.contactNumber}
              onChange={(e) => update("contactNumber", e.target.value)}
              required
              inputMode="tel"
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="10-digit mobile number"
            />
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BriefcaseBusiness className="h-3.5 w-3.5 text-blue-600" />
              Service Category
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setTargetCategory(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                required
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 pr-9 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Type or select category..."
              />
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            {isOpen && (
              <ul className="absolute left-0 right-0 z-50 mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <li
                      key={cat}
                      onClick={() => {
                        setTargetCategory(cat);
                        setSearchQuery(cat);
                        setIsOpen(false);
                      }}
                      className={`cursor-pointer px-3.5 py-2 text-xs transition font-semibold ${
                        targetCategory.toLowerCase() === cat.toLowerCase()
                          ? "bg-blue-600 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </li>
                  ))
                ) : (
                  <li
                    onClick={() => {
                      setTargetCategory(searchQuery);
                      setIsOpen(false);
                    }}
                    className="cursor-pointer px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 italic"
                  >
                    Use custom category: "{searchQuery}"
                  </li>
                )}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              Target Pincode
            </label>
            <input
              value={targetPincode}
              onChange={(e) => setTargetPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              required
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="Enter 6-digit pincode"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            Service Address / सेवा का पता
          </label>
          <textarea
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
            placeholder="Enter full address where service is required..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Requirement Details / काम का विवरण
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
            placeholder="Describe what help you need (e.g. AC not cooling, need repair today)..."
          />
        </div>

        {status.message && (
          <div
            className={`rounded-xl border p-3 text-xs font-bold ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !targetCategory.trim() || targetPincode.length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3 px-4 text-xs font-extrabold tracking-wide shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4 text-white" />
          {submitting ? "Broadcasting Request…" : "🚀 Submit Lead & Broadcast Request"}
        </button>
      </form>
    </div>
  );
}
