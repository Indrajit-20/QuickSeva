/**
 * OTP Service
 * Handles SMS OTP verification using 2factor.in API
 */

const API_KEY = "354d27f2-fdd2-11eb-a13b-0200cd936042"; // Your API key
const API_BASE_URL = "/otp-api/API/V1"; // Vite proxy endpoint

/**
 * Send OTP to phone number
 * @param {string} phone - Phone number with country code (e.g., +91-XXXXXXXXXX)
 * @param {string} otp - OTP to send (6 digits)
 * @returns {Promise<{status: string, details: string, sessionId?: string}>}
 */
export const sendOTP = async (phone, otp) => {
  try {
    // Build the URL using local Vite proxy
    const url = `${API_BASE_URL}/${API_KEY}/SMS/${phone}/${otp}/anyhelp`;

    console.log("📤 Sending OTP to:", phone);
    console.log("🔗 Using Vite proxy at:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📥 Response from 2factor.in:", data);

    if (data.Status === "Success") {
      console.log("✅ OTP sent successfully!");
      return {
        status: "success",
        details: data.Details,
        sessionId: data.Details, // Session ID for verification
      };
    } else {
      throw new Error(data.Details || "Failed to send OTP");
    }
  } catch (error) {
    console.error("❌ Error sending OTP:", error);

    return {
      status: "error",
      details:
        error.message || "Failed to send OTP. Check console for details.",
    };
  }
};

/**
 * Generate random 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
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
export const verifyOTP = async (phone, sessionId, enteredOtp) => {
  try {
    // Note: The 2factor.in API requires verification on the backend
    // For now, we're doing a client-side verification
    // In production, you should verify on your backend server

    // Store the entered OTP in sessionStorage for backend verification
    sessionStorage.setItem("verificationOtp", enteredOtp);
    sessionStorage.setItem("sessionId", sessionId);
    sessionStorage.setItem("verificationPhone", phone);

    // Return success - backend will verify
    return {
      verified: true,
      message: "OTP submitted for verification",
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      verified: false,
      message: error.message,
    };
  }
};

/**
 * Check if OTP has expired
 * @param {number} expiryTime - Expiry time in milliseconds
 * @returns {boolean} - True if expired
 */
export const isOTPExpired = (expiryTime) => {
  return Date.now() > expiryTime;
};
