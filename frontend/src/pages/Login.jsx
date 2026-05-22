    import React, { useState, useCallback } from "react";
    import { Link, useNavigate } from "react-router-dom";
    import { useAuth } from "../context/AuthContext";
    import { sendOTP, formatPhoneNumber, verifyOTP } from "../utils/otpService";

    const Login = () => {
      const navigate = useNavigate();
      const { loginWithEmail, loginWithPhone } = useAuth();

      // ========================================
      // ACTIVE TAB STATE
      // ========================================
      const [activeTab, setActiveTab] = useState("mobile"); // "mobile" only now

      // ========================================
      // MOBILE LOGIN STATE
      // ========================================
      const [mobileForm, setMobileForm] = useState({
        mobileNumber: "",
      });
      const [mobileErrors, setMobileErrors] = useState({});
      const [mobileTouched, setMobileTouched] = useState({});
      const [mobileLoading, setMobileLoading] = useState(false);
      const [mobileSuccess, setMobileSuccess] = useState("");

      // OTP State (appears after sending OTP)
      const [otpSent, setOtpSent] = useState(false);
      const [otpCode, setOtpCode] = useState("");
      const [otpErrors, setOtpErrors] = useState("");
      const [otpTouched, setOtpTouched] = useState(false);
      const [otpLoading, setOtpLoading] = useState(false);
      const [sessionId, setSessionId] = useState(null);

      // OTP Timer State (30 seconds)
      const [otpTimer, setOtpTimer] = useState(0);
      const [otpTimerActive, setOtpTimerActive] = useState(false);

      // ========================================
      // MOBILE VALIDATION FUNCTIONS
      // ========================================
      const validateMobileNumber = (mobile) => {
        if (!mobile) return "Mobile number is required";
        const digitsOnly = mobile.replace(/\D/g, "");
        if (digitsOnly.length !== 10) return "Mobile number must be 10 digits";
        return null;
      };

      const validateOtp = (otp) => {
        if (!otp) return "OTP is required";
        if (otp.length !== 6) return "OTP must be 6 digits";
        return null;
      };

      const validateMobileForm = useCallback(() => {
        const newErrors = {};
        newErrors.mobileNumber = validateMobileNumber(mobileForm.mobileNumber);

        setMobileErrors(newErrors);
        setMobileTouched({
          mobileNumber: true,
        });

        return !newErrors.mobileNumber;
      }, [mobileForm]);

      // ========================================
      // MOBILE TAB HANDLERS
      // ========================================
      const handleMobileChange = (e) => {
        const { name, value } = e.target;
        let sanitizedValue = value;

        if (name === "mobileNumber") {
          sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
        }

        setMobileForm((prev) => ({
          ...prev,
          [name]: sanitizedValue,
        }));

        // Real-time validation
        if (mobileTouched[name]) {
          setMobileErrors((prev) => ({
            ...prev,
            mobileNumber: validateMobileNumber(sanitizedValue),
          }));
        }
      };

      const handleMobileBlur = (e) => {
        const { name, value } = e.target;
        setMobileTouched((prev) => ({
          ...prev,
          [name]: true,
        }));

        setMobileErrors((prev) => ({
          ...prev,
          mobileNumber: validateMobileNumber(value),
        }));
      };

      const handleSendOtp = async (e) => {
        e.preventDefault();
        setMobileSuccess("");
        setMobileErrors({});

        if (!validateMobileForm()) return;

        setMobileLoading(true);

        try {
          // Send OTP via SMS using real API. 2factor generates the OTP and
          // returns a session ID that must be used for verification.
          const result = await sendOTP(formatPhoneNumber(mobileForm.mobileNumber));

          if (result.status !== "success") {
            throw new Error(result.details || "Failed to send OTP");
          }

          // Store session ID for verification
          setSessionId(result.sessionId);
          setOtpSent(true);
          setMobileSuccess("OTP sent to your mobile number!");

          // Start 30-second timer
          setOtpTimer(30);
          setOtpTimerActive(true);
        } catch (err) {
          setMobileErrors({
            submit: err.message || "Failed to send OTP. Please try again.",
          });
        } finally {
          setMobileLoading(false);
        }
      };

      // OTP Timer Effect
      React.useEffect(() => {
        if (!otpTimerActive || otpTimer <= 0) {
          if (otpTimer <= 0 && otpTimerActive) {
            setOtpTimerActive(false);
          }
          return;
        }

        const interval = setInterval(() => {
          setOtpTimer((prev) => {
            if (prev <= 1) {
              setOtpTimerActive(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(interval);
      }, [otpTimerActive, otpTimer]);

      const handleOtpChange = (e) => {
        const { value } = e.target;
        const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
        setOtpCode(digitsOnly);

        // Real-time validation
        if (otpTouched) {
          setOtpErrors(validateOtp(digitsOnly));
        }
      };

      const handleOtpBlur = () => {
        setOtpTouched(true);
        setOtpErrors(validateOtp(otpCode));
      };

      const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setOtpErrors("");
        setMobileSuccess("");

        const error = validateOtp(otpCode);
        if (error) {
          setOtpErrors(error);
          return;
        }

        setOtpLoading(true);

        try {
          if (!sessionId) {
            throw new Error("OTP session expired. Please resend OTP.");
          }

          const result = await verifyOTP(
            formatPhoneNumber(mobileForm.mobileNumber),
            sessionId,
            otpCode
          );

          if (!result.verified) {
            throw new Error(result.message || "Invalid OTP. Please try again.");
          }

          setMobileSuccess("OTP Verified! Logging you in...");

          // Extract user data if available
          const storedUser = localStorage.getItem("registeredUser");
          const userData = storedUser ? JSON.parse(storedUser) : {};

          // Use AuthContext to store user auth info
          loginWithPhone(
            mobileForm.mobileNumber,
            userData.firstName
              ? `${userData.firstName} ${userData.lastName}`
              : "User"
          );

          setTimeout(() => {
            navigate("/");
          }, 1500);
        } catch (err) {
          setOtpErrors(err.message || "OTP verification failed.");
        } finally {
          setOtpLoading(false);
        }
      };

      const handleResendOtp = async () => {
        setOtpCode("");
        setOtpTouched(false);
        setOtpErrors("");
        setMobileSuccess("");

        try {
          // Send new OTP via SMS
          const result = await sendOTP(formatPhoneNumber(mobileForm.mobileNumber));

          if (result.status !== "success") {
            throw new Error(result.details || "Failed to resend OTP");
          }

          setSessionId(result.sessionId);
          setOtpTimer(30);
          setOtpTimerActive(true);
          setMobileSuccess(" New OTP sent!");
        } catch (err) {
          setMobileErrors({
            submit: err.message || "Failed to resend OTP. Please try again.",
          });
        }
      };

      return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4">
          <div className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-indigo-500/30 red-accent-line">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-indigo-200">Sign in to continue your journey</p>
            </div>

            {/* ========================================
                MOBILE OTP LOGIN SECTION
                ======================================== */}
            <div className="animate-fade-in">
              {/* Error Message */}
              {(mobileErrors.submit || otpErrors) && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{mobileErrors.submit || otpErrors}</span>
                  </div>
                )}

                {/* Success Message */}
                {mobileSuccess && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-200 rounded-lg text-sm flex items-center gap-2 font-semibold">
                    <span>✓</span>
                    <span>{mobileSuccess}</span>
                  </div>
                )}

                {/* Mobile OTP Form */}
                <form
                  onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
                  className="space-y-5"
                >
                  {/* Mobile Number Input */}
                  {!otpSent && (
                    <div>
                      <label className="form-label">
                        Mobile Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={mobileForm.mobileNumber}
                        onChange={handleMobileChange}
                        onBlur={handleMobileBlur}
                        placeholder="98765 43210"
                        disabled={mobileLoading || otpSent}
                        maxLength="10"
                        className={`form-input ${
                          mobileErrors.mobileNumber && mobileTouched.mobileNumber
                            ? "border-danger focus:ring-danger"
                            : !mobileErrors.mobileNumber &&
                              mobileTouched.mobileNumber &&
                              mobileForm.mobileNumber
                            ? "border-success focus:ring-success"
                            : "focus:border-primary"
                        }`}
                      />
                      {mobileErrors.mobileNumber && mobileTouched.mobileNumber && (
                        <p className="mt-1 text-xs text-danger flex items-center gap-1">
                          <span>⚠️</span> {mobileErrors.mobileNumber}
                        </p>
                      )}
                    </div>
                  )}

                  {/* OTP Code Input */}
                  {otpSent && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label">
                          Enter OTP <span className="text-danger">*</span>
                        </label>
                        <span className="text-xs text-text-muted">
                          Sent to +91 {mobileForm.mobileNumber}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={otpCode}
                        onChange={handleOtpChange}
                        onBlur={handleOtpBlur}
                        placeholder="000000"
                        disabled={otpLoading}
                        maxLength="6"
                        className={`form-input text-center font-mono tracking-widest ${
                          otpErrors && otpTouched
                            ? "border-danger focus:ring-danger"
                            : ""
                        }`}
                      />
                      {otpErrors && otpTouched && (
                        <p className="mt-1 text-xs text-danger flex items-center gap-1">
                          <span>⚠️</span> {otpErrors}
                        </p>
                      )}
                     
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={
                        mobileLoading ||
                        otpLoading ||
                        (!otpSent &&
                          (!mobileForm.mobileNumber ||
                            mobileErrors.mobileNumber)) ||
                        (otpSent && (!otpCode || otpErrors))
                      }
                      className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                      {mobileLoading || otpLoading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {otpSent ? "Verifying..." : "Sending OTP..."}
                        </>
                      ) : otpSent ? (
                        "Verify & Login"
                      ) : (
                        "Send OTP"
                      )}
                    </button>

                    {otpSent && (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpTimerActive || otpLoading}
                        className="w-full btn btn-secondary"
                      >
                        {otpTimerActive
                          ? `Resend OTP (${otpTimer}s)`
                          : "Resend OTP"}
                      </button>
                    )}
                  </div>
                </form>
              </div>

            {/* Divider */}
            <div className="my-6 flex items-center red-accent-top pt-6">
              <div className="grow border-t border-indigo-500/30"></div>
              <span className="px-4 text-indigo-300 text-sm">or</span>
              <div className="grow border-t border-indigo-500/30"></div>
            </div>

            {/* Link to Register */}
            <p className="text-center text-indigo-200 text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-red-400 hover:text-red-300 hover:underline"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      );
    };

    export default Login;
