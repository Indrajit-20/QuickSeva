import React, { useState } from "react";
import { X, Send, Phone, User, MapPin, Briefcase, CheckCircle2, MessageCircle } from "lucide-react";
import { createQuoteRequest } from "../api/contractorApi";

export default function ContractorQuoteModal({ contractor, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    city: contractor?.city || "",
    service_type: contractor?.trade_specialization || "General Work Contract",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !contractor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone || !formData.city) {
      setError("Please fill in your Name, Phone Number, and City.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createQuoteRequest({
        contractor_id: contractor.id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        city: formData.city,
        service_type: formData.service_type,
        notes: formData.notes,
      });

      setSubmittedLead(res?.data || null);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit quote request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight">Request Contractor Quote</h3>
            <p className="text-xs text-amber-100 font-medium">
              Get direct callback from {contractor.company_name || contractor.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:bg-rose-600 flex items-center justify-center text-white transition active:scale-95 shadow-md"
            title="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 mb-1">Quote Request Sent! 🎉</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Lead registered for <span className="font-bold text-slate-900">{contractor.company_name || contractor.name}</span>. QuickSeva has captured your request.
                </p>
                {submittedLead?.quoteId && (
                  <span className="inline-block mt-2 px-3 py-1 bg-amber-50 text-amber-800 text-[11px] font-black rounded-lg border border-amber-200">
                    Lead Reference: #{submittedLead.quoteId}
                  </span>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indrajeit Sharma"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (For Contractor Callback) *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Work Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project Type</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. House Painting"
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Details / Requirements</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Need 3BHK flat painting completed in 4 days. Need quote for labor + materials."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Quote Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
