import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Clock3, Crown, MapPin, Phone, RefreshCw, Shield, Star, TrendingUp, User, Rocket, Activity, Megaphone, Zap } from "lucide-react";
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

export default function SellerLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [premiumMessage, setPremiumMessage] = useState("");

  const sellerId = user?.sellerId || user?.seller_id || user?.seller?.id || "";

  const fetchLeads = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const query = sellerId ? `?sellerId=${encodeURIComponent(sellerId)}` : "";
      const res = await apiClient.get(`/seller/leads${query}`);
      const data = res?.data?.data || {};

      // Server tells us if premium is required
      if (data.premiumRequired) {
        setPremiumRequired(true);
        setPremiumMessage(data.message || "");
        setLeads([]);
      } else {
        setPremiumRequired(false);
        setPremiumMessage("");
        const nextLeads = data.leads || [];
        setLeads(Array.isArray(nextLeads) ? nextLeads : []);
        // Notify layout and navigation that leads have been viewed so badge is cleared
        window.dispatchEvent(new CustomEvent("leads-read"));
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
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

  /* ── Premium Required Gate ── */
  if (!loading && premiumRequired) {
    return (
      <div className="seller-page space-y-5 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="seller-page-title">Lead Alerts</h1>
            <p className="seller-page-subtitle">
              Customer requests in your area / ग्राहक संदेश
            </p>
          </div>
        </div>

        {/* Premium Upgrade Card */}
        <div className="seller-card" style={{ overflow: 'hidden', borderRadius: 20 }}>
          {/* Gradient Header */}
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 40%, #7c3aed 100%)',
            padding: '32px 24px 28px', color: 'white', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: -20, width: 80, height: 80,
              borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
            }} />

            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <Crown size={32} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Unlock Customer Leads
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
              {premiumMessage || "Available with Standard & Pro plans. Get direct access to high-intent buyer requests in your area."}
            </p>
          </div>

          {/* Benefits List */}
          <div style={{ padding: '20px 20px 8px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Included in Standard & Pro / स्टैंडर्ड और प्रो में शामिल
            </p>
            {[
              { icon: <Zap size={16} />, color: '#f59e0b', bg: '#fffbeb', text: 'Instant lead alerts in real-time', hi: 'रीयल-टाइम में तुरंत लीड अलर्ट' },
              { icon: <Phone size={16} />, color: '#10b981', bg: '#ecfdf5', text: 'Direct customer contact numbers', hi: 'ग्राहक के सीधे संपर्क नंबर' },
              { icon: <TrendingUp size={16} />, color: '#3b82f6', bg: '#eff6ff', text: 'Priority matching with buyers', hi: 'खरीदारों के साथ प्राथमिकता मिलान' },
              { icon: <Shield size={16} />, color: '#8b5cf6', bg: '#f5f3ff', text: 'Verified & high-intent requests only', hi: 'केवल सत्यापित और उच्च-इरादे वाले अनुरोध' },
              { icon: <Star size={16} />, color: '#ec4899', bg: '#fdf2f8', text: 'Boost your profile visibility', hi: 'अपनी प्रोफ़ाइल दृश्यता बढ़ाएं' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12, background: item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: item.color,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 1 }}>{item.text}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{item.hi}</p>
                </div>
                <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ padding: '8px 20px 24px' }}>
            <Link
              to="/seller/packages"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '14px 24px', borderRadius: 16,
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: 'white', fontSize: 15, fontWeight: 700,
                textDecoration: 'none', border: 'none',
                boxShadow: '0 4px 14px rgba(109,40,217,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(109,40,217,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(109,40,217,0.3)';
              }}
            >
              <Crown size={18} />
              View Standard & Pro Plans
            </Link>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 10, fontWeight: 500 }}>
              Lead Alerts activate instantly after purchasing Standard or Pro plan
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="seller-card">
          <div className="seller-card-body" style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
              How Leads Work / लीड्स कैसे काम करती हैं
            </p>
            {[
              { step: '1', text: 'Customer submits a service request', hi: 'ग्राहक सेवा अनुरोध जमा करता है' },
              { step: '2', text: 'We match with Standard & Pro sellers in the area', hi: 'हम क्षेत्र के स्टैंडर्ड और प्रो विक्रेताओं से मिलान करते हैं' },
              { step: '3', text: 'You get instant alert with customer details', hi: 'आपको ग्राहक विवरण के साथ तुरंत अलर्ट मिलता है' },
              { step: '4', text: 'Call & close the deal directly', hi: 'सीधे कॉल करें और डील पक्की करें' },
            ].map((item) => (
              <div key={item.step} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 10,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontSize: 12, fontWeight: 800, color: '#2563eb',
                }}>
                  {item.step}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{item.text}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{item.hi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
