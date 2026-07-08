import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  getMe,
  verifyOtp,
  sendOtp,
  login,
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

const toast = {
  error: (msg) => alert(msg),
  success: (msg) => alert(msg)
};

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
  const location = useLocation();

  // New state
  const [isSeller, setIsSeller] = useState(false);
  const [activeRole, setActiveRole] = useState(
    localStorage.getItem("activeRole") || "user"
  );

  useEffect(() => {
    const isSellerWorkspace =
      location.pathname === "/seller" ||
      location.pathname.startsWith("/seller/dashboard") ||
      location.pathname.startsWith("/seller/profile") ||
      location.pathname.startsWith("/seller/services") ||
      location.pathname.startsWith("/seller/orders") ||
      location.pathname.startsWith("/seller/packages") ||
      location.pathname.startsWith("/seller/wallet");

    if (isSellerWorkspace) {
      if (activeRole !== "seller") {
        setActiveRole("seller");
        localStorage.setItem("activeRole", "seller");
      }
    } else if (location.pathname.startsWith("/admin")) {
      if (activeRole !== "admin") {
        setActiveRole("admin");
        localStorage.setItem("activeRole", "admin");
      }
    } else {
      if (activeRole !== "user") {
        setActiveRole("user");
        localStorage.setItem("activeRole", "user");
      }
    }
  }, [location.pathname, activeRole]);

  // ========================================
  // AUTH STATE
  // ========================================
  // Single source of truth for authorization is data.user from /api/auth/me
  // Do NOT bootstrap from localStorage.userRole or localStorage.user (stale/cross-tab).
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsSeller(user?.role === "seller");
  }, [user]);

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

        if (data.user?.role === "seller" && data.user?.premium_expires_at) {
          localStorage.setItem(
            "sellerPremium",
            JSON.stringify({
              plan: data.user.plan,
              expiresAt: data.user.premium_expires_at,
              isPremium: data.user.is_premium === 1 || data.user.is_premium === true,
            })
          );
        }

        const isUserSeller = data.user?.role === "seller";
        setIsSeller(isUserSeller);

        const savedRole = localStorage.getItem("activeRole");
        if (!savedRole) {
          setActiveRole("user");
          localStorage.setItem("activeRole", "user");
        } else if (savedRole === "seller" && !isUserSeller) {
          setActiveRole("user");
          localStorage.setItem("activeRole", "user");
        } else {
          setActiveRole(savedRole);
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

  const loginWithPassword = async ({ phone, password, captchaAnswer, captchaToken }) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await login({ phone, password, captchaAnswer, captchaToken });

      const token = result?.data?.token;
      const userData = result?.data?.user;

      if (!token || !userData) {
        throw new Error("Invalid response from server.");
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

  const authenticateSession = (token, userData) => {
    localStorage.setItem("authToken", token);
    if (userData?.role) localStorage.setItem("userRole", userData.role);
    setUser(userData);
    setIsAuthenticated(true);
    setIsSeller(userData?.role === "seller");
    setActiveRole(userData?.role || "user");
    localStorage.setItem("activeRole", userData?.role || "user");
  };

  // New function
  const switchRole = (role) => {
    if (role === "seller" && !isSeller) {
      toast.error("Register as a seller first");
      navigate("/become-seller");
      return;
    }
    setActiveRole(role);
    localStorage.setItem("activeRole", role);
    if (role === "seller") navigate("/seller/dashboard");
    if (role === "user") navigate("/");
  };

  const refreshAuth = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) return;
      const { data } = await getMe();
      if (data?.user) {
        setUser(data.user);
        setIsSeller(data.user.role === "seller");
        if (data.user.role) {
          localStorage.setItem("userRole", data.user.role);
        }
        if (data.user.role === "seller" && data.user.premium_expires_at) {
          localStorage.setItem(
            "sellerPremium",
            JSON.stringify({
              plan: data.user.plan,
              expiresAt: data.user.premium_expires_at,
              isPremium: data.user.is_premium === 1 || data.user.is_premium === true,
            })
          );
        }
      }
    } catch (err) {
      console.error("refreshAuth error:", err);
    }
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
    setActiveRole("user");
    setIsSeller(false);

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
    loginWithPassword,
    logout,
    updateUser,
    switchRole,
    refreshAuth,
    authenticateSession,
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
