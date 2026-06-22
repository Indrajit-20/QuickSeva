import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMe,
  verifyOtp,
  sendOtp,
  getBackendErrorMessage,
} from "../api/authService";

/**
 * AuthContext
 * JWT-backed auth state using backend:
 * - POST /api/auth/send-otp
 * - POST /api/auth/verify-otp
 * - GET  /api/auth/me
 */

const AuthContext = createContext();

const mapAuthErrorToUserMessage = (message) => {
  const normalized = String(message || "").toLowerCase();

  if (
    normalized.includes("user not found") ||
    normalized.includes("invalid phone") ||
    normalized.includes("no user")
  ) {
    return "Mobile number not found. Please register first.";
  }

  if (
    normalized.includes("invalid otp") ||
    normalized.includes("otp verification failed") ||
    normalized.includes("incorrect otp")
  ) {
    return "The OTP you entered is incorrect.";
  }

  if (normalized.includes("expired")) {
    return "OTP has expired. Please request a new OTP.";
  }

  if (
    normalized.includes("too many requests") ||
    normalized.includes("maximum resend") ||
    normalized.includes("rate limit")
  ) {
    return "Too many OTP requests. Please try again later.";
  }

  return String(message || "Something went wrong");
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // New state
  const [isSeller, setIsSeller] = useState(false);
  const [activeRole, setActiveRole] = useState(
    localStorage.getItem("activeRole") || "user"
  );

  // ========================================
  // AUTH STATE
  // ========================================
  // Single source of truth for authorization is data.user from /api/auth/me
  // Do NOT bootstrap from localStorage.userRole or localStorage.user (stale/cross-tab).
  const [user, setUser] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ========================================
  // LOAD CURRENT USER (JWT) ON MOUNT
  // ========================================
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // Fetch /api/auth/me to validate token + get user
        const { data } = await getMe();
        setUser(data.user || null);
        setIsAuthenticated(Boolean(data?.user));
        setAuthError(null);

        setIsSeller(data.isSeller);
        // If saved role is "seller" but user is not a seller, reset to "user"
        if (!data.isSeller && localStorage.getItem("activeRole") === "seller") {
          setActiveRole("user");
          localStorage.setItem("activeRole", "user");
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userRole");
          setUser(null);
          setIsAuthenticated(false);
          setAuthError("Session expired. Please login again.");
        } else {
          // Network error or database 500 error: keep token, but set error
          setIsAuthenticated(false);
          setUser(null);
          setAuthError("Unable to connect to server. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ========================================
  // OTP LOGIN
  // ========================================
  const sendOtpToPhone = async ({ identifier }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await sendOtp({ identifier, type: "login" });
      return result;
    } catch (err) {
      const message = getBackendErrorMessage(err);
      setAuthError(mapAuthErrorToUserMessage(message));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async ({ identifier, otp, sessionId }) => {
    setIsLoading(true);

    setAuthError(null);

    try {
      const payload = { identifier, otp, sessionId, type: "login" };
      const result = await verifyOtp(payload);

      const token = result?.data?.token;
      const userData = result?.data?.user;

      if (!token || !userData) {
        throw new Error("Invalid OTP verification response from server.");
      }

      localStorage.setItem("authToken", token);
      if (userData?.role) localStorage.setItem("userRole", userData.role);

      setUser(userData);
      setIsAuthenticated(true);
      return { user: userData, token };
    } catch (err) {
      const message = getBackendErrorMessage(err);
      setAuthError(mapAuthErrorToUserMessage(message));
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // New function
  const switchRole = (role) => {
    if (role === "seller" && !isSeller) return; // do nothing if not a seller
    setActiveRole(role);
    localStorage.setItem("activeRole", role);
    if (role === "seller") navigate("/seller/dashboard");
    if (role === "user") navigate("/");
  };

  // ========================================
  // LOGOUT
  // ========================================
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("otpTimerExpiry");
    localStorage.removeItem("otpResendCount");
    localStorage.removeItem("activeRole");

    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  // ========================================
  // UPDATE USER STATE
  // ========================================
  const updateUser = (newUserData) => {
    setUser((prev) => (prev ? { ...prev, ...newUserData } : null));
  };

  // ========================================
  // CONTEXT VALUE
  // ========================================
  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    authError,
    isSeller,
    activeRole,

    // Methods
    sendOtp: sendOtpToPhone,
    loginWithOtp,
    logout,
    updateUser,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ========================================
// CUSTOM HOOK TO USE AUTH CONTEXT
// ========================================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
