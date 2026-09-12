import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "../api/adminService";
import {
  Calendar,
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  User,
  Store,
  CreditCard,
  FileText,
  Clock,
  TrendingUp,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   Inline Toast System
───────────────────────────────────────────────── */
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
};

const Toast = ({ toasts }) => {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-bold pointer-events-auto ${
            t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"
          }`}
          style={{ animation: "slideUp 0.3s ease" }}
        >
          {t.type === "success" ? <CheckCircle size={14} /> : t.type === "error" ? <XCircle size={14} /> : <Info size={14} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────
   Status Config
───────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:     { label: "Pending",     cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  accepted:    { label: "Accepted",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed:   { label: "Completed",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled:   { label: "Cancelled",   cls: "bg-slate-100 text-slate-500 border-slate-300" },
  disputed:    { label: "Disputed",    cls: "bg-red-50 text-red-700 border-red-200" },
  refunded:    { label: "Refunded",    cls: "bg-orange-50 text-orange-700 border-orange-200" },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || { label: status?.toUpperCase() || "—", cls: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const map = {
    paid:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    refunded:"bg-orange-50 text-orange-700 border-orange-200",
    failed:  "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${map[status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {status || "—"}
    </span>
  );
};

/* ─────────────────────────────────────────────────
   Skeleton Row
───────────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr className="border-b border-slate-100 animate-pulse">
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="h-3.5 bg-slate-100 rounded w-full" />
      </td>
    ))}
  </tr>
);

/* ─────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────── */
const AdminBookings = () => {
  const { toasts, show: showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const buildParams = useCallback((page = 1, limit = pagination.limit) => ({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(status !== "all" && { status }),
    ...(paymentMethod !== "all" && { payment_method: paymentMethod }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  }), [debouncedSearch, status, paymentMethod, startDate, endDate, pagination.limit]);

  const fetchBookings = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const res = await adminService.getBookings(buildParams(page, limit));
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch bookings.", "error");
    } finally {
      setLoading(false);
    }
  }, [buildParams, showToast]);

  useEffect(() => {
    fetchBookings(1, pagination.limit);
  }, [debouncedSearch, status, paymentMethod, startDate, endDate]);

  const activeFilterCount = [
    debouncedSearch,
    status !== "all" ? status : "",
    paymentMethod !== "all" ? paymentMethod : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch(""); setDebouncedSearch("");
    setStatus("all"); setPaymentMethod("all");
    setStartDate(""); setEndDate("");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchBookings(newPage, pagination.limit);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    fetchBookings(1, newLimit);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminService.exportBookingsCSV(buildParams());
      showToast(`Exporting ${pagination.total} booking records...`, "success");
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  // Summary stats from current page
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.platform_fee || 0), 0);
  const totalGMV = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Toast toasts={toasts} />

      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={22} className="text-amber-600" />
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Platform Bookings</h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Monitor all service orders — pending, active, completed, cancelled, and disputed.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-60 cursor-pointer shrink-0"
          >
            <Download size={14} />
            {exporting ? "Exporting..." : `Export CSV (${pagination.total})`}
          </button>
        </div>

        {/* Quick Stats Bar */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Orders", value: pagination.total, icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-200" },
              { label: "Page GMV", value: `₹${totalGMV.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
              { label: "Platform Revenue", value: `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: CreditCard, color: "text-purple-600 bg-purple-50 border-purple-200" },
              { label: "Pending", value: orders.filter(o => o.status === "pending" || o.status === "accepted").length, icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`flex items-center gap-3 p-3.5 rounded-xl border ${color} bg-opacity-50`}>
                <div className={`p-2 rounded-lg border ${color}`}><Icon size={15} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-bold text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Order #, buyer, seller, service..."
                  className="w-full pl-8 pr-8 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition bg-slate-50"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-slate-50 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-slate-50 cursor-pointer"
              >
                <option value="all">All Methods</option>
                <option value="wallet">Wallet</option>
                <option value="online">Online</option>
                <option value="cod">COD</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
              <div className="flex gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full py-2.5 px-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-slate-50 cursor-pointer"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full py-2.5 px-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-slate-50 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500">
                <Filter size={11} className="inline mr-1" />
                {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
              </span>
              <button onClick={clearFilters} className="text-[10px] font-bold text-red-500 hover:text-red-700 transition cursor-pointer flex items-center gap-1">
                <X size={11} /> Clear all
              </button>
            </div>
          )}
        </div>

        {/* Count Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold text-slate-500">
              {loading ? (
                <span className="animate-pulse">Loading bookings...</span>
              ) : (
                <>Showing <span className="text-slate-800">{startItem}–{endItem}</span> of <span className="text-slate-800">{pagination.total}</span> order{pagination.total !== 1 ? "s" : ""}</>
              )}
            </p>
            <button onClick={() => fetchBookings(pagination.page, pagination.limit)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer" title="Refresh">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rows per page</label>
            <select
              value={pagination.limit}
              onChange={handleLimitChange}
              className="py-1.5 px-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-white cursor-pointer"
            >
              {[10, 20, 25, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Order #", "Buyer", "Seller / Business", "Service", "Amount", "Payment", "Status", "Booked", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <FileText size={36} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-bold text-sm">No bookings found</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {activeFilterCount > 0 ? "Try adjusting your filters." : "No orders have been placed yet."}
                      </p>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="mt-3 text-xs text-amber-600 font-bold hover:underline cursor-pointer">
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${expandedRow === order.id ? "bg-amber-50/40" : ""}`}
                        onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800">{order.order_number}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-bold text-slate-700">{order.buyer_name || "—"}</p>
                            <p className="text-slate-400 text-[10px]">{order.buyer_phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-bold text-slate-700">{order.business_name || "—"}</p>
                            <p className="text-slate-400 text-[10px]">{order.seller_name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 max-w-[160px]">
                          <p className="font-semibold text-slate-700 truncate">{order.service_title || "Custom Service"}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-bold text-slate-800 font-mono">₹{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                            <p className="text-[10px] text-emerald-600 font-bold">Fee: ₹{parseFloat(order.platform_fee || 0).toFixed(2)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <p className="text-slate-600 font-bold uppercase text-[10px]">{order.payment_method || "—"}</p>
                            <PaymentBadge status={order.payment_status} />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-slate-500 font-semibold">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                          <p className="text-slate-400 text-[10px]">{new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <button className={`text-[10px] font-bold cursor-pointer transition ${expandedRow === order.id ? "text-amber-600" : "text-slate-400 hover:text-slate-700"}`}>
                            {expandedRow === order.id ? "▲ Less" : "▼ More"}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expandedRow === order.id && (
                        <tr className="bg-amber-50/30 border-b border-slate-100">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                              {/* Buyer Details */}
                              <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                  <User size={11} /> Buyer
                                </p>
                                <p className="font-bold text-slate-800">{order.buyer_name}</p>
                                <p className="text-slate-500">{order.buyer_phone}</p>
                                <p className="text-slate-400 text-[10px]">ID: QS-USR-{order.buyer_id}</p>
                              </div>

                              {/* Seller Details */}
                              <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1">
                                  <Store size={11} /> Seller Partner
                                </p>
                                <p className="font-bold text-slate-800">{order.business_name}</p>
                                <p className="text-slate-500">{order.seller_name} · {order.seller_phone}</p>
                                <p className="text-slate-400 text-[10px]">Seller ID: QS-SLR-{order.seller_id}</p>
                              </div>

                              {/* Order Details */}
                              <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                  <CreditCard size={11} /> Financials
                                </p>
                                <div className="space-y-1 text-slate-600 font-semibold">
                                  <p>Total: <span className="font-bold text-slate-800 font-mono">₹{parseFloat(order.total_amount || 0).toFixed(2)}</span></p>
                                  <p>Platform Fee: <span className="text-emerald-700 font-bold">₹{parseFloat(order.platform_fee || 0).toFixed(2)}</span></p>
                                  <p>Net Payout: <span className="font-bold text-slate-800 font-mono">₹{(parseFloat(order.total_amount || 0) - parseFloat(order.platform_fee || 0)).toFixed(2)}</span></p>
                                  {order.scheduled_date && (
                                    <p>Scheduled: <span className="text-slate-700">{new Date(order.scheduled_date).toLocaleDateString("en-IN")}</span></p>
                                  )}
                                </div>
                              </div>

                              {/* Notes / Reason */}
                              {(order.notes || order.cancel_reason) && (
                                <div className="sm:col-span-3 bg-white border border-slate-200 p-3.5 rounded-xl">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    {order.cancel_reason ? "Cancellation Reason" : "Order Notes"}
                                  </p>
                                  <p className={`text-xs font-semibold italic ${order.cancel_reason ? "text-red-700" : "text-slate-600"}`}>
                                    "{order.cancel_reason || order.notes}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-xs font-bold text-slate-400">
              Page <span className="text-slate-700">{pagination.page}</span> of <span className="text-slate-700">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="px-2.5 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">«</button>
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer">
                <ChevronLeft size={13} /> Prev
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`el-${idx}`} className="px-2 text-slate-400 text-xs font-bold">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${pagination.page === item ? "bg-slate-800 text-white border-slate-800" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer">
                Next <ChevronRight size={13} />
              </button>
              <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="px-2.5 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">»</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminBookings;
