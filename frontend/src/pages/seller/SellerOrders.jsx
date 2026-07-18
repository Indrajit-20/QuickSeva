import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PlayCircle, XCircle, Download, FileText, Clock, ChevronDown, ChevronUp, Phone, MapPin } from "lucide-react";
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
  const [expandedId, setExpandedId] = useState(null);

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
      // Calculate parts_cost dynamically from the partsList (quoteForm.parts_cost is not auto-updated)
      const computedPartsCost = partsList.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

      const notesPayload = JSON.stringify({
        notes: quoteForm.notes || "",
        parts: partsList.filter(p => p.name || p.price).map(p => ({
          name: p.name || "Unnamed Part",
          price: parseFloat(p.price) || 0,
        })),
      });

      await sellerOrdersApi.submitQuotation(quotingOrderId, {
        service_charge: parseFloat(quoteForm.service_charge) || 0,
        parts_cost: computedPartsCost,
        discount: parseFloat(quoteForm.discount) || 0,
        notes: notesPayload,
      });

      // Reset everything on success
      setQuotingOrderId(null);
      setPartsList([]);
      setQuoteForm({ service_charge: "", parts_cost: "", discount: "", notes: "" });
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit quotation. Please try again.");
    } finally {
      setSubmittingQuote(false);
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
        await sellerOrdersApi.start(id);
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

  const tabLabel = (t) => t.replace("_", " ");

  return (
    <PageTransition>
      <div className="seller-page space-y-5 animate-fade-in">

        {/* ── Page Header ── */}
        <div>
          <h1 className="seller-page-title">Orders</h1>
          <p className="seller-page-subtitle">
            Review bookings & update status / बुकिंग देखें और स्टेटस अपडेट करें
          </p>
        </div>

        {/* ── Filter Pills — Horizontal Scroll ── */}
        <div className="seller-filter-row">
          {tabs.map((tab) => {
            const count = tabCounts[tab] || 0;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`seller-filter-pill ${isActive ? "seller-filter-pill--active" : ""}`}
              >
                {tabLabel(tab)}
                {count > 0 && (
                  <span className="seller-filter-count">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            borderRadius: 14, border: '1px solid #fecaca', background: '#fef2f2',
            padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#b91c1c',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Orders List ── */}
        {loading ? (
          <div className="seller-empty-state" style={{ padding: '40px 24px' }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid #eff6ff', borderTopColor: '#3b82f6',
              borderRadius: '50%', margin: '0 auto 14px',
              animation: 'spin 1s linear infinite',
            }} />
            <p className="seller-empty-text">Loading orders…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="seller-empty-state">
            <div className="seller-empty-icon">
              <FileText size={28} />
            </div>
            <div className="seller-empty-title">No {tabLabel(activeTab)} orders</div>
            <div className="seller-empty-text">
              Orders will appear here once customers book your services.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const id = order.id;
              const number = order.order_number || `#${id}`;
              const customer = order.buyer_name || order.customer_name || "Guest";
              const service = order.service_title || order.service_name || "—";
              const amount = order.total_amount;
              const phone = order.buyer_phone || order.customer_phone;
              const busy = busyId === id;
              const isExpanded = expandedId === id;

              return (
                <article key={id} className="seller-order-card">
                  {/* ── Card Header ── */}
                  <div className="seller-order-header">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{number}</span>
                      <span className={`seller-status-pill seller-status-pill--${order.status}`}>
                        <span className="seller-status-dot" />
                        {order.status?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(order.scheduled_at || order.created_at) && (
                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                          {new Date(order.scheduled_at || order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short",
                          })}
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : id)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 active:scale-90 transition"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* ── Customer + Amount Row ── */}
                  <div className="seller-order-body">
                    <div className="seller-order-info-row">
                      <div
                        className="seller-order-avatar"
                        style={{ background: '#eff6ff', color: '#3b82f6' }}
                      >
                        {customer[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{customer}</div>
                        <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>{service}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>
                          {order.visiting_charge_amount
                            ? formatCurrency(order.visiting_charge_amount)
                            : formatCurrency(amount || 0)}
                        </div>
                        {order.service_charge_amount > 0 && (
                          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                            +{formatCurrency(
                              parseFloat(order.service_charge_amount) +
                              parseFloat(order.parts_cost_amount || 0) -
                              parseFloat(order.discount_amount || 0)
                            )} work
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Expandable Details ── */}
                    <div className={`seller-expandable ${isExpanded ? 'seller-expandable--open' : 'seller-expandable--collapsed'}`}>

                      {/* Detail Grid */}
                      <div className="seller-order-detail-grid" style={{ marginTop: 8 }}>
                        <div className="seller-order-detail-item">
                          <span className="seller-order-detail-label">Payment</span>
                          <span className="seller-order-detail-value" style={{ textTransform: 'capitalize' }}>
                            {order.payment_method || "—"}
                          </span>
                        </div>
                        <div className="seller-order-detail-item">
                          <span className="seller-order-detail-label">Date</span>
                          <span className="seller-order-detail-value">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString("en-IN")
                              : "—"}
                          </span>
                        </div>

                        {/* Contact (for accepted+) */}
                        {["accepted", "in_progress", "quoted", "completed"].includes(order.status) && phone && (
                          <div className="seller-order-detail-item">
                            <span className="seller-order-detail-label">Contact</span>
                            <div className="flex items-center gap-1">
                              <Phone size={12} style={{ color: '#059669' }} />
                              <span className="seller-order-detail-value" style={{ fontSize: 13, color: '#059669' }}>
                                {order.status === "completed" ? maskPhone(phone) : phone}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Address */}
                        {["accepted", "in_progress", "quoted", "completed"].includes(order.status) && order.address && (
                          <div className="seller-order-detail-item" style={{ gridColumn: phone ? 'auto' : '1 / -1' }}>
                            <span className="seller-order-detail-label">Address</span>
                            <div className="flex items-start gap-1">
                              <MapPin size={12} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
                              <span className="seller-order-detail-value" style={{ fontSize: 12, fontWeight: 600 }}>
                                {order.address}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Quotation Breakdown ── */}
                      {order.service_charge_amount > 0 && (
                        <div className="seller-quote-summary" style={{ marginTop: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Quotation Summary / पक्का बिल विवरण
                          </p>
                          <div className="seller-quote-row">
                            <span style={{ color: '#475569' }}>Service Fee</span>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{formatCurrency(order.service_charge_amount)}</span>
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
                                  <div style={{ paddingLeft: 12, borderLeft: '2px solid #bfdbfe', margin: '6px 0', }}>
                                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Parts / Materials:</span>
                                    {parsedNotes.parts.map((p, idx) => (
                                      <div key={idx} className="seller-quote-row" style={{ fontSize: 12 }}>
                                        <span style={{ color: '#64748b' }}>• {p.name}</span>
                                        <span style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</span>
                                      </div>
                                    ))}
                                    <div className="seller-quote-row" style={{ borderTop: '1px solid #bfdbfe', paddingTop: 4, marginTop: 4 }}>
                                      <span style={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Total Parts</span>
                                      <span style={{ fontWeight: 700, fontSize: 12 }}>{formatCurrency(order.parts_cost_amount)}</span>
                                    </div>
                                  </div>
                                )}
                                {!parsedNotes.parts?.length && order.parts_cost_amount > 0 && (
                                  <div className="seller-quote-row">
                                    <span style={{ color: '#475569' }}>Parts / Materials</span>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(order.parts_cost_amount)}</span>
                                  </div>
                                )}
                                {parsedNotes.notes && (
                                  <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', padding: '6px 0', borderTop: '1px solid #bfdbfe', marginTop: 4 }}>
                                    <strong style={{ fontStyle: 'normal', color: '#475569' }}>Note: </strong>
                                    {parsedNotes.notes}
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          {order.discount_amount > 0 && (
                            <div className="seller-quote-row" style={{ color: '#dc2626' }}>
                              <span>Discount</span>
                              <span style={{ fontWeight: 700 }}>-{formatCurrency(order.discount_amount)}</span>
                            </div>
                          )}
                          <div className="seller-quote-total">
                            <span>Stage 2 Total</span>
                            <span>{formatCurrency(
                              parseFloat(order.service_charge_amount) +
                              parseFloat(order.parts_cost_amount || 0) -
                              parseFloat(order.discount_amount || 0)
                            )}</span>
                          </div>
                        </div>
                      )}
                    </div>



                    {/* ── Inline Completion PIN ── */}
                    {completingOrderId === id && (
                      <form onSubmit={handleCompletionPinVerify} style={{ marginTop: 12, background: '#f8fafc', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                          Enter Completion PIN
                        </h3>
                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                          Customer's cash payment completion PIN
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            required
                            maxLength="4"
                            pattern="\d{4}"
                            value={completionPin}
                            onChange={(e) => setCompletionPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="• • • •"
                            className="seller-otp-input"
                            style={{ width: 120, height: 52, fontSize: 20 }}
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={verifyingCompletionPin || !completionPin}
                            className="seller-action-btn seller-action-btn--success"
                            style={{ flex: 1, fontSize: 13 }}
                          >
                            {verifyingCompletionPin ? "Verifying…" : "✓ Complete"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCompletingOrderId(null)}
                          style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="seller-order-actions">
                    {order.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("accept", id)}
                          className="seller-action-btn seller-action-btn--primary seller-action-btn--full"
                          style={{ fontSize: 13 }}
                        >
                          <CheckCircle2 size={16} /> Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
                          style={{ fontSize: 13, color: '#dc2626' }}
                        >
                          <XCircle size={16} /> Decline
                        </button>
                      </>
                    )}
                    {order.status === "accepted" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("start", id)}
                          className="seller-action-btn seller-action-btn--primary seller-action-btn--full"
                          style={{ fontSize: 13 }}
                        >
                          <PlayCircle size={16} /> Start Job
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
                          style={{ fontSize: 13, color: '#dc2626' }}
                        >
                          <XCircle size={16} /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === "in_progress" && (!order.service_charge_amount || parseFloat(order.service_charge_amount) === 0) && (
                      <>
                        <button
                          type="button"
                          disabled={busy || quotingOrderId === id}
                          onClick={() => setQuotingOrderId(id)}
                          className="seller-action-btn seller-action-btn--primary seller-action-btn--full"
                          style={{ fontSize: 13 }}
                        >
                          ➕ Create Quote
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
                          style={{ fontSize: 13, color: '#dc2626' }}
                        >
                          <XCircle size={16} /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === "in_progress" && order.service_charge_amount > 0 && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("complete", id)}
                          className="seller-action-btn seller-action-btn--success seller-action-btn--full"
                          style={{ fontSize: 13 }}
                        >
                          <CheckCircle2 size={16} /> Mark Complete
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
                          style={{ fontSize: 13, color: '#dc2626' }}
                        >
                          <XCircle size={16} /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === "quoted" && (
                      <>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '10px 14px', borderRadius: 12, display: 'inline-block', textAlign: 'center', width: '100%' }}>
                          ⏳ Waiting for Customer Approval
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction("cancel", id)}
                          className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
                          style={{ fontSize: 13, color: '#dc2626', width: '100%', marginTop: 8 }}
                        >
                          <XCircle size={16} /> Cancel
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
                        className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
                        style={{ fontSize: 13 }}
                      >
                        <Download size={16} /> Download Invoice
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quotation Modal ── */}
      {quotingOrderId && (
        <div className="seller-bottom-sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setQuotingOrderId(null); setPartsList([]); } }}>
          <div className="seller-bottom-sheet" style={{ maxWidth: 520, borderRadius: 24, padding: '24px' }}>
            <form onSubmit={handleQuoteSubmit} className="space-y-5 text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900">Create Quotation</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Create detailed estimate bill / नया पक्का बिल बनाएं</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="seller-label">Service Fee / काम का दाम (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={quoteForm.service_charge}
                    onChange={(e) => setQuoteForm({ ...quoteForm, service_charge: e.target.value })}
                    placeholder="e.g. 500"
                    className="seller-input"
                  />
                </div>
                <div>
                  <label className="seller-label">Discount / छूट (₹, Optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={quoteForm.discount}
                    onChange={(e) => setQuoteForm({ ...quoteForm, discount: e.target.value })}
                    placeholder="e.g. 50"
                    className="seller-input"
                  />
                </div>
              </div>

              {/* Parts / Materials Section */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-3">
                  <label className="seller-label" style={{ margin: 0 }}>Parts & Materials / सामान चार्ज</label>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-3 py-2 transition active:scale-95"
                  >
                    ➕ Add Part / सामान जोड़ें
                  </button>
                </div>

                {partsList.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                    No parts added / कोई अतिरिक्त सामान नहीं जोड़ा गया (वैकल्पिक)
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 no-scrollbar">
                    {partsList.map((part, index) => (
                      <div key={index} className="flex gap-2.5 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <input
                          type="text"
                          required
                          value={part.name}
                          onChange={(e) => handlePartChange(index, "name", e.target.value)}
                          placeholder="Part name (e.g. Air Filter)"
                          className="seller-input"
                          style={{ flex: 1, padding: '10px 12px', fontSize: 13 }}
                        />
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: '#ffffff', borderRadius: 12,
                          border: '1.5px solid #e2e8f0', padding: '8px 10px',
                          width: 100,
                        }}>
                          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 'bold' }}>₹</span>
                          <input
                            type="number"
                            required
                            min="1"
                            value={part.price}
                            onChange={(e) => handlePartChange(index, "price", e.target.value)}
                            placeholder="Price"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 700 }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(index)}
                          className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center cursor-pointer hover:bg-rose-100 transition active:scale-90"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes / description */}
              <div>
                <label className="seller-label">Description / विवरण</label>
                <textarea
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  placeholder="Describe parts replaced or additional tasks…"
                  rows="2"
                  className="seller-input"
                  style={{ resize: 'none', padding: '12px 14px' }}
                />
              </div>

              {/* Dynamic Live Estimation Invoice Summary Card */}
              {(() => {
                const sCharge = parseFloat(quoteForm.service_charge) || 0;
                const pCost = partsList.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
                const disc = parseFloat(quoteForm.discount) || 0;
                const finalTotal = Math.max(0, sCharge + pCost - disc);

                return (
                  <div className="bg-blue-50/85 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                    <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-widest">Live Bill Preview / बिल का पूर्वावलोकन</span>
                    <div className="space-y-1.5 text-xs font-semibold text-slate-650">
                      <div className="flex justify-between">
                        <span>Service Charge / सेवा चार्ज:</span>
                        <span className="text-slate-800 font-mono">₹{sCharge.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Materials Cost / सामान चार्ज:</span>
                        <span className="text-slate-800 font-mono">₹{pCost.toLocaleString("en-IN")}</span>
                      </div>
                      {disc > 0 && (
                        <div className="flex justify-between text-rose-650">
                          <span>Discount / छूट:</span>
                          <span className="font-mono">-₹{disc.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="h-px bg-slate-200 my-1" />
                      <div className="flex justify-between text-sm font-black text-blue-750">
                        <span>Final Customer Bill / कुल भुगतान राशि:</span>
                        <span className="font-mono text-base">₹{finalTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setQuotingOrderId(null); setPartsList([]); }}
                  className="seller-action-btn seller-action-btn--outline seller-action-btn--full py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="seller-action-btn seller-action-btn--primary seller-action-btn--full py-3"
                >
                  {submittingQuote ? "Sending…" : "Send Estimate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancel Bottom Sheet ── */}
      {cancellingOrderId && (
        <div className="seller-bottom-sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCancellingOrderId(null); }}>
          <div className="seller-bottom-sheet">
            <div className="seller-bottom-sheet-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Cancel Booking
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Please provide a reason. This will be shown to the customer.
            </p>
            <div>
              <label className="seller-label">
                Cancellation Reason <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                required
                rows="3"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Cannot make it today / Out of stock…"
                className="seller-input"
                style={{ resize: 'none' }}
              />
            </div>
            <div className="flex gap-3" style={{ marginTop: 16 }}>
              <button
                type="button"
                disabled={submittingCancel}
                onClick={() => setCancellingOrderId(null)}
                className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={submittingCancel || !cancelReasonInput.trim()}
                onClick={handleCancelConfirm}
                className="seller-action-btn seller-action-btn--danger seller-action-btn--full"
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
