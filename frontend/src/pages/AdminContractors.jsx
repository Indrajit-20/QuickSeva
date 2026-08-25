import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Briefcase,
  MessageCircle,
  Award,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import {
  getAdminContractorVerifications,
  reviewAdminContractorVerification,
  getAdminContractorPosts,
  updateAdminContractorPostStatus,
  getAdminQuoteRequests,
  updateAdminQuoteRequestStatus,
  getAdminContractorAnalytics,
} from "../api/contractorApi";

const AdminContractors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "verifications";

  // Tab 1: Verifications State
  const [verifications, setVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [verifStatusFilter, setVerifStatusFilter] = useState("pending");
  const [docPreviewUrl, setDocPreviewUrl] = useState(null);
  const [docZoomLevel, setDocZoomLevel] = useState(1);
  const [rejectionModalItem, setRejectionModalItem] = useState(null);
  const [rejectionReasonPreset, setRejectionReasonPreset] = useState("Document photo is blurry or unreadable");
  const [customRejectionNote, setCustomRejectionNote] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Tab 2: Posts State
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsStatusFilter, setPostsStatusFilter] = useState("all");
  const [postsSearch, setPostsSearch] = useState("");

  // Tab 3: Quote Requests State
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quotesStatusFilter, setQuotesStatusFilter] = useState("all");
  const [quotesSearch, setQuotesSearch] = useState("");

  // Tab 4: Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (activeTab === "verifications") fetchVerifications();
    else if (activeTab === "posts") fetchPosts();
    else if (activeTab === "quotes") fetchQuoteRequests();
    else if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab, verifStatusFilter, postsStatusFilter, postsSearch, quotesStatusFilter, quotesSearch]);

  const fetchVerifications = async () => {
    setLoadingVerifications(true);
    try {
      const res = await getAdminContractorVerifications({ status: verifStatusFilter });
      setVerifications(res?.data?.contractors || []);
    } catch (err) {
      console.error("Failed to fetch verifications:", err);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await getAdminContractorPosts({
        status: postsStatusFilter,
        search: postsSearch,
      });
      setPosts(res?.data?.posts || []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchQuoteRequests = async () => {
    setLoadingQuotes(true);
    try {
      const res = await getAdminQuoteRequests({
        status: quotesStatusFilter,
        search: quotesSearch,
      });
      setQuoteRequests(res?.data?.requests || []);
    } catch (err) {
      console.error("Failed to fetch quote requests:", err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await getAdminContractorAnalytics();
      setAnalyticsData(res?.data || null);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleReviewVerification = async (id, action, notes = "") => {
    try {
      if (action === "reject") setSubmittingRejection(true);
      await reviewAdminContractorVerification(id, action, notes);
      setRejectionModalItem(null);
      fetchVerifications();
    } catch (err) {
      alert("Failed to update verification status");
    } finally {
      setSubmittingRejection(false);
    }
  };

  const handlePostAction = async (id, action) => {
    try {
      await updateAdminContractorPostStatus(id, action);
      fetchPosts();
    } catch (err) {
      alert("Failed to update post status");
    }
  };

  const handleQuoteStatusChange = async (id, status) => {
    try {
      await updateAdminQuoteRequestStatus(id, status);
      fetchQuoteRequests();
    } catch (err) {
      alert("Failed to update quote request status");
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black uppercase rounded-md tracking-wider">
              Admin Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2.5 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200/60 shadow-2xs">
              🏗️
            </span>
            <span>Contractors Hub & Operations</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Manage contractor identity verifications (KYC), moderate site postings, track client price quote leads, and view performance metrics.
          </p>
        </div>
      </div>

      {/* Top Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSearchParams({ tab: "verifications" })}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === "verifications"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShieldCheck size={16} className={activeTab === "verifications" ? "text-amber-400" : "text-slate-400"} />
          <span>KYC Verifications Queue</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: "posts" })}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === "posts"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Briefcase size={16} className={activeTab === "posts" ? "text-emerald-400" : "text-slate-400"} />
          <span>Site Requirements Moderation</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: "quotes" })}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === "quotes"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <MessageCircle size={16} className={activeTab === "quotes" ? "text-sky-400" : "text-slate-400"} />
          <span>Client Quote Inquiry Logs</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: "analytics" })}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === "analytics"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Award size={16} className={activeTab === "analytics" ? "text-purple-400" : "text-slate-400"} />
          <span>Analytics &amp; Leaderboard</span>
        </button>
      </div>

      {/* ── TAB 1: VERIFICATIONS QUEUE ── */}
      {activeTab === "verifications" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              {["pending", "verified", "rejected", "all"].map((statusKey) => (
                <button
                  key={statusKey}
                  onClick={() => setVerifStatusFilter(statusKey)}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold capitalize transition cursor-pointer ${
                    verifStatusFilter === statusKey
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {statusKey}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-bold self-end sm:self-auto">
              Total Found: {verifications.length}
            </span>
          </div>

          {loadingVerifications ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">
              Loading verification applications...
            </div>
          ) : verifications.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">
              No contractors match selected status.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifications.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs hover:bg-slate-100/70 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">🏢 {item.company_name || "Independent Contractor"}</p>
                      <p className="text-xs text-slate-500 font-medium">📞 {item.phone} • 📍 {item.city || "India"}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      item.verification_status === "verified" || item.is_verified_contractor === 1
                        ? "bg-emerald-100 text-emerald-800"
                        : item.verification_status === "pending"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {item.verification_status || "unverified"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">GSTIN</span>
                      <span className="font-mono font-bold text-slate-800">{item.gstin || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">PAN</span>
                      <span className="font-mono font-bold text-slate-800">{item.pan_number || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">LICENSE</span>
                      <span className="font-mono font-bold text-slate-800">{item.license_number || "—"}</span>
                    </div>
                  </div>

                  {item.verification_doc_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setDocPreviewUrl(item.verification_doc_url);
                        setDocZoomLevel(1);
                      }}
                      className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Search size={14} />
                      <span>Preview Document Proof</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => handleReviewVerification(item.id, "approve")}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                    >
                      ✓ Approve Verification
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectionModalItem(item);
                        setRejectionReasonPreset("Document photo is blurry or unreadable");
                        setCustomRejectionNote("");
                      }}
                      className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition cursor-pointer active:scale-95"
                    >
                      ❌ Reject with Reason
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SITE POSTS MODERATION ── */}
      {activeTab === "posts" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              {["all", "active", "featured", "closed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setPostsStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold capitalize transition cursor-pointer ${
                    postsStatusFilter === st
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <input
                type="text"
                placeholder="Search site, city, contractor..."
                value={postsSearch}
                onChange={(e) => setPostsSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          {loadingPosts ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">
              Loading site requirement posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">
              No site posts match criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {post.is_featured === 1 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase shadow-2xs">
                            ⭐ FEATURED SITE
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          post.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{post.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Posted by: <strong>{post.company_name || post.contact_name}</strong> ({post.contact_phone}) • 📍 {post.city}, {post.state || "India"}
                      </p>
                    </div>

                    <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-200 shrink-0">
                      📩 {post.applications_count || 0} Applicants
                    </span>
                  </div>

                  {post.requirements && post.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.requirements.map((r, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                          {r.role_title} ({r.quantity} req) • ₹{r.wage_amount}/{r.wage_type === "per_day" ? "day" : "month"}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 flex-wrap gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Posted: {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => handlePostAction(post.id, "toggle_featured")}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition cursor-pointer active:scale-95 ${
                          post.is_featured === 1
                            ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {post.is_featured === 1 ? "★ Unfeature" : "⭐ Feature Site"}
                      </button>

                      {post.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => handlePostAction(post.id, "close")}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-extrabold rounded-xl transition cursor-pointer active:scale-95"
                        >
                          🔒 Close
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePostAction(post.id, "reopen")}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-xl border border-emerald-200 transition cursor-pointer active:scale-95"
                        >
                          🔓 Re-open
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this site post?")) {
                            handlePostAction(post.id, "delete");
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold rounded-xl border border-rose-200 transition cursor-pointer active:scale-95"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: CLIENT QUOTE INQUIRY LOGS ── */}
      {activeTab === "quotes" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          {/* Explanatory Info Header Banner */}
          <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-sky-600 text-white rounded-xl shadow-xs text-sm">💡</span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">What is Client Quote Inquiry Logs?</h3>
                <p className="text-xs text-slate-600 font-medium">
                  When a customer asks for a price estimate on QuickSeva, it appears here as a lead for you to manage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-sky-200/60 text-xs">
              <div className="p-2.5 bg-white/80 rounded-xl border border-sky-100 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black text-[11px]">1. ⏳ New (Not Called)</span>
                <span className="text-slate-600 font-medium text-[11px]">Customer requested quote → Call them now!</span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-sky-100 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-black text-[11px]">2. 📞 Called & Talking</span>
                <span className="text-slate-600 font-medium text-[11px]">You spoke with the client & sent price</span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-sky-100 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-[11px]">3. 🎯 Job Done</span>
                <span className="text-slate-600 font-medium text-[11px]">Client agreed and work is finished</span>
              </div>
            </div>
          </div>

          {/* Quick Summary Stat Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Customer Leads</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{quoteRequests.length}</span>
            </div>
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">⏳ Needs Call (New)</span>
              <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">
                {quoteRequests.filter((r) => !r.status || r.status === "pending").length}
              </span>
            </div>
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl">
              <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider block">📞 Called & In Progress</span>
              <span className="text-xl font-black text-sky-900 font-mono mt-0.5 block">
                {quoteRequests.filter((r) => r.status === "contacted").length}
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">🎯 Job Done / Closed</span>
              <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">
                {quoteRequests.filter((r) => r.status === "completed").length}
              </span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              {[
                { id: "all", label: "All Leads" },
                { id: "pending", label: "⏳ New (Needs Call)" },
                { id: "contacted", label: "📞 Called" },
                { id: "completed", label: "🎯 Job Done" },
                { id: "cancelled", label: "❌ Cancelled" },
              ].map((filterObj) => (
                <button
                  key={filterObj.id}
                  onClick={() => setQuotesStatusFilter(filterObj.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                    quotesStatusFilter === filterObj.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {filterObj.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <input
                type="text"
                placeholder="Search customer, phone, city..."
                value={quotesSearch}
                onChange={(e) => setQuotesSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-600 transition"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          {loadingQuotes ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">
              Loading customer leads...
            </div>
          ) : quoteRequests.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">
              No customer leads found matching this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {quoteRequests.map((reqItem) => {
                const st = reqItem.status || "pending";

                return (
                  <div key={reqItem.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs hover:bg-slate-100/60 transition">
                    <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm">
                            👤 Customer: {reqItem.customer_name}
                          </span>
                          <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            📞 {reqItem.customer_phone}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          🏢 Contractor Requested: <strong>{reqItem.contractor_company_name || reqItem.contractor_name || "General Contractor"}</strong> ({reqItem.contractor_phone || "No phone"})
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-amber-100/80 text-amber-900 text-[11px] font-bold rounded-md border border-amber-200">
                            🛠️ Work Needed: {reqItem.work_type || "General Construction Work"}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            📍 {reqItem.city || "India"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 ml-auto sm:ml-0">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Current Progress / Status:
                        </span>
                        <select
                          value={st}
                          onChange={(e) => handleQuoteStatusChange(reqItem.id, e.target.value)}
                          className={`pl-3 pr-7 py-1.5 text-xs font-extrabold rounded-xl border appearance-none cursor-pointer outline-none transition ${
                            st === "completed"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : st === "contacted"
                              ? "bg-sky-100 text-sky-800 border-sky-300"
                              : st === "cancelled"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-amber-100 text-amber-900 border-amber-300"
                          }`}
                        >
                          <option value="pending">⏳ New (Not Called Yet)</option>
                          <option value="contacted">📞 Customer Called & Discussed</option>
                          <option value="completed">🎯 Deal Done / Work Finished</option>
                          <option value="cancelled">❌ Cancelled / Rejected</option>
                        </select>
                      </div>
                    </div>

                    {reqItem.notes && (
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 italic leading-relaxed">
                        💬 Client Note: "{reqItem.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-400 font-medium">
                      <span>🗓️ Inquiry Date: {new Date(reqItem.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <a
                        href={`tel:${reqItem.customer_phone}`}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition active:scale-95 flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageCircle size={14} className="text-sky-400" />
                        <span>Call Client ({reqItem.customer_phone})</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: ANALYTICS & LEADERBOARD ── */}
      {activeTab === "analytics" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          {loadingAnalytics || !analyticsData ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">
              Loading analytics and leaderboard...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Contractors</span>
                  <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{analyticsData.stats.totalContractors}</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Compliance Rate</span>
                  <span className="text-2xl font-black text-emerald-900 font-mono mt-1 block">{analyticsData.stats.complianceRate}% Verified</span>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Total Site Postings</span>
                  <span className="text-2xl font-black text-amber-900 font-mono mt-1 block">{analyticsData.stats.totalPosts}</span>
                </div>
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                  <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider block">Worker Connections</span>
                  <span className="text-2xl font-black text-sky-900 font-mono mt-1 block">{analyticsData.stats.totalApplications}</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-3">Contractor &amp; Firm</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Site Posts</th>
                      <th className="py-3 px-3 text-center">Worker Leads</th>
                      <th className="py-3 px-3 text-center">Direct Quotes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {analyticsData.leaderboard.map((item, index) => {
                      const rankBadge = index === 0 ? "🏆 #1" : index === 1 ? "🥈 #2" : index === 2 ? "🥉 #3" : `#${index + 1}`;
                      const isTop3 = index < 3;

                      return (
                        <tr key={item.id} className={isTop3 ? "bg-amber-50/40 hover:bg-amber-50/80" : "bg-white hover:bg-slate-50"}>
                          <td className="py-3 px-3 font-black text-slate-900 text-xs">
                            <span className={`px-2 py-0.5 rounded-lg ${isTop3 ? "bg-amber-500 text-white font-black" : "text-slate-600"}`}>
                              {rankBadge}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{item.company_name || item.name}</div>
                            <div className="text-[11px] text-slate-500 font-semibold">{item.name} ({item.phone}) • 📍 {item.city || "India"}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              item.verification_status === "verified" || item.is_verified_contractor === 1
                                ? "bg-emerald-100 text-emerald-800"
                                : item.verification_status === "pending"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {item.verification_status || "unverified"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{item.posts_count}</td>
                          <td className="py-3 px-3 text-center font-black text-emerald-700">{item.total_applications_received}</td>
                          <td className="py-3 px-3 text-center font-black text-sky-700">{item.quote_leads_received}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Structured Rejection Reason Modal */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900">Specify Verification Rejection Reason</h3>
            <div className="space-y-2">
              {[
                "Document photo is blurry or unreadable",
                "GSTIN / PAN name mismatch with registration",
                "Trade License number is expired or invalid",
                "Other / Custom Note",
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="rejectionPreset"
                    checked={rejectionReasonPreset === reason}
                    onChange={() => setRejectionReasonPreset(reason)}
                    className="accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {rejectionReasonPreset === "Other / Custom Note" && (
              <textarea
                rows={3}
                required
                placeholder="Explain what needs correction..."
                value={customRejectionNote}
                onChange={(e) => setCustomRejectionNote(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 outline-none transition"
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRejection}
                onClick={() => {
                  const finalNote = rejectionReasonPreset === "Other / Custom Note" ? customRejectionNote : rejectionReasonPreset;
                  handleReviewVerification(rejectionModalItem.id, "reject", finalNote);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Document Previewer */}
      {docPreviewUrl && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setDocZoomLevel((prev) => Math.max(prev - 0.25, 0.5))}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-extrabold rounded-xl border border-slate-700"
            >
              Zoom -
            </button>
            <button
              onClick={() => setDocZoomLevel(1)}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-extrabold rounded-xl border border-slate-700"
            >
              Reset
            </button>
            <button
              onClick={() => setDocZoomLevel((prev) => Math.min(prev + 0.25, 3))}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-extrabold rounded-xl border border-slate-700"
            >
              Zoom +
            </button>
            <button
              onClick={() => setDocPreviewUrl(null)}
              className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-extrabold rounded-xl"
            >
              ✕ Close
            </button>
          </div>
          <div className="max-w-4xl max-h-[80vh] overflow-auto p-2">
            <img
              src={docPreviewUrl}
              alt="Verification Document Proof"
              style={{ transform: `scale(${docZoomLevel})`, transformOrigin: "center center" }}
              className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-150"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContractors;
