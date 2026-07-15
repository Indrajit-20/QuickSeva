import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PlayCircle, XCircle, Download, FileText, Clock, ChevronRight } from "lucide-react";
import { formatCurrency, statusClasses } from "./sellerData";
import { sellerOrdersApi } from "../../api/orderApi";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axiosConfig";

import PageTransition from "../../components/PageTransition";
import "../../index.css";

const tabs = ["all", "pending", "accepted", "in_progress", "quoted", "completed", "cancelled"];

const maskPhone = (phone) =>
  phone ? `${String(phone).slice(0, 2)}XXXXXX${String(phone).slice(-2)}` : "";

/* ── Reusable section label ─────────────────────────────── */
const FieldLabel = ({ children }) => (
  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
    {children}
  </span>
);

const FieldValue = ({ children, className = "" }) => (
  <span className={`text-sm font-semibold text-slate-800 ${className}`}>{children}</span>
);

export default function SellerOrders() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

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
    setQuoteForm(prev => ({ ...prev, parts_cost: sum > 0 ? String(sum) : "" }));
  };

  const handlePartChange = (index, field, value) => {
    const updated = partsList.map((part, i) =>
      i === index ? { ...part, [field]: value } : part
    );
    setPartsList(updated);
    if (field === "price") {
      const sum = updated.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
      setQuoteForm(prev => ({ ...prev, parts_cost: sum > 0 ? String(sum) : "" }));
    }
  };

  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [completionPin, setCompletionPin] = useState("");
  const [verifyingCompletionPin, setVerifyingCompletionPin] = useState(false);

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

    const invalidParts = partsList.filter(p => !p.price || parseFloat(p.price) <= 0);
    if (invalidParts.length > 0) {
      alert("Please enter a valid price for all added parts / कृपया जोड़े गए सभी सामानों के लिए सही दाम दर्ज करें।");
      return;
    }

    setSubmittingQuote(true);
    try {
      const notesPayload = JSON.stringify({
        notes: quoteForm.notes || "",
        parts: partsList.filter(p => p.name || p.price).map(p => ({
          name: p.name || "Unnamed Part",
          price: parseFloat(p.price) || 0,
        })),
      });

      await sellerOrdersApi.quote(quotingOrderId, {
        service_charge: parseFloat(quoteForm.service_charge) || 0,
        parts_cost: parseFloat(quoteForm.parts_cost) || 0,
        discount: parseFloat(quoteForm.discount) || 0,
        notes: notesPayload,
      });

      setQuotingOrderId(null);
      setPartsList([]);
      setQuoteForm({ service_charge: "", parts_cost: "", discount: "", notes: "" });
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit quote");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!verifyingOrderId || otpCode.length !== 4) return;
    setVerifyingOtp(true);
    try {
      await sellerOrdersApi.start(verifyingOrderId, { otp: otpCode });
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
      const res = await sellerOrdersApi.list();
      const list = res?.data?.orders || res?.orders || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const tabCounts = useMemo(() => {
    const counts = { all: orders.length };
    tabs.slice(1).forEach(t => {
      counts[t] = orders.filter(o => o.status === t).length;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() =>
    activeTab === "all" ? orders : orders.filter(o => o.status === activeTab),
    [orders, activeTab]
  );

  const runAction = async (action, id) => {
    setBusyId(id);
    try {
      if (action === "accept") await sellerOrdersApi.accept(id);
      else if (action === "start") {
        setVerifyingOrderId(id);
        setOtpCode("");
        setBusyId(null);
        return;
      }
      else if (action === "complete") {
        const order = orders.find(o => o.id === id);
        if (order?.payment_method === "cash") {
          setCompletingOrderId(id);
          setCompletionPin("");
          setBusyId(null);
          return;
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

  /* ── Tab label helper ─────────────────────────────────── */
  const tabLabel = (t) => t.replace("_", " ");

  return (
    <PageTransition>
      <div className="animate-fade-in space-y-6" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>

        {/* ── Page Header ─────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
            <p className="mt-0.5 text-sm text-slate-500">Review bookings and update order status.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Clock size={13} />
            <span>{orders.length} total orders</span>
          </div>
        </div>

        {/* ── Filter Tabs ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const count = tabCounts[tab] || 0;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold capitalize transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {tabLabel(tab)}
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Error ───────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            ⚠ {error}
          </div>
        )}

        {/* ── Orders List ─────────────────────────────────── */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading orders…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">No {tabLabel(activeTab)} orders</p>
            <p className="text-sm text-slate-400 mt-1">Orders will appear here once customers book your services.</p>
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
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* ── Card Header ── */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-bold text-slate-800 tracking-tight">{number}</h2>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        statusClasses[order.status] || "border-slate-200 bg-slate-50 text-slate-600"
                      }`}>
                        {order.status?.replace("_", " ")}
                      </span>
                    </div>
                    {order.scheduled_at || order.created_at ? (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(order.scheduled_at || order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    ) : null}
                  </div>

                  {/* ── Order Info Grid ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 pb-4 border-b border-slate-100">
                    <div>
                      <FieldLabel>Customer</FieldLabel>
                      <FieldValue>{customer}</FieldValue>
                    </div>
                    <div>
                      <FieldLabel>Service</FieldLabel>
                      <FieldValue className="text-blue-600">{service}</FieldValue>
                    </div>
                    <div>
                      <FieldLabel>Visit Amount</FieldLabel>
                      <FieldValue className="text-emerald-600">
                        {order.visiting_charge_amount
                          ? formatCurrency(order.visiting_charge_amount)
                          : formatCurrency(amount || 0)}
                      </FieldValue>
                      {order.service_charge_amount > 0 && (
                        <span className="block text-xs text-indigo-600 font-medium mt-0.5">
                          +{formatCurrency(
                            parseFloat(order.service_charge_amount) +
                            parseFloat(order.parts_cost_amount || 0) -
                            parseFloat(order.discount_amount || 0)
                          )} work
                        </span>
                      )}
                    </div>
                    <div>
                      <FieldLabel>Payment</FieldLabel>
                      <FieldValue className="capitalize">{order.payment_method || "—"}</FieldValue>
                    </div>
                  </div>

                  {/* ── Accepted+ Details ── */}
                  {["accepted", "in_progress", "quoted", "completed"].includes(order.status) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {phone && (
                        <div>
                          <FieldLabel>Contact Phone</FieldLabel>
                          <FieldValue>
                            {order.status === "completed" ? maskPhone(phone) : phone}
                          </FieldValue>
                        </div>
                      )}
                      {order.address && (
                        <div>
                          <FieldLabel>Service Address</FieldLabel>
                          <FieldValue>{order.address}</FieldValue>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Quotation Breakdown ── */}
                  {order.service_charge_amount > 0 && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-bold text-blue-700 mb-2.5 uppercase tracking-wide">
                        Quotation Summary / पक्का बिल विवरण
                      </p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-slate-700">
                          <span>Service Fee</span>
                          <span className="font-semibold">{formatCurrency(order.service_charge_amount)}</span>
                        </div>

                        {(() => {
                          let parsedNotes = { notes: order.quotation_notes || "", parts: [] };
                          try {
                            if (order.quotation_notes?.startsWith("{")) {
                              parsedNotes = JSON.parse(order.quotation_notes);
                            }
                          } catch (e) {}

                          return (
                            <>
                              {parsedNotes.parts?.length > 0 && (
                                <div className="pl-3 border-l-2 border-blue-200 my-1.5 space-y-1">
                                  <span className="text-xs text-slate-500 font-semibold block">Parts / Materials:</span>
                                  {parsedNotes.parts.map((p, idx) => (
                                    <div key={idx} className="flex justify-between text-slate-600 text-xs">
                                      <span>• {p.name}</span>
                                      <span>{formatCurrency(p.price)}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between text-slate-700 font-semibold text-xs border-t border-blue-100 pt-1">
                                    <span>Total Parts</span>
                                    <span>{formatCurrency(order.parts_cost_amount)}</span>
                                  </div>
                                </div>
                              )}
                              {!parsedNotes.parts?.length && order.parts_cost_amount > 0 && (
                                <div className="flex justify-between text-slate-700">
                                  <span>Parts / Materials</span>
                                  <span className="font-semibold">{formatCurrency(order.parts_cost_amount)}</span>
                                </div>
                              )}
                              {parsedNotes.notes && (
                                <div className="text-xs text-slate-500 italic pt-1 border-t border-blue-100">
                                  <span className="font-semibold not-italic text-slate-600">Note: </span>
                                  {parsedNotes.notes}
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {order.discount_amount > 0 && (
                          <div className="flex justify-between text-red-600 font-medium">
                            <span>Discount</span>
                            <span>-{formatCurrency(order.discount_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-800 font-bold border-t border-blue-200 pt-2 mt-1">
                          <span>Stage 2 Total</span>
                          <span>{formatCurrency(
                            parseFloat(order.service_charge_amount) +
                            parseFloat(order.parts_cost_amount || 0) -
                            parseFloat(order.discount_amount || 0)
                          )}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Quotation Form ── */}
                  {quotingOrderId === id && (
                    <form onSubmit={handleQuoteSubmit} className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800">Create Quotation / नया पक्का बिल बनाएं</h3>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Service Fee / काम का दाम (₹)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={quoteForm.service_charge}
                            onChange={(e) => setQuoteForm({ ...quoteForm, service_charge: e.target.value })}
                            placeholder="e.g. 500"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Discount / छूट (₹, Optional)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={quoteForm.discount}
                            onChange={(e) => setQuoteForm({ ...quoteForm, discount: e.target.value })}
                            placeholder="e.g. 50"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      {/* Parts & Materials */}
                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-600">
                            Parts & Materials (Optional)
                          </label>
                          {partsList.length === 0 && (
                            <button
                              type="button"
                              onClick={handleAddPart}
                              className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition"
                            >
                              ➕ Add Part
                            </button>
                          )}
                        </div>

                        {partsList.length === 0 ? (
                          <div className="text-center py-3 border border-dashed border-slate-200 rounded-lg bg-white">
                            <span className="text-xs text-slate-400">No parts added</span>
                          </div>
                        ) : (
                          <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-white">
                            {partsList.map((part, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={part.name}
                                    onChange={(e) => handlePartChange(index, "name", e.target.value)}
                                    placeholder="Part name (e.g. Capacitor)"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                                  />
                                </div>
                                <div className="w-28 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-blue-500 focus-within:bg-white">
                                  <span className="text-xs text-slate-400 mr-1">₹</span>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    value={part.price}
                                    onChange={(e) => handlePartChange(index, "price", e.target.value)}
                                    placeholder="Price"
                                    className="w-full bg-transparent text-xs text-slate-800 outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePart(index)}
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 hover:text-red-600 transition"
                                  title="Remove part"
                                >
                                  <span className="text-xs font-bold">✕</span>
                                </button>
                              </div>
                            ))}

                            <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                              <button
                                type="button"
                                onClick={handleAddPart}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 transition"
                              >
                                ➕ Add Another Part
                              </button>
                              <span className="text-xs font-bold text-emerald-600">
                                Total: ₹{quoteForm.parts_cost || 0}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Quotation Notes / विवरण
                        </label>
                        <textarea
                          value={quoteForm.notes}
                          onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                          placeholder="Describe parts replaced or additional tasks done..."
                          rows="2"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => { setQuotingOrderId(null); setPartsList([]); }}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingQuote}
                          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 text-sm font-bold text-white shadow-sm transition"
                        >
                          {submittingQuote ? "Submitting…" : "Send Estimate"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ── OTP Verify Form ── */}
                  {verifyingOrderId === id && (
                    <form onSubmit={handleOtpVerify} className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Verify Start Code / काम शुरू करने का कोड</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Ask the customer for the 4-digit code shown on their booking screen.</p>
                      </div>
                      <div className="flex gap-3 flex-wrap items-center">
                        <input
                          type="text"
                          required
                          maxLength="4"
                          pattern="\d{4}"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="• • • •"
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-xl font-bold tracking-widest text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-32"
                        />
                        <button
                          type="submit"
                          disabled={verifyingOtp || otpCode.length !== 4}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-2 text-sm font-bold text-white shadow-sm transition"
                        >
                          {verifyingOtp ? "Verifying…" : "✓ Verify & Start"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerifyingOrderId(null)}
                          className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ── Action Buttons ── */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                    {order.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("accept", id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition"
                        >
                          <CheckCircle2 size={15} /> Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                        >
                          <XCircle size={15} /> Decline
                        </button>
                      </>
                    )}
                    {order.status === "accepted" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("start", id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
                        >
                          <PlayCircle size={15} /> Start Job
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                        >
                          <XCircle size={15} /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === "in_progress" && (!order.service_charge_amount || parseFloat(order.service_charge_amount) === 0) && (
                      <>
                        <button
                          type="button"
                          disabled={busy || quotingOrderId === id}
                          onClick={() => setQuotingOrderId(id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition"
                        >
                          ➕ Create Quotation
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                        >
                          <XCircle size={15} /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === "in_progress" && order.service_charge_amount > 0 && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("complete", id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
                        >
                          <CheckCircle2 size={15} /> Mark Complete
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                        >
                          <XCircle size={15} /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === "quoted" && (
                      <>
                        {(order.payment_method === "cash" ? order.completion_otp_code : order.final_payment_status === "paid") ? (
                          <button
                            type="button"
                            disabled={busy || verifyingOrderId === id}
                            onClick={() => { setVerifyingOrderId(id); setOtpCode(""); }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100 transition"
                          >
                            🔑 Enter Start Code
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                            ⏳ Awaiting Customer Approval
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                        >
                          <XCircle size={15} /> Cancel
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
                            date: order.scheduled_at || order.created_at || order.date,
                          };
                          import("../../utils/invoiceGenerator").then((m) => m.generateInvoicePDF(payload));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Download size={14} /> Download Invoice
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Cancel Modal ─────────────────────────────────── */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-scale-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Cancel Booking</h3>
              <p className="text-sm text-slate-500 mt-1">
                Please provide a reason. This will be logged and shown to the customer.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows="3"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Cannot make it today / Out of stock / Customer requested cancellation…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none placeholder-slate-400"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                disabled={submittingCancel}
                onClick={() => setCancellingOrderId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={submittingCancel || !cancelReasonInput.trim()}
                onClick={handleCancelConfirm}
                className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-5 py-2 text-sm font-bold text-white shadow-sm transition"
              >
                {submittingCancel ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
