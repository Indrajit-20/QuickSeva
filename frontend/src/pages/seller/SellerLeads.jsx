import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Crown, MapPin, Phone, RefreshCw, User } from "lucide-react";
import apiClient from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";

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
  const [premiumStatus, setPremiumStatus] = useState({
    loading: true,
    isProActive: false,
    plan: null,
    expiresAt: null,
  });

  const sellerId = user?.sellerId || user?.seller_id || user?.seller?.id || "";

  const fetchPremiumStatus = async () => {
    try {
      const profileResp = await apiClient.get("/sellers/me/profile");
      const seller = profileResp.data?.data?.seller || profileResp.data?.seller;
      const expiresAt = seller?.premium_expires_at || seller?.premiumExpiresAt;
      const expiryTime = expiresAt ? new Date(expiresAt).getTime() : 0;
      const isProActive =
        (seller?.is_premium === 1 || seller?.is_premium === true) &&
        seller?.plan === "pro" &&
        expiryTime > Date.now();

      setPremiumStatus({
        loading: false,
        isProActive,
        plan: seller?.plan || null,
        expiresAt: expiresAt || null,
      });
    } catch {
      setPremiumStatus((prev) => ({ ...prev, loading: false }));
    }
  };

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

  useEffect(() => {
    fetchPremiumStatus();
  }, []);

  const openLeads = useMemo(
    () => leads.filter((lead) => lead.status === "OPEN" || lead.status === "PENDING"),
    [leads],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Premium Lead Alerts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Pro plan fallback requests routed directly to your dashboard.
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
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Open Leads</div>
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

      {!premiumStatus.loading && !premiumStatus.isProActive && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-400/15 p-2 text-amber-200">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-100">
                  Pro plan is not active
                </p>
                <p className="mt-1 text-xs text-amber-100/75">
                  Fallback leads are routed only to active Pro sellers on the Rs 355 plan.
                </p>
              </div>
            </div>
            <a
              href="/seller/packages"
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-400"
            >
              Activate Pro Plan
            </a>
          </div>
        </div>
      )}

      {!premiumStatus.loading && premiumStatus.isProActive && (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-200">
          Pro plan active. Premium fallback leads will appear here automatically.
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
          <p className="text-sm font-bold text-white">No premium fallback leads yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            New matching requests will appear here automatically.
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
