import { CheckCircle2, ClipboardList, Clock3, IndianRupee } from "lucide-react";
import {
  formatCurrency,
  loadArray,
  mockOrders,
  statusClasses,
} from "./sellerData";
import { useAuth } from "../../context/AuthContext";

const cardBase =
  "rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5";

export default function SellerDashboard() {
  const { user } = useAuth();

  const sellerPremium = (() => {
    try {
      return JSON.parse(localStorage.getItem("sellerPremium") || "null");
    } catch {
      return null;
    }
  })();

  const isExpiredPremium =
    sellerPremium?.expiresAt && new Date(sellerPremium.expiresAt) <= new Date();
  const expiredPlanName = sellerPremium?.plan
    ? sellerPremium.plan.charAt(0).toUpperCase() + sellerPremium.plan.slice(1)
    : "Premium";

  const orders = loadArray("sellerOrders", mockOrders);

  const completed = orders.filter((order) => order.status === "completed");
  const pending = orders.filter((order) => order.status === "pending");
  const earnings = completed.reduce(
    (total, order) => total + Number(order.amount || 0),
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

      {isExpiredPremium && (
        <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          ⚠️ Your <strong>{expiredPlanName}</strong> plan expired on{" "}
          {new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(sellerPremium.expiresAt))}
          . Renew now to regain top placement.
          <div className="mt-3">
            <a
              href="/seller/packages"
              className="inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 text-xs font-bold text-[#1e1b4b] hover:bg-yellow-400"
            >
              Renew Plan →
            </a>
          </div>
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
              <div className="text-3xl font-black text-white">{stat.value}</div>
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

        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-indigo-400/30 p-8 text-center text-[#94a3b8]">
            No orders yet — your bookings will appear here
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-indigo-500/20 text-xs uppercase text-[#94a3b8]">
                <tr>
                  <th className="py-3 pr-4">Order ID</th>
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
                      {order.id}
                    </td>
                    <td className="py-4 pr-4">{order.customer}</td>
                    <td className="py-4 pr-4">{order.service}</td>
                    <td className="py-4 pr-4 font-semibold">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                          statusClasses[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-[#94a3b8]">{order.date}</td>
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
