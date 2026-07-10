import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { formatCurrency, statusClasses } from "./sellerData";
import { sellerOrdersApi } from "../../api/orderApi";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axiosConfig";

import PageTransition from "../../components/PageTransition";
import "../../index.css";

const tabs = ["all", "pending", "accepted", "in_progress", "quoted", "completed", "cancelled"];

const maskPhone = (phone) =>
  phone ? `${String(phone).slice(0, 2)}XXXXXX${String(phone).slice(-2)}` : "";

export default function SellerOrders() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Quotation states
  const [quotingOrderId, setQuotingOrderId] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    service_charge: "",
    parts_cost: "",
    discount: "",
    notes: "",
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // OTP verification states
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Completion PIN verification states (for cash payments)
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [completionPin, setCompletionPin] = useState("");
  const [verifyingCompletionPin, setVerifyingCompletionPin] = useState(false);

  const handleCompletionPinVerify = async (e) => {
    e.preventDefault();
    if (!completingOrderId || !completionPin) return;
    setVerifyingCompletionPin(true);
    try {
      await sellerOrdersApi.complete(completingOrderId, { otp: completionPin });
      setCompletingOrderId(null);
      setCompletionPin("");
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Invalid secure completion PIN");
    } finally {
      setVerifyingCompletionPin(false);
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!quotingOrderId) return;
    setSubmittingQuote(true);
    try {
      await sellerOrdersApi.submitQuotation(quotingOrderId, {
        service_charge: Number(quoteForm.service_charge) || 0,
        parts_cost: Number(quoteForm.parts_cost) || 0,
        discount: Number(quoteForm.discount) || 0,
        notes: quoteForm.notes,
      });
      alert("Quotation estimate sent to customer!");
      setQuotingOrderId(null);
      setQuoteForm({ service_charge: "", parts_cost: "", discount: "", notes: "" });
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit quotation");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!verifyingOrderId || !otpCode) return;
    setVerifyingOtp(true);
    try {
      await sellerOrdersApi.verifyStartCode(verifyingOrderId, otpCode);
      setVerifyingOrderId(null);
      setOtpCode("");
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Invalid start code");
    } finally {
      setVerifyingOtp(false);
    }
  };

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
      else if (action === "complete") {
        const order = orders.find((o) => o.id === id);
        if (order && order.payment_method === "cash") {
          setCompletingOrderId(id);
          setCompletionPin("");
          setVerifyingCompletionPin(false);
          setBusyId(null);
          return;
        }
        await sellerOrdersApi.complete(id);
      }
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
                            Amount / कुल राशि
                          </span>
                          <span className="font-semibold text-emerald-400">
                            Visit: {order.visiting_charge_amount ? formatCurrency(order.visiting_charge_amount) : formatCurrency(amount || 0)}
                          </span>
                          {order.service_charge_amount > 0 && (
                            <span className="block text-xs text-indigo-300">
                              Work: +{formatCurrency(parseFloat(order.service_charge_amount) + parseFloat(order.parts_cost_amount || 0) - parseFloat(order.discount_amount || 0))}
                            </span>
                          )}
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

                      {["accepted", "in_progress", "quoted", "completed"].includes(order.status) && (
                        <div className="mt-4 grid gap-3 border-t border-indigo-500/10 pt-4 text-sm sm:grid-cols-2">
                          {phone && (
                            <div>
                              <span className="block text-xs text-[#94a3b8]">
                                Contact Phone
                              </span>
                              <span className="font-semibold text-white">
                                {order.status === "completed" ? maskPhone(phone) : phone}
                              </span>
                            </div>
                          )}
                          {order.address && (
                            <div>
                              <span className="block text-xs text-[#94a3b8]">
                                Service Address
                              </span>
                              <span className="font-semibold text-white">
                                {order.address}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Render quotation form if active */}
                    {quotingOrderId === id && (
                      <form onSubmit={handleQuoteSubmit} className="mt-4 p-4 rounded-xl border border-indigo-500/25 bg-[#0f0e1a] space-y-3.5 w-full">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Quotation / नया पक्का बिल बनाएं</h3>
                        
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Service Fee / काम का दाम (₹)</label>
                            <input
                              type="number"
                              required
                              value={quoteForm.service_charge}
                              onChange={(e) => setQuoteForm({ ...quoteForm, service_charge: e.target.value })}
                              placeholder="E.g. 500"
                              className="w-full rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Parts/Materials / सामान का दाम (₹, Optional)</label>
                            <input
                              type="number"
                              value={quoteForm.parts_cost}
                              onChange={(e) => setQuoteForm({ ...quoteForm, parts_cost: e.target.value })}
                              placeholder="E.g. 200"
                              className="w-full rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Discount / छूट (₹, Optional)</label>
                            <input
                              type="number"
                              value={quoteForm.discount}
                              onChange={(e) => setQuoteForm({ ...quoteForm, discount: e.target.value })}
                              placeholder="E.g. 50"
                              className="w-full rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Quotation Notes / विवरण</label>
                          <textarea
                            value={quoteForm.notes}
                            onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                            placeholder="Describe parts replaced or additional tasks done..."
                            rows="2"
                            className="w-full rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setQuotingOrderId(null)}
                            className="rounded-lg border border-slate-500/30 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 active:scale-95 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingQuote}
                            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-lg active:scale-95 transition"
                          >
                            {submittingQuote ? "Submitting..." : "Send Estimate"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Render OTP verification form if active */}
                    {verifyingOrderId === id && (
                      <form onSubmit={handleOtpVerify} className="mt-4 p-4 rounded-xl border border-indigo-500/25 bg-[#0f0e1a] space-y-3 w-full">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verify Start Code / काम शुरू करने का कोड</h3>
                        <p className="text-[10px] text-slate-400">Ask the customer for the 4-digit code shown on their booking screen.</p>
                        
                        <div className="flex gap-3 max-w-xs items-center">
                          <input
                            type="text"
                            required
                            maxLength="4"
                            pattern="\d{4}"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="E.g. 4812"
                            className="rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2 text-center text-base font-black tracking-widest text-white outline-none focus:border-indigo-500 w-28"
                          />
                          <button
                            type="submit"
                            disabled={verifyingOtp || otpCode.length !== 4}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-lg active:scale-95 transition disabled:opacity-50"
                          >
                            {verifyingOtp ? "Verifying..." : "Verify & Start"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setVerifyingOrderId(null)}
                            className="text-xs font-semibold text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Render Completion PIN verification form for cash orders */}
                    {completingOrderId === id && (
                      <form onSubmit={handleCompletionPinVerify} className="mt-4 p-4 rounded-xl border border-amber-500/25 bg-[#0f0e1a] space-y-3 w-full text-left">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">Verify Completion PIN / भुगतान सत्यापन पिन</h3>
                        <p className="text-[10px] text-slate-400">Ask the customer for the 4-digit Completion PIN to verify receipt of Cash.</p>
                        
                        <div className="flex gap-3 max-w-xs items-center">
                          <input
                            type="text"
                            required
                            maxLength="4"
                            pattern="\d{4}"
                            value={completionPin}
                            onChange={(e) => setCompletionPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="E.g. 5923"
                            className="rounded-lg border border-amber-500/20 bg-[#16152b] px-3 py-2 text-center text-base font-black tracking-widest text-white outline-none focus:border-amber-500 w-28"
                          />
                          <button
                            type="submit"
                            disabled={verifyingCompletionPin || completionPin.length !== 4}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-lg active:scale-95 transition disabled:opacity-50"
                          >
                            {verifyingCompletionPin ? "Verifying..." : "Verify & Complete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompletingOrderId(null)}
                            className="text-xs font-semibold text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
 
                    <div className="flex shrink-0 flex-wrap gap-2 mt-2.5">
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
                      {order.status === "in_progress" && (!order.service_charge_amount || parseFloat(order.service_charge_amount) === 0) && (
                        <button
                          type="button"
                          disabled={busy || quotingOrderId === id}
                          onClick={() => setQuotingOrderId(id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50 shadow-md"
                        >
                          ➕ Create Quotation / बिल बनाएं
                        </button>
                      )}
                      {order.status === "in_progress" && order.service_charge_amount > 0 && (
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
                      {order.status === "quoted" && (
                        <>
                          {order.final_payment_status === "paid" ? (
                            <button
                              type="button"
                              disabled={busy || verifyingOrderId === id}
                              onClick={() => {
                                setVerifyingOrderId(id);
                                setOtpCode("");
                              }}
                              className="inline-flex items-center gap-2 rounded-lg border border-teal-400/30 bg-teal-500/10 px-3 py-2 text-sm font-bold text-teal-200 transition hover:bg-teal-500/20 shadow-md"
                            >
                              🔑 Enter Start Code / कोड डालें
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-amber-300 bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded-lg">
                              ⏳ Awaiting Customer Approval / मंजूरी का इंतज़ार
                            </span>
                          )}
                        </>
                      )}
                      {order.status === "completed" && (
                        <button
                          type="button"
                          onClick={() => {
                            const payload = {
                              ...order,
                              customer_name: order.customer_name || "Customer",
                              customer_phone: order.customer_phone || "",
                              service_name: order.service_name || "Service",
                              seller_business: order.seller_business || "QuickSeva",
                              date: order.scheduled_at || order.created_at || order.date
                            };
                            import("../../utils/invoiceGenerator").then((m) =>
                              m.generateInvoicePDF(payload)
                            );
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-sm font-bold text-purple-200 transition hover:bg-purple-500/20"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Invoice
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
