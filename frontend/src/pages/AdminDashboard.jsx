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
} from "lucide-react";

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
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 mb-2 border-b border-slate-105 pb-3">Platform Controls</h2>

          <button
            onClick={() => navigate("/admin/users")}
            className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-99"
          >
            <div className="flex items-center gap-3 text-xs">
              <Users size={16} />
              <span>Manage User List</span>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate("/admin/sellers")}
            className="w-full flex items-center justify-between p-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-99"
          >
            <div className="flex items-center gap-3 text-xs">
              <UserCheck size={16} />
              <span>Verify Seller Partners</span>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate("/admin/disputes")}
            className="w-full flex items-center justify-between p-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-99"
          >
            <div className="flex items-center gap-3 text-xs">
              <ShieldCheck size={16} />
              <span>Dispute & Payout Center</span>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => {
              setShowPolicyEditor(true);
              handleLoadPolicy("privacy_policy");
            }}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition cursor-pointer active:scale-99"
          >
            <div className="flex items-center gap-3 text-xs">
              <BookOpen size={16} className="text-blue-600" />
              <span>Manage CMS Policies</span>
            </div>
            <span>⚙</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
