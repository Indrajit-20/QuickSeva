import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPolicy, updatePolicy } from "../api/policyService";
import { getBackendErrorMessage } from "../api/authService";
import { adminService } from "../api/adminService";
import {
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  IndianRupee,
  Activity,
  UserCheck,
  ShieldCheck,
  BookOpen,
  MessageCircle,
  Award,
  Search,
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalServices: 0,
    completedServices: 0,
    pendingServices: 0,
    disputedServices: 0,
    revenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Contractor Verifications Queue State
  const [showContractorVerifications, setShowContractorVerifications] = useState(false);
  const [contractorVerifications, setContractorVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [verificationQueueTab, setVerificationQueueTab] = useState("pending");
  const [docPreviewUrl, setDocPreviewUrl] = useState(null);
  const [docZoomLevel, setDocZoomLevel] = useState(1);

  // Structured Rejection Modal State
  const [rejectionModalItem, setRejectionModalItem] = useState(null);
  const [rejectionReasonPreset, setRejectionReasonPreset] = useState("Document photo is blurry or unreadable");
  const [customRejectionNote, setCustomRejectionNote] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Site Requirements Moderation State
  const [showPostModeration, setShowPostModeration] = useState(false);
  const [adminPosts, setAdminPosts] = useState([]);
  const [loadingAdminPosts, setLoadingAdminPosts] = useState(false);
  const [adminPostsTab, setAdminPostsTab] = useState("all");
  const [adminPostsSearch, setAdminPostsSearch] = useState("");

  // Client Quote Requests Oversight State
  const [showQuoteRequestsModal, setShowQuoteRequestsModal] = useState(false);
  const [adminQuoteRequests, setAdminQuoteRequests] = useState([]);
  const [loadingQuoteRequests, setLoadingQuoteRequests] = useState(false);
  const [quoteTabFilter, setQuoteTabFilter] = useState("all");
  const [quoteSearch, setQuoteSearch] = useState("");

  // Contractor Analytics & Leaderboard State
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAdminAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await getAdminContractorAnalytics();
      setAnalyticsData(res?.data || null);
    } catch (err) {
      console.error("Failed to fetch contractor analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchAdminPosts = async () => {
    setLoadingAdminPosts(true);
    try {
      const res = await getAdminContractorPosts({
        status: adminPostsTab,
        search: adminPostsSearch,
      });
      setAdminPosts(res?.data?.posts || []);
    } catch (err) {
      console.error("Failed to fetch admin contractor posts:", err);
    } finally {
      setLoadingAdminPosts(false);
    }
  };

  const fetchAdminQuoteRequests = async () => {
    setLoadingQuoteRequests(true);
    try {
      const res = await getAdminQuoteRequests({
        status: quoteTabFilter,
        search: quoteSearch,
      });
      setAdminQuoteRequests(res?.data?.requests || []);
    } catch (err) {
      console.error("Failed to fetch admin quote requests:", err);
    } finally {
      setLoadingQuoteRequests(false);
    }
  };

  const handleUpdateQuoteStatus = async (id, status) => {
    try {
      await updateAdminQuoteRequestStatus(id, status);
      fetchAdminQuoteRequests();
    } catch (err) {
      alert("Failed to update quote request status");
    }
  };

  const handlePostAction = async (id, action) => {
    try {
      await updateAdminContractorPostStatus(id, action);
      fetchAdminPosts();
    } catch (err) {
      alert("Failed to update post status");
    }
  };

  const fetchContractorVerifications = async () => {
    setLoadingVerifications(true);
    try {
      const res = await getAdminContractorVerifications({ status: "all" });
      setContractorVerifications(res?.data?.verifications || []);
    } catch (err) {
      console.error("Failed to fetch contractor verifications:", err);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const handleReviewVerification = async (id, action, notes = null) => {
    try {
      await reviewAdminContractorVerification(id, action, notes);
      setRejectionModalItem(null);
      fetchContractorVerifications();
    } catch (err) {
      alert("Failed to review contractor verification.");
    }
  };

  // Policy Editor State
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [selectedPolicyKey, setSelectedPolicyKey] = useState("privacy_policy");
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState(null);
  const [editorSuccess, setEditorSuccess] = useState(null);

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const result = await adminService.getStats();
      if (result.success && result.data) {
        setDashboardStats(result.data.stats);
        setRecentActivity(result.data.recentActivity || []);
      }
    } catch (err) {
      console.error(err);
      setStatsError("Failed to fetch dashboard stats.");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLoadPolicy = async (key) => {
    setSelectedPolicyKey(key);
    setEditorLoading(true);
    setEditorError(null);
    setEditorSuccess(null);
    try {
      const result = await getPolicy(key);
      setPolicyTitle(result.data.title);
      setPolicyContent(result.data.content);
    } catch (err) {
      console.error(err);
      setEditorError(getBackendErrorMessage(err));
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    setEditorLoading(true);
    setEditorError(null);
    setEditorSuccess(null);
    try {
      await updatePolicy(selectedPolicyKey, {
        title: policyTitle,
        content: policyContent,
      });
      setEditorSuccess("Policy updated successfully and stored in MySQL DB!");
    } catch (err) {
      console.error(err);
      setEditorError(getBackendErrorMessage(err));
    } finally {
      setEditorLoading(false);
    }
  };

  useEffect(() => {
    // Check if admin is logged in
    const userRole = localStorage.getItem("userRole");
    const isAdminAuthenticated =
      localStorage.getItem("isAdminAuthenticated") === "true";
    const adminEmail = localStorage.getItem("adminEmail") || "admin@quickseva.com";

    if (userRole !== "admin" || !isAdminAuthenticated) {
      navigate("/admin/login");
      return;
    }

    setAdminData({
      email: adminEmail,
      lastLogin: new Date().toLocaleString(),
    });

    fetchStats();
  }, [navigate]);

  if (!adminData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="text-slate-600 text-2xl font-bold animate-pulse">Loading Admin Console...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: dashboardStats.totalUsers.toLocaleString(),
      subtitle: `${dashboardStats.activeUsers} active accounts`,
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      iconColor: "text-blue-600 bg-blue-50",
    },
    {
      title: "Total Services",
      value: dashboardStats.totalServices.toLocaleString(),
      subtitle: "Active category items",
      icon: Briefcase,
      color: "from-purple-500 to-pink-600",
      iconColor: "text-purple-600 bg-purple-50",
    },
    {
      title: "Completed Jobs",
      value: dashboardStats.completedServices.toLocaleString(),
      subtitle: "Successful transactions",
      icon: CheckCircle,
      color: "from-emerald-500 to-teal-600",
      iconColor: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Pending Bookings",
      value: dashboardStats.pendingServices.toLocaleString(),
      subtitle: "In-progress requests",
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      iconColor: "text-amber-600 bg-amber-50",
    },
    {
      title: "Disputed Bookings",
      value: dashboardStats.disputedServices.toLocaleString(),
      subtitle: "Awaiting resolution",
      icon: AlertTriangle,
      color: "from-rose-500 to-red-600",
      iconColor: "text-red-600 bg-red-50",
    },
    {
      title: "Total Revenue",
      value: `₹${dashboardStats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Platform commission fee sum",
      icon: IndianRupee,
      color: "from-cyan-500 to-blue-600",
      iconColor: "text-sky-600 bg-sky-50",
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "signup":
        return "✨";
      case "order":
        return "📅";
      case "wallet":
        return "💳";
      default:
        return "🔹";
    }
  };

  const formatActivityTime = (dateString) => {
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-105 focus:border-blue-500 transition font-medium shadow-xs";

  return (
    <div className="space-y-8 text-left">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-1 font-semibold text-sm">
            Logged in as: <span className="text-blue-600 font-bold">{adminData.email}</span>
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={statsLoading}
          className="px-4 py-2.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition shadow-xs flex items-center gap-2 self-start cursor-pointer active:scale-95"
        >
          <Activity size={14} className={statsLoading ? "animate-spin text-blue-600" : "text-blue-600"} />
          <span>Refresh Data</span>
        </button>
      </div>

      {statsError && (
        <div className="bg-red-50 border border-red-200 text-red-750 rounded-2xl p-4 text-sm font-semibold shadow-xs">
          ⚠️ {statsError}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-slate-800 text-2xl font-black tracking-tight pt-1 font-mono">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.iconColor} shadow-2xs`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-4 flex items-center gap-1.5 font-bold">
                <span>{card.subtitle}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Policy Editor Overlay Block */}
      {showPolicyEditor && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              <span>Manage Site Policies</span>
            </h2>
            <button
              onClick={() => setShowPolicyEditor(false)}
              className="text-slate-500 hover:text-slate-800 text-xs bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer font-bold"
            >
              Close Editor
            </button>
          </div>

          {editorError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-semibold">
              ⚠️ {editorError}
            </div>
          )}

          {editorSuccess && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-xl p-4 text-xs font-semibold">
              ✅ {editorSuccess}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <label htmlFor="policy-select" className="text-slate-600 text-xs font-bold uppercase tracking-wider">Select Document:</label>
                <select
                  id="policy-select"
                  value={selectedPolicyKey}
                  onChange={(e) => handleLoadPolicy(e.target.value)}
                  disabled={editorLoading}
                  className="bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="privacy_policy">Privacy Policy</option>
                  <option value="terms_of_service">Terms of Service</option>
                </select>
              </div>
              {editorLoading && (
                <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold">
                  <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading Document...</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="policy-title" className="block text-slate-655 text-xs font-bold uppercase tracking-wider mb-2">Document Title</label>
              <input
                id="policy-title"
                type="text"
                value={policyTitle}
                onChange={(e) => setPolicyTitle(e.target.value)}
                disabled={editorLoading}
                placeholder="e.g., Privacy Policy"
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="policy-content" className="block text-slate-655 text-xs font-bold uppercase tracking-wider">Document Content (HTML format)</label>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Supports basic markup tags</span>
              </div>
              <textarea
                id="policy-content"
                value={policyContent}
                onChange={(e) => setPolicyContent(e.target.value)}
                disabled={editorLoading}
                placeholder="Enter HTML formatted text..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono text-xs leading-relaxed h-80 resize-y"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                onClick={() => setShowPolicyEditor(false)}
                disabled={editorLoading}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePolicy}
                disabled={editorLoading || !policyTitle || !policyContent}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xs flex items-center text-xs cursor-pointer"
              >
                {editorLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Policy Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-105 pb-3">
            <Activity className="text-blue-600" size={18} />
            <h2 className="text-lg font-bold text-slate-800">Recent Activity Log</h2>
          </div>

          <div className="space-y-4 flex-1">
            {statsLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs animate-pulse font-semibold">Loading updates...</div>
            ) : recentActivity.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">No recent updates in the log logs.</div>
            ) : (
              recentActivity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 bg-white rounded-lg border border-slate-200/50 shadow-2xs">{getActivityIcon(item.type)}</span>
                    <p className="text-slate-700 text-xs font-bold">{item.action}</p>
                  </div>
                  <span className="text-slate-550 text-[10px] font-bold">
                    {formatActivityTime(item.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Platform Core Controls</span>
            </h2>

            <div className="grid grid-cols-1 gap-2.5 mt-3">
              <button
                onClick={() => navigate("/admin/users")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold rounded-2xl border border-slate-200 transition cursor-pointer active:scale-99"
              >
                <div className="flex items-center gap-3 text-xs">
                  <Users size={16} className="text-blue-600" />
                  <span>Manage User List</span>
                </div>
                <span className="text-slate-400 font-bold">→</span>
              </button>

              <button
                onClick={() => navigate("/admin/sellers")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold rounded-2xl border border-slate-200 transition cursor-pointer active:scale-99"
              >
                <div className="flex items-center gap-3 text-xs">
                  <UserCheck size={16} className="text-purple-600" />
                  <span>Verify Seller Partners</span>
                </div>
                <span className="text-slate-400 font-bold">→</span>
              </button>

              <button
                onClick={() => navigate("/admin/disputes")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold rounded-2xl border border-slate-200 transition cursor-pointer active:scale-99"
              >
                <div className="flex items-center gap-3 text-xs">
                  <ShieldCheck size={16} className="text-rose-600" />
                  <span>Dispute &amp; Payout Center</span>
                </div>
                <span className="text-slate-400 font-bold">→</span>
              </button>

              <button
                onClick={() => navigate("/admin/contractors")}
                className="w-full flex items-center justify-between p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold rounded-2xl border border-amber-200 transition cursor-pointer active:scale-99"
              >
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-base">🏗️</span>
                  <span>Contractors Management Hub</span>
                </div>
                <span className="text-amber-700 font-bold">→</span>
              </button>

              <button
                onClick={() => navigate("/admin/policies")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold rounded-2xl border border-slate-200 transition cursor-pointer active:scale-99"
              >
                <div className="flex items-center gap-3 text-xs">
                  <BookOpen size={16} className="text-indigo-600" />
                  <span>Manage CMS Policies</span>
                </div>
                <span className="text-slate-400 font-bold">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contractor Verifications Modal */}
      {showContractorVerifications && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <ShieldCheck size={18} className="text-amber-400" />
                  <span>Contractor Verification Queue</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Review GST, PAN, and Construction Licenses submitted by contractors
                </p>
              </div>
              <button
                onClick={() => setShowContractorVerifications(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Filter Tabs for Verifications Queue */}
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setVerificationQueueTab("pending")}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                    verificationQueueTab === "pending"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  ⏳ Pending ({contractorVerifications.filter((v) => (v.verification_status || "pending") === "pending").length})
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationQueueTab("verified")}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                    verificationQueueTab === "verified"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  ✓ Verified ({contractorVerifications.filter((v) => v.verification_status === "verified" || v.is_verified_contractor === 1).length})
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationQueueTab("rejected")}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                    verificationQueueTab === "rejected"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                  }`}
                >
                  ❌ Rejected ({contractorVerifications.filter((v) => v.verification_status === "rejected").length})
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationQueueTab("all")}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                    verificationQueueTab === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All ({contractorVerifications.length})
                </button>
              </div>

              {loadingVerifications ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  Loading verification requests...
                </div>
              ) : contractorVerifications.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  No contractor verification requests found.
                </div>
              ) : (
                (() => {
                  const filteredList = contractorVerifications.filter((item) => {
                    const st = item.verification_status || "pending";
                    if (verificationQueueTab === "pending") return st === "pending" && item.is_verified_contractor !== 1;
                    if (verificationQueueTab === "verified") return st === "verified" || item.is_verified_contractor === 1;
                    if (verificationQueueTab === "rejected") return st === "rejected";
                    return true;
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs font-semibold text-slate-400">
                        No contractor records under <strong>"{verificationQueueTab}"</strong> status.
                      </div>
                    );
                  }

                  return filteredList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {item.company_name || item.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Contact: {item.name} ({item.phone}) • {item.city || "India"}
                          </p>
                          <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
                            Trade: {item.trade_specialization || "General Contractor"}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            item.verification_status === "verified" || item.is_verified_contractor === 1
                              ? "bg-emerald-100 text-emerald-800"
                              : item.verification_status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.verification_status || "Pending"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px]">GSTIN</span>
                          <span className="font-extrabold text-slate-800">{item.gstin || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px]">PAN NUMBER</span>
                          <span className="font-extrabold text-slate-800">{item.pan_number || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px]">LICENSE NO.</span>
                          <span className="font-extrabold text-slate-800">{item.license_number || "N/A"}</span>
                        </div>
                      </div>

                      {item.verification_notes && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                          <strong>Admin Rejection Note:</strong> "{item.verification_notes}"
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 flex-wrap gap-2">
                        {item.verification_doc_url ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDocZoomLevel(1);
                              setDocPreviewUrl(
                                item.verification_doc_url.startsWith("http")
                                  ? item.verification_doc_url
                                  : `http://localhost:5000${item.verification_doc_url}`
                              );
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold rounded-xl border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span>🔍 Preview Document Proof</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">No document uploaded</span>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectionModalItem(item);
                              setRejectionReasonPreset("Document photo is blurry or unreadable");
                              setCustomRejectionNote("");
                            }}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold rounded-xl border border-rose-200 transition cursor-pointer active:scale-95"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewVerification(item.id, "approve", "Verification document and credentials approved.")}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                          >
                            ✓ Approve & Verify
                          </button>
                        </div>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENT PREVIEW LIGHTBOX MODAL (z-[10000]) ── */}
      {docPreviewUrl && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 text-white p-3 rounded-2xl w-full max-w-4xl flex items-center justify-between mb-3 border border-slate-800">
            <span className="text-xs font-bold text-slate-300">📄 Contractor Verification Document Lightbox</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDocZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
              >
                Zoom -
              </button>
              <span className="text-xs font-extrabold text-amber-400">{Math.round(docZoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setDocZoomLevel((z) => Math.min(3, z + 0.25))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
              >
                Zoom +
              </button>
              <button
                type="button"
                onClick={() => setDocZoomLevel(1)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setDocPreviewUrl(null)}
                className="w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold flex items-center justify-center cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-w-4xl max-h-[80vh] overflow-auto bg-slate-900/60 p-4 rounded-3xl border border-slate-800 flex items-center justify-center">
            <img
              src={docPreviewUrl}
              alt="Document Preview"
              style={{ transform: `scale(${docZoomLevel})`, transformOrigin: "center center" }}
              className="max-h-[70vh] object-contain rounded-xl transition-transform duration-200"
            />
          </div>
        </div>
      )}

      {/* ── STRUCTURED REJECTION REASON MODAL (z-[10000]) ── */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span className="text-rose-600">❌</span>
                <span>Reject Contractor Verification</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectionModalItem(null)}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Please specify the reason for rejecting <strong>{rejectionModalItem.company_name || rejectionModalItem.name}</strong>.
              This note will be shown on their profile page so they can re-upload correct proof.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">Select Rejection Reason:</label>
              {[
                "Document photo is blurry or unreadable",
                "GSTIN / PAN name mismatch with registration",
                "Trade License number is expired or invalid",
                "Other / Custom Note",
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    rejectionReasonPreset === reason
                      ? "bg-rose-50 border-rose-300 text-rose-900"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={rejectionReasonPreset === reason}
                    onChange={() => setRejectionReasonPreset(reason)}
                    className="accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {rejectionReasonPreset === "Other / Custom Note" && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Custom Rejection Note *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain what document or number needs correction..."
                  value={customRejectionNote}
                  onChange={(e) => setCustomRejectionNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 outline-none transition"
                />
              </div>
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
                onClick={() => {
                  const finalNote =
                    rejectionReasonPreset === "Other / Custom Note"
                      ? customRejectionNote
                      : rejectionReasonPreset;
                  handleReviewVerification(rejectionModalItem.id, "reject", finalNote);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SITE REQUIREMENTS MODERATION MODAL (z-[9999]) ── */}
      {showPostModeration && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Briefcase size={18} className="text-emerald-400" />
                  <span>Site Requirements &amp; Post Moderation</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Inspect, feature, close, or remove contractor workforce demand posts across India
                </p>
              </div>
              <button
                onClick={() => setShowPostModeration(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setAdminPostsTab("all")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      adminPostsTab === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    All ({adminPosts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminPostsTab("active")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      adminPostsTab === "active" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    Active ({adminPosts.filter((p) => p.status === "active").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminPostsTab("featured")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      adminPostsTab === "featured" ? "bg-amber-500 text-white shadow-xs" : "bg-amber-50 text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    ⭐ Featured ({adminPosts.filter((p) => p.is_featured === 1).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminPostsTab("closed")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      adminPostsTab === "closed" ? "bg-slate-700 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Closed ({adminPosts.filter((p) => p.status === "closed").length})
                  </button>
                </div>

                <div className="relative min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search site, city, contractor..."
                    value={adminPostsSearch}
                    onChange={(e) => setAdminPostsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>
              </div>

              {loadingAdminPosts ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  Loading site requirement posts...
                </div>
              ) : adminPosts.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  No site requirement posts match your selected filter.
                </div>
              ) : (
                (() => {
                  const filtered = adminPosts.filter((post) => {
                    if (adminPostsTab === "active" && post.status !== "active") return false;
                    if (adminPostsTab === "featured" && post.is_featured !== 1) return false;
                    if (adminPostsTab === "closed" && post.status !== "closed") return false;
                    if (adminPostsSearch) {
                      const term = adminPostsSearch.toLowerCase();
                      const titleMatch = (post.title || "").toLowerCase().includes(term);
                      const cityMatch = (post.city || "").toLowerCase().includes(term);
                      const nameMatch = (post.contact_name || post.contractor_user_name || "").toLowerCase().includes(term);
                      if (!titleMatch && !cityMatch && !nameMatch) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs font-semibold text-slate-400">
                        No site requirements in this view.
                      </div>
                    );
                  }

                  return filtered.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs hover:bg-slate-100/60 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {post.is_featured === 1 && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase shadow-2xs flex items-center gap-1">
                                ⭐ FEATURED SITE
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                post.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {post.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Posted by: <strong>{post.company_name || post.contact_name}</strong> ({post.contact_phone}) • 📍 {post.city}, {post.state || "India"}
                          </p>
                        </div>

                        <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-200 shrink-0">
                          📩 {post.applications_count || 0} Applications
                        </span>
                      </div>

                      {/* Requirements Breakdown */}
                      {post.requirements && post.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.requirements.map((r, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                              {r.role_title} ({r.quantity} required) • ₹{r.wage_amount}/{r.wage_type === "per_day" ? "day" : "month"}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions Bar */}
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
                              if (window.confirm("Are you sure you want to delete this site requirement post permanently?")) {
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
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CLIENT QUOTE REQUEST OVERSIGHT MODAL (z-[9999]) ── */}
      {showQuoteRequestsModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <MessageCircle size={18} className="text-sky-400" />
                  <span>Client Project Quote Request Logs</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Monitor and track direct customer project inquiries sent to contractors across India
                </p>
              </div>
              <button
                onClick={() => setShowQuoteRequestsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setQuoteTabFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      quoteTabFilter === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    All ({adminQuoteRequests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteTabFilter("pending")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      quoteTabFilter === "pending" ? "bg-amber-500 text-white shadow-xs" : "bg-amber-50 text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    ⏳ Pending ({adminQuoteRequests.filter((q) => (q.status || "pending") === "pending").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteTabFilter("contacted")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      quoteTabFilter === "contacted" ? "bg-sky-600 text-white shadow-xs" : "bg-sky-50 text-sky-800 hover:bg-sky-100"
                    }`}
                  >
                    📞 Contacted ({adminQuoteRequests.filter((q) => q.status === "contacted").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteTabFilter("completed")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      quoteTabFilter === "completed" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    🎯 Completed ({adminQuoteRequests.filter((q) => q.status === "completed").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteTabFilter("cancelled")}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer shrink-0 ${
                      quoteTabFilter === "cancelled" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                    }`}
                  >
                    ❌ Cancelled ({adminQuoteRequests.filter((q) => q.status === "cancelled").length})
                  </button>
                </div>

                <div className="relative min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search customer, phone, city..."
                    value={quoteSearch}
                    onChange={(e) => setQuoteSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-600 transition"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>
              </div>

              {loadingQuoteRequests ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  Loading quote requests...
                </div>
              ) : adminQuoteRequests.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  No client quote requests found.
                </div>
              ) : (
                (() => {
                  const filtered = adminQuoteRequests.filter((q) => {
                    const st = q.status || "pending";
                    if (quoteTabFilter === "pending" && st !== "pending") return false;
                    if (quoteTabFilter === "contacted" && st !== "contacted") return false;
                    if (quoteTabFilter === "completed" && st !== "completed") return false;
                    if (quoteTabFilter === "cancelled" && st !== "cancelled") return false;
                    if (quoteSearch) {
                      const term = quoteSearch.toLowerCase();
                      const nameMatch = (q.customer_name || "").toLowerCase().includes(term);
                      const phoneMatch = (q.customer_phone || "").includes(term);
                      const cityMatch = (q.city || "").toLowerCase().includes(term);
                      const contractorMatch = (q.contractor_name || "").toLowerCase().includes(term);
                      if (!nameMatch && !phoneMatch && !cityMatch && !contractorMatch) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs font-semibold text-slate-400">
                        No quote inquiries in this view.
                      </div>
                    );
                  }

                  return filtered.map((reqItem) => {
                    const st = reqItem.status || "pending";

                    return (
                      <div
                        key={reqItem.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs hover:bg-slate-100/60 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-black text-slate-900 text-sm">
                                Client: {reqItem.customer_name}
                              </span>
                              <span className="text-xs font-bold text-slate-500">
                                ({reqItem.customer_phone})
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              Assigned Contractor: <strong>{reqItem.contractor_company_name || reqItem.contractor_name || "General Contractor"}</strong> ({reqItem.contractor_phone || "No phone"})
                            </p>
                            <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
                              Work Type: {reqItem.work_type || "General Construction Work"} • 📍 {reqItem.city}, India
                            </span>
                          </div>

                          <div className="relative shrink-0">
                            <select
                              value={st}
                              onChange={(e) => handleUpdateQuoteStatus(reqItem.id, e.target.value)}
                              className={`pl-3 pr-7 py-1.5 text-xs font-extrabold rounded-xl border appearance-none cursor-pointer outline-none ${
                                st === "completed"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : st === "contacted"
                                  ? "bg-sky-100 text-sky-800 border-sky-300"
                                  : st === "cancelled"
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : "bg-amber-100 text-amber-900 border-amber-300"
                              }`}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="contacted">📞 Contacted</option>
                              <option value="completed">🎯 Completed</option>
                              <option value="cancelled">❌ Cancelled</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {reqItem.notes && (
                          <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 italic leading-relaxed">
                            "{reqItem.notes}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-400 font-medium">
                          <span>Inquiry Date: {new Date(reqItem.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <a
                            href={`tel:${reqItem.customer_phone}`}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-lg transition active:scale-95 flex items-center gap-1"
                          >
                            <span>📞 Call Client</span>
                          </a>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTRACTOR ANALYTICS & LEADERBOARD MODAL (z-[9999]) ── */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  <span>Contractor Analytics &amp; Top Leaderboard</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Platform performance metrics, contractor compliance, and top contractor rankings
                </p>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {loadingAnalytics || !analyticsData ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  Loading contractor analytics...
                </div>
              ) : (
                <>
                  {/* High-Level Metric Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Contractors</span>
                      <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{analyticsData.stats.totalContractors}</span>
                    </div>
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Compliance Rate</span>
                      <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">{analyticsData.stats.complianceRate}% Verified</span>
                    </div>
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Total Site Postings</span>
                      <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">{analyticsData.stats.totalPosts}</span>
                    </div>
                    <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl">
                      <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider block">Worker Connections</span>
                      <span className="text-xl font-black text-sky-900 font-mono mt-0.5 block">{analyticsData.stats.totalApplications}</span>
                    </div>
                  </div>

                  {/* Top Contractor Leaderboard Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>🏆 Top Contractor Leaderboard</span>
                      </h4>
                      <span className="text-xs font-semibold text-slate-400">Ranked by total worker applications received</span>
                    </div>

                    {analyticsData.leaderboard.length === 0 ? (
                      <div className="py-8 text-center text-xs font-semibold text-slate-400">
                        No contractor activity logged yet.
                      </div>
                    ) : (
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
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                        item.verification_status === "verified" || item.is_verified_contractor === 1
                                          ? "bg-emerald-100 text-emerald-800"
                                          : item.verification_status === "pending"
                                          ? "bg-amber-100 text-amber-900"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {item.verification_status === "verified" || item.is_verified_contractor === 1
                                        ? "✓ Verified"
                                        : item.verification_status === "pending"
                                        ? "⏳ Pending"
                                        : "Unverified"}
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
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
