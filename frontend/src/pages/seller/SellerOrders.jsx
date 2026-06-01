import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  formatCurrency,
  loadArray,
  mockOrders,
  statusClasses,
} from "./sellerData";

const tabs = ["all", "pending", "completed", "cancelled"];

import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import "../../index.css";

export default function SellerOrders() {
  const [activeTab, setActiveTab] = useState("all");

  const [orders, setOrders] = useState(() =>
    loadArray("sellerOrders", mockOrders),
  );

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter((order) => order.status === activeTab);
  }, [activeTab, orders]);

  const updateStatus = (id, status) => {
    const nextOrders = orders.map((order) =>
      order.id === id ? { ...order, status } : order,
    );
    setOrders(nextOrders);
    localStorage.setItem("sellerOrders", JSON.stringify(nextOrders));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <PageTransition>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white gradient-text-purple">
            Orders
          </h1>

          <p className="mt-1 text-[#94a3b8]">
            Review bookings and update pending order status.
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
              {tab}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-indigo-400/30 bg-[#1a1830] p-8 text-center text-[#94a3b8]">
            No {activeTab} orders
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-white">
                        {order.id}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                          statusClasses[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="block text-xs text-[#94a3b8]">
                          Customer
                        </span>
                        <span className="font-semibold text-white">
                          {order.customerName ||
                            order.customer ||
                            order.mobile ||
                            "Guest"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-[#94a3b8]">
                          Service
                        </span>
                        <span>
                          {order.serviceDetail ||
                            order.sellerService ||
                            order.service ||
                            "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-[#94a3b8]">
                          Amount
                        </span>
                        <span className="font-semibold">
                          {order.amount > 0
                            ? formatCurrency(order.amount)
                            : order.amount === 0 && !order.bookedAt
                              ? formatCurrency(0)
                              : "Not specified"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-[#94a3b8]">
                          Date
                        </span>
                        <span>
                          {order.date
                            ? new Date(order.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.status === "pending" && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, "completed")}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 size={16} />
                        Mark Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, "cancelled")}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
