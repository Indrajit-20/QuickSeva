import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, CheckCircle2, ShieldCheck, ArrowRight, Briefcase } from "lucide-react";
import { registerContractor } from "../api/contractorApi";
import { useAuth } from "../context/AuthContext";

export default function ContractorRegister() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, refreshAuth } = useAuth();

  const [companyName, setCompanyName] = useState(user?.company_name || "");
  const [tradeSpecialization, setTradeSpecialization] = useState(user?.trade_specialization || "Painting Contractor");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // If guest visits this page, redirect them to standard Login/Register with return redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login?redirect=/become-contractor", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const tradeOptions = [
    "Painting Contractor",
    "Civil & Masonry Contractor",
    "Electrical Site Contractor",
    "Plumbing & Piping Contractor",
    "Interior & Renovation",
    "Fabrication & Welding",
    "Waterproofing & Damp Proofing",
    "Tile, Marble & Granite",
    "Carpentry & Modular Work",
    "HVAC & Commercial AC Work",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Please enter your Company or Contractor Business Name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await registerContractor({
        company_name: companyName.trim(),
        trade_specialization: tradeSpecialization,
      });

      if (res?.success) {
        await refreshAuth();
        alert("🎉 Successfully updated your Contractor profile!");
        navigate("/contractor/dashboard");
      }
    } catch (err) {
      console.error("Contractor setup failed:", err);
      setError(err?.response?.data?.message || "Failed to save contractor profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 text-slate-800 font-sans py-8 px-4 sm:px-6 flex items-center justify-center bottom-nav-spacer">
      <div className="max-w-md w-full bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto mb-2 font-black text-lg">
            <Building2 size={22} />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Become a Contractor</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Fill 2 simple fields to receive customer quote leads and post site labor requirements.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Firm / Contractor Name *</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-amber-600 transition">
              <Building2 size={16} className="text-amber-600 shrink-0" />
              <input
                type="text"
                required
                placeholder="e.g. Apex Painting Contractor / Sharma Builders"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Trade Specialization *</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-amber-600 transition">
              <Briefcase size={16} className="text-amber-600 shrink-0" />
              <select
                value={tradeSpecialization}
                onChange={(e) => setTradeSpecialization(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {tradeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5 text-[11px] font-semibold text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <ShieldCheck size={15} className="text-amber-600 shrink-0" />
              <span>Contractor Account Benefits:</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 size={13} className="text-amber-600 shrink-0" />
              <span>Post work site labor needs with Food 🍱 & Stay 🛖 perks</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 size={13} className="text-amber-600 shrink-0" />
              <span>Receive direct customer project quote calls & WhatsApps</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Save & Go to Dashboard</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
