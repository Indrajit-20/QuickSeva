import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3, IndianRupee, Rocket } from "lucide-react";
import { formatCurrency, statusClasses } from "./sellerData";
import { useAuth } from "../../context/AuthContext";
import { sellerOrdersApi } from "../../api/orderApi";
import { Link } from "react-router-dom";
import { isPremiumActive } from "../../utils/premium";
import apiClient from "../../api/axiosConfig";

const cardBase =
  "rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5";

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
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: ClipboardList,
      color: "text-indigo-300 bg-indigo-500/15",
    },
    {
      label: "Pending Orders",
      value: pending.length,
      icon: Clock3,
      color: "text-amber-300 bg-amber-500/15",
    },
    {
      label: "Completed Orders",
      value: completed.length,
      icon: CheckCircle2,
      color: "text-emerald-300 bg-emerald-500/15",
    },
    {
      label: "Total Earnings",
      value: formatCurrency(earnings),
      icon: IndianRupee,
      color: "text-violet-300 bg-violet-500/15",
    },
  ];

  const [hasPremium, setHasPremium] = useState(true);

  useEffect(() => {
    setHasPremium(isPremiumActive(user) || isPremiumActive());
  }, [user]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-300">{today}</p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Welcome back, {user?.name || "Seller"}!
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {/* Availability Status Badge & Toggle */}
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs shadow-sm">
            <span className={`h-2 w-2 rounded-full ${user?.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className={`font-bold ${user?.is_available ? 'text-emerald-600' : 'text-rose-500'}`}>
              {user?.is_available ? 'Active / चालू' : 'Inactive / बंद'}
            </span>
            <button
              onClick={async () => {
                try {
                  const res = await apiClient.patch("/sellers/me/toggle-availability");
                  if (res?.data?.success) {
                    updateUser({ is_available: user?.is_available ? 0 : 1 });
                  }
                } catch (err) {
                  console.error(err);
                  alert("Failed to toggle availability");
                }
              }}
              className={`relative inline-flex h-5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user?.is_available ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 hover:bg-slate-400'}`}
              title={user?.is_available ? "Active: Customers can see and book your services / चालू: ग्राहक आपकी सेवाएं देख सकते हैं" : "Inactive: Customers cannot see or book your services / बंद: ग्राहक आपकी सेवाएं नहीं देख सकते"}
              aria-label="Toggle availability"
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${user?.is_available ? 'translate-x-3' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {hasPremium && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              👑 Premium Member
            </span>
          )}
        </div>
      </div>

      {/* Offline Status Alert Banner */}
      {!user?.is_available && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-start gap-3.5 animate-pulse">
          <span className="text-2xl mt-0.5 select-none">⚠️</span>
          <div>
            <h3 className="text-base font-bold text-rose-300">
              You are currently Offline / आप अभी ऑफ़लाइन हैं
            </h3>
            <p className="text-sm text-rose-200/90 mt-1 font-medium leading-relaxed">
              Your services are hidden from customers. Switch your status to <strong className="text-white bg-rose-600/50 px-1.5 py-0.5 rounded font-bold">Active / चालू</strong> in the top header or sidebar to start showing up in searches and receiving new bookings.
            </p>
            <p className="text-xs text-rose-300/80 mt-1 font-medium">
              आपकी सेवाएं ग्राहकों को दिखाई नहीं दे रही हैं। ग्राहकों की खोज में दिखने और नई बुकिंग प्राप्त करने के लिए ऊपर या साइडबार में अपनी स्थिति को <strong className="text-white bg-rose-600/50 px-1.5 py-0.5 rounded font-bold">Active / चालू</strong> पर बदलें।
            </p>
          </div>
        </div>
      )}

      {/* Premium Boost Banner */}
      {!hasPremium && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
              <Rocket className="rotate-45" size={24} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Boost your profile with Premium Membership</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Get top results in searches, highlight your map pin, and display a gold badge to attract more customers.
            </p>
          </div>
          <div>
            <Link
              to="/seller/packages"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold force-text-white bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-lg shadow-purple-600/20"
            >
              GET PREMIUM MEMBERSHIP
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={cardBase}>
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}
              >
                <Icon size={22} />
              </div>
              <div className="text-3xl font-black text-white">
                {loading ? "…" : stat.value}
              </div>
              <div className="mt-1 text-sm font-medium text-[#94a3b8]">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      <section className={cardBase}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            {orders.length} total
          </span>
        </div>

        {loading ? (
          <div className="rounded-lg border border-dashed border-indigo-400/30 p-8 text-center text-[#94a3b8]">
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-indigo-400/30 p-8 text-center text-[#94a3b8]">
            No orders yet — your bookings will appear here
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-indigo-500/20 text-xs uppercase text-[#94a3b8]">
                <tr>
                  <th className="py-3 pr-4">Order #</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Service</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="text-slate-200">
                    <td className="py-4 pr-4 font-bold text-white">
                      {order.order_number || order.id}
                    </td>
                    <td className="py-4 pr-4">
                      {order.buyer_name || order.customer_name || "—"}
                    </td>
                    <td className="py-4 pr-4">
                      {order.service_title || order.service_name || "—"}
                    </td>
                    <td className="py-4 pr-4 font-semibold">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                          statusClasses[order.status] ||
                          "border-slate-400/30 bg-slate-400/10 text-slate-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-[#94a3b8]">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
