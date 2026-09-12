import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../api/adminService";
import {
  Search,
  CheckCircle,
  FileText,
  UserCheck,
  UserX,
  X,
  MapPin,
  Briefcase,
  Star,
  Download,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import apiClient from "../api/axiosConfig";

// ── Inline Toast ─────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold pointer-events-auto animate-fade-in
          ${t.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
          }`}
      >
        {t.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
        {t.message}
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
};
// ─────────────────────────────────────────────────────────────────────────────

const AdminSellers = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pending";

  // Data & Loading
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { toasts, show: showToast } = useToast();

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Categories list (for filter dropdown)
  const [categories, setCategories] = useState([]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset filters on tab change
  useEffect(() => {
    setSearchInput(""); setSearchQuery("");
    setCategoryFilter("all"); setStartDate(""); setEndDate("");
    setPage(1);
  }, [activeTab]);

  // Load categories for filter
  useEffect(() => {
    adminService.getCategories().then((res) => {
      if (res.success) setCategories(res.data.categories || []);
    }).catch(() => {});
  }, []);

  // ── Build params for the active tab ────────────────────────────────────────
  const getTabParams = () => {
    const base = {};
    if (activeTab === "pending") {
      base.is_verified = 0;
      base.is_active = 1;
    } else if (activeTab === "verified") {
      base.is_verified = 1;
      base.is_active = 1;
    } else if (activeTab === "suspended") {
      base.is_active = 0;
    }
    return base;
  };

  const fetchSellers = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminService.getSellers({
        ...getTabParams(),
        page,
        limit,
        search: searchQuery || undefined,
        category_id: categoryFilter !== "all" ? categoryFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success && res.data) {
        setSellers(res.data.sellers || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch seller profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSellers(); }, [activeTab, page, limit, searchQuery, categoryFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchInput(""); setSearchQuery("");
    setCategoryFilter("all"); setStartDate(""); setEndDate("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchInput || searchQuery || categoryFilter !== "all" || startDate || endDate);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await adminService.exportSellersCSV({
        ...getTabParams(),
        search: searchQuery || undefined,
        category_id: categoryFilter !== "all" ? categoryFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      showToast(`Exported ${pagination.total} seller records successfully!`);
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Failed to export sellers report.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleVerifySeller = async (sellerId) => {
    setActionLoading(true);
    try {
      const res = await adminService.verifySeller(sellerId);
      if (res.success) {
        showToast("Seller verified and approved successfully!");
        setSellers((prev) => prev.filter((s) => s.id !== sellerId));
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to verify seller.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspension = async (seller) => {
    setActionLoading(true);
    try {
      const res = await adminService.toggleUserStatus(seller.user_id);
      if (res.success) {
        const action = seller.is_active ? "suspended" : "reactivated";
        showToast(`Seller account ${action} successfully!`);
        setSellers((prev) => prev.filter((s) => s.id !== seller.id));
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update seller account status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getDocUrl = (path) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    const base = apiClient.defaults.baseURL
      ? apiClient.defaults.baseURL.replace("/api", "")
      : "http://localhost:5000";
    return `${base}${path}`;
  };

  const handleOpenDetails = (seller) => { setSelectedSeller(seller); setShowDetailModal(true); };

  const inputBaseClass =
    "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-semibold shadow-xs transition-all";

  const titleMap = {
    pending: "Pending Verifications",
    verified: "Verified Seller Partners",
    suspended: "Suspended Seller Accounts",
  };

  return (
    <div className="space-y-6 text-left">
      <Toast toasts={toasts} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {titleMap[activeTab] || "Seller Partners"}
          </h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">
            Review certificates, verify compliance, manage suspensions and export seller data.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {exporting
            ? "Generating..."
            : hasActiveFilters
            ? `⬇ Export ${pagination.total} Filtered (.CSV)`
            : `⬇ Export All ${pagination.total} (.CSV)`}
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter size={14} className="text-blue-600" />
            <span>Filter Sellers</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-200">
                Active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
              <Search size={15} />
            </div>
            <input
              type="text"
              placeholder="Search name, business, phone, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`${inputBaseClass} !pl-10`}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className={inputBaseClass}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Joined From */}
          <div className="relative">
            <label className="absolute -top-[18px] left-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              📅 Joined From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className={inputBaseClass}
            />
          </div>

          {/* Joined To */}
          <div className="relative">
            <label className="absolute -top-[18px] left-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              📅 Joined To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className={inputBaseClass}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Count & Rows per page */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <div>
          Showing <span className="font-bold text-slate-800">{sellers.length}</span> of{" "}
          <span className="font-bold text-slate-800">{pagination.total}</span> sellers
        </div>
        <div className="flex items-center gap-2">
          <span>Per page:</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            {[10, 20, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
              <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              <div className="h-3 bg-slate-100 rounded-lg w-2/3 mt-4" />
              <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
            </div>
          ))
        ) : sellers.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-xs font-bold">No seller accounts match the current filters.</p>
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className="mt-3 text-blue-600 text-xs font-bold hover:underline cursor-pointer">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          sellers.map((seller) => (
            <div
              key={seller.id}
              onClick={() => handleOpenDetails(seller)}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm group"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-700 transition">
                    {seller.business_name || "QuickSeva Partner"}
                  </h3>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        seller.is_verified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {seller.is_verified ? "✓ Verified" : "⏳ Pending"}
                    </span>
                    {seller.is_active === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-red-50 text-red-700 border-red-200">
                        Suspended
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                  {seller.category_name || "General Services"}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{seller.city || "Unknown City"}</span>
                  </div>
                  {seller.documents && seller.documents.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      <FileText size={11} />
                      {seller.documents.length} doc{seller.documents.length > 1 ? "s" : ""} uploaded
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold truncate max-w-[60%]">{seller.name}</span>
                <span className="flex items-center gap-1 font-bold text-slate-700 shrink-0">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  {parseFloat(seller.avg_rating || 0).toFixed(1)}
                  <span className="text-slate-400 font-medium">({seller.total_reviews || 0})</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500 font-semibold">
            Page <span className="font-bold text-slate-800">{pagination.page}</span> of{" "}
            <span className="font-bold text-slate-800">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const startP = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
              const p = startP + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                    p === page
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedSeller.business_name || "QuickSeva Partner"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: QS-SLR-{selectedSeller.id} · Registered by: {selectedSeller.name}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    selectedSeller.is_verified
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {selectedSeller.is_verified ? "✓ Verified" : "⏳ Pending Verification"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    selectedSeller.is_active
                      ? "bg-slate-50 text-slate-600 border-slate-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {selectedSeller.is_active ? "Active Account" : "Suspended"}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition">
                <X size={18} />
              </button>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 font-bold block mb-1.5 uppercase tracking-wider text-[10px]">Owner Contact</span>
                  <p className="text-slate-800 font-bold">{selectedSeller.name}</p>
                  <p className="text-blue-600 font-bold">{selectedSeller.phone}</p>
                  <p className="text-slate-500 font-medium">{selectedSeller.email || "No email address"}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1.5 uppercase tracking-wider text-[10px]">Business Details</span>
                  <p className="text-slate-700 font-semibold">Category: {selectedSeller.category_name || "General"}</p>
                  <p className="text-slate-700 font-semibold">Type: {selectedSeller.seller_type || "Individual"}</p>
                  <p className="text-slate-700 font-semibold">GST: {selectedSeller.gst_number || "Not registered"}</p>
                  <p className="text-slate-700 font-semibold">Plan: {selectedSeller.plan?.toUpperCase() || "FREE"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 font-bold block mb-1.5 uppercase tracking-wider text-[10px]">Location</span>
                  <p className="text-slate-800 font-bold">{selectedSeller.address || "No address listed"}</p>
                  <p className="text-slate-500 font-semibold mt-0.5">
                    {selectedSeller.city}{selectedSeller.state ? `, ${selectedSeller.state}` : ""}{selectedSeller.pincode ? ` - ${selectedSeller.pincode}` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1.5 uppercase tracking-wider text-[10px]">Performance</span>
                  <p className="text-slate-700 font-semibold">Rating: ⭐ {parseFloat(selectedSeller.avg_rating || 0).toFixed(1)}</p>
                  <p className="text-slate-700 font-semibold">Orders: {selectedSeller.total_orders || 0}</p>
                  <p className="text-slate-700 font-semibold">Reviews: {selectedSeller.total_reviews || 0}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-3 uppercase tracking-wider text-[10px]">
                Submitted Documents ({selectedSeller.documents?.length || 0})
              </span>
              {selectedSeller.documents && selectedSeller.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSeller.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={getDocUrl(doc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-xs text-blue-600 hover:text-blue-700 transition font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-slate-400" />
                        <span>Document_{idx + 1}</span>
                      </div>
                      <Download size={13} />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 italic text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 text-center font-semibold">
                  ⚠️ No verification documents uploaded yet.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition text-xs cursor-pointer"
              >
                Close
              </button>

              {selectedSeller.is_active === 1 && (
                <button
                  type="button"
                  onClick={() => handleToggleSuspension(selectedSeller)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldX size={13} />
                  Suspend Account
                </button>
              )}

              {selectedSeller.is_active === 0 && (
                <button
                  type="button"
                  onClick={() => handleToggleSuspension(selectedSeller)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck size={13} />
                  Reactivate Account
                </button>
              )}

              {!selectedSeller.is_verified && selectedSeller.is_active === 1 && (
                <button
                  type="button"
                  onClick={() => handleVerifySeller(selectedSeller.id)}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ShieldCheck size={13} />
                  {actionLoading ? "Processing..." : "Approve & Verify"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellers;
