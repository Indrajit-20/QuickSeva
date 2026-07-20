import axios from "axios";
import { API_BASE_URL } from "../config/api";


/**
 * ========================================
 * AXIOS API CONFIGURATION
 * ========================================
 * Central configuration for all API requests
 * Includes request/response interceptors
 * Handles authentication token management
 */

// ========================================
// 1. CREATE AXIOS INSTANCE
// ========================================


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ========================================
// 2. REQUEST INTERCEPTOR
// ========================================
/**
 * This interceptor runs BEFORE every request is sent
 *
 * Logic Flow:
 * 1. Get token from localStorage (if exists)
 * 2. If token exists, attach it to Authorization header
 * 3. If no token, proceed without it (public endpoints)
 * 4. Send the request with updated headers
 *
 * This way, you never have to manually add:
 *   headers: { Authorization: `Bearer ${token}` }
 * on every single API call
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("authToken");

    // If token exists, attach it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log the request (helpful for debugging)
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);

    // Always return the config object
    return config;
  },
  (error) => {
    // If there's an error before the request is sent, reject it
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// ========================================
// 3. RESPONSE INTERCEPTOR
// - If token is invalid/expired => auto-remove and bubble error
// ========================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      // Keep it generic (no router dependency here)
      console.warn("[API] 401 received - clearing auth token");
    }

    return Promise.reject(error);
  },
);

// ========================================
// 4. EXPORT THE CONFIGURED INSTANCE
// ========================================
export default apiClient;
