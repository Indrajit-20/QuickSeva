import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config/api";


const isValidOTP = (otp) => /^\d{6}$/.test(otp);

const formatPhoneNumber = (phone) => {
  let cleaned = String(phone || "").replace(/[^\d+-]/g, "");

  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith("91")) cleaned = "91" + cleaned;
    cleaned = "+" + cleaned;
  }

  return cleaned;
};

const pad2 = (n) => String(n).padStart(2, "0");

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const inputsRef = useRef([]);

  // Get phone number and seller-register fields from location state
  const phoneNumber = location.state?.phoneNumber;
  const userName = location.state?.userName || "User";
  const firstName = location.state?.firstName;
  const lastName = location.state?.lastName;
  const email = location.state?.email;

  // Kept for compatibility; real sessionId comes from backend send-otp
  const otpRequestId = location.state?.otpRequestId || phoneNumber;

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionIdRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);

  // Resend cooldown = 30 seconds
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendLocked, setResendLocked] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const resendTimerRef = useRef(null);

  const TIMER_SECONDS = 30;
  const MAX_RESENDS = 3;

  // Init timer/resend count; also triggers initial SEND OTP immediately
  useEffect(() => {
    const init = async () => {
      if (!phoneNumber) {
        setError("Phone number not provided. Please register again.");
        setTimeout(() => navigate("/register"), 2000);
        return;
      }

      // Load resend count (hard cap)
      const savedResendCount = localStorage.getItem("otpResendCount");
      const count = savedResendCount ? parseInt(savedResendCount, 10) : 0;
      setResendCount(count);
      if (count >= MAX_RESENDS) {
        setResendLocked(true);
        setResendDisabled(true);
      }

      // Prime sessionId from state (fallback only)
      sessionIdRef.current = otpRequestId;
      setSessionId(otpRequestId);

      // Start with disabled button until first send completes
      setResendDisabled(true);

      // Reset resend timer
      setTimeRemaining(0);
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);

      // Immediately send OTP on open
      await sendOtpNow({ resetTimer: true });
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber, navigate]);

  // Timer tick
  useEffect(() => {
    if (!resendDisabled || resendLocked) return;

    if (timeRemaining <= 0) {
      // enable if allowed
      if (!resendLocked && resendCount < MAX_RESENDS) {
        setResendDisabled(false);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, resendDisabled, resendLocked, resendCount]);

  const startCooldown = () => {
    // reset cooldown UI to 30 seconds
    setTimeRemaining(TIMER_SECONDS);
    setResendDisabled(true);

    // Also persist to localStorage for refresh durability
    const expiryTime = Date.now() + TIMER_SECONDS * 1000;
    localStorage.setItem("otpTimerExpiry", expiryTime);

    if (resendTimerRef.current) clearInterval(resendTimerRef.current);

    resendTimerRef.current = setInterval(() => {
      const expiryStr = localStorage.getItem("otpTimerExpiry");
      if (!expiryStr) return;
      const expiryMs = parseInt(expiryStr, 10);
      const remainingMs = expiryMs - Date.now();
      if (remainingMs <= 0) {
        clearInterval(resendTimerRef.current);
        localStorage.removeItem("otpTimerExpiry");
        setTimeRemaining(0);
        setResendDisabled(resendLocked || resendCount >= MAX_RESENDS);
      } else {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setTimeRemaining(remainingSeconds);
      }
    }, 250);
  };

  const sendOtpNow = async ({ resetTimer }) => {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!formattedPhone) {
      setError("Invalid phone number. Please register again.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      // Disable during request
      setResendDisabled(true);
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formattedPhone,
          type: "seller-register",
        }),
      });

      const responseData = await res.json();
      console.log("SEND OTP RESPONSE", responseData);
      console.log(
        "SESSION ID",
        responseData?.data?.sessionId || responseData?.sessionId,
      );

      if (!res.ok)
        throw new Error(responseData?.message || "Failed to send OTP");

      // IMPORTANT: store returned sessionId immediately
      const newSessionId =
        responseData?.data?.sessionId || responseData?.sessionId;
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);

      // Reset cooldown to 30 seconds after every send
      if (resetTimer) startCooldown();

      // increment resend count only on resend clicks; but initial send should not count.
      // keep resendCount as-is here.

      setSuccess(`✓ OTP sent to ${phoneNumber || formattedPhone}!`);

      // Focus inputs
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputsRef.current[0]?.focus(), 0);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
      console.error("Send OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];

      if (!otp[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        newOtp[index - 1] = "";
      } else {
        newOtp[index] = "";
      }

      setOtp(newOtp);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "");

    if (digits.length >= 6) {
      const newOtp = digits.slice(0, 6).split("");
      setOtp(newOtp);
      inputsRef.current[5]?.focus();
    }
  };

  const formatTime = () => {
    // UI requirement: Resend OTP (00:30) style
    return `(${pad2(Math.floor(timeRemaining / 60))}:${pad2(timeRemaining % 60)})`;
  };

  const handleResendOtp = async () => {
    if (resendLocked) {
      setError(
        "⚠️ Maximum resend attempts reached. Contact support for assistance.",
      );
      return;
    }

    if (resendCount >= MAX_RESENDS) {
      setResendLocked(true);
      setResendDisabled(true);
      setError(
        "⚠️ Maximum resend attempts reached. Contact support for assistance.",
      );
      return;
    }

    // Cooldown guard
    if (timeRemaining > 0 || resendDisabled) return;

    // Clicked resend: increment resend count
    const newCount = resendCount + 1;
    setResendCount(newCount);
    localStorage.setItem("otpResendCount", String(newCount));

    if (newCount >= MAX_RESENDS) setResendLocked(true);

    // Call backend send-otp again and reset cooldown
    // Also resets timer back to 30 seconds
    await sendOtpNow({ resetTimer: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpCode = otp.join("");

    // Validation
    if (!phoneNumber) {
      setError("Phone number missing. Please register again.");
      return;
    }

    if (!sessionIdRef.current) {
      setError(
        "OTP session missing. Please wait for OTP resend and try again.",
      );
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (!isValidOTP(otpCode)) {
      setError("OTP must contain only digits");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formattedPhone,
          otp: otpCode,
          sessionId: sessionIdRef.current,
          type: "seller-register",
          firstName,
          lastName,
          email,
        }),
      });

      const responseData = await res.json();
      console.log("VERIFY OTP RESPONSE", responseData);

      if (!res.ok)
        throw new Error(responseData?.message || "OTP verification failed");

      // Success: token + user stored
      const token = responseData?.data?.token || responseData?.token;

      if (token) localStorage.setItem("authToken", token);

      setSuccess("✓ OTP verified successfully!");

      // Clear timers
      localStorage.removeItem("otpTimerExpiry");
      localStorage.removeItem("otpResendCount");

      // Navigate directly to seller dashboard
      setTimeout(() => {
        navigate("/seller/dashboard", {
          state: { phone: phoneNumber, name: userName },
        });
      }, 200);
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
      console.error("OTP verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Verify OTP</h1>
            <p className="text-gray-600">
              {phoneNumber
                ? `We sent a 6-digit code to ${phoneNumber}`
                : "We sent a 6-digit code"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>

              <div className="flex gap-2 sm:gap-3 justify-center">
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
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors bg-white hover:border-gray-400"
                    disabled={loading}
                    autoComplete="off"
                  />
                ))}
              </div>

              <p className="text-xs text-gray-500 text-center">
                💡 Tip: You can paste a 6-digit code in the first box
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <span className="text-red-600 font-semibold text-sm flex-1">
                  {error}
                </span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                <span className="text-emerald-600 font-semibold text-sm flex-1">
                  {success}
                </span>
              </div>
            )}

            {/* Resend OTP cooldown / button */}
            <div className="border-t pt-6 space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Didn't receive the code?
              </p>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendDisabled || resendLocked || loading}
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
                  : resendDisabled
                    ? `Resend OTP (${pad2(Math.floor(timeRemaining / 60))}:${pad2(timeRemaining % 60)})`
                    : "Resend OTP"}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Resend attempts: {resendCount}/{MAX_RESENDS}
              </p>
            </div>

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

        {/* Debug info (remove in production) */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            🔧 Debug: Timer: {timeRemaining}s | SessionId set:{" "}
            {sessionId ? "yes" : "no"}| OTP: {otp.join("") || "(empty)"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
