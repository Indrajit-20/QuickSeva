import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "../api/adminService";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Store,
  DollarSign,
  Info,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Calendar,
  FileText,
  Gavel,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   Inline Toast System (no external library)
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
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-bold animate-fade-in pointer-events-auto transition-all duration-300 ${
            t.type === "success"
              ? "bg-emerald-600"
              : t.type === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          }`}
          style={{ animation: "slideUp 0.3s ease" }}
        >
          {t.type === "success" ? (
            <CheckCircle size={14} />
          ) : t.type === "error" ? (
            <XCircle size={14} />
          ) : (
            <Info size={14} />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────
   Skeleton Loading Cards
───────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded w-32" />
        <div className="h-3 bg-slate-100 rounded w-48" />
      </div>
      <div className="h-7 w-20 bg-slate-100 rounded-lg" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-20 bg-slate-100 rounded-xl" />
      <div className="h-20 bg-slate-100 rounded-xl" />
      <div className="h-20 bg-slate-100 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-10 bg-slate-100 rounded-lg" />
      <div className="h-10 bg-slate-100 rounded-lg" />
    </div>
    <div className="flex justify-end gap-2 pt-2">
      <div className="h-9 w-28 bg-slate-100 rounded-xl" />
      <div className="h-9 w-28 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────
   Status Badge
───────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const config = {
    disputed: { label: "DISPUTED", cls: "bg-red-50 text-red-700 border-red-200" },
    cancelled: { label: "CANCELLED", cls: "bg-slate-100 text-slate-600 border-slate-300" },
    completed: { label: "COMPLETED", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    refunded: { label: "REFUNDED", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  };
  const c = config[status] || { label: status?.toUpperCase(), cls: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────── */
const AdminDisputes = () => {
  const { toasts, show: showToast } = useToast();

  // ── Data State ──────────────────────────────────
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Pagination ──────────────────────────────────
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // ── Filters ─────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("disputed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ── Modal ────────────────────────────────────────
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionAction, setResolutionAction] = useState("");

  const searchDebounceRef = useRef(null);

  // ── Debounce search ──────────────────────────────
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // ── Re-fetch on filter/page change ──────────────
  const fetchDisputes = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      const res = await adminService.getDisputes(params);
      if (res.success && res.data) {
        setDisputes(res.data.disputes || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch disputes.", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, startDate, endDate, pagination.limit, showToast]);

  useEffect(() => {
    fetchDisputes(1, pagination.limit);
  }, [debouncedSearch, status, startDate, endDate]);

  // ── Helpers ──────────────────────────────────────
  const activeFilterCount = [
    debouncedSearch,
    status !== "disputed" ? status : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("disputed");
    setStartDate("");
    setEndDate("");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchDisputes(newPage, pagination.limit);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    fetchDisputes(1, newLimit);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      await adminService.exportDisputesCSV(params);
      showToast(`Exporting ${pagination.total} dispute records as CSV...`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export disputes. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  // ── Resolution Modal ──────────────────────────────
  const handleOpenConfirm = (dispute, action) => {
    setSelectedDispute(dispute);
    setResolutionAction(action);
    setShowConfirmModal(true);
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.resolveDispute(selectedDispute.id, resolutionAction);
      if (res.success) {
        showToast(
          resolutionAction === "refund"
            ? `✅ Refund issued to buyer for Order #${selectedDispute.order_number}`
            : `✅ Payout released to seller for Order #${selectedDispute.order_number}`,
          "success"
        );
        setShowConfirmModal(false);
        setSelectedDispute(null);
        // Refresh current page
        fetchDisputes(pagination.page, pagination.limit);
      } else {
        showToast(res.message || "Resolution failed. Check server logs.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to resolve dispute. Please try again.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Pagination Info ──────────────────────────────
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
        {/* ── Page Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gavel size={22} className="text-red-600" />
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Dispute Resolution Center
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Arbitrate conflicts — issue refunds to buyers or release payouts to sellers.
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

        {/* ── Filter Toolbar ─────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Order #, buyer, seller, service..."
                  className="w-full pl-8 pr-8 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-slate-50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition bg-slate-50 cursor-pointer"
              >
                <option value="disputed">Active Disputes</option>
                <option value="all">All Orders</option>
                <option value="resolved">Resolved (Cancelled / Completed)</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                From Date
              </label>
              <div className="relative">
                <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-8 py-2.5 pr-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition bg-slate-50 cursor-pointer"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                To Date
              </label>
              <div className="relative">
                <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-8 py-2.5 pr-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition bg-slate-50 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Active filters / clear button */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500">
                <Filter size={11} className="inline mr-1" />
                {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
              </span>
              <button
                onClick={clearFilters}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 transition cursor-pointer flex items-center gap-1"
              >
                <X size={11} /> Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* ── Count Bar ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold text-slate-500">
              {loading ? (
                <span className="animate-pulse">Loading disputes...</span>
              ) : (
                <>
                  Showing <span className="text-slate-800">{startItem}–{endItem}</span> of{" "}
                  <span className="text-slate-800">{pagination.total}</span> dispute
                  {pagination.total !== 1 ? "s" : ""}
                </>
              )}
            </p>
            <button
              onClick={() => fetchDisputes(pagination.page, pagination.limit)}
              className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Rows per page
            </label>
            <select
              value={pagination.limit}
              onChange={handleLimitChange}
              className="py-1.5 px-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition bg-white cursor-pointer"
            >
              {[10, 20, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Disputes List ────────────────────────────── */}
        <div className="space-y-5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : disputes.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <FileText size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-bold text-sm">No disputes found</p>
              <p className="text-slate-400 text-xs mt-1">
                {activeFilterCount > 0
                  ? "Try adjusting your filters."
                  : "System is fully operational — no active disputes."}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-xs text-red-500 font-bold hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm hover:shadow-md transition duration-300"
              >
                {/* Dispute Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={dispute.status} />
                      <h3 className="font-bold text-slate-800 text-base">
                        Order #{dispute.order_number}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">
                      Booked: {new Date(dispute.created_at).toLocaleString()} &nbsp;•&nbsp;
                      Updated: {new Date(dispute.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ORDER TOTAL</p>
                    <p className="text-slate-800 text-xl font-bold font-mono">
                      ₹{parseFloat(dispute.total_amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Parties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Buyer */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                      <User size={11} /> Buyer Client
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{dispute.buyer_name}</p>
                      <p className="text-slate-500 font-semibold mt-0.5">{dispute.buyer_phone}</p>
                      <p className="text-slate-400 font-bold text-[10px] mt-0.5">ID: QS-USR-{dispute.buyer_id}</p>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Store size={11} /> Seller Partner
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{dispute.business_name}</p>
                      <p className="text-slate-500 font-semibold mt-0.5">Contact: {dispute.seller_name}</p>
                      <p className="text-slate-500 font-semibold">{dispute.seller_phone}</p>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign size={11} /> Payment Info
                    </span>
                    <div className="space-y-1 font-bold text-slate-600 text-xs">
                      <p>Method: <span className="text-slate-800 uppercase">{dispute.payment_method}</span></p>
                      <p>Status: <span className="text-slate-800 uppercase">{dispute.payment_status}</span></p>
                      <p>Platform Fee: <span className="text-emerald-700">₹{parseFloat(dispute.platform_fee || 0).toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>

                {/* Service & Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                      SERVICE BOOKED
                    </span>
                    <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                      {dispute.service_title || "Custom Service Job"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                      DISPUTE STATEMENT
                    </span>
                    <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 italic font-semibold leading-relaxed">
                      "{dispute.cancel_reason || dispute.notes || "No reason provided."}"
                    </div>
                  </div>
                </div>

                {/* Actions — only show for active disputes */}
                {dispute.status === "disputed" && (
                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleOpenConfirm(dispute, "refund")}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle size={14} />
                      <span>Refund Buyer</span>
                    </button>
                    <button
                      onClick={() => handleOpenConfirm(dispute, "complete")}
                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle size={14} />
                      <span>Release Payout</span>
                    </button>
                  </div>
                )}

                {dispute.status !== "disputed" && (
                  <div className="flex justify-end border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      This dispute has been resolved
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Pagination Controls ──────────────────────── */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs font-bold text-slate-400">
              Page <span className="text-slate-700">{pagination.page}</span> of{" "}
              <span className="text-slate-700">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                «
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={13} /> Prev
              </button>

              {/* Page number pills */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  const cur = pagination.page;
                  return p === 1 || p === pagination.totalPages || Math.abs(p - cur) <= 2;
                })
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs font-bold">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        pagination.page === item
                          ? "bg-slate-800 text-white border-slate-800"
                          : "text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight size={13} />
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Arbitration Confirmation Modal ──────────── */}
      {showConfirmModal && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-slate-800">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={18} />
                <h3 className="text-base font-bold text-slate-800">Arbitration Confirmation</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
                className="text-slate-400 hover:text-slate-700 cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 font-semibold">
              <p>
                Resolving dispute for{" "}
                <span className="font-bold text-slate-800">Order #{selectedDispute.order_number}</span>.
              </p>
              {resolutionAction === "refund" ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold">Refund Buyer:</span> The booking will be cancelled and{" "}
                    <span className="font-bold text-slate-900">
                      ₹{parseFloat(selectedDispute.total_amount).toFixed(2)}
                    </span>{" "}
                    will be credited back to the buyer's wallet.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold">Release Payout:</span> The order will be completed and{" "}
                    <span className="font-bold text-slate-900">
                      ₹{(parseFloat(selectedDispute.total_amount) - parseFloat(selectedDispute.platform_fee || 0)).toFixed(2)}
                    </span>{" "}
                    (total minus platform fee) will be credited to the seller's wallet.
                  </p>
                </div>
              )}
              <p className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                ⚠️ This action is permanent and cannot be undone. The wallet transaction will be recorded immediately.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className={`px-5 py-2.5 font-bold rounded-xl text-white transition text-xs cursor-pointer ${
                  resolutionAction === "refund"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:opacity-60`}
              >
                {actionLoading ? "Processing..." : "Confirm Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDisputes;
