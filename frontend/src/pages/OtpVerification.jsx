import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  sendOTP,
  generateOTP,
  isValidOTP,
  formatPhoneNumber,
  verifyOTP,
} from "../utils/otpService";

/**
 * OTP Verification Component
 * Features:
 * - 6 separate input boxes with auto-focus
 * - Backspace support for seamless navigation
 * - Paste support for 6-digit codes
 * - Page-refresh proof 30-second timer (localStorage)
 * - Resend limit hard cap (max 3 times with localStorage tracking)
 * - Real SMS OTP integration with 2factor.in API
 */
const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputsRef = useRef([]);

  // Get phone number from location state
  const phoneNumber = location.state?.phoneNumber;
  const userName = location.state?.userName || "User";

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Timer states
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Resend states
  const [resendCount, setResendCount] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendLocked, setResendLocked] = useState(false);

  // Initialize timer and resend count on component mount
  useEffect(() => {
    // Check if phone number is provided
    if (!phoneNumber) {
      setError("Phone number not provided. Please register again.");
      setTimeout(() => navigate("/register"), 2000);
      return;
    }

    initializeTimerAndResendCount();
  }, [phoneNumber, navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) {
      if (timeRemaining <= 0 && timerActive) {
        setTimerActive(false);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setTimerActive(false);
          localStorage.removeItem("otpTimerExpiry");
        } else {
          // Update expiry timestamp in localStorage
          const expiryTime = Date.now() + newTime * 1000;
          localStorage.setItem("otpTimerExpiry", expiryTime);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  /**
   * Initialize timer from localStorage (page-refresh proof)
   * and load resend count
   */
  const initializeTimerAndResendCount = () => {
    // Check for existing timer in localStorage
    const savedExpiryTime = localStorage.getItem("otpTimerExpiry");
    if (savedExpiryTime) {
      const expiryMs = parseInt(savedExpiryTime, 10);
      const now = Date.now();
      const remainingMs = expiryMs - now;

      if (remainingMs > 0) {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setTimeRemaining(remainingSeconds);
        setTimerActive(true);
      } else {
        localStorage.removeItem("otpTimerExpiry");
      }
    }

    // Load resend count from localStorage
    const savedResendCount = localStorage.getItem("otpResendCount");
    if (savedResendCount) {
      const count = parseInt(savedResendCount, 10);
      setResendCount(count);

      // Hard cap: if resend count >= 3, lock the button permanently
      if (count >= 3) {
        setResendLocked(true);
        setResendDisabled(true);
      }
    }
  };

  /**
   * Handle individual digit input
   */
  const handleInputChange = (index, value) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;

    // Allow only single character
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus to next input if digit is entered
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /**
   * Handle backspace to move to previous input
   */
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      const newOtp = [...otp];

      // If current box is empty, move to previous and clear it
      if (!otp[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        newOtp[index - 1] = "";
      } else {
        // Clear current box
        newOtp[index] = "";
      }

      setOtp(newOtp);
    }
  };

  /**
   * Handle paste event - split 6-digit code into boxes
   */
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");

    // Extract only digits
    const digits = pastedData.replace(/\D/g, "");

    if (digits.length >= 6) {
      const newOtp = digits.slice(0, 6).split("");
      setOtp(newOtp);

      // Auto-focus to the last input after paste
      inputsRef.current[5]?.focus();
    }
  };

  /**
   * Handle OTP submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpCode = otp.join("");

    // Validation
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (!isValidOTP(otpCode)) {
      setError("OTP must contain only digits");
      return;
    }

    setLoading(true);

    try {
      // Verify OTP with the API session
      const result = await verifyOTP(phoneNumber, sessionId, otpCode);

      if (result.verified) {
        setSuccess("✓ OTP verified successfully!");

        // Clear localStorage timers
        localStorage.removeItem("otpTimerExpiry");
        localStorage.removeItem("otpResendCount");

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate("/dashboard", {
            state: { phone: phoneNumber, name: userName },
          });
        }, 1500);
      } else {
        setError(result.message || "Invalid OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      console.error("OTP verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Resend OTP with hard cap at 3 attempts
   */
  const handleResendOtp = async () => {
    // Hard cap check: prevent any action if already at 3 resends
    if (resendCount >= 3) {
      setResendLocked(true);
      setError(
        "⚠️ Maximum resend attempts reached. Contact support for assistance."
      );
      return;
    }

    setError("");
    setSuccess("");
    setResendDisabled(true);

    try {
      // Generate new OTP
      const newOtp = generateOTP();

      // Send OTP via SMS
      const result = await sendOTP(formatPhoneNumber(phoneNumber), newOtp);

      if (result.status === "success") {
        // Store session ID for verification
        setSessionId(result.sessionId);

        // Increment resend count
        const newResendCount = resendCount + 1;
        setResendCount(newResendCount);
        localStorage.setItem("otpResendCount", newResendCount);

        // If this is the 3rd resend, lock for future attempts
        if (newResendCount >= 3) {
          setResendLocked(true);
        }

        // Reset OTP inputs
        setOtp(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();

        // Start 30-second timer
        const expiryTime = Date.now() + 30 * 1000;
        localStorage.setItem("otpTimerExpiry", expiryTime);
        setTimeRemaining(30);
        setTimerActive(true);

        setSuccess(
          `✓ New OTP sent to ${phoneNumber}! (${newResendCount}/3 resends used)`
        );
      } else {
        setError(`Failed to resend OTP: ${result.details}`);
        setResendDisabled(false);
      }
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
      setResendDisabled(false);
      console.error("Resend OTP error:", err);
    } finally {
      // Keep button disabled until timer expires
      if (timeRemaining > 0) {
        setResendDisabled(true);
      }
    }
  };

  /**
   * Format time display (MM:SS)
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Verify OTP</h1>
            <p className="text-gray-600">
              We've sent a 6-digit code to your registered email/phone
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Boxes */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>

              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : null}
                    placeholder="0"
                    className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors bg-white hover:border-gray-400"
                    disabled={loading}
                    autoComplete="off"
                  />
                ))}
              </div>

              {/* Paste Hint */}
              <p className="text-xs text-gray-500 text-center">
                💡 Tip: You can paste a 6-digit code in the first box
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <span className="text-red-600 font-semibold text-sm flex-1">
                  {error}
                </span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                <span className="text-emerald-600 font-semibold text-sm flex-1">
                  {success}
                </span>
              </div>
            )}

            {/* Timer Display */}
            {timerActive && (
              <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm text-blue-600">
                  ⏱️ OTP expires in:{" "}
                </span>
                <span className="font-mono font-bold text-blue-700">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="border-t pt-6 space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Didn't receive the code?
            </p>

            {/* Resend Button */}
            <button
              onClick={handleResendOtp}
              disabled={resendDisabled || resendLocked}
              className={`w-full py-2 px-4 font-medium rounded-lg border-2 transition-colors ${
                resendLocked
                  ? "border-red-300 bg-red-50 text-red-600 cursor-not-allowed"
                  : resendDisabled
                  ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "border-emerald-600 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              }`}
            >
              {resendLocked
                ? "🔒 Resend Locked (Max attempts reached)"
                : resendDisabled && timerActive
                ? `Resend OTP (${formatTime(timeRemaining)})`
                : resendDisabled
                ? "Resend OTP"
                : `Resend OTP (${resendCount}/3)`}
            </button>

            {/* Resend Count Info */}
            {!resendLocked && (
              <p className="text-xs text-gray-500 text-center">
                Resend attempts: {resendCount}/3
              </p>
            )}

            {/* Lock Warning */}
            {resendLocked && (
              <p className="text-xs text-red-600 text-center font-semibold">
                ⚠️ Contact support if you need additional resends
              </p>
            )}
          </div>

          {/* Footer Link */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Wrong contact info?{" "}
              <a
                href="/register"
                className="text-emerald-600 font-semibold hover:underline"
              >
                Update it here
              </a>
            </p>
          </div>
        </div>

        {/* Debug Info (Remove in Production) */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            🔧 Debug: Resends: {resendCount}/3 | Timer: {timeRemaining}s | OTP:
            {otp.join("") || "(empty)"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
