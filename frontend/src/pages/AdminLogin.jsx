import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/axiosConfig";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Validation functions
  const validateUsername = (username) => {
    if (!username) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    if (touched[name]) {
      let error = null;
      if (name === "username") {
        error = validateUsername(value);
      } else if (name === "password") {
        error = validatePassword(value);
      }

      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  // Handle blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    let error = null;
    if (name === "username") {
      error = validateUsername(value);
    } else if (name === "password") {
      error = validatePassword(value);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrors({});

    // Validate all fields
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);

    if (usernameError || passwordError) {
      setErrors({
        username: usernameError,
        password: passwordError,
      });
      setTouched({
        username: true,
        password: true,
      });
      return;
    }

    setLoading(true);

    try {
      // API call to backend admin-login endpoint
      const response = await apiClient.post("/auth/admin-login", {
        username: formData.username,
        password: formData.password,
      });

      const { user, token } = response.data.data;

      if (user.role !== "admin") {
        throw new Error("Access denied: You are not an administrator.");
      }

      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("isAdminAuthenticated", "true");
      localStorage.setItem("adminEmail", user.email || "");

      setSuccessMessage("✓ Admin login successful! Redirecting...");

      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 1500);
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err.message || "Admin login failed. Please try again.";
      setErrors({
        submit: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToUser = (e) => {
    e.preventDefault();
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAdminAuthenticated");
    localStorage.removeItem("adminEmail");
    navigate("/login");
    window.location.reload();
  };

  const handleGoHome = (e) => {
    e.preventDefault();
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAdminAuthenticated");
    localStorage.removeItem("adminEmail");
    navigate("/");
    window.location.reload();
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-805 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition font-medium shadow-xs";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 border border-slate-200 text-slate-850">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Admin Login</h1>
          <p className="text-slate-500 font-semibold text-sm">Manage QuickSeva Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider"
            >
              Admin Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputClass} ${touched.username && errors.username ? "border-red-300 focus:ring-red-105" : ""}`}
              placeholder="e.g., admin"
              disabled={loading}
            />
            {touched.username && errors.username && (
              <p className="text-red-600 font-semibold text-xs mt-1.5">⚠️ {errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputClass} ${touched.password && errors.password ? "border-red-300 focus:ring-red-105" : ""}`}
              placeholder="Enter admin password"
              disabled={loading}
            />
            {touched.password && errors.password && (
              <p className="text-red-600 font-semibold text-xs mt-1.5">⚠️ {errors.password}</p>
            )}
          </div>

          {/* Submit Errors */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-700 text-xs font-semibold">❌ {errors.submit}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-3">
              <p className="text-emerald-700 text-xs font-semibold">{successMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            {loading ? "🔄 Logging in..." : "🔐 Admin Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-slate-200"></div>
          <p className="px-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Testing Credentials</p>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Test Credentials Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            📋 Use these to test:
          </p>
          <p className="text-slate-600 text-xs font-semibold">
            Username: <span className="font-mono text-slate-900 bg-white border border-slate-200 px-1 rounded">admin</span>
          </p>
          <p className="text-slate-600 text-xs font-semibold mt-1.5">
            Password:{" "}
            <span className="font-mono text-slate-900 bg-white border border-slate-200 px-1 rounded">Admin@123</span>
          </p>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-3">
          <p className="text-slate-500 text-sm font-semibold">
            Not an admin?{" "}
            <button
              onClick={handleSwitchToUser}
              className="text-blue-600 hover:text-blue-700 font-bold bg-transparent border-none p-0 cursor-pointer outline-none"
            >
              User Login
            </button>
          </p>
          <p className="text-slate-500 text-sm font-semibold">
            <button
              onClick={handleGoHome}
              className="text-blue-600 hover:text-blue-700 font-bold bg-transparent border-none p-0 cursor-pointer outline-none"
            >
              Back to Home
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
