import axios from "axios";

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
// Point this to your .NET backend URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
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
  }
);

// ========================================
// 3. RESPONSE INTERCEPTOR (Will be added in Step 2)
// ========================================
// We'll add this in the next step

// ========================================
// 4. EXPORT THE CONFIGURED INSTANCE
// ========================================
export default apiClient;
