import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "../api/adminService";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Calendar,
  CreditCard,
  TrendingUp,
  User,
  Info,
  CheckCircle,
  XCircle,
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
   Skeleton Table Rows
───────────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100">
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
    <td className="p-4"><div className="h-5 bg-slate-100 rounded-full w-16" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-40" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
  </tr>
);

/* ─────────────────────────────────────────────────
   Role Badge Component
───────────────────────────────────────────────── */
const RoleBadge = ({ role }) => {
  const config = {
    buyer: "bg-blue-50 text-blue-700 border-blue-200",
    seller: "bg-purple-50 text-purple-700 border-purple-200",
    contractor: "bg-amber-50 text-amber-700 border-amber-200",
    admin: "bg-red-50 text-red-700 border-red-200",
  };
  const cls = config[role?.toLowerCase()] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {role}
    </span>
  );
};

/* ─────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────── */
const AdminPayments = () => {
  const { toasts, show: showToast } = useToast();

  // ── Data State ──────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalVolume: "0.00", totalCredit: "0.00", totalDebit: "0.00", totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // ── Pagination ──────────────────────────────────
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // ── Filters ─────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const searchDebounceRef = useRef(null);

  // ── Debounce search ──────────────────────────────
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // ── Fetch transactions ───────────────────────────
  const fetchPayments = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(type !== "all" && { type }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      const res = await adminService.getPayments(params);
      if (res.success && res.data) {
        setTransactions(res.data.transactions || []);
        setStats(res.data.stats || { totalVolume: "0.00", totalCredit: "0.00", totalDebit: "0.00", totalCount: 0 });
        setPagination(res.data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch payments data.", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, type, startDate, endDate, pagination.limit, showToast]);

  useEffect(() => {
    fetchPayments(1, pagination.limit);
  }, [debouncedSearch, type, startDate, endDate]);

  // ── Helpers ──────────────────────────────────────
  const activeFilterCount = [
    debouncedSearch,
    type !== "all" ? type : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setType("all");
    setStartDate("");
    setEndDate("");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchPayments(newPage, pagination.limit);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    fetchPayments(1, newLimit);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(type !== "all" && { type }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      await adminService.exportPaymentsCSV(params);
      showToast(`Exporting ${pagination.total} transaction records as CSV...`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export payments. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

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
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={24} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Wallet & Payment Ledger
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Monitor all digital wallet transactions, payouts, refunds, and user balances in real time.
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

        {/* ── Summary Stats Cards ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Volume */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Transaction Volume</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono">
              ₹{parseFloat(stats.totalVolume).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Total value processed</p>
          </div>

          {/* Total Credit */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Credits</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 font-mono">
              ₹{parseFloat(stats.totalCredit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Wallet recharges & payouts</p>
          </div>

          {/* Total Debit */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Debits</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowDownLeft size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600 font-mono">
              ₹{parseFloat(stats.totalDebit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Bookings & withdrawals</p>
          </div>

          {/* Transaction Count */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Ledger Entries</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono">
              {stats.totalCount}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Filtered transactions</p>
          </div>
        </div>

        {/* ── Filter Toolbar ─────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="User, email, phone, Txn ID, ref..."
                  className="w-full pl-8 pr-8 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-slate-50"
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

            {/* Type Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-slate-50 cursor-pointer"
              >
                <option value="all">All Types (Credits & Debits)</option>
                <option value="credit">Credit (+)</option>
                <option value="debit">Debit (-)</option>
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
                  className="w-full pl-8 py-2.5 pr-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-slate-50 cursor-pointer"
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
                  className="w-full pl-8 py-2.5 pr-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-slate-50 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Active Filter Clear */}
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
                <span className="animate-pulse">Loading ledger...</span>
              ) : (
                <>
                  Showing <span className="text-slate-800">{startItem}–{endItem}</span> of{" "}
                  <span className="text-slate-800">{pagination.total}</span> transaction
                  {pagination.total !== 1 ? "s" : ""}
                </>
              )}
            </p>
            <button
              onClick={() => fetchPayments(pagination.page, pagination.limit)}
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
              className="py-1.5 px-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white cursor-pointer"
            >
              {[10, 20, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Transactions Table ──────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">TXN ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Balance After</th>
                  <th className="p-4">Source / Ref ID</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center">
                      <Wallet size={36} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-bold text-sm">No transactions found</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {activeFilterCount > 0 ? "Try adjusting your search filters." : "No wallet transactions recorded yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/80 transition">
                      {/* Txn ID */}
                      <td className="p-4 font-mono font-bold text-slate-800">
                        #{txn.id}
                      </td>

                      {/* User */}
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{txn.user_name}</span>
                            <RoleBadge role={txn.user_role} />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{txn.user_phone || txn.user_email}</p>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="p-4">
                        {txn.type === "credit" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowUpRight size={11} /> CREDIT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowDownLeft size={11} /> DEBIT
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-mono font-bold">
                        <span className={txn.type === "credit" ? "text-emerald-600" : "text-rose-600"}>
                          {txn.type === "credit" ? "+" : "-"}₹{parseFloat(txn.amount).toFixed(2)}
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="p-4 font-mono text-slate-600">
                        ₹{parseFloat(txn.balance_after).toFixed(2)}
                      </td>

                      {/* Source & Ref ID */}
                      <td className="p-4">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            {txn.source}
                          </span>
                          {txn.reference_id && (
                            <p className="text-[10px] text-slate-400 font-mono mt-1">Ref: {txn.reference_id}</p>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="p-4 max-w-xs text-slate-600 truncate" title={txn.description}>
                        {txn.description || "N/A"}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

              {/* Page pills */}
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
    </>
  );
};

export default AdminPayments;
