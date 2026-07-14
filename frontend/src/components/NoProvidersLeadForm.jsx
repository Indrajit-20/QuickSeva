import { useEffect, useState, useRef } from "react";
import { Send, User, Phone, MapPin, BriefcaseBusiness, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const initialState = {
  customerName: "",
  contactNumber: "",
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
        description: "",
      }));
      setSearchQuery(targetCategory);
      setStatus({
        type: "success",
        message: `Request saved. ${data.data?.matchedPremiumSellers || 0} premium partners were notified.`,
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
    <div className="qs-lead-form-card">
      <div className="mb-5 pb-3 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <BriefcaseBusiness className="h-5 w-5 text-indigo-600" />
          No Direct Partners Found
        </h4>
        <p className="mt-1 text-xs text-slate-500 leading-normal">
          Share your requirement and QuickSeva will notify matching premium partners in your area instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              Customer Name
            </label>
            <input
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-indigo-500" />
              Contact Number
            </label>
            <input
              value={form.contactNumber}
              onChange={(e) => update("contactNumber", e.target.value)}
              required
              inputMode="tel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="10-digit mobile number"
            />
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <BriefcaseBusiness className="h-3.5 w-3.5 text-indigo-500" />
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 pr-8 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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
              <ul className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <li
                      key={cat}
                      onClick={() => {
                        setTargetCategory(cat);
                        setSearchQuery(cat);
                        setIsOpen(false);
                      }}
                      className={`cursor-pointer px-3.5 py-2 text-sm transition font-medium ${
                        targetCategory.toLowerCase() === cat.toLowerCase()
                          ? "bg-indigo-600 text-white font-bold"
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-indigo-500" />
              Target Pincode
            </label>
            <input
              value={targetPincode}
              onChange={(e) => setTargetPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Enter target pincode"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Requirement Details
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            placeholder="Describe what help you need, timing, landmark, etc..."
          />
        </div>

        {status.message && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 shadow-md cursor-pointer hover:shadow-lg"
        >
          <Send className="h-4 w-4 text-white" />
          {submitting ? "Sending..." : "Notify Premium Partners"}
        </button>
      </form>
    </div>
  );
}
