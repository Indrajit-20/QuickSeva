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
  const [partsList, setPartsList] = useState([]);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  const handleAddPart = () => {
    setPartsList([...partsList, { name: "", price: "" }]);
  };

  const handleRemovePart = (index) => {
    const updated = partsList.filter((_, i) => i !== index);
    setPartsList(updated);
    const sum = updated.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    setQuoteForm(prev => ({
      ...prev,
      parts_cost: sum > 0 ? String(sum) : ""
    }));
  };

  const handlePartChange = (index, field, value) => {
    const updated = partsList.map((part, i) => {
      if (i === index) {
        return { ...part, [field]: value };
      }
      return part;
    });
    setPartsList(updated);

    if (field === "price") {
      const sum = updated.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
      setQuoteForm(prev => ({
        ...prev,
        parts_cost: sum > 0 ? String(sum) : ""
      }));
    }
  };

  // OTP verification states
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Completion PIN verification states (for cash payments)
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [completionPin, setCompletionPin] = useState("");
  const [verifyingCompletionPin, setVerifyingCompletionPin] = useState(false);

  // Cancellation states
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const handleCancelConfirm = async () => {
    if (!cancellingOrderId || !cancelReasonInput.trim()) return;
    setSubmittingCancel(true);
    try {
      await sellerOrdersApi.cancel(cancellingOrderId, { reason: cancelReasonInput.trim() });
      alert("Order cancelled successfully!");
      setCancellingOrderId(null);
      await fetchOrders();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to cancel order");
    } finally {
      setSubmittingCancel(false);
    }
  };

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

    // Validate parts list: price is required if a row is present
    const invalidParts = partsList.filter(p => !p.price || parseFloat(p.price) <= 0);
    if (invalidParts.length > 0) {
      alert("Please enter a valid price for all added parts / कृपया जोड़े गए सभी सामानों के लिए सही दाम दर्ज करें।");
      return;
    }

    const serviceCharge = parseFloat(quoteForm.service_charge) || 0;
    const partsCost = parseFloat(quoteForm.parts_cost) || 0;
    const discount = parseFloat(quoteForm.discount) || 0;

    if (serviceCharge < 0) {
      alert("Service Fee cannot be negative / काम का दाम ऋणात्मक नहीं हो सकता।");
      return;
    }
    if (partsCost < 0) {
      alert("Parts cost cannot be negative / सामान का चार्ज ऋणात्मक नहीं हो सकता।");
      return;
    }
    if (discount < 0) {
      alert("Discount cannot be negative / छूट ऋणात्मक नहीं हो सकती।");
      return;
    }
    if (discount > (serviceCharge + partsCost)) {
      alert("Discount cannot exceed the sum of Service Fee and Parts Cost / छूट काम के दाम और सामान के कुल चार्ज से अधिक नहीं हो सकती।");
      return;
    }

    setSubmittingQuote(true);
    try {
      const finalizedParts = partsList.map(p => ({
        name: p.name.trim() || "Spare Part / सामग्री",
        price: parseFloat(p.price) || 0
      }));

      const notesPayload = JSON.stringify({
        notes: quoteForm.notes,
        parts: finalizedParts
      });

      await sellerOrdersApi.submitQuotation(quotingOrderId, {
        service_charge: serviceCharge,
        parts_cost: partsCost,
        discount: discount,
        notes: notesPayload,
      });
      alert("Quotation estimate sent to customer!");
      setQuotingOrderId(null);
      setPartsList([]);
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

  const fetchOrders = async (initial = true) => {
    try {
      if (initial) setLoading(true);
      setError(null);
      const res = await sellerOrdersApi.list();
      const list = res?.data?.orders || res?.orders || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (e) {
      if (initial) setError(e?.response?.data?.message || "Failed to load orders");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const tabCounts = useMemo(() => {
    const counts = { all: orders.length };
    orders.forEach((o) => {
      const status = o.status;
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [orders]);

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
          const totalAmount = parseFloat(order.service_charge_amount || 0) + parseFloat(order.parts_cost_amount || 0) - parseFloat(order.discount_amount || 0) + parseFloat(order.visiting_charge_amount || 0);
          if (!window.confirm(`Have you collected the cash payment of ₹${totalAmount} (including Visiting Charge) from the customer? / क्या आपने ग्राहक से ₹${totalAmount} (विजिटिंग चार्ज सहित) का नकद भुगतान प्राप्त कर लिया है?`)) {
            setBusyId(null);
            return;
          }
        }
        await sellerOrdersApi.complete(id);
      }
      else if (action === "cancel") {
        setCancellingOrderId(id);
        setCancelReasonInput("");
        setBusyId(null);
        return;
      }
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
          {tabs.map((tab) => {
            const count = tabCounts[tab] || 0;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition flex items-center gap-2 ${
                  activeTab === tab
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                    : "border border-indigo-500/20 bg-[#1a1830] text-[#94a3b8] hover:text-white"
                }`}
              >
                <span>{tab.replace("_", " ")}</span>
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${
                    activeTab === tab ? "bg-white text-indigo-600" : "bg-indigo-500/20 text-indigo-300"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
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

                      {/* Quotation breakdown for seller */}
                      {order.service_charge_amount > 0 && (
                        <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/10 text-xs space-y-2">
                          <div className="font-bold text-indigo-300">Quotation Summary / पक्का बिल विवरण:</div>
                          <div className="flex justify-between text-slate-300">
                            <span>Service Fee / काम का दाम:</span>
                            <span>{formatCurrency(order.service_charge_amount)}</span>
                          </div>
                          
                          {/* Parts breakdown */}
                          {(() => {
                            let parsedNotes = { notes: order.quotation_notes || "", parts: [] };
                            try {
                              if (order.quotation_notes && order.quotation_notes.startsWith("{")) {
                                parsedNotes = JSON.parse(order.quotation_notes);
                              }
                            } catch (e) {}

                            return (
                              <>
                                {parsedNotes.parts && parsedNotes.parts.length > 0 ? (
                                  <div className="space-y-1.5 pl-2 border-l border-indigo-500/20 my-1">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Itemized Parts / सामानों की सूची:</span>
                                    {parsedNotes.parts.map((p, idx) => (
                                      <div key={idx} className="flex justify-between text-slate-400 text-[11px]">
                                        <span>• {p.name}:</span>
                                        <span>{formatCurrency(p.price)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between text-slate-300 font-semibold border-t border-indigo-500/5 pt-1">
                                      <span>Total Parts Cost:</span>
                                      <span>{formatCurrency(order.parts_cost_amount)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  order.parts_cost_amount > 0 && (
                                    <div className="flex justify-between text-slate-300">
                                      <span>Parts/Materials / सामान का दाम:</span>
                                      <span>{formatCurrency(order.parts_cost_amount)}</span>
                                    </div>
                                  )
                                )}
                                
                                {parsedNotes.notes && (
                                  <div className="text-slate-400 italic text-[11px] mt-1 border-t border-indigo-500/5 pt-1.5">
                                    <span className="font-bold not-italic text-slate-300">Notes:</span> {parsedNotes.notes}
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          {order.discount_amount > 0 && (
                            <div className="flex justify-between text-red-400 font-semibold">
                              <span>Discount / छूट:</span>
                              <span>-{formatCurrency(order.discount_amount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-white font-extrabold border-t border-indigo-500/10 pt-1.5 mt-1.5">
                            <span>Stage 2 Subtotal / बकाया कुल राशि:</span>
                            <span>{formatCurrency(parseFloat(order.service_charge_amount) + parseFloat(order.parts_cost_amount || 0) - parseFloat(order.discount_amount || 0))}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Render quotation form if active */}
                    {quotingOrderId === id && (
                      <form onSubmit={handleQuoteSubmit} className="mt-4 p-4 rounded-xl border border-indigo-500/25 bg-[#0f0e1a] space-y-3.5 w-full">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Quotation / नया पक्का बिल बनाएं</h3>
                        
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Service Fee / काम का दाम (₹)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={quoteForm.service_charge}
                              onChange={(e) => setQuoteForm({ ...quoteForm, service_charge: e.target.value })}
                              placeholder="E.g. 500"
                              className="w-full rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Discount / छूट (₹, Optional)</label>
                            <input
                              type="number"
                              min="0"
                              value={quoteForm.discount}
                              onChange={(e) => setQuoteForm({ ...quoteForm, discount: e.target.value })}
                              placeholder="E.g. 50"
                              className="w-full rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Combined Parts & Materials Section */}
                        <div className="border-t border-indigo-500/10 pt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-slate-400">Parts & Materials / अतिरिक्त सामान का चार्ज (Optional)</label>
                            {partsList.length === 0 && (
                              <button
                                type="button"
                                onClick={handleAddPart}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 active:scale-95 transition"
                              >
                                ➕ Add Part / सामान जोड़ें
                              </button>
                            )}
                          </div>

                          {partsList.length === 0 ? (
                            <div className="text-center py-2 border border-dashed border-indigo-500/10 rounded-lg bg-indigo-950/5">
                              <span className="text-[10px] text-slate-400/80">No parts or extra materials added / कोई अतिरिक्त सामान नहीं जोड़ा गया</span>
                            </div>
                          ) : (
                            <div className="space-y-2.5 p-3 rounded-lg border border-indigo-500/10 bg-[#16152b]/10">
                              {partsList.map((part, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={part.name}
                                      onChange={(e) => handlePartChange(index, "name", e.target.value)}
                                      placeholder="Part Name / सामान का नाम (Optional, e.g. Capacitor)"
                                      className="w-full rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="w-28 flex items-center bg-[#16152b] rounded-lg border border-indigo-500/20 px-3 py-2">
                                    <span className="text-xs text-slate-400 mr-1">₹</span>
                                    <input
                                      type="number"
                                      required
                                      min="1"
                                      value={part.price}
                                      onChange={(e) => handlePartChange(index, "price", e.target.value)}
                                      placeholder="Price / दाम"
                                      className="w-full bg-transparent text-xs text-white outline-none"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePart(index)}
                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition active:scale-95"
                                    title="Remove part"
                                  >
                                    <span className="text-xs font-bold font-mono">✕</span>
                                  </button>
                                </div>
                              ))}
                              
                              <div className="flex items-center justify-between border-t border-indigo-500/10 pt-2 mt-2">
                                <button
                                  type="button"
                                  onClick={handleAddPart}
                                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1.5 rounded-md border border-indigo-500/20 active:scale-95 transition"
                                >
                                  ➕ Add Another Part / और सामान जोड़ें
                                </button>
                                <span className="text-[11px] font-bold text-emerald-400">
                                  Total Parts / कुल सामान: ₹{quoteForm.parts_cost || 0}
                                </span>
                              </div>
                            </div>
                          )}
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
                            onClick={() => { setQuotingOrderId(null); setPartsList([]); }}
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
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction("start", id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50"
                          >
                            <PlayCircle size={16} />
                            Start
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
                      {order.status === "in_progress" && (!order.service_charge_amount || parseFloat(order.service_charge_amount) === 0) && (
                        <>
                          <button
                            type="button"
                            disabled={busy || quotingOrderId === id}
                            onClick={() => setQuotingOrderId(id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50 shadow-md"
                          >
                            ➕ Create Quotation / बिल बनाएं
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
                      {order.status === "in_progress" && order.service_charge_amount > 0 && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction("complete", id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <CheckCircle2 size={16} />
                            Mark Complete
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
                      {order.status === "quoted" && (
                        <>
                          {(order.payment_method === "cash" ? order.completion_otp_code : order.final_payment_status === "paid") ? (
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

      {/* Cancellation Modal Overlay */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/25 bg-[#0f0e1a] p-6 shadow-2xl space-y-4 animate-fade-in text-left">
            <div>
              <h3 className="text-lg font-bold text-white">Cancel Booking / बुकिंग रद्द करें</h3>
              <p className="text-xs text-slate-400 mt-1">
                Please provide the reason why you are cancelling this booking. This reason will be logged and shown to the customer.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Cancellation Reason / रद्द करने का कारण <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows="3"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="E.g., I cannot make it today / Out of stock / Customer requested cancellation..."
                className="w-full rounded-lg border border-indigo-500/20 bg-[#16152b] px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none placeholder-slate-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={submittingCancel}
                onClick={() => setCancellingOrderId(null)}
                className="rounded-lg border border-slate-500/30 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 transition"
              >
                Go Back / वापस जाएं
              </button>
              <button
                type="button"
                disabled={submittingCancel || !cancelReasonInput.trim()}
                onClick={handleCancelConfirm}
                className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg active:scale-95 transition"
              >
                {submittingCancel ? "Cancelling..." : "Confirm Cancel / रद्द करें"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
