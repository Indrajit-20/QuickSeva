import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  IndianRupee,
  Rocket,
  BriefcaseBusiness,
  Megaphone,
  Wallet,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, statusClasses } from "./sellerData";
import { useAuth } from "../../context/AuthContext";
import { sellerOrdersApi } from "../../api/orderApi";
import { Link } from "react-router-dom";
import { isPremiumActive } from "../../utils/premium";
import apiClient from "../../api/axiosConfig";

export default function SellerDashboard() {
  const { user, updateUser } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await sellerOrdersApi.list();
        const list = res?.data?.orders || res?.orders || [];
        if (!cancelled) setOrders(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled)
          setError(e?.response?.data?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completed = orders.filter((o) => o.status === "completed");
  const pending = orders.filter((o) => o.status === "pending");
  const earnings = completed.reduce(
    (total, o) => total + Number(o.total_amount || o.amount || 0),
    0,
  );

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: ClipboardList,
      color: "blue",
      iconBg: "#eff6ff",
      iconColor: "#3b82f6",
    },
    {
      label: "Pending",
      value: pending.length,
      icon: Clock3,
      color: "amber",
      iconBg: "#fffbeb",
      iconColor: "#f59e0b",
    },
    {
      label: "Completed",
      value: completed.length,
      icon: CheckCircle2,
      color: "emerald",
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
    },
    {
      label: "Earnings",
      value: formatCurrency(earnings),
      icon: IndianRupee,
      color: "violet",
      iconBg: "#f5f3ff",
      iconColor: "#8b5cf6",
    },
  ];

  const [hasPremium, setHasPremium] = useState(true);

  useEffect(() => {
    setHasPremium(isPremiumActive(user) || isPremiumActive());
  }, [user]);

  const quickActions = [
    {
      label: "My Services",
      sublabel: "Add & manage",
      path: "/seller/services",
      icon: BriefcaseBusiness,
      iconBg: "#eff6ff",
      iconColor: "#3b82f6",
    },
    {
      label: "Orders",
      sublabel: `${pending.length} pending`,
      path: "/seller/orders",
      icon: ClipboardList,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
    },
    {
      label: "Wallet",
      sublabel: "Credits & billing",
      path: "/seller/wallet",
      icon: Wallet,
      iconBg: "#ecfdf5",
      iconColor: "#059669",
    },
    {
      label: "Lead Alerts",
      sublabel: "New customers",
      path: "/seller/dashboard/leads",
      icon: Megaphone,
      iconBg: "#faf5ff",
      iconColor: "#7c3aed",
    },
  ];

  return (
    <div className="seller-page space-y-5 animate-fade-in">

      {/* ── Welcome Hero Card ── */}
      <div className="seller-welcome-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, color: '#ffffff' }}>{today}</p>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Welcome, {user?.name?.split(' ')[0] || "Seller"} 👋
              </h1>
              <p style={{ fontSize: 13, opacity: 0.85, marginTop: 4, color: '#ffffff' }}>
                {user?.is_available ? "You're online and accepting orders" : "You're currently offline"}
              </p>
            </div>
            {hasPremium && (
              <span style={{
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 12,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 800,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
              }}>
                👑 Premium
              </span>
            )}
          </div>

          {/* Inline stats summary */}
          <div className="flex items-center gap-4 mt-4" style={{ fontSize: 13, color: '#ffffff' }}>
            <div className="flex items-center gap-1.5" style={{ opacity: 0.9 }}>
              <TrendingUp size={14} />
              <span style={{ fontWeight: 700 }}>{formatCurrency(earnings)}</span>
              <span style={{ opacity: 0.8 }}>earned</span>
            </div>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.25)' }} />
            <div style={{ opacity: 0.9 }}>
              <span style={{ fontWeight: 700 }}>{orders.length}</span> orders
            </div>
          </div>
        </div>
      </div>

      {/* ── Offline Banner ── */}
      {!user?.is_available && (
        <div className="seller-offline-banner">
          <div className="seller-offline-icon">
            <AlertTriangle size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>
              You're Offline / आप ऑफ़लाइन हैं
            </p>
            <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 2, fontWeight: 500 }}>
              Tap "Online" in header to start receiving bookings
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await apiClient.patch("/sellers/me/toggle-availability");
                if (res?.data?.success) {
                  updateUser({ is_available: 1 });
                }
              } catch (err) {
                alert("Failed to go online");
              }
            }}
            className="seller-action-btn seller-action-btn--success"
            style={{ padding: '10px 18px', minHeight: 40, fontSize: 13 }}
          >
            Go Online
          </button>
        </div>
      )}

      {error && (
        <div style={{
          borderRadius: 14,
          border: '1px solid #fecaca',
          background: '#fef2f2',
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: '#b91c1c',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Stat Chips — Horizontal Scroll ── */}
      <div className="seller-scroll-row">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`seller-stat-chip seller-stat-chip--${stat.color}`}>
              <div className="seller-stat-icon" style={{ background: stat.iconBg }}>
                <Icon size={20} style={{ color: stat.iconColor }} />
              </div>
              <div className="seller-stat-value">
                {loading ? "…" : stat.value}
              </div>
              <div className="seller-stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Actions Grid ── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Quick Actions
        </h2>
        <div className="seller-quick-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path} className="seller-quick-item">
                <div className="seller-quick-icon" style={{ background: action.iconBg }}>
                  <Icon size={24} style={{ color: action.iconColor }} />
                </div>
                <div className="seller-quick-label">{action.label}</div>
                <div className="seller-quick-sublabel">{action.sublabel}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Premium Boost Banner ── */}
      {!hasPremium && (
        <div className="seller-card" style={{ overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            padding: '20px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Rocket size={24} style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800 }}>Boost with Premium</h3>
              <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                Get top placement, highlighted pin & gold badge
              </p>
            </div>
            <Link
              to="/seller/packages"
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Upgrade →
            </Link>
          </div>
        </div>
      )}

      {/* ── Recent Orders — Mobile Card Feed ── */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Recent Orders</h2>
          <Link
            to="/seller/orders"
            className="flex items-center gap-1 text-blue-600"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="seller-empty-state" style={{ padding: '32px 24px' }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid #eff6ff',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="seller-empty-state">
            <div className="seller-empty-icon">
              <ClipboardList size={28} />
            </div>
            <div className="seller-empty-title">No orders yet</div>
            <div className="seller-empty-text">
              Your bookings will appear here once customers start booking your services.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="seller-order-card">
                <div className="seller-order-header">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                      {order.order_number || `#${order.id}`}
                    </span>
                    <span className={`seller-status-pill seller-status-pill--${order.status}`}>
                      <span className="seller-status-dot" />
                      {order.status?.replace("_", " ")}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short"
                        })
                      : "—"}
                  </span>
                </div>

                <div className="seller-order-body">
                  <div className="seller-order-info-row">
                    <div
                      className="seller-order-avatar"
                      style={{ background: '#eff6ff', color: '#3b82f6' }}
                    >
                      {(order.buyer_name || order.customer_name || "G")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                        {order.buyer_name || order.customer_name || "Guest"}
                      </div>
                      <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>
                        {order.service_title || order.service_name || "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#059669' }}>
                        {formatCurrency(order.total_amount)}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, textTransform: 'capitalize' }}>
                        {order.payment_method || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
