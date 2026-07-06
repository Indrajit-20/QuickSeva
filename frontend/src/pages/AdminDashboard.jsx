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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading Admin Console...</div>
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
      borderColor: "border-blue-500/30",
    },
    {
      title: "Total Services",
      value: dashboardStats.totalServices.toLocaleString(),
      subtitle: "Active category items",
      icon: Briefcase,
      color: "from-purple-500 to-pink-600",
      borderColor: "border-purple-500/30",
    },
    {
      title: "Completed Jobs",
      value: dashboardStats.completedServices.toLocaleString(),
      subtitle: "Successful transactions",
      icon: CheckCircle,
      color: "from-emerald-500 to-teal-600",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Pending Bookings",
      value: dashboardStats.pendingServices.toLocaleString(),
      subtitle: "In-progress requests",
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Disputed Bookings",
      value: dashboardStats.disputedServices.toLocaleString(),
      subtitle: "Awaiting resolution",
      icon: AlertTriangle,
      color: "from-rose-500 to-red-600",
      borderColor: "border-rose-500/30",
    },
    {
      title: "Total Revenue",
      value: `₹${dashboardStats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Platform commission fee sum",
      icon: IndianRupee,
      color: "from-cyan-500 to-blue-600",
      borderColor: "border-cyan-500/30",
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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-400 mt-1">
            Logged in as: <span className="text-indigo-400 font-semibold">{adminData.email}</span>
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={statsLoading}
          className="px-4 py-2 text-xs font-bold bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 rounded-xl transition-all flex items-center gap-2 self-start"
        >
          <Activity size={14} className={statsLoading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {statsError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-sm">
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
              className={`bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border ${card.borderColor} hover:border-indigo-500/40 transition-all duration-300 group`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-white text-2xl font-black tracking-tight pt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-linear-to-br ${card.color} text-white shadow-lg shadow-indigo-950/20`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-4 flex items-center gap-1.5 font-medium">
                <span>{card.subtitle}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Policy Editor Overlay Block */}
      {showPolicyEditor && (
        <div className="bg-slate-900/60 backdrop-blur-lg rounded-2xl p-6 border border-indigo-900/40 shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6 border-b border-indigo-950 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-400" />
              <span>Manage Site Policies</span>
            </h2>
            <button
              onClick={() => setShowPolicyEditor(false)}
              className="text-slate-400 hover:text-white text-xs bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/20 transition-all"
            >
              Close Editor
            </button>
          </div>

          {editorError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-xs">
              ⚠️ {editorError}
            </div>
          )}

          {editorSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 mb-6 text-xs">
              ✅ {editorSuccess}
            </div>
          )}

          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/40 p-4 rounded-xl border border-indigo-950/60">
              <div className="flex items-center gap-3">
                <label htmlFor="policy-select" className="text-slate-400 text-xs font-semibold">Select Document:</label>
                <select
                  id="policy-select"
                  value={selectedPolicyKey}
                  onChange={(e) => handleLoadPolicy(e.target.value)}
                  disabled={editorLoading}
                  className="bg-slate-900 border border-indigo-900/50 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="privacy_policy">Privacy Policy</option>
                  <option value="terms_of_service">Terms of Service</option>
                </select>
              </div>
              {editorLoading && (
                <div className="flex items-center gap-2 text-indigo-400 text-xs">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading Document...</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="policy-title" className="block text-slate-400 text-xs font-semibold mb-2">Document Title</label>
              <input
                id="policy-title"
                type="text"
                value={policyTitle}
                onChange={(e) => setPolicyTitle(e.target.value)}
                disabled={editorLoading}
                placeholder="e.g., Privacy Policy"
                className="bg-slate-950/30 border border-indigo-900/30 text-white rounded-lg px-4 py-2.5 w-full focus:outline-none focus:border-indigo-500 text-xs font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="policy-content" className="block text-slate-400 text-xs font-semibold">Document Content (HTML format)</label>
                <span className="text-[10px] text-slate-500 italic">Supports basic markup tags</span>
              </div>
              <textarea
                id="policy-content"
                value={policyContent}
                onChange={(e) => setPolicyContent(e.target.value)}
                disabled={editorLoading}
                placeholder="Enter HTML formatted text..."
                className="bg-slate-950/30 border border-indigo-900/30 text-white rounded-lg px-4 py-3 w-full h-80 focus:outline-none focus:border-indigo-500 font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-indigo-950 pt-5">
              <button
                onClick={() => setShowPolicyEditor(false)}
                disabled={editorLoading}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 font-semibold rounded-xl border border-slate-900 transition-all text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePolicy}
                disabled={editorLoading || !policyTitle || !policyContent}
                className="px-5 py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-600/40 disabled:to-purple-600/40 text-white font-bold rounded-xl transition-all shadow-lg flex items-center text-xs"
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
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-indigo-900/30 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-indigo-400" size={18} />
            <h2 className="text-lg font-bold text-white">Recent Activity Log</h2>
          </div>

          <div className="space-y-4 flex-1">
            {statsLoading ? (
              <div className="py-8 text-center text-slate-500 text-xs animate-pulse">Loading updates...</div>
            ) : recentActivity.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No recent updates in the log logs.</div>
            ) : (
              recentActivity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-950/20 rounded-xl border border-indigo-950/40 hover:border-indigo-500/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 bg-indigo-950/30 rounded-lg">{getActivityIcon(item.type)}</span>
                    <p className="text-slate-300 text-xs font-semibold">{item.action}</p>
                  </div>
                  <span className="text-slate-500 text-[10px] font-bold">
                    {formatActivityTime(item.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-indigo-900/30 space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Platform Controls</h2>

          <button
            onClick={() => navigate("/admin/users")}
            className="w-full flex items-center justify-between p-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-md transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 text-xs">
              <Users size={16} />
              <span>Manage User List</span>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate("/admin/sellers")}
            className="w-full flex items-center justify-between p-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-md transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 text-xs">
              <UserCheck size={16} />
              <span>Verify Seller Partners</span>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate("/admin/disputes")}
            className="w-full flex items-center justify-between p-4 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl transition-all shadow-md transform hover:-translate-y-0.5"
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
            className="w-full flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-900 text-indigo-300 hover:text-white font-semibold rounded-xl border border-indigo-900/30 transition-all"
          >
            <div className="flex items-center gap-3 text-xs">
              <BookOpen size={16} />
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
