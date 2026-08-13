import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  CheckCircle2,
  MapPin,
  Plus,
  PlusCircle,
  Send,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { createContractorPost } from "../../api/contractorApi";
import LocationPicker from "../../components/LocationPicker";

export default function CreateContractorPost() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    post_type: "demand_workers",
    title: "",
    company_name: "",
    contact_name: "",
    contact_phone: "",
    whatsapp_phone: "",
    site_address: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "",
    lat: null,
    lng: null,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "",
  });

  // Dynamic labor requirements line items
  const [requirements, setRequirements] = useState([
    { role_title: "Painter", quantity: 5, wage_amount: 850, wage_type: "per_day", skills_required: "" },
  ]);

  // Selected Perks
  const [selectedAmenities, setSelectedAmenities] = useState(["Food", "Accommodation / Stay"]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const availablePerks = [
    "Food",
    "Accommodation / Stay",
    "Traveling Allowance",
    "PF & Insurance",
    "Overtime Pay",
  ];

  const handleAddReq = () => {
    setRequirements([
      ...requirements,
      { role_title: "Helper", quantity: 2, wage_amount: 550, wage_type: "per_day", skills_required: "" },
    ]);
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

  const toggleAmenity = (perk) => {
    if (selectedAmenities.includes(perk)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== perk));
    } else {
      setSelectedAmenities([...selectedAmenities, perk]);
    }
  };

  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      site_address: loc.address || prev.site_address,
      city: loc.city || prev.city,
      state: loc.state || prev.state,
      pincode: loc.pincode || prev.pincode,
      lat: loc.lat,
      lng: loc.lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.contact_name || !formData.contact_phone || !formData.site_address || !formData.city) {
      setError("Please fill in Title, Contact Name, Phone, Address, and City.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        amenities: selectedAmenities,
        requirements,
      };

      const res = await createContractorPost(payload);
      if (res?.success) {
        alert("Work Site Requirement Posted Successfully!");
        navigate("/contractor-hub");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create post. Please check fields.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 font-sans text-slate-800 pb-24">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-black uppercase tracking-wider mb-1">
          <Building2 size={16} />
          <span>QuickSeva Contractor Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Post Work Site Requirement
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
          Specify labor needs, date duration, daily wages, and amenities to connect with Manpower Agencies and Workers.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Post Title & Contact Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={18} className="text-amber-600" />
            <span>1. Post Title & Contact Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Post Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Need 10 Painters & 5 Helpers for Commercial Site in Baner"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Company / Firm Name</label>
              <input
                type="text"
                placeholder="e.g. Anil Construction / Apex Interiors"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Contractor Anil Kumar"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Phone Number (For Direct Calls) *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">WhatsApp Number</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={formData.whatsapp_phone}
                onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Work Site Location & Duration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin size={18} className="text-amber-600" />
            <span>2. Site Address & Duration</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Select Location on Map</label>
              <LocationPicker
                onSelectLocation={handleLocationSelect}
                initialLat={formData.lat}
                initialLng={formData.lng}
                initialAddress={formData.site_address}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Complete Work Site Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. Plot No. 42, Near Datta Mandir, Baner, Pune"
                value={formData.site_address}
                onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Pune"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                placeholder="e.g. 411045"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Multi-Labor Requirements */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users size={18} className="text-amber-600" />
              <span>3. Labor / Workforce Requirements</span>
            </h2>
            <button
              type="button"
              onClick={handleAddReq}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black rounded-xl flex items-center gap-1 transition active:scale-95"
            >
              <Plus size={14} />
              <span>Add Another Role</span>
            </button>
          </div>

          <div className="space-y-3">
            {requirements.map((req, index) => (
              <div
                key={index}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Role / Trade</label>
                  <select
                    value={req.role_title}
                    onChange={(e) => handleReqChange(index, "role_title", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="Painter">Painter</option>
                    <option value="Mason">Mason / Karigar</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Helper">General Helper</option>
                    <option value="Welder">Welder</option>
                    <option value="Carpenter">Carpenter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity Needed</label>
                  <input
                    type="number"
                    min="1"
                    value={req.quantity}
                    onChange={(e) => handleReqChange(index, "quantity", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Wage Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="850"
                    value={req.wage_amount}
                    onChange={(e) => handleReqChange(index, "wage_amount", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Unit</label>
                    <select
                      value={req.wage_type}
                      onChange={(e) => handleReqChange(index, "wage_type", e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="per_day">per day</option>
                      <option value="per_hour">per hour</option>
                      <option value="per_month">per month</option>
                    </select>
                  </div>

                  {requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveReq(index)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      title="Remove role"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Amenities Provided */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle2 size={18} className="text-amber-600" />
            <span>4. Amenities & Facilities Provided</span>
          </h2>

          <div className="flex flex-wrap gap-3">
            {availablePerks.map((perk) => {
              const selected = selectedAmenities.includes(perk);
              return (
                <button
                  type="button"
                  key={perk}
                  onClick={() => toggleAmenity(perk)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all active:scale-95 flex items-center gap-2 ${
                    selected
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2 size={15} className={selected ? "text-emerald-600" : "text-slate-300"} />
                  <span>{perk}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Additional Site Notes */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Site Overview & Notes</h2>
          <textarea
            rows={4}
            placeholder="Provide any additional site instructions, work hours (e.g. 9 AM - 6 PM), or tools required..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-2xl transition shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} />
              <span>Publish Work Site Requirement</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
