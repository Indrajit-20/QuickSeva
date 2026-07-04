import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import { getPolicy, updatePolicy } from "../api/policyService";
import { getBackendErrorMessage } from "../api/authService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 1250,
    activeUsers: 847,
    totalServices: 42,
    completedServices: 1089,
    pendingServices: 156,
    revenue: 125450,
  });

  // Policy Editor State
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [selectedPolicyKey, setSelectedPolicyKey] = useState("privacy_policy");
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState(null);
  const [editorSuccess, setEditorSuccess] = useState(null);

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
    const adminEmail = localStorage.getItem("adminEmail");

    if (userRole !== "admin" || !isAdminAuthenticated) {
      navigate("/admin/login");
      return;
    }

    setAdminData({
      email: adminEmail,
      lastLogin: new Date().toLocaleString(),
    });
  }, [navigate]);

  if (!adminData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, Admin! 👋
          </h1>
          <p className="text-indigo-300">
            Logged in as:{" "}
            <span className="font-semibold">{adminData.email}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Users Card */}
          <div className="bg-indigo-900/40 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-300 text-sm font-medium">
                  Total Users
                </p>
                <p className="text-white text-3xl font-bold mt-2">
                  {dashboardStats.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
            <p className="text-indigo-200 text-xs mt-4">
              {dashboardStats.activeUsers} active users
            </p>
          </div>

          {/* Active Users Card */}
          <div className="bg-indigo-900/40 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-300 text-sm font-medium">
                  Active Now
                </p>
                <p className="text-white text-3xl font-bold mt-2">
                  {dashboardStats.activeUsers}
                </p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
            <p className="text-indigo-200 text-xs mt-4">
              {Math.round(
                (dashboardStats.activeUsers / dashboardStats.totalUsers) * 100
              )}
              % of users
            </p>
          </div>

          {/* Total Services Card */}
          <div className="bg-indigo-900/40 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-300 text-sm font-medium">
                  Total Services
                </p>
                <p className="text-white text-3xl font-bold mt-2">
                  {dashboardStats.totalServices}
                </p>
              </div>
              <div className="text-4xl">🛠️</div>
            </div>
            <p className="text-indigo-200 text-xs mt-4">
              Available services on platform
            </p>
          </div>

          {/* Completed Services Card */}
          <div className="bg-indigo-900/40 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-300 text-sm font-medium">Completed</p>
                <p className="text-white text-3xl font-bold mt-2">
                  {dashboardStats.completedServices.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
            <p className="text-indigo-200 text-xs mt-4">
              Services completed successfully
            </p>
          </div>

          {/* Pending Services Card */}
          <div className="bg-indigo-900/40 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-300 text-sm font-medium">Pending</p>
                <p className="text-white text-3xl font-bold mt-2">
                  {dashboardStats.pendingServices}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
            <p className="text-indigo-200 text-xs mt-4">
              Services awaiting completion
            </p>
          </div>

          {/* Revenue Card */}
          <div className="bg-indigo-900/40 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-300 text-sm font-medium">
                  Total Revenue
                </p>
                <p className="text-white text-3xl font-bold mt-2">
                  ₹{dashboardStats.revenue.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <p className="text-indigo-200 text-xs mt-4">Platform revenue</p>
          </div>
        </div>

        {/* Policy Editor Section */}
        {showPolicyEditor && (
          <div className="bg-indigo-950/60 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl mb-8 transition-all duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-indigo-900 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-2">⚖️</span> Manage Site Policies
              </h2>
              <button
                onClick={() => setShowPolicyEditor(false)}
                className="text-indigo-400 hover:text-white text-sm bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-500/25 transition-all"
              >
                Close Editor
              </button>
            </div>

            {editorError && (
              <div className="bg-red-950/80 border border-red-500/50 text-red-200 rounded-lg p-4 mb-6 text-sm flex items-center space-x-3">
                <span>⚠️</span>
                <span>{editorError}</span>
              </div>
            )}

            {editorSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 rounded-lg p-4 mb-6 text-sm flex items-center space-x-3">
                <span>✅</span>
                <span>{editorSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {/* Document Selection */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-indigo-900/25 p-4 rounded-xl border border-indigo-800/50">
                <div className="flex items-center space-x-3">
                  <label htmlFor="policy-select" className="text-indigo-300 text-sm font-semibold">Select Document:</label>
                  <select
                    id="policy-select"
                    value={selectedPolicyKey}
                    onChange={(e) => handleLoadPolicy(e.target.value)}
                    disabled={editorLoading}
                    className="bg-indigo-900/80 border border-indigo-500/30 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                  >
                    <option value="privacy_policy">Privacy Policy</option>
                    <option value="terms_of_service">Terms of Service</option>
                  </select>
                </div>
                {editorLoading && (
                  <div className="flex items-center space-x-2 text-indigo-400 text-xs">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading Document...</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="policy-title" className="block text-indigo-300 text-sm font-semibold mb-2">Document Title</label>
                <input
                  id="policy-title"
                  type="text"
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                  disabled={editorLoading}
                  placeholder="e.g., Privacy Policy"
                  className="bg-indigo-900/40 border border-indigo-500/30 text-white rounded-lg px-4 py-2.5 w-full focus:outline-none focus:border-indigo-400 text-sm"
                />
              </div>

              {/* Content Editor */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="policy-content" className="block text-indigo-300 text-sm font-semibold">Document Content (HTML formatted)</label>
                  <span className="text-xs text-indigo-400 italic">Supports standard HTML tags</span>
                </div>
                <textarea
                  id="policy-content"
                  value={policyContent}
                  onChange={(e) => setPolicyContent(e.target.value)}
                  disabled={editorLoading}
                  placeholder="Enter policy content in HTML format..."
                  className="bg-indigo-900/40 border border-indigo-500/30 text-white rounded-lg px-4 py-3 w-full h-80 focus:outline-none focus:border-indigo-400 font-mono text-sm leading-relaxed"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 border-t border-indigo-900 pt-6">
                <button
                  onClick={() => setShowPolicyEditor(false)}
                  disabled={editorLoading}
                  className="px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-semibold rounded-lg border border-indigo-500/20 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePolicy}
                  disabled={editorLoading || !policyTitle || !policyContent}
                  className="px-6 py-2.5 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-indigo-500/40 disabled:to-purple-600/40 text-white font-bold rounded-lg transition-all shadow-md transform hover:scale-102 flex items-center text-sm"
                >
                  {editorLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save & Apply Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="bg-indigo-900/40 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30">
          <h2 className="text-2xl font-bold text-white mb-6">
            📊 Recent Activity
          </h2>

          <div className="space-y-4">
            {[
              {
                action: "New user registered",
                time: "2 minutes ago",
                icon: "✨",
              },
              {
                action: "Service completed",
                time: "15 minutes ago",
                icon: "✅",
              },
              { action: "Payment received", time: "1 hour ago", icon: "💳" },
              {
                action: "Support ticket closed",
                time: "2 hours ago",
                icon: "🎫",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-indigo-800/30 rounded-lg border border-indigo-500/20 hover:border-indigo-400/50 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-indigo-200">{item.action}</p>
                </div>
                <span className="text-indigo-400 text-sm">{item.time}</span>
              </div>
            ))}
          </div>
        </div>


        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105">
            📋 Manage Users
          </button>
          <button className="bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105">
            🛠️ Manage Services
          </button>
          <button className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105">
            💰 View Reports
          </button>
          <button
            onClick={() => {
              setShowPolicyEditor(true);
              handleLoadPolicy("privacy_policy");
            }}
            className="bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
          >
            ⚖️ Manage Policies
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
