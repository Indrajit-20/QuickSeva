import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  MessageSquare,
  Phone,
  PlusCircle,
  Share2,
  Trash2,
  Users,
  MessageCircle,
  XCircle,
  Briefcase,
  MapPin,
  Filter,
  Search,
  Edit3,
  X,
  IndianRupee,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  getMyPosts,
  getMyQuoteRequests,
  updatePostStatus,
  updateContractorPost,
  getPostApplications,
  deleteContractorPost,
  updateQuoteStatus,
  updateApplicationStatus,
} from "../../api/contractorApi";
import { useAuth } from "../../context/AuthContext";
import { getWhatsAppContractorToApplicantLink } from "../../utils/whatsappUtils";

const TRADE_CATEGORIES = [
  { id: "All", label: "All Leads", icon: "📋" },
  { id: "My Trades", label: "My Trades", icon: "⭐" },
  { id: "Painting", label: "Painting", icon: "🎨" },
  { id: "Civil", label: "Civil & Masonry", icon: "🏗️" },
  { id: "Electrical", label: "Electrical", icon: "⚡" },
  { id: "Plumbing", label: "Plumbing", icon: "🚰" },
  { id: "Carpentry", label: "Carpentry", icon: "🪚" },
];

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Detect current view mode from route: 'dashboard', 'quotes', or 'posts'
  const getViewModeFromPath = (pathname) => {
    if (pathname.includes("/posts")) return "posts";
    if (pathname.includes("/quotes")) return "quotes";
    return "dashboard";
  };

  const [viewMode, setViewMode] = useState(() => getViewModeFromPath(location.pathname));
  const [posts, setPosts] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for Customer Leads
  const [leadTradeFilter, setLeadTradeFilter] = useState("All");
  const [leadSearch, setLeadSearch] = useState("");

  // Status Filter for Site Listings
  const [postStatusFilter, setPostStatusFilter] = useState("all");

  // Selected post applications modal
  const [selectedPostApps, setSelectedPostApps] = useState(null);
  const [appsList, setAppsList] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const selectedTrades = (() => {
    const raw = user?.trade_specialization || "";
    if (Array.isArray(raw)) return raw;
    return raw ? raw.split(",").map((t) => t.trim()) : [];
  })();

  useEffect(() => {
    setViewMode(getViewModeFromPath(location.pathname));
    fetchDashboardData();
  }, [location.pathname]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [postsRes, quotesRes] = await Promise.all([
        getMyPosts(),
        getMyQuoteRequests(),
      ]);
      setPosts(postsRes?.data?.posts || []);
      setQuoteRequests(quotesRes?.data?.quoteRequests || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePostStatus = async (postId, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "closed" : "active";
    try {
      await updatePostStatus(postId, nextStatus);
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDeletePost = async (postId, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete post "${title}"?\nThis action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await deleteContractorPost(postId);
      if (res?.success) {
        alert("Post deleted successfully.");
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert(err?.response?.data?.message || "Failed to delete post");
    }
  };

  const handleViewApps = async (post) => {
    setSelectedPostApps(post);
    setLoadingApps(true);
    try {
      const res = await getPostApplications(post.id);
      setAppsList(res?.data?.applications || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleUpdateQuoteLeadStatus = async (quoteId, newStatus) => {
    try {
      await updateQuoteStatus(quoteId, newStatus);
      setQuoteRequests((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
      );
    } catch (err) {
      alert("Failed to update lead status");
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      setAppsList((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert("Failed to update application status");
    }
  };

  const totalActive = posts.filter((p) => p.status === "active").length;
  const totalClosed = posts.filter((p) => p.status !== "active").length;
  const totalApps = posts.reduce(
    (sum, p) => sum + (Number(p.applications_count) || 0),
    0
  );

  // Filter Customer Quote Leads
  const filteredQuoteRequests = quoteRequests.filter((req) => {
    const serviceType = (req.service_type || "").toLowerCase();
    const customerName = (req.customer_name || "").toLowerCase();
    const city = (req.city || "").toLowerCase();
    const query = leadSearch.toLowerCase();

    const matchesQuery =
      !query ||
      serviceType.includes(query) ||
      customerName.includes(query) ||
      city.includes(query);

    if (!matchesQuery) return false;
    if (leadTradeFilter === "All") return true;
    if (leadTradeFilter === "My Trades") {
      if (!selectedTrades.length) return true;
      return selectedTrades.some((t) =>
        serviceType.includes(t.toLowerCase())
      );
    }
    return serviceType.includes(leadTradeFilter.toLowerCase());
  });

  // Filter Site Posts by status (active vs closed/expired/inactive)
  const filteredPosts = posts.filter((p) => {
    if (postStatusFilter === "active") return p.status === "active";
    if (postStatusFilter === "closed") return p.status !== "active";
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-4 px-3 sm:px-6 font-sans text-slate-800 pb-24 space-y-6">

      {/* ═════════════════════════════════════════════════════════════
          PAGE VIEW 1: EXECUTIVE DASHBOARD OVERVIEW (/contractor/dashboard)
         ═════════════════════════════════════════════════════════════ */}
      {viewMode === "dashboard" && (
        <div className="space-y-4">
          {/* Hero Header Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/5 rounded-2xl p-4 sm:p-6 border border-amber-200/70 shadow-xs relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-amber-200/50">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                    Contractor Portal
                  </span>
                  {user?.is_verified_contractor === 1 && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-300">
                      <ShieldCheck size={10} className="text-emerald-600" /> Verified Business
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Welcome back, {user?.company_name || user?.name || "Contractor"}! 👋
                </h1>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                  Overview of your active site requirements and customer quote requests.
                </p>
              </div>

              <button
                onClick={() => navigate("/contractor/create-post")}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <PlusCircle size={16} />
                <span>Post Requirement</span>
              </button>
            </div>

            {/* 3 KPI cards — horizontal row even on mobile */}
            <div className="grid grid-cols-3 gap-2 relative z-10">
              <div
                onClick={() => navigate("/contractor/posts")}
                className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 shadow-2xs flex flex-col gap-0.5 cursor-pointer hover:border-amber-400 transition"
              >
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Sites</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-slate-900">{totalActive}</span>
                  <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 mt-1">
                  <Building2 size={16} />
                </div>
              </div>

              <div
                onClick={() => navigate("/contractor/quotes")}
                className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 shadow-2xs flex flex-col gap-0.5 cursor-pointer hover:border-amber-400 transition"
              >
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Leads</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-slate-900">{quoteRequests.length}</span>
                  <span className="text-[9px] font-bold text-amber-600">Inquiries</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 mt-1">
                  <MessageSquare size={16} />
                </div>
              </div>

              <div
                onClick={() => navigate("/contractor/posts")}
                className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 shadow-2xs flex flex-col gap-0.5 cursor-pointer hover:border-amber-400 transition"
              >
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Apps</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-slate-900">{totalApps}</span>
                  <span className="text-[9px] font-bold text-blue-600">Workers</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 mt-1">
                  <Users size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Overview Section: Recent Leads & Active Listings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Leads Preview Box */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <MessageSquare size={18} className="text-amber-600" />
                    Recent Customer Leads
                  </h3>
                  <button
                    onClick={() => navigate("/contractor/quotes")}
                    className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All ({quoteRequests.length})</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {quoteRequests.length === 0 ? (
                  <div className="py-8 text-center text-xs font-medium text-slate-500">
                    No customer lead inquiries received yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {quoteRequests.slice(0, 3).map((req) => (
                      <div
                        key={req.id}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-amber-50/20 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">{req.customer_name}</span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              {req.service_type || "Contract"}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-amber-600" /> {req.city}
                          </p>
                        </div>

                        <a
                          href={`tel:${req.customer_phone}`}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 transition shrink-0"
                        >
                          <Phone size={12} />
                          <span>Call</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Site Listings Preview Box */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <Building2 size={18} className="text-amber-600" />
                    My Active Site Listings
                  </h3>
                  <button
                    onClick={() => navigate("/contractor/posts")}
                    className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage All ({posts.length})</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {posts.length === 0 ? (
                  <div className="py-8 text-center text-xs font-medium text-slate-500">
                    No active site requirement posts created yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {posts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-amber-50/20 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate">{post.title}</h4>
                          <p className="text-[11px] font-semibold text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-amber-600 shrink-0" /> {post.city}
                          </p>
                        </div>

                        <button
                          onClick={() => handleViewApps(post)}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-black rounded-xl shrink-0"
                        >
                          Apps ({post.applications_count || 0})
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          PAGE VIEW 2: DEDICATED CUSTOMER LEADS MANAGER (/contractor/quotes)
         ═════════════════════════════════════════════════════════════ */}
      {viewMode === "quotes" && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Customer Leads Directory
                </span>
                <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {filteredQuoteRequests.length} Leads Total
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Customer Quote Requests
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Review client inquiries and provide direct estimates for painting, civil, plumbing, or electrical contracts.
              </p>
            </div>

            <button
              onClick={() => navigate("/contractor/create-post")}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle size={16} />
              <span>Post Requirement</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="relative w-full flex items-center">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
              />
              <input
                type="text"
                placeholder="Search leads by customer name, city, or trade..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
                className="w-full pr-9 py-2.5 bg-slate-50 rounded-2xl text-xs font-semibold text-slate-900 border border-slate-200 outline-none focus:bg-white focus:border-amber-600 transition shadow-2xs"
              />
              {leadSearch && (
                <button
                  type="button"
                  onClick={() => setLeadSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer z-10"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Filter size={13} /> Trades:
              </span>
              {TRADE_CATEGORIES.map((cat) => {
                const isActive = leadTradeFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setLeadTradeFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 border ${isActive
                        ? "bg-amber-100 text-amber-900 border-amber-300 font-black shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-bold"
                      }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}

              {(leadSearch || leadTradeFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setLeadSearch("");
                    setLeadTradeFilter("All");
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline ml-2 shrink-0"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Quote Leads Grid */}
          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-slate-500 bg-white rounded-3xl border border-slate-200/80">
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading Customer Quote Leads...
            </div>
          ) : filteredQuoteRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-3 font-black border border-amber-200/60">
                <MessageSquare size={30} />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                No Customer Leads Found
              </h3>
              <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
                {leadSearch || leadTradeFilter !== "All"
                  ? "No quote requests matched your search query or trade filter. Try resetting filters."
                  : "Customer inquiries for painting, civil, electrical, or plumbing contracts in your city will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuoteRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[11px] font-black uppercase tracking-wider border border-amber-200">
                        {req.service_type || "General Contract"}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-black text-slate-900 text-base">
                          {req.customer_name}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={14} className="text-amber-600 shrink-0" /> {req.city}
                        </p>
                      </div>

                      {/* Lead Status Selector */}
                      <select
                        value={req.status || "pending"}
                        onChange={(e) =>
                          handleUpdateQuoteLeadStatus(req.id, e.target.value)
                        }
                        className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-xl border outline-none cursor-pointer ${req.status === "completed"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : req.status === "contacted"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : req.status === "cancelled"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="contacted">📞 Contacted</option>
                        <option value="completed">✅ Completed</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3 italic leading-relaxed">
                        "{req.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                    <a
                      href={`tel:${req.customer_phone}`}
                      title={`Call ${req.customer_name}: ${req.customer_phone}`}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                    >
                      <Phone size={14} />
                      <span>Call {req.customer_phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/91${req.customer_phone}?text=${encodeURIComponent(
                        `Hi ${req.customer_name}, I saw your quote request on QuickSeva for ${req.service_type} work in ${req.city}. I am available to provide an estimate.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          PAGE VIEW 3: DEDICATED MY SITE LISTINGS MANAGER (/contractor/posts)
         ═════════════════════════════════════════════════════════════ */}
      {viewMode === "posts" && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Labor Requirements Management
                </span>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {totalActive} Active Posts
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                My Site Listings
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Manage your work site postings, view agency worker applications, and update daily wages.
              </p>
            </div>

            <button
              onClick={() => navigate("/contractor/create-post")}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle size={16} />
              <span>Post Requirement</span>
            </button>
          </div>

          {/* Status Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter size={13} /> Filter:
              </span>
              {[
                { id: "all", label: `All Listings (${posts.length})` },
                { id: "active", label: `Active (${totalActive})` },
                { id: "closed", label: `Closed (${totalClosed})` },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setPostStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition cursor-pointer border ${postStatusFilter === st.id
                      ? "bg-amber-100 text-amber-900 border-amber-300 font-black shadow-2xs"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 font-bold"
                    }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Site Posts Grid */}
          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-slate-500 bg-white rounded-3xl border border-slate-200/80">
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading Site Posts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-3 font-black border border-amber-200/60">
                <Building2 size={30} />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                No Site Listings Found
              </h3>
              <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto mb-4">
                Post your site labor requirements to hire painters, masons, electricians, and helpers.
              </p>
              <button
                onClick={() => navigate("/contractor/create-post")}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                Post Site Requirement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition"
                >
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Status Badges, Date Range, & Delete Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${post.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                        >
                          {post.status}
                        </span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          {post.start_date ? post.start_date.split("T")[0] : ""} to {post.end_date ? post.end_date.split("T")[0] : ""}
                        </span>
                      </div>

                      {/* Top-Right Trash Action Button */}
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id, post.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                        title="Delete requirement"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Main Content */}
                    <div>
                      <h3 className="font-black text-slate-900 text-base sm:text-lg leading-snug line-clamp-2 mb-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 font-semibold flex items-center gap-1 truncate">
                        <MapPin size={14} className="text-amber-600 shrink-0" />
                        <span>{Array.from(new Set(([post.site_address, post.city, post.state].filter(Boolean).join(", ")).split(", "))).join(", ")}</span>
                      </p>
                    </div>

                    {/* Actions Toolbar — Responsive Grid */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                      {/* Applicants Button */}
                      <button
                        type="button"
                        onClick={() => handleViewApps(post)}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <Users size={14} className="text-amber-600" />
                        <span>Applicants ({post.applications_count || 0})</span>
                      </button>

                      {/* View Public Button */}
                      <button
                        type="button"
                        onClick={() => navigate(`/contractor-posts/${post.id}?fromPage=/contractor/posts`)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                        title="View public post detail page"
                      >
                        <Eye size={14} />
                        <span>View Public</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => navigate(`/contractor/edit-post/${post.id}`)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                        title="Edit requirement details"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>

                      {/* Mark Closed / Reopen */}
                      <button
                        type="button"
                        onClick={() => handleTogglePostStatus(post.id, post.status)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition cursor-pointer active:scale-95 ${post.status === "active"
                            ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-black"
                          }`}
                      >
                        {post.status === "active" ? "Mark Closed" : "Re-open"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── APPLICANTS DRAWER MODAL (z-[9999]) ── */}
      {selectedPostApps && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">
                  Manpower Applications ({appsList.length})
                </span>
                <h3 className="text-base font-black text-white tracking-tight leading-snug truncate max-w-[320px]">
                  {selectedPostApps.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPostApps(null)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:bg-rose-600 flex items-center justify-center text-white transition cursor-pointer shrink-0 shadow-md active:scale-95"
                title="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              {loadingApps ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  <div className="w-7 h-7 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading applicant details...
                </div>
              ) : appsList.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-500">
                  <Users size={32} className="text-slate-300 mx-auto mb-2" />
                  <p>No agencies or workers have applied to this site requirement yet.</p>
                </div>
              ) : (
                appsList.map((app) => {
                  const currentAppStatus = app.status || "pending";
                  const waLink = getWhatsAppContractorToApplicantLink({
                    phone: app.applicant_phone,
                    applicantName: app.applicant_name,
                    postTitle: selectedPostApps.title,
                    workersCount: app.workers_count,
                  });

                  return (
                    <div
                      key={app.id}
                      className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 hover:bg-amber-50/20 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {app.applicant_name}
                            </h4>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${currentAppStatus === "hired"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : currentAppStatus === "contacted"
                                    ? "bg-sky-100 text-sky-800 border-sky-300"
                                    : currentAppStatus === "rejected"
                                      ? "bg-rose-100 text-rose-800 border-rose-300"
                                      : "bg-amber-100 text-amber-800 border-amber-300"
                                }`}
                            >
                              {currentAppStatus === "hired"
                                ? "🎯 Hired"
                                : currentAppStatus === "contacted"
                                  ? "📞 Contacted"
                                  : currentAppStatus === "rejected"
                                    ? "❌ Rejected"
                                    : "⏳ Pending"}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-700 capitalize mt-0.5 block">
                            {app.applicant_type === "agency"
                              ? "🏢 Manpower Agency"
                              : app.applicant_type === "group_leader"
                                ? "👷 Group Leader (Thekedar)"
                                : "👤 Individual Worker"}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-black border border-amber-200 shrink-0">
                          👥 {app.workers_count} Workers
                        </span>
                      </div>

                      {app.notes && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 italic">
                          "{app.notes}"
                        </p>
                      )}

                      {/* Interactive Status Update Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateApplicationStatus(app.id, "contacted")}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${currentAppStatus === "contacted"
                              ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                              : "bg-white text-sky-700 border-sky-200 hover:bg-sky-50"
                            }`}
                        >
                          Contacted
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateApplicationStatus(app.id, "hired")}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${currentAppStatus === "hired"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }`}
                        >
                          Hire
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateApplicationStatus(app.id, "rejected")}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${currentAppStatus === "rejected"
                              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                              : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                            }`}
                        >
                          Reject
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                        <a
                          href={`tel:${app.applicant_phone}`}
                          className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <Phone size={13} />
                          <span>Call {app.applicant_phone}</span>
                        </a>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
