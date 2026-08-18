import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  IndianRupee,
  Info,
  MapPin,
  Minus,
  Phone,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { createContractorPost } from "../../api/contractorApi";
import { useAuth } from "../../context/AuthContext";

const PRESET_ROLES = [
  "Painter",
  "Mason / Karigar",
  "Electrician",
  "Plumber",
  "General Helper",
  "Welder",
  "Carpenter",
  "Tile Layer",
  "Bar Bender",
  "Shuttering Carpenter",
];

const PRESET_AMENITIES = [
  "Food",
  "Accommodation / Stay",
  "Traveling Allowance",
  "PF & Insurance",
  "Overtime Pay",
  "Safety Gear Provided",
];

const SHIFT_TIMING_PRESETS = [
  "8 Hours (9:00 AM - 5:00 PM)",
  "9 Hours (9:00 AM - 6:00 PM)",
  "10 Hours (8:00 AM - 6:00 PM)",
  "12 Hours (Day Shift: 8 AM - 8 PM)",
  "12 Hours (Night Shift: 8 PM - 8 AM)",
];

// Calculate hours and format 12h time string
const calculateShiftHours = (startTimeStr, endTimeStr) => {
  if (!startTimeStr || !endTimeStr) return "";
  const [sH, sM] = startTimeStr.split(":").map(Number);
  const [eH, eM] = endTimeStr.split(":").map(Number);

  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60; // Overnight shift
  }

  const diffMinutes = endMinutes - startMinutes;
  const hours = (diffMinutes / 60).toFixed(1).replace(".0", "");

  const format12h = (h, m) => {
    const period = h >= 12 && h < 24 ? "PM" : "AM";
    let hour12 = h % 24 % 12;
    if (hour12 === 0) hour12 = 12;
    const minStr = m < 10 ? `0${m}` : m;
    return `${hour12}:${minStr} ${period}`;
  };

  return `${hours} Hours (${format12h(sH, sM)} - ${format12h(eH, eM)})`;
};

export default function CreateContractorPost() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(1); // 1: Workforce, 2: Location & Shift, 3: Amenities & Contact
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);

  // Time picker state for custom shift
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [useCustomTimePicker, setUseCustomTimePicker] = useState(false);

  // Track which fields were auto-filled from location search
  const [autoFilledFields, setAutoFilledFields] = useState({ city: false, pincode: false, state: false });
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    post_type: "demand_workers",
    title: "",
    company_name: user?.company_name || "",
    contact_name: user?.name || user?.contact_person || "",
    contact_phone: user?.phone || "",
    whatsapp_phone: user?.phone || "",
    site_address: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "",
    work_hours: "8 Hours (9:00 AM - 5:00 PM)",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "",
  });

  // Dynamic labor requirements
  const [requirements, setRequirements] = useState([
    { role_title: "Painter", quantity: 5, wage_amount: 850, wage_type: "per_day", skills_required: "" },
  ]);

  // Selected Perks
  const [selectedAmenities, setSelectedAmenities] = useState(["Food", "Accommodation / Stay"]);

  // Location search state
  const [locationSearchInput, setLocationSearchInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fill user profile info
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        company_name: prev.company_name || user.company_name || "",
        contact_name: prev.contact_name || user.name || user.contact_person || "",
        contact_phone: prev.contact_phone || user.phone || "",
        whatsapp_phone: prev.whatsapp_phone || user.phone || "",
      }));
    }
  }, [user]);

  // Update work_hours whenever custom time picker changes
  useEffect(() => {
    if (useCustomTimePicker && startTime && endTime) {
      const computed = calculateShiftHours(startTime, endTime);
      if (computed) {
        setFormData((prev) => ({ ...prev, work_hours: computed }));
      }
    }
  }, [startTime, endTime, useCustomTimePicker]);

  // Location search handler with Nominatim
  const handleLocationSearch = async (val) => {
    setLocationSearchInput(val);
    if (!val || val.trim().length < 3) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }

    setIsSearchingLocation(true);
    setShowLocationDropdown(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&countrycodes=in&addressdetails=1&email=support@quickseva.com`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "QuickSeva/1.0",
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocationSuggestions(data);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Reverse-geocode fallback to fetch pincode from lat/lon
  const fetchPincodeFromCoords = async (lat, lon) => {
    setPincodeLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1&email=support@quickseva.com`,
        { headers: { Accept: "application/json", "User-Agent": "QuickSeva/1.0" } }
      );
      const data = await res.json();
      const postcode = data?.address?.postcode || "";
      if (postcode) {
        setFormData((prev) => ({ ...prev, pincode: postcode }));
        setAutoFilledFields((prev) => ({ ...prev, pincode: true }));
      }
    } catch (err) {
      console.error("Reverse geocode for pincode failed:", err);
    } finally {
      setPincodeLoading(false);
    }
  };

  const selectLocationSuggestion = (item) => {
    const addr = item.address || {};
    const cityVal = addr.city || addr.town || addr.village || addr.suburb || addr.county || "";
    const pincodeVal = addr.postcode || "";
    const stateVal = addr.state || formData.state || "";
    const addressVal = item.display_name || "";

    setFormData((prev) => ({
      ...prev,
      site_address: addressVal,
      city: cityVal,
      state: stateVal,
      pincode: pincodeVal,
    }));

    // Track auto-filled fields
    setAutoFilledFields({
      city: !!cityVal,
      pincode: !!pincodeVal,
      state: !!stateVal,
    });

    // Issue 2: If pincode is missing, try reverse-geocode with lat/lon
    if (!pincodeVal && item.lat && item.lon) {
      fetchPincodeFromCoords(item.lat, item.lon);
    }

    // Issue 1: Auto-regenerate title with the new city (unless user manually typed a custom title)
    if (!isTitleManuallyEdited) {
      const autoTitle = generateAutoTitleString(requirements, cityVal, pincodeVal);
      setFormData((prev) => ({ ...prev, title: autoTitle }));
    }

    setLocationSearchInput("");
    setShowLocationDropdown(false);
  };

  // Helper to generate auto title
  const generateAutoTitleString = (reqs, cityStr, pinStr) => {
    const roleItems = reqs
      .filter((r) => r.role_title && Number(r.quantity) > 0)
      .map((r) => `${r.quantity} ${r.role_title}${Number(r.quantity) > 1 ? "s" : ""}`);

    if (roleItems.length === 0) return "Need Workers for Site Work";

    let rolesText = "";
    if (roleItems.length === 1) {
      rolesText = roleItems[0];
    } else if (roleItems.length === 2) {
      rolesText = `${roleItems[0]} & ${roleItems[1]}`;
    } else {
      rolesText = `${roleItems.slice(0, -1).join(", ")} & ${roleItems[roleItems.length - 1]}`;
    }

    const locText = cityStr?.trim() ? `in ${cityStr.trim()}` : pinStr?.trim() ? `in Pincode ${pinStr.trim()}` : "";
    return `Need ${rolesText} ${locText}`.trim();
  };

  // Auto-generate title
  useEffect(() => {
    if (!isTitleManuallyEdited) {
      const autoTitle = generateAutoTitleString(requirements, formData.city, formData.pincode);
      setFormData((prev) => ({ ...prev, title: autoTitle }));
    }
  }, [requirements, formData.city, formData.pincode, isTitleManuallyEdited]);

  const handleRegenerateTitle = () => {
    const autoTitle = generateAutoTitleString(requirements, formData.city, formData.pincode);
    setFormData((prev) => ({ ...prev, title: autoTitle }));
    setIsTitleManuallyEdited(false);
  };

  const handleAddReq = () => {
    const updated = [
      ...requirements,
      { role_title: "General Helper", quantity: 2, wage_amount: 550, wage_type: "per_day", skills_required: "" },
    ];
    setRequirements(updated);
  };

  const handleRemoveReq = (index) => {
    if (requirements.length === 1) return;
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleReqChange = (index, field, value) => {
    const updated = [...requirements];
    updated[index][field] = value;
    setRequirements(updated);
  };

  const handleQuantityDelta = (index, delta) => {
    const updated = [...requirements];
    const currentQty = Number(updated[index].quantity) || 1;
    const newQty = Math.max(1, currentQty + delta);
    updated[index].quantity = newQty;
    setRequirements(updated);
  };

  const toggleAmenity = (perk) => {
    if (selectedAmenities.includes(perk)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== perk));
    } else {
      setSelectedAmenities([...selectedAmenities, perk]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.contact_name || !formData.contact_phone || !formData.site_address || !formData.city) {
      setError("Please fill in Title, Contact Name, Phone Number, Site Address, and City.");
      setActiveStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fullDescription = `Work Shift / Timings: ${formData.work_hours}\n${formData.description || ""}`.trim();
      const payload = {
        ...formData,
        description: fullDescription,
        amenities: selectedAmenities,
        requirements,
      };

      const res = await createContractorPost(payload);
      if (res?.success) {
        alert("Work Site Requirement Posted Successfully!");
        navigate("/contractor/posts");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create post. Please check required fields.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-3 sm:px-5 font-sans text-slate-800 pb-20">
      {/* Compact Top Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black">
            <Building2 size={18} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              Post Work Site Requirement
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
              Fill in worker trades, location & timing details below
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/contractor/posts")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          <ArrowLeft size={14} />
          <span>My Listings</span>
        </button>
      </div>

      {/* Modern Compact 3-Step Bar */}
      <div className="bg-slate-200/70 p-1 rounded-2xl mb-5 flex items-center justify-between gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all ${
            activeStep === 1
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black ${
            activeStep === 1 ? "bg-white/20 text-white" : "bg-slate-300 text-slate-700"
          }`}>
            1
          </span>
          <span className="truncate">Workforce Needs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all ${
            activeStep === 2
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black ${
            activeStep === 2 ? "bg-white/20 text-white" : "bg-slate-300 text-slate-700"
          }`}>
            2
          </span>
          <span className="truncate">Location & Shift</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all ${
            activeStep === 3
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black ${
            activeStep === 3 ? "bg-white/20 text-white" : "bg-slate-300 text-slate-700"
          }`}>
            3
          </span>
          <span className="truncate">Contact & Perks</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Info size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* STEP 1: WORKFORCE NEEDS */}
        {activeStep === 1 && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            {/* Auto Title */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white rounded-2xl p-4 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Auto-Generated Requirement Title</span>
                </label>
                {isTitleManuallyEdited && (
                  <button
                    type="button"
                    onClick={handleRegenerateTitle}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md transition"
                  >
                    <RefreshCw size={11} />
                    <span>Auto-Suggest</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                required
                placeholder="e.g. Need 5 Painters in Pune"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setIsTitleManuallyEdited(true);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Trades & Counts List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-amber-600" />
                  <span>Labor Requirements</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAddReq}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1 transition"
                >
                  <Plus size={13} />
                  <span>Add Role</span>
                </button>
              </div>

              {requirements.map((req, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Trade / Role</label>
                    <select
                      value={req.role_title}
                      onChange={(e) => handleReqChange(index, "role_title", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-amber-600"
                    >
                      {PRESET_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Workers Needed</label>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden p-0.5">
                      <button
                        type="button"
                        onClick={() => handleQuantityDelta(index, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-black"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={req.quantity}
                        onChange={(e) => handleReqChange(index, "quantity", e.target.value)}
                        className="w-full text-center text-xs font-black text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityDelta(index, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-black"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Wage Rate (₹/day)</label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-600/10 transition">
                      <div className="pl-3 text-amber-600 font-extrabold flex items-center justify-center shrink-0">
                        <IndianRupee size={15} />
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="850"
                        value={req.wage_amount}
                        onChange={(e) => handleReqChange(index, "wage_amount", e.target.value)}
                        className="w-full pl-1.5 pr-3 py-2 bg-transparent text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    {requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveReq(index)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Remove role"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => {
                if (!formData.title) {
                  setError("Please fill in Post Title before moving to Step 2.");
                  return;
                }
                setError(null);
                setActiveStep(2);
              }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Continue to Step 2: Location & Shift</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: LOCATION & SHIFT TIMINGS */}
        {activeStep === 2 && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            {/* Work Site Location (Clean Search & Auto-Fill - NO quick select pills) */}
            <div className="space-y-3 pb-3 border-b border-slate-100">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} className="text-amber-600" />
                <span>Work Site Location</span>
              </h2>

              <div className="relative">
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Search Area / Landmark</span>
                  <span className="text-[10px] text-amber-600 font-bold">Auto-fills City & Pincode</span>
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-600/10 transition">
                  <div className="pl-3 pr-1 text-amber-600 flex items-center justify-center shrink-0">
                    <Search size={15} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search e.g. Baner, Wakad, Kothrud, Hinjewadi..."
                    value={locationSearchInput}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    onFocus={() => {
                      if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                    }}
                    className="w-full py-2.5 pr-3 bg-transparent text-xs font-semibold text-slate-900 outline-none"
                  />
                  {isSearchingLocation && (
                    <div className="pr-3 flex items-center shrink-0">
                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {showLocationDropdown && locationSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {locationSuggestions.map((item, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => selectLocationSuggestion(item)}
                        className="w-full px-3 py-2 text-left border-b border-slate-100 hover:bg-amber-50 transition flex items-start gap-2 text-xs"
                      >
                        <MapPin size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{item.display_name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            City: {item.address?.city || item.address?.town || "Pune"} | Pincode: {item.address?.postcode || "N/A"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Full Site Address / Landmark *</label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-600/10 transition">
                    <div className="pl-3 pr-1 text-slate-400 flex items-center justify-center shrink-0">
                      <MapPin size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Plot No 42, Near Datta Mandir, Baner Main Road"
                      value={formData.site_address}
                      onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                      className="w-full py-2 pr-3 bg-transparent text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span>City / Town *</span>
                    {autoFilledFields.city && formData.city && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md animate-pulse">Auto-filled ✓</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      setAutoFilledFields((prev) => ({ ...prev, city: false }));
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition ${
                      autoFilledFields.city && formData.city
                        ? "bg-emerald-50/50 border-emerald-300"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span>Pincode *</span>
                    {pincodeLoading && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                        <span className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        Fetching...
                      </span>
                    )}
                    {!pincodeLoading && autoFilledFields.pincode && formData.pincode && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md animate-pulse">Auto-filled ✓</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 411045"
                    value={formData.pincode}
                    onChange={(e) => {
                      setFormData({ ...formData, pincode: e.target.value });
                      setAutoFilledFields((prev) => ({ ...prev, pincode: false }));
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition ${
                      autoFilledFields.pincode && formData.pincode
                        ? "bg-emerald-50/50 border-emerald-300"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Shift Timings with Presets + Interactive Start/End Time Picker */}
            <div className="space-y-3 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <span>Shift Hours & Timings *</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setUseCustomTimePicker(!useCustomTimePicker)}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline"
                >
                  {useCustomTimePicker ? "Use Shift Presets" : "Use Custom Time Picker"}
                </button>
              </div>

              {!useCustomTimePicker ? (
                <div className="flex flex-wrap gap-2">
                  {SHIFT_TIMING_PRESETS.map((preset) => {
                    const selected = formData.work_hours === preset;
                    return (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setFormData({ ...formData, work_hours: preset })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          selected
                            ? "bg-amber-50 text-amber-900 border-amber-300 font-black shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {selected && <Check size={13} className="inline mr-1 text-amber-600" />}
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-amber-900 mb-1">Shift Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-black text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-amber-900 mb-1">Shift End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-black text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                  <div className="text-xs font-black text-amber-800">
                    Calculated Shift: <span className="underline">{formData.work_hours}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Work Start & End Dates */}
            <div className="space-y-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-amber-600" />
                <span>Work Duration Dates</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
              >
                Back to Step 1
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!formData.site_address || !formData.city) {
                    setError("Please fill in Site Address and City before moving to Step 3.");
                    return;
                  }
                  setError(null);
                  setActiveStep(3);
                }}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Continue to Step 3: Contact & Perks</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AMENITIES & CONTACT */}
        {activeStep === 3 && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            {/* Amenities Provided */}
            <div className="space-y-3 pb-3 border-b border-slate-100">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-600" />
                <span>Amenities & Facilities Provided</span>
              </h2>

              <div className="flex flex-wrap gap-2">
                {PRESET_AMENITIES.map((perk) => {
                  const selected = selectedAmenities.includes(perk);
                  return (
                    <button
                      type="button"
                      key={perk}
                      onClick={() => toggleAmenity(perk)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition active:scale-95 flex items-center gap-1.5 ${
                        selected
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <CheckCircle2 size={13} className={selected ? "text-emerald-600" : "text-slate-300"} />
                      <span>{perk}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Info (Auto-Filled) */}
            <div className="space-y-3 pb-3 border-b border-slate-100">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-amber-600" />
                <span>Contact Details (Auto-Filled)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Anil Construction / Apex Interiors"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Contractor Anil Kumar"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.whatsapp_phone}
                    onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Site Notes (Optional)</h2>
              <textarea
                rows={2}
                placeholder="Safety instructions or site rules..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
              >
                Back to Step 2
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <span>Publish Work Site Requirement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
