import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "../api/adminService";
import {
  Inbox,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Calendar,
  Phone,
  MapPin,
  Tag,
  CheckCircle,
  Clock,
  XCircle,
  Info,
  Bell,
  Check,
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
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-44" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
    <td className="p-4"><div className="h-5 bg-slate-100 rounded-full w-20" /></td>
    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
    <td className="p-4"><div className="h-8 bg-slate-100 rounded-xl w-24" /></td>
  </tr>
);

/* ─────────────────────────────────────────────────
   Status Badge Component
───────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const config = {
    OPEN: { label: "OPEN", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    PENDING: { label: "PENDING", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    CLOSED: { label: "CLOSED", cls: "bg-slate-100 text-slate-600 border-slate-300", icon: XCircle },
  };
  const c = config[status] || { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200", icon: Info };
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${c.cls}`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────── */
const AdminLeads = () => {
  const { toasts, show: showToast } = useToast();

  // ── Data State ──────────────────────────────────
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ totalLeads: 0, openLeads: 0, pendingLeads: 0, closedLeads: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // ── Pagination ──────────────────────────────────
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // ── Filters ─────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const searchDebounceRef = useRef(null);

  // ── Load categories for filter dropdown ─────────
  useEffect(() => {
    adminService.getCategories().then((res) => {
      if (res.success && res.data) {
        setCategories(Array.isArray(res.data.categories) ? res.data.categories : Array.isArray(res.data) ? res.data : []);
      }
    }).catch(console.error);
  }, []);

  // ── Debounce search ──────────────────────────────
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // ── Fetch Leads ──────────────────────────────────
  const fetchLeads = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status !== "all" && { status }),
        ...(category !== "all" && { category }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      const res = await adminService.getLeads(params);
      if (res.success && res.data) {
        setLeads(res.data.leads || []);
        setStats(res.data.stats || { totalLeads: 0, openLeads: 0, pendingLeads: 0, closedLeads: 0 });
        setPagination(res.data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch buyer leads.", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, category, startDate, endDate, pagination.limit, showToast]);

  useEffect(() => {
    fetchLeads(1, pagination.limit);
  }, [debouncedSearch, status, category, startDate, endDate]);

  // ── Helpers ──────────────────────────────────────
  const activeFilterCount = [
    debouncedSearch,
    status !== "all" ? status : "",
    category !== "all" ? category : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setCategory("all");
    setStartDate("");
    setEndDate("");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchLeads(newPage, pagination.limit);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    fetchLeads(1, newLimit);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status !== "all" && { status }),
        ...(category !== "all" && { category }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      await adminService.exportLeadsCSV(params);
      showToast(`Exporting ${pagination.total} lead records as CSV...`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export leads. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const res = await adminService.updateLeadStatus(leadId, newStatus);
      if (res.success) {
        showToast(`Lead #${leadId} status changed to ${newStatus}`, "success");
        fetchLeads(pagination.page, pagination.limit);
      } else {
        showToast(res.message || "Failed to update lead status.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update status. Please try again.", "error");
    } finally {
      setUpdatingId(null);
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
              <Inbox size={24} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Buyer Lead Enquiries
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Monitor incoming service inquiries submitted by customers and matched with verified sellers.
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

        {/* ── Summary Cards ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Leads */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Leads</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Inbox size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-800 font-mono">{stats.totalLeads}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Filtered lead inquiries</p>
          </div>

          {/* Open Leads */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Open Leads</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 font-mono">{stats.openLeads}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Active for seller broadcast</p>
          </div>

          {/* Pending Leads */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending Response</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-600 font-mono">{stats.pendingLeads}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">In customer contact pipeline</p>
          </div>

          {/* Closed Leads */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Closed Leads</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <XCircle size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-700 font-mono">{stats.closedLeads}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Fulfilled or archived</p>
          </div>
        </div>

        {/* ── Filter Toolbar ─────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Customer, phone, category, pincode, description..."
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

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-slate-50 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="PENDING">PENDING</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-slate-50 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {(Array.isArray(categories) ? categories : []).map((cat) => (
                  <option key={cat.id || cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
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
                <span className="animate-pulse">Loading leads...</span>
              ) : (
                <>
                  Showing <span className="text-slate-800">{startItem}–{endItem}</span> of{" "}
                  <span className="text-slate-800">{pagination.total}</span> lead enquiry
                  {pagination.total !== 1 ? "s" : ""}
                </>
              )}
            </p>
            <button
              onClick={() => fetchLeads(pagination.page, pagination.limit)}
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

        {/* ── Leads Table ─────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">LEAD ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Category & Pincode</th>
                  <th className="p-4">Address & Inquiry Notes</th>
                  <th className="p-4 text-center">Sellers Notified</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center">
                      <Inbox size={36} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-bold text-sm">No lead enquiries found</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {activeFilterCount > 0 ? "Try adjusting your search filters." : "No customer lead requests submitted yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                      {/* Lead ID */}
                      <td className="p-4 font-mono font-bold text-slate-800">
                        #{lead.id}
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-800">{lead.customer_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone size={10} className="text-slate-400" /> {lead.contact_number}
                          </p>
                        </div>
                      </td>

                      {/* Category & Pincode */}
                      <td className="p-4">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <Tag size={10} /> {lead.category}
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                            <MapPin size={10} /> Pincode: {lead.pincode}
                          </p>
                        </div>
                      </td>

                      {/* Address & Notes */}
                      <td className="p-4 max-w-xs">
                        {lead.address && (
                          <p className="text-slate-800 text-xs font-semibold truncate" title={lead.address}>
                            {lead.address}
                          </p>
                        )}
                        <p className="text-slate-500 text-[11px] truncate italic mt-0.5" title={lead.description}>
                          "{lead.description || "No specific details provided."}"
                        </p>
                      </td>

                      {/* Notified Sellers */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Bell size={11} className="text-blue-500" />
                          {lead.notified_sellers_count}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <StatusBadge status={lead.status} />
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="py-1.5 px-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-slate-50 cursor-pointer disabled:opacity-50"
                        >
                          <option value="OPEN">Mark OPEN</option>
                          <option value="PENDING">Mark PENDING</option>
                          <option value="CLOSED">Mark CLOSED</option>
                        </select>
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

export default AdminLeads;
