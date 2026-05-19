import apiClient from "./axiosConfig";

/**
 * ========================================
 * API SERVICE - Authentication Endpoints
 * ========================================
 * This file contains all authentication-related API calls
 * It uses the configured Axios instance from axiosConfig.js
 */

// ========================================
// LOGIN ENDPOINT
// ========================================
/**
 * Send login credentials to the backend
 *
 * Expected .NET Backend Request:
 * POST /api/auth/login
 * Body: { email: string, password: string }
 *
 * Expected Response:
 * {
 *   success: true,
 *   token: "eyJhbGciOi...",
 *   user: { id, email, name, ... }
 * }
 */
export const loginWithEmail = async (email, password) => {
  try {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    // Error will be handled by Response Interceptor in Step 2
    throw error;
  }
};

// ========================================
// LOGOUT ENDPOINT
// ========================================
/**
 * Clear user session on the backend
 * Optionally, backend can invalidate the token
 */
export const logoutUser = async () => {
  try {
    const response = await apiClient.post("/auth/logout", {});
    return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, we'll clear localStorage on frontend
    throw error;
  }
};

// ========================================
// REFRESH TOKEN ENDPOINT
// ========================================
/**
 * Get a new token when current one is about to expire
 * This will be useful in Step 2's Response Interceptor
 */
export const refreshToken = async () => {
  try {
    const response = await apiClient.post("/auth/refresh-token", {});
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ========================================
// GET CURRENT USER ENDPOINT
// ========================================
/**
 * Fetch the logged-in user's profile
 * This request will automatically include the Bearer token
 * thanks to the Request Interceptor in axiosConfig.js
 */
export const getCurrentUser = async () => {
  try {
    // The Authorization header is automatically added!
    const response = await apiClient.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ========================================
// SEND OTP ENDPOINT (Optional)
// ========================================
/**
 * Send OTP to user's phone for login
 * This is a public endpoint (doesn't need token)
 */
export const sendOTPLogin = async (phone) => {
  try {
    const response = await apiClient.post("/auth/send-otp", {
      phone,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ========================================
// VERIFY OTP ENDPOINT (Optional)
// ========================================
/**
 * Verify OTP and get login token
 * This is a public endpoint (doesn't need token)
 */
export const verifyOTPLogin = async (phone, otp) => {
  try {
    const response = await apiClient.post("/auth/verify-otp", {
      phone,
      otp,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ========================================
// REGISTER ENDPOINT (Optional)
// ========================================
/**
 * Register a new user
 * This is a public endpoint (doesn't need token)
 */
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
