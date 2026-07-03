import { useEffect, useState } from "react";
import { Send, User, Phone, MapPin, BriefcaseBusiness } from "lucide-react";
import { API_BASE_URL } from "../config/api";

const initialState = {
  customerName: "",
  contactNumber: "",
  description: "",
};

export default function NoProvidersLeadForm({
  category,
  pincode,
  radiusKm,
  buyerPos,
}) {
  const [form, setForm] = useState(initialState);
  const [targetCategory, setTargetCategory] = useState(category || "");
  const [targetPincode, setTargetPincode] = useState(pincode || "");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTargetCategory(category || "");
    setTargetPincode(pincode || "");
    setStatus({ type: "", message: "" });
  }, [category, pincode]);

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

      setForm(initialState);
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

  return (
    <div className="qs-lead-form-card">
      <div className="mb-4">
        <p className="text-sm font-bold text-white">No direct providers found</p>
        <p className="mt-1 text-xs text-indigo-200/75">
          Share your requirement and QuickSeva will notify matching Pro partners instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
              <User className="h-3.5 w-3.5" />
              Customer Name
            </span>
            <input
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
              required
              className="w-full rounded-xl border border-indigo-400/20 bg-white/5 px-3 py-2.5 text-sm font-medium text-white placeholder-indigo-300/45 outline-none transition focus:border-indigo-300/60 focus:bg-white/10"
              placeholder="Your name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
              <Phone className="h-3.5 w-3.5" />
              Contact Number
            </span>
            <input
              value={form.contactNumber}
              onChange={(e) => update("contactNumber", e.target.value)}
              required
              inputMode="tel"
              className="w-full rounded-xl border border-indigo-400/20 bg-white/5 px-3 py-2.5 text-sm font-medium text-white placeholder-indigo-300/45 outline-none transition focus:border-indigo-300/60 focus:bg-white/10"
              placeholder="10-digit mobile number"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Service Category
            </span>
            <input
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              readOnly={Boolean(category)}
              required
              className="w-full rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2.5 text-sm font-semibold text-indigo-100 outline-none transition focus:border-indigo-300/60"
              placeholder="Enter service category"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
              <MapPin className="h-3.5 w-3.5" />
              Target Pincode
            </span>
            <input
              value={targetPincode}
              onChange={(e) => setTargetPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              required
              className="w-full rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2.5 text-sm font-semibold text-indigo-100 outline-none transition focus:border-indigo-300/60"
              placeholder="Enter target pincode"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
            Requirement Details
          </span>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-indigo-400/20 bg-white/5 px-3 py-2.5 text-sm font-medium text-white placeholder-indigo-300/45 outline-none transition focus:border-indigo-300/60 focus:bg-white/10"
            placeholder="Describe the issue, urgency, timing, or landmark..."
          />
        </label>

        {status.message && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
              status.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-400/30 bg-red-500/10 text-red-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !targetCategory.trim() || targetPincode.length !== 6}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Sending..." : "Notify Premium Partners"}
        </button>
      </form>
    </div>
  );
}
