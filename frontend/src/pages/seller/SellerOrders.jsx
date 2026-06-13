import { useMemo, useState } from "react";
import { CheckCircle2, Download, MessageSquare, XCircle } from "lucide-react";
import {
  formatCurrency,
  loadArray,
  mockOrders,
  statusClasses,
} from "./sellerData";

const tabs = ["all", "pending", "completed", "cancelled"];

import PageTransition from "../../components/PageTransition";
import "../../index.css";
import {
  generateInvoicePDF,
  openWhatsAppInvoice,
} from "../../utils/invoiceGenerator";

const maskPhone = (phone) =>
  phone ? `${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}` : "";

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
      order.id === id || order.order_id === id ? { ...order, status } : order,
    );
    setOrders(nextOrders);
    localStorage.setItem("sellerOrders", JSON.stringify(nextOrders));
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
            {filteredOrders.map((order) => {
              const orderId = order.order_id || order.id;
              const customerName =
                order.customer_name ||
                order.customerName ||
                order.customer ||
                order.mobile ||
                "Guest";
              const serviceName =
                order.service_name ||
                order.serviceDetail ||
                order.sellerService ||
                order.service ||
                "—";
              const customerPhone = order.customer_phone;
              const amount =
                order.total_amount !== undefined
                  ? order.total_amount
                  : order.amount;

              return (
                <article
                  key={orderId}
                  className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-white">
                          {orderId}
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
                            {customerName}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-[#94a3b8]">
                            Service
                          </span>
                          <span>{serviceName}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-[#94a3b8]">
                            Amount
                          </span>
                          <span className="font-semibold">
                            {amount !== undefined && amount !== null
                              ? formatCurrency(amount)
                              : "Not specified"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-[#94a3b8]">
                            Date
                          </span>
                          <span>
                            {order.date
                              ? new Date(order.date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {order.status === "completed" && (
                        <div className="mt-3">
                          <span className="block text-xs text-[#94a3b8]">
                            Phone
                          </span>
                          <span className="font-semibold text-white">
                            {maskPhone(customerPhone)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {order.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(orderId, "completed")}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 size={16} />
                            Mark Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(orderId, "cancelled")}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
                          >
                            <XCircle size={16} />
                            Cancel
                          </button>
                        </>
                      )}

                      {order.status !== "pending" &&
                        order.status !== "completed" && (
                          <div className="rounded-lg border border-[rgba(99,102,241,0.2)] bg-[#1a1830] px-3 py-2 text-sm font-bold text-[#94a3b8]">
                            —
                          </div>
                        )}

                      {order.status === "completed" && (
                        <>
                          <button
                            type="button"
                            onClick={() => generateInvoicePDF(order)}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-[#1a1830] px-3 py-2 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/10"
                          >
                            <Download size={16} />
                            Download Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => openWhatsAppInvoice(order)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-bold text-[#0b2a17] transition hover:brightness-95"
                          >
                            <MessageSquare size={16} />
                            Send on WhatsApp
                          </button>
                        </>
                      )}

                      {order.status === "pending" && (
                        <div className="inline-flex items-center rounded-lg bg-[#1a1830] px-3 py-2 text-sm font-bold text-[#94a3b8]">
                          ⏳ Invoice available after completion
                        </div>
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
