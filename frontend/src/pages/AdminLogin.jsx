import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
      // ⚠️ TEMPORARY: Hardcoded admin credentials for testing
      // In production, this should call your .NET backend:
      // POST /api/admin/login { email, password }

      // Frontend-only testing credentials (no backend yet)
      // Default admin:
      const ADMIN_USERNAME = "admin";
      const ADMIN_PASSWORD = "Admin@123";

      if (
        formData.username === ADMIN_USERNAME &&
        formData.password === ADMIN_PASSWORD
      ) {
        // Admin login successful
        const adminToken = `admin_token_${Date.now()}`;

        localStorage.setItem("authToken", adminToken);
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("adminUsername", formData.username);
        localStorage.setItem("adminEmail", formData.username);

        setSuccessMessage("✓ Admin login successful! Redirecting...");

        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1500);
      } else {
        throw new Error("Invalid admin credentials");
      }
    } catch (err) {
      setErrors({
        submit: err.message || "Admin login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4">
      <div className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-indigo-500/30">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-indigo-200">Manage QuickSeva Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-indigo-200 mb-2"
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
              className={`w-full px-4 py-3 rounded-lg bg-indigo-800/50 border-2 text-white placeholder-indigo-300 focus:outline-none transition-all ${
                touched.username && errors.username
                  ? "border-red-500 focus:border-red-500"
                  : "border-indigo-500/30 focus:border-indigo-400"
              }`}
              placeholder="admin"
              disabled={loading}
            />
            {touched.username && errors.username && (
              <p className="text-red-400 text-sm mt-1">⚠️ {errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-indigo-200 mb-2"
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
              className={`w-full px-4 py-3 rounded-lg bg-indigo-800/50 border-2 text-white placeholder-indigo-300 focus:outline-none transition-all ${
                touched.password && errors.password
                  ? "border-red-500 focus:border-red-500"
                  : "border-indigo-500/30 focus:border-indigo-400"
              }`}
              placeholder="Enter admin password"
              disabled={loading}
            />
            {touched.password && errors.password && (
              <p className="text-red-400 text-sm mt-1">⚠️ {errors.password}</p>
            )}
          </div>

          {/* Submit Errors */}
          {errors.submit && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">❌ {errors.submit}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-300 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
          >
            {loading ? "🔄 Logging in..." : "🔐 Admin Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-indigo-500/30"></div>
          <p className="px-4 text-indigo-300 text-sm">Testing Credentials</p>
          <div className="flex-1 border-t border-indigo-500/30"></div>
        </div>

        {/* Test Credentials Info */}
        <div className="bg-indigo-800/30 border border-indigo-500/30 rounded-lg p-4 mb-6">
          <p className="text-indigo-200 text-sm font-semibold mb-2">
            📋 Use these to test:
          </p>
          <p className="text-indigo-300 text-xs">
            Username: <span className="font-mono text-indigo-100">admin</span>
          </p>
          <p className="text-indigo-300 text-xs">
            Password:{" "}
            <span className="font-mono text-indigo-100">Admin@123</span>
          </p>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-3">
          <p className="text-indigo-300 text-sm">
            Not an admin?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              User Login
            </Link>
          </p>
          <p className="text-indigo-300 text-sm">
            <Link
              to="/"
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
