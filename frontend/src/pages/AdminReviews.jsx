import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "../api/adminService";
import {
  Star,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Calendar,
  Trash2,
  MessageSquare,
  User,
  Store,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  FileText,
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
   Skeleton Loading Card
───────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-100 rounded w-28" />
          <div className="h-3 bg-slate-100 rounded w-20" />
        </div>
      </div>
      <div className="h-6 w-24 bg-slate-100 rounded-full" />
    </div>
    <div className="h-14 bg-slate-100 rounded-xl" />
    <div className="flex justify-between items-center pt-2">
      <div className="h-3 bg-slate-100 rounded w-36" />
      <div className="h-8 w-20 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────
   Star Rating Display
───────────────────────────────────────────────── */
const StarRating = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-100"}
      />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────── */
const AdminReviews = () => {
  const { toasts, show: showToast } = useToast();

  // ── Data State ──────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    avgRating: "0.0",
    totalCount: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Pagination ──────────────────────────────────
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // ── Filters ─────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rating, setRating] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ── Delete Modal State ──────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const searchDebounceRef = useRef(null);

  // ── Debounce search ──────────────────────────────
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // ── Fetch Reviews ────────────────────────────────
  const fetchReviews = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(rating !== "all" && { rating }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      const res = await adminService.getReviews(params);
      if (res.success && res.data) {
        setReviews(res.data.reviews || []);
        setStats(res.data.stats || { avgRating: "0.0", totalCount: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
        setPagination(res.data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch customer reviews.", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, rating, startDate, endDate, pagination.limit, showToast]);

  useEffect(() => {
    fetchReviews(1, pagination.limit);
  }, [debouncedSearch, rating, startDate, endDate]);

  // ── Helpers ──────────────────────────────────────
  const activeFilterCount = [
    debouncedSearch,
    rating !== "all" ? rating : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setRating("all");
    setStartDate("");
    setEndDate("");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchReviews(newPage, pagination.limit);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    fetchReviews(1, newLimit);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(rating !== "all" && { rating }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      await adminService.exportReviewsCSV(params);
      showToast(`Exporting ${pagination.total} review records as CSV...`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export reviews. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  // ── Delete Review Handlers ───────────────────────
  const handleOpenDelete = (review) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedReview) return;
    setActionLoading(true);
    try {
      const res = await adminService.deleteReview(selectedReview.id);
      if (res.success) {
        showToast("✅ Review deleted and seller rating recalculated.", "success");
        setShowDeleteModal(false);
        setSelectedReview(null);
        fetchReviews(pagination.page, pagination.limit);
      } else {
        showToast(res.message || "Failed to delete review.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete review. Please try again.", "error");
    } finally {
      setActionLoading(false);
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
        {/* ── Page Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={24} className="text-amber-500 fill-amber-500" />
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Customer Reviews Moderation
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Monitor, filter, and moderate customer ratings & feedback across all seller partners.
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

        {/* ── Rating Breakdown Stats Bar ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Average Rating Overall */}
          <div className="md:col-span-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-100">Average Rating</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black font-mono tracking-tight">{stats.avgRating}</span>
                <span className="text-sm font-bold text-amber-200">/ 5.0</span>
              </div>
              <p className="text-xs font-medium text-amber-100 mt-1">Based on {stats.totalCount} ratings</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <Star size={28} className="fill-white" />
            </div>
          </div>

          {/* Star Distribution Pills */}
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rating Distribution</p>
            <div className="grid grid-cols-5 gap-2">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const cnt = stats.ratingCounts?.[starNum] || 0;
                const isSelected = rating === String(starNum);
                return (
                  <button
                    key={starNum}
                    onClick={() => setRating(isSelected ? "all" : String(starNum))}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/30"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-slate-800">{starNum}</span>
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500">{cnt}</span>
                  </button>
                );
              })}
            </div>
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
                  placeholder="Buyer, seller, comment, order #..."
                  className="w-full pl-8 pr-8 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-slate-50"
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

            {/* Rating Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Rating Stars
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-slate-50 cursor-pointer"
              >
                <option value="all">All Ratings (1 - 5 Stars)</option>
                <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                <option value="4">4 Stars ⭐⭐⭐⭐</option>
                <option value="3">3 Stars ⭐⭐⭐</option>
                <option value="2">2 Stars ⭐⭐</option>
                <option value="1">1 Star ⭐</option>
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
                  className="w-full pl-8 py-2.5 pr-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-slate-50 cursor-pointer"
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
                  className="w-full pl-8 py-2.5 pr-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-slate-50 cursor-pointer"
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
                <span className="animate-pulse">Loading reviews...</span>
              ) : (
                <>
                  Showing <span className="text-slate-800">{startItem}–{endItem}</span> of{" "}
                  <span className="text-slate-800">{pagination.total}</span> review
                  {pagination.total !== 1 ? "s" : ""}
                </>
              )}
            </p>
            <button
              onClick={() => fetchReviews(pagination.page, pagination.limit)}
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
              className="py-1.5 px-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition bg-white cursor-pointer"
            >
              {[10, 20, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Reviews Cards List ──────────────────────── */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <MessageSquare size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-bold text-sm">No reviews found</p>
              <p className="text-slate-400 text-xs mt-1">
                {activeFilterCount > 0 ? "Try adjusting your filters." : "No customer reviews submitted yet."}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-xs text-amber-600 font-bold hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition duration-300"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  {/* Buyer */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden shrink-0">
                      {rev.buyer_pic ? (
                        <img src={rev.buyer_pic} alt={rev.buyer_name} className="w-full h-full object-cover" />
                      ) : (
                        rev.buyer_name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {rev.buyer_name}
                        {rev.order_number && (
                          <span className="text-[10px] text-slate-400 font-mono font-normal">
                            Order #{rev.order_number}
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{rev.buyer_phone}</p>
                    </div>
                  </div>

                  {/* Seller & Date */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center sm:justify-end gap-1">
                        <Store size={11} /> {rev.business_name}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">By: {rev.seller_name}</p>
                    </div>
                    <button
                      onClick={() => handleOpenDelete(rev)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
                      title="Delete review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Rating & Comment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <StarRating rating={rev.rating} size={16} />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(rev.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    "{rev.comment || "No written comment provided."}"
                  </p>
                </div>

                {/* Seller Reply */}
                {rev.reply && (
                  <div className="bg-purple-50/60 border border-purple-200/60 rounded-xl p-3 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      💬 Seller Response:
                    </span>
                    <p className="text-purple-950 font-medium italic">"{rev.reply}"</p>
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

      {/* ── Delete Confirmation Modal ──────────────── */}
      {showDeleteModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-slate-800">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={18} />
                <h3 className="text-base font-bold text-slate-800">Delete Review</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="text-slate-400 hover:text-slate-700 cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 font-semibold">
              <p>
                Are you sure you want to delete this {selectedReview.rating}-star review from{" "}
                <span className="font-bold text-slate-800">{selectedReview.buyer_name}</span> for{" "}
                <span className="font-bold text-slate-800">{selectedReview.business_name}</span>?
              </p>
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl">
                <p className="font-bold">⚠️ Warning:</p>
                <p className="mt-1 font-normal">
                  Deleting this review will remove it permanently and automatically update the seller's average rating & review count.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 font-bold rounded-xl text-white transition text-xs cursor-pointer disabled:opacity-60"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminReviews;
