import React, { createContext, useContext, useState, useEffect } from "react";

import { getMe, verifyOtp, sendOtp, getBackendErrorMessage } from "../api/authService";


/**
 * AuthContext
 * JWT-backed auth state using backend:
 * - POST /api/auth/send-otp
 * - POST /api/auth/verify-otp
 * - GET  /api/auth/me
 */

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ========================================
  // AUTH STATE
  // ========================================
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
      } catch (err) {
        console.error("Auth init failed:", err);
        localStorage.removeItem("authToken");
        setUser(null);
        setIsAuthenticated(false);
        setAuthError("Session expired. Please login again.");
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
      setAuthError(message);
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
      setAuthError(message);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
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

    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
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

    // Methods
    sendOtp: sendOtpToPhone,
    loginWithOtp,
    logout,
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
