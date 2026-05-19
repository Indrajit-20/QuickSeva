import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * AuthContext
 * Manages global authentication state
 * Supports both email and phone-verified users
 */
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ========================================
  // AUTH STATE
  // ========================================
  const [user, setUser] = useState(null); // Authenticated user
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ========================================
  // INITIALIZE AUTH STATE ON MOUNT
  // Load from localStorage to persist login
  // ========================================
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem("loggedInUser");

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        setAuthError("Failed to load authentication");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ========================================
  // LOGIN - EMAIL
  // ========================================
  const loginWithEmail = (email, name) => {
    const userData = {
      type: "email",
      email,
      name,
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem("loggedInUser", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  // ========================================
  // LOGIN - PHONE (OTP VERIFIED)
  // ========================================
  const loginWithPhone = (phone, name) => {
    const userData = {
      type: "phone",
      phone,
      name,
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem("loggedInUser", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  // ========================================
  // UPDATE USER INFO
  // ========================================
  const updateUser = (updates) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...updates,
    };

    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // ========================================
  // LOGOUT
  // ========================================
  const logout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("otpTimerExpiry");
    localStorage.removeItem("otpResendCount");
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  // ========================================
  // CHECK IF USER IS LOGGED IN
  // ========================================
  const isLoggedIn = () => {
    return isAuthenticated && user !== null;
  };

  // ========================================
  // GET USER LOGIN TYPE
  // ========================================
  const getUserLoginType = () => {
    return user?.type; // "email" or "phone"
  };

  // ========================================
  // GET USER IDENTIFIER (EMAIL or PHONE)
  // ========================================
  const getUserIdentifier = () => {
    if (!user) return null;
    return user.type === "email" ? user.email : user.phone;
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
    loginWithEmail,
    loginWithPhone,
    updateUser,
    logout,
    isLoggedIn,
    getUserLoginType,
    getUserIdentifier,
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
