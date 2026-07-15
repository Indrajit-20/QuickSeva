import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Crown, MapPin, Phone, RefreshCw, User, Rocket } from "lucide-react";
import apiClient from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { isPremiumActive } from "../../utils/premium";

const POLL_MS = 30000;

const formatTime = (value) => {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function SellerLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hasPremium, setHasPremium] = useState(true);

  const sellerId = user?.sellerId || user?.seller_id || user?.seller?.id || "";

  useEffect(() => {
    setHasPremium(isPremiumActive(user) || isPremiumActive());
  }, [user]);

  const fetchLeads = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const query = sellerId ? `?sellerId=${encodeURIComponent(sellerId)}` : "";
      const res = await apiClient.get(`/seller/leads${query}`);
      const nextLeads = res?.data?.data?.leads || [];
      setLeads(Array.isArray(nextLeads) ? nextLeads : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load lead alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const run = async (options) => {
      if (!active) return;
      await fetchLeads(options);
    };

    run();
    const interval = setInterval(() => run({ silent: true }), POLL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const openLeads = useMemo(
    () => leads.filter((lead) => lead.status === "OPEN" || lead.status === "PENDING"),
    [leads],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lead Alerts / ग्राहक संदेश</h1>
          <p className="mt-1 text-sm text-slate-500">
            Customer leads routed directly to your dashboard. / ग्राहकों के संदेश सीधे आपके डैशबोर्ड पर।
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLeads()}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition duration-200 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Leads / नए संदेश</div>
          <div className="mt-2 text-3xl font-black text-slate-800">{openLeads.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Polling</div>
          <div className="mt-2 text-lg font-bold text-slate-800">Every 30 sec</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Updated</div>
          <div className="mt-2 text-sm font-semibold text-slate-800">
            {lastUpdated ? formatTime(lastUpdated) : "Waiting..."}
          </div>
        </div>
      </div>

      {/* Informational Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 flex gap-3 text-left">
        <span className="text-xl">💡</span>
        <div className="text-xs space-y-1">
          <p className="font-bold text-blue-900">How to use Lead Alerts? / ग्राहक संदेश का उपयोग कैसे करें:</p>
          <p className="text-slate-650 leading-relaxed font-semibold">
            <strong>EN:</strong> These are real-time requests from customers in your area. Tap <strong>"Call Client Now"</strong> to talk directly, discuss the work, and confirm your booking.
          </p>
          <p className="text-slate-500 leading-relaxed border-t border-blue-100/50 pt-1 font-semibold">
            <strong>HI:</strong> ये आपके क्षेत्र के ग्राहकों के सीधे संदेश हैं। ग्राहक से बात करने, काम समझने और बुकिंग पक्की करने के लिए <strong>"Call Client Now"</strong> पर क्लिक करें।
          </p>
        </div>
      </div>

      {!hasPremium && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 text-center space-y-4 shadow-sm">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Rocket className="rotate-45" size={24} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Unlock Lead Alerts with Premium Membership</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Get customer leads routed directly to your dashboard in real-time when clients search for your categories and pincodes.
            </p>
          </div>
          <div>
            <Link
              to="/seller/packages"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-sm"
            >
              👑 UPGRADE TO PREMIUM
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 shadow-sm">
          Loading lead alerts...
        </div>
      )}

      {!loading && leads.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-700">No lead alerts yet / कोई ग्राहक संदेश नहीं है</p>
          <p className="mt-1 text-xs text-slate-400">
            New matching requests will appear here. / नए काम के संदेश यहाँ दिखाई देंगे।
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {leads.map((lead) => (
          <article
            key={`${lead.notificationId}-${lead.leadId}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition duration-200 text-left space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-250 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  HIGH PRIORITY / उच्च प्राथमिकता
                </span>
                <h2 className="text-lg font-black text-slate-800 leading-snug">
                  {lead.category} Request / {lead.category} काम की मांग
                </h2>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {lead.status}
              </span>
            </div>

            {/* Explanation box for the seller */}
            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed space-y-0.5 font-semibold">
              <p>
                👉 <strong>EN:</strong> Customer <strong>{lead.customerName}</strong> needs an <strong>{lead.category}</strong> service near <strong>{lead.pincode}</strong>.
              </p>
              <p className="border-t border-slate-200/50 pt-1 mt-1">
                👉 <strong>HI:</strong> ग्राहक <strong>{lead.customerName}</strong> को <strong>{lead.pincode}</strong> के पास <strong>{lead.category}</strong> काम की जरूरत है।
              </p>
            </div>

            {/* User Details Grid */}
            <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-3 bg-white p-1 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Client Name / ग्राहक</span>
                  <span className="font-bold text-slate-800 text-sm">{lead.customerName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Location / दूरी</span>
                  <span className="font-bold text-slate-800 text-sm">{lead.pincode} ({lead.radiusKm || 5} km away)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Requested On / समय</span>
                  <span className="font-bold text-slate-800 text-sm">{formatTime(lead.createdAt)}</span>
                </div>
              </div>
            </div>

            {lead.description && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-600">
                <span className="font-bold text-slate-700 block mb-1">Customer Notes / ग्राहक का विवरण:</span>
                <p className="italic font-medium">"{lead.description}"</p>
              </div>
            )}

            {/* Direct Contact Phone info if available */}
            {lead.contactNumber && (
              <div className="flex items-center gap-2 border-t border-slate-150 pt-3 text-xs">
                <Phone className="h-3.5 w-3.5 text-emerald-650" />
                <span className="font-bold text-emerald-700">
                  Phone Number / फोन नंबर: {lead.contactNumber}
                </span>
              </div>
            )}

            <div className="flex pt-1">
              <a
                href={`tel:${lead.contactNumber}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition-all duration-150 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm"
              >
                <Phone className="h-4 w-4" />
                Call Client Now / ग्राहक को अभी फोन करें
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
