/**
 * OTP Service
 * Handles SMS OTP verification using 2factor.in API
 */

const API_KEY = "354d27f2-fdd2-11eb-a13b-0200cd936042"; // Your API key
const API_BASE_URL = "/otp-api/API/V1"; // Vite proxy endpoint

/**
 * Send OTP to phone number
 * @param {string} phone - Phone number with country code (e.g., +91-XXXXXXXXXX)
 * @returns {Promise<{status: string, details: string, sessionId?: string}>}
 */
export const sendOTP = async (phone) => {
  try {
    // Correct send URL (server generates OTP/session)
    // Your confirmed SEND endpoint pattern:
    // https://2factor.in/API/V1/{apiKey}/SMS/{phone}/AUTOGEN/anyhelp
    const url = `${API_BASE_URL}/${API_KEY}/SMS/${phone}/AUTOGEN/anyhelp`;

    console.log("📤 Sending OTP to:", phone);
    console.log("🔗 Using Vite proxy at:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📥 Response from 2factor.in:", data);

    if (data.Status === "Success") {
      return {
        status: "success",
        details: data.Details,
        // session id for VERIFY is returned in Details
        sessionId: data.Details,
      };
    }

    return {
      status: "error",
      details: data.Details || "Failed to send OTP",
    };
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
    // Your confirmed VERIFY endpoint:
    // https://2factor.in/API/V1/{apiKey}/SMS/VERIFY/{sessionId}/{otp}
    const url = `${API_BASE_URL}/${API_KEY}/SMS/VERIFY/${sessionId}/${enteredOtp}`;

    console.log("🔐 Verifying OTP...");
    console.log("🔗 Using Vite proxy at:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📥 Verify response from 2factor.in:", data);

    if (data.Status === "Success") {
      // Expected response like:
      // {"Status":"Success","Details":"<sessionId>"}
      return {
        verified: true,
        message: "OTP verified successfully",
      };
    }

    return {
      verified: false,
      message: data.Details || "Invalid OTP",
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      verified: false,
      message: error.message || "Verification failed",
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
