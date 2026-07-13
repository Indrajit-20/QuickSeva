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
          <h1 className="text-2xl font-black text-white">Lead Alerts / ग्राहक संदेश</h1>
          <p className="mt-1 text-sm text-slate-400">
            Customer leads routed directly to your dashboard. / ग्राहकों के संदेश सीधे आपके डैशबोर्ड पर।
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLeads()}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-100 transition hover:bg-indigo-500/20"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-indigo-400/20 bg-[#151334] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Open Leads / नए संदेश</div>
          <div className="mt-2 text-3xl font-black text-white">{openLeads.length}</div>
        </div>
        <div className="rounded-2xl border border-indigo-400/20 bg-[#151334] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Polling</div>
          <div className="mt-2 text-lg font-black text-white">Every 30 sec</div>
        </div>
        <div className="rounded-2xl border border-indigo-400/20 bg-[#151334] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Last Updated</div>
          <div className="mt-2 text-sm font-bold text-white">
            {lastUpdated ? formatTime(lastUpdated) : "Waiting..."}
          </div>
        </div>
      </div>

      {!hasPremium && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/15 p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
              <Rocket className="rotate-45" size={24} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Unlock Lead Alerts with Premium Membership</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Get customer leads routed directly to your dashboard in real-time when clients search for your categories and pincodes.
            </p>
          </div>
          <div>
            <Link
              to="/seller/packages"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-lg shadow-purple-600/20"
            >
              👑 UPGRADE TO PREMIUM
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-indigo-400/20 bg-[#151334] p-8 text-center text-indigo-200">
          Loading lead alerts...
        </div>
      )}

      {!loading && leads.length === 0 && (
        <div className="rounded-2xl border border-indigo-400/20 bg-[#151334] p-10 text-center">
          <p className="text-sm font-bold text-white">No lead alerts yet / कोई ग्राहक संदेश नहीं है</p>
          <p className="mt-1 text-xs text-slate-400">
            New matching requests will appear here. / नए काम के संदेश यहाँ दिखाई देंगे।
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {leads.map((lead) => (
          <article
            key={`${lead.notificationId}-${lead.leadId}`}
            className="rounded-2xl border border-indigo-400/20 bg-[#110e3d] p-5 shadow-[0_18px_45px_-30px_rgba(99,102,241,0.8)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  HIGH PRIORITY
                </div>
                <h2 className="mt-3 text-lg font-black text-white">
                  {lead.category} request in {lead.pincode}
                </h2>
              </div>
              <div className="rounded-full border border-indigo-400/20 bg-white/5 px-3 py-1 text-xs font-bold text-indigo-200">
                {lead.status}
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-indigo-100 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-300" />
                {lead.customerName}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-300" />
                {lead.pincode} within {lead.radiusKm || 5} km
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-indigo-300" />
                {formatTime(lead.createdAt)}
              </div>
            </div>

            {lead.description && (
              <p className="mt-4 rounded-xl border border-indigo-400/15 bg-white/5 p-3 text-sm leading-relaxed text-slate-200">
                {lead.description}
              </p>
            )}

            <a
              href={`tel:${lead.contactNumber}`}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500"
            >
              <Phone className="h-4 w-4" />
              Call Client Now
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
