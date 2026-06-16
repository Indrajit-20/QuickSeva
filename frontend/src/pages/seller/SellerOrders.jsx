import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { formatCurrency, statusClasses } from "./sellerData";
import { sellerOrdersApi } from "../../api/orderApi";

import PageTransition from "../../components/PageTransition";
import "../../index.css";

const tabs = ["all", "pending", "accepted", "in_progress", "completed", "cancelled"];

const maskPhone = (phone) =>
  phone ? `${String(phone).slice(0, 2)}XXXXXX${String(phone).slice(-2)}` : "";

export default function SellerOrders() {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await sellerOrdersApi.list();
      const list = res?.data?.orders || res?.orders || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [activeTab, orders]);

  const runAction = async (action, id) => {
    setBusyId(id);
    try {
      if (action === "accept") await sellerOrdersApi.accept(id);
      else if (action === "start") await sellerOrdersApi.start(id);
      else if (action === "complete") await sellerOrdersApi.complete(id);
      else if (action === "cancel")
        await sellerOrdersApi.cancel(id, { reason: "Cancelled by seller" });
      await fetchOrders();
    } catch (e) {
      alert(e?.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageTransition>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white gradient-text-purple">
            Orders
          </h1>
          <p className="mt-1 text-[#94a3b8]">
            Review bookings and update order status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
                activeTab === tab
                  ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                  : "border border-indigo-500/20 bg-[#1a1830] text-[#94a3b8] hover:text-white"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-dashed border-indigo-400/30 bg-[#1a1830] p-8 text-center text-[#94a3b8]">
            Loading orders…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-indigo-400/30 bg-[#1a1830] p-8 text-center text-[#94a3b8]">
            No {activeTab.replace("_", " ")} orders
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const id = order.id;
              const number = order.order_number || `#${id}`;
              const customer = order.buyer_name || order.customer_name || "Guest";
              const service = order.service_title || order.service_name || "—";
              const amount = order.total_amount;
              const phone = order.buyer_phone || order.customer_phone;
              const busy = busyId === id;

              return (
                <article
                  key={id}
                  className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-white">
                          {number}
                        </h2>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                            statusClasses[order.status] ||
                            "border-slate-400/30 bg-slate-400/10 text-slate-300"
                          }`}
                        >
                          {order.status?.replace("_", " ")}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="block text-xs text-[#94a3b8]">
                            Customer
                          </span>
                          <span className="font-semibold text-white">
                            {customer}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-[#94a3b8]">
                            Service
                          </span>
                          <span>{service}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-[#94a3b8]">
                            Amount
                          </span>
                          <span className="font-semibold">
                            {amount !== undefined && amount !== null
                              ? formatCurrency(amount)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-[#94a3b8]">
                            Date
                          </span>
                          <span>
                            {order.scheduled_at || order.created_at
                              ? new Date(
                                  order.scheduled_at || order.created_at,
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {order.status === "completed" && phone && (
                        <div className="mt-3">
                          <span className="block text-xs text-[#94a3b8]">
                            Phone
                          </span>
                          <span className="font-semibold text-white">
                            {maskPhone(phone)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {order.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction("accept", id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm font-bold text-sky-200 transition hover:bg-sky-500/20 disabled:opacity-50"
                          >
                            <CheckCircle2 size={16} />
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction("cancel", id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            Cancel
                          </button>
                        </>
                      )}
                      {order.status === "accepted" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("start", id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50"
                        >
                          <PlayCircle size={16} />
                          Start
                        </button>
                      )}
                      {order.status === "in_progress" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("complete", id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
