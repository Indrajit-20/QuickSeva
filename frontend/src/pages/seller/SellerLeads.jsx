import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock3,
  Crown,
  MapPin,
  Phone,
  RefreshCw,
  User,
  Megaphone,
  Copy,
  Check,
  MessageCircle,
  Flame,
  Wrench,
  Droplets,
  Snowflake,
  Bug,
  Hammer,
  Tv,
  Palette,
  Zap,
} from "lucide-react";
import apiClient from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const POLL_MS = 30000;

const formatTimeAgo = (value) => {
  if (!value) return "Just now";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

function getCategoryIcon(catName = "") {
  const lowered = String(catName).toLowerCase();
  if (lowered.includes("clean")) return Wrench;
  if (lowered.includes("ac") || lowered.includes("cool")) return Snowflake;
  if (lowered.includes("electric") || lowered.includes("fan") || lowered.includes("wiring")) return Zap;
  if (lowered.includes("plumb") || lowered.includes("leak") || lowered.includes("water")) return Droplets;
  if (lowered.includes("pest") || lowered.includes("bug")) return Bug;
  if (lowered.includes("carpen") || lowered.includes("wood")) return Hammer;
  if (lowered.includes("appliance") || lowered.includes("wash") || lowered.includes("tv")) return Tv;
  if (lowered.includes("paint")) return Palette;
  return Wrench;
}

export default function SellerLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [premiumMessage, setPremiumMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const sellerId = user?.sellerId || user?.seller_id || user?.seller?.id || "";

  const fetchLeads = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const query = sellerId ? `?sellerId=${encodeURIComponent(sellerId)}` : "";
      const res = await apiClient.get(`/seller/leads${query}`);
      const data = res?.data?.data || {};

      if (data.premiumRequired) {
        setPremiumRequired(true);
        setPremiumMessage(data.message || "");
        setLeads([]);
      } else {
        setPremiumRequired(false);
        setPremiumMessage("");
        const nextLeads = data.leads || [];
        setLeads(Array.isArray(nextLeads) ? nextLeads : []);
      }
      // Always notify layout & navigation that leads have been viewed so red badge count is reset to 0
      window.dispatchEvent(new CustomEvent("leads-read"));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
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
  }, [sellerId]);

  const openLeads = useMemo(
    () => leads.filter((lead) => lead.status === "OPEN" || lead.status === "PENDING"),
    [leads]
  );

  const copyToClipboard = (text, leadKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(leadKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Premium Required Gate ── */
  if (!loading && premiumRequired) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200 text-left">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Lead Alerts</h1>
            <p className="text-xs font-semibold text-slate-500">Customer requests in your area</p>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-800 border border-amber-200">
            PRO FEATURE
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white text-center">
            <Crown className="h-10 w-10 mx-auto mb-2 text-amber-300" />
            <h3 className="text-xl font-black">Unlock Direct Customer Leads</h3>
            <p className="mt-1 text-xs text-purple-100 max-w-xs mx-auto">
              {premiumMessage || "Available with Standard & Pro plans. Get direct access to buyer requests in your area."}
            </p>
          </div>

          <div className="p-5 space-y-3">
            {[
              "Instant lead alerts in real-time",
              "Direct customer phone numbers & WhatsApp links",
              "Priority matching with active local buyers",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{text}</span>
              </div>
            ))}

            <Link
              to="/seller/packages"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-500/20 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              <span>Upgrade to Standard / Pro</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 text-left animate-in fade-in duration-200">
      {/* ── Ultra-Clean Compact Header ── */}
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 sm:px-5 sm:py-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
            <Megaphone className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Lead Alerts</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-black text-white shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                {openLeads.length} {openLeads.length === 1 ? "Lead" : "Leads"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500">
              Customer requests near your location / ग्राहक संदेश
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchLeads()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 shadow-2xs shrink-0 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-sky-600 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 shadow-2xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && leads.length === 0 && (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/5"></div>
              </div>
              <div className="h-12 bg-slate-100 rounded-xl"></div>
              <div className="h-9 bg-slate-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && leads.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs max-w-sm mx-auto my-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mx-auto text-xl mb-3 border border-sky-100">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">No Lead Alerts Right Now</h3>
          <p className="mt-1 text-xs text-slate-500 font-semibold leading-relaxed">
            New customer service requests in your area will appear here automatically in real-time.
          </p>
        </div>
      )}

      {/* ── Clean Lead Cards List ── */}
      <div className="space-y-3">
        {leads.map((lead) => {
          const leadKey = `${lead.notificationId}-${lead.leadId}`;
          const CatIcon = getCategoryIcon(lead.category);

          return (
            <article
              key={leadKey}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-sky-300 hover:shadow-md"
            >
              {/* Top Category & Pincode Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-extrabold text-sky-700 border border-sky-100">
                    <CatIcon className="h-3.5 w-3.5 text-sky-600" />
                    <span className="capitalize">{lead.category || "Service Request"}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span>Priority</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>Pincode: {lead.pincode || "389320"}</span>
                  </span>

                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    {formatTimeAgo(lead.createdAt)}
                  </span>
                </div>
              </div>

              {/* Main Request Summary Box */}
              <div className="my-3 rounded-xl bg-slate-50/90 p-3 border border-slate-100 text-left space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  Customer looking for{" "}
                  <span className="text-sky-600 font-black">{lead.category}</span> near pincode{" "}
                  <span className="text-slate-800 font-black">{lead.pincode}</span>
                </h4>
                <p className="text-[11px] font-medium text-slate-500">
                  पिनकोड <strong className="text-slate-700">{lead.pincode}</strong> में{" "}
                  <strong className="text-sky-600">{lead.category}</strong> सेवा के लिए अनुरोध
                </p>
              </div>

              {/* Address if available */}
              {lead.address && (
                <div className="mb-3 flex items-start gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <p className="font-semibold text-slate-700 text-xs">
                    {lead.address}
                  </p>
                </div>
              )}

              {/* Notes if available */}
              {lead.description && (
                <div className="mb-3 rounded-lg bg-amber-50/70 p-2.5 border border-amber-100 text-xs">
                  <span className="font-bold text-amber-900 block text-[10px] mb-0.5">
                    💬 Notes / विवरण:
                  </span>
                  <p className="text-amber-800 font-medium italic">"{lead.description}"</p>
                </div>
              )}

              {/* Client Info Bar */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 font-black text-white text-[11px] shadow-2xs">
                    {(lead.customerName || "Client").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                      Client
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {lead.customerName || "Customer"}
                    </span>
                  </div>
                </div>

                {lead.contactNumber && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      📞 {lead.contactNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lead.contactNumber, leadKey)}
                      className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                      title="Copy phone"
                    >
                      {copiedId === leadKey ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={`tel:${lead.contactNumber}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3 px-3.5 text-xs font-extrabold text-white shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Client Now / ग्राहक को फोन करें</span>
                </a>

                {lead.contactNumber && (
                  <a
                    href={`https://wa.me/91${lead.contactNumber.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-3 px-3.5 text-xs font-extrabold text-emerald-800 transition-all active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp / व्हाट्सएप</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
