import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Crown, MapPin, Phone, RefreshCw, User, Rocket, Activity } from "lucide-react";
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
    <div className="seller-page space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="seller-page-title">Lead Alerts</h1>
          <p className="seller-page-subtitle">
            Customer requests in your area / ग्राहक संदेश
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLeads()}
          className="seller-action-btn seller-action-btn--outline"
          style={{ padding: '10px 14px', minHeight: 40, fontSize: 12 }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Live Stats Row ── */}
      <div className="seller-scroll-row">
        {/* Open Leads */}
        <div className="seller-stat-chip seller-stat-chip--blue" style={{ minWidth: 130 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <div className="seller-live-dot" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live
            </span>
          </div>
          <div className="seller-stat-value">{openLeads.length}</div>
          <div className="seller-stat-label">Open Leads</div>
        </div>

        {/* Polling */}
        <div className="seller-stat-chip seller-stat-chip--violet" style={{ minWidth: 130 }}>
          <div style={{ marginBottom: 8 }}>
            <Activity size={16} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Every 30s</div>
          <div className="seller-stat-label">Auto-refresh</div>
        </div>

        {/* Last Updated */}
        <div className="seller-stat-chip seller-stat-chip--emerald" style={{ minWidth: 130 }}>
          <div style={{ marginBottom: 8 }}>
            <Clock3 size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
            {lastUpdated ? formatTimeAgo(lastUpdated) : "Waiting…"}
          </div>
          <div className="seller-stat-label">Last Updated</div>
        </div>
      </div>

      {/* ── How To Use Tip ── */}
      <div className="seller-card">
        <div className="seller-card-body" style={{ display: 'flex', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Rocket size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: 12 }}>
            <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
              How to use / कैसे उपयोग करें
            </p>
            <p style={{ color: '#64748b', lineHeight: 1.5 }}>
              Tap <strong>"Call Client Now"</strong> to speak directly and confirm booking.
            </p>
            <p style={{ color: '#94a3b8', lineHeight: 1.5, marginTop: 2, fontSize: 11 }}>
              बुकिंग पक्की करने के लिए <strong>"Call Client Now"</strong> दबाएं।
            </p>
          </div>
        </div>
      </div>

      {/* ── Premium Gate ── */}
      {!hasPremium && (
        <div className="seller-card" style={{ overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            padding: 24, color: 'white', textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Crown size={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
              Unlock Lead Alerts with Premium
            </h3>
            <p style={{ fontSize: 12, opacity: 0.8, maxWidth: 280, margin: '0 auto 16px' }}>
              Get customer leads routed directly to your dashboard in real-time.
            </p>
            <Link
              to="/seller/packages"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 24px', borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white', fontSize: 13, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              👑 Upgrade to Premium
            </Link>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          borderRadius: 14, border: '1px solid #fecaca', background: '#fef2f2',
          padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#b91c1c',
        }}>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && leads.length === 0 && (
        <div className="seller-empty-state" style={{ padding: '32px 24px' }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid #eff6ff', borderTopColor: '#3b82f6',
            borderRadius: '50%', margin: '0 auto 12px',
            animation: 'spin 1s linear infinite',
          }} />
          <p className="seller-empty-text">Loading lead alerts…</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && leads.length === 0 && (
        <div className="seller-empty-state">
          <div className="seller-empty-icon">
            <Megaphone size={28} />
          </div>
          <div className="seller-empty-title">No lead alerts yet</div>
          <div className="seller-empty-text">
            New matching customer requests will appear here automatically.
          </div>
        </div>
      )}

      {/* ── Lead Cards ── */}
      <div className="space-y-3">
        {leads.map((lead) => (
          <article
            key={`${lead.notificationId}-${lead.leadId}`}
            className="seller-lead-card seller-lead-card--priority"
          >
            {/* Top Tags */}
            <div className="seller-lead-header">
              <div className="seller-lead-meta">
                <span className="seller-lead-tag" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  <AlertTriangle size={12} /> Priority
                </span>
                <span className="seller-lead-tag" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', textTransform: 'capitalize' }}>
                  {lead.category}
                </span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#64748b',
                background: '#f1f5f9', padding: '3px 8px', borderRadius: 12,
                textTransform: 'uppercase',
              }}>
                {lead.status}
              </span>
            </div>

            <div className="seller-lead-body space-y-3">
              {/* Request Description */}
              <div style={{
                background: '#f8fafc', borderRadius: 14, padding: 14,
                border: '1px solid #e2e8f0', fontSize: 13,
              }}>
                <p style={{ color: '#1e293b', fontWeight: 600 }}>
                  Customer looking for <span style={{ color: '#2563eb', fontWeight: 700 }}>{lead.category}</span> near pincode <span style={{ fontWeight: 700 }}>{lead.pincode}</span>
                </p>
                <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                  पिनकोड <strong>{lead.pincode}</strong> में <strong style={{ color: '#2563eb' }}>{lead.category}</strong> सेवा के लिए अनुरोध
                </p>
              </div>

              {/* Address */}
              {lead.address && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12 }}>
                  <MapPin size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Service Address
                    </span>
                    <p style={{ color: '#1e293b', fontWeight: 600, marginTop: 2 }}>{lead.address}</p>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 8, background: '#f8fafc', borderRadius: 14, padding: 12,
                border: '1px solid #f1f5f9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'white', border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={14} style={{ color: '#94a3b8' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Client
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{lead.customerName}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'white', border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Clock3 size={14} style={{ color: '#94a3b8' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Time
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{formatTimeAgo(lead.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              {lead.description && (
                <div style={{
                  background: 'white', borderRadius: 14, padding: '12px 14px',
                  border: '1px solid #e2e8f0', fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 4, fontSize: 11 }}>
                    Customer Notes / ग्राहक विवरण
                  </span>
                  <p style={{ color: '#64748b', fontStyle: 'italic', fontWeight: 500 }}>
                    "{lead.description}"
                  </p>
                </div>
              )}

              {/* Phone */}
              {lead.contactNumber && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Phone size={14} style={{ color: '#059669' }} />
                  <span style={{ fontWeight: 700, color: '#059669' }}>{lead.contactNumber}</span>
                </div>
              )}
            </div>

            {/* Call Action */}
            <div className="seller-lead-action">
              <a
                href={`tel:${lead.contactNumber}`}
                className="seller-action-btn seller-action-btn--success seller-action-btn--full"
              >
                <Phone size={18} />
                Call Client Now / ग्राहक को फोन करें
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
