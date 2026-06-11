/**
 * OTP Service
 * Handles SMS OTP verification using 2factor.in API
 */

// NOTE: 2Factor API key MUST NOT be shipped to browser.
// This file should not be used for production OTP flows.
// Seller Registration OTP must use backend APIs only.
const API_KEY = null; // deprecated
const API_BASE_URL = "/otp-api/API/V1"; // Vite proxy endpoint

/**
 * Send OTP to phone number
 * @param {string} phone - Phone number with country code (e.g., +91-XXXXXXXXXX)
 * @returns {Promise<{status: string, details: string, sessionId?: string}>}
 */
export const sendOTP = async (phone) => {
  throw new Error(
    "sendOTP is disabled for production. Seller Registration must call backend /api/auth/send-otp only (no 2factor.in from frontend).",
  );
};

/**
 * Generate random 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
// The following helpers are no longer required for production login flow.
// Kept as-is for compatibility with any other (non-OTP-login) code.
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} - True if valid 6-digit OTP
 */
export const isValidOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Format phone number for API
 * Ensures phone is in correct format with country code
 * @param {string} phone - Raw phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters except + and -
  let cleaned = phone.replace(/[^\d+-]/g, "");

  // If no country code, assume India (+91)
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1); // Remove leading 0
    }
    if (!cleaned.startsWith("91")) {
      cleaned = "91" + cleaned;
    }
    cleaned = "+" + cleaned;
  }

  return cleaned;
};

/**
 * Simulate OTP verification (for development/testing)
 * In production, this should be done on the backend
 * @param {string} phone - Phone number
 * @param {string} sessionId - Session ID from sendOTP
 * @param {string} enteredOtp - OTP entered by user
 * @returns {Promise<{verified: boolean, message: string}>}
 */
export const verifyOTP = async () => {
  throw new Error(
    "verifyOTP is disabled for production. Seller Registration must call backend /api/auth/verify-otp only (no 2factor.in from frontend).",
  );
};

/**
 * Check if OTP has expired
 * @param {number} expiryTime - Expiry time in milliseconds
 * @returns {boolean} - True if expired
 */
export const isOTPExpired = (expiryTime) => {
  return Date.now() > expiryTime;
};
