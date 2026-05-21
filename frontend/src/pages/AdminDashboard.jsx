import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

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
          <button className="bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105">
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
