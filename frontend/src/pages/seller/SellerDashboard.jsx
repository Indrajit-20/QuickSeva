import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3, IndianRupee } from "lucide-react";
import { formatCurrency, statusClasses } from "./sellerData";
import { useAuth } from "../../context/AuthContext";
import { sellerOrdersApi } from "../../api/orderApi";

const cardBase =
  "rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5";

export default function SellerDashboard() {
  const { user } = useAuth();

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

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-300">{today}</p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Welcome back, {user?.name || "Seller"}!
        </h1>
      </div>

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
