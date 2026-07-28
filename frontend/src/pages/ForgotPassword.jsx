import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { scrollToFirstError } from "../utils/scrollUtils";

// Input field helper component matching other screens
const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  maxLength,
  value,
  error,
  isTouched,
  onChange,
  onBlur,
  prefix,
  disabled,
  required = true,
}) => (
  <div className="text-left">
    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm pointer-events-none select-none z-10">
          {prefix}
        </span>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        style={prefix ? { paddingLeft: "3.25rem" } : {}}
        className={`w-full ${prefix ? "pr-3" : "px-3.5"} py-2.5 rounded-xl border text-sm font-medium bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60 disabled:cursor-not-allowed ${
          error && isTouched
            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
            : !error && isTouched && value
            ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-50"
            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
        }`}
      />
    </div>
    {error && isTouched && (
      <p className="mt-1.5 text-xs font-semibold text-red-650">⚠ {error}</p>
    )}
  </div>
);

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Phone input, 2 = OTP + New Password
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  const resendTimerRef = useRef(null);
  const digitsOnlyPhone = phone.replace(/\D/g, "");

  useEffect(() => () => clearInterval(resendTimerRef.current), []);

  const startResendTimer = () => {
    clearInterval(resendTimerRef.current);
    setResendCountdown(60);
    resendTimerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    if (!digitsOnlyPhone) {
      setErrors({ phone: "Mobile number is required" });
      return;
    }
    if (digitsOnlyPhone.length !== 10) {
      setErrors({ phone: "Must be exactly 10 digits" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: digitsOnlyPhone,
          type: "login", // checks if user exists
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setSessionId(data.data?.sessionId ?? "");
      startResendTimer();
      setStep(2);
    } catch (err) {
      setServerError(err.message || "User not found or connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setServerError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: digitsOnlyPhone,
          type: "login",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");

      setSessionId(data.data?.sessionId ?? "");
      setOtp("");
      startResendTimer();
    } catch (err) {
      setServerError(err.message || "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const fieldErrors = {};
    if (!otp || !/^\d{6}$/.test(otp)) {
      fieldErrors.otp = "Please enter the 6-digit OTP code";
    }
    if (!newPassword || newPassword.length < 6) {
      fieldErrors.newPassword = "Password must be at least 6 characters";
    }
    if (newPassword !== confirmPassword) {
      fieldErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: digitsOnlyPhone,
          otp,
          sessionId,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      setSuccessMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      let msg = err.message || "OTP verification failed or session expired.";
      if (msg.includes("2Factor") || msg.includes("OTP Mismatch") || msg.includes("Details")) {
        msg = "Invalid OTP code. Please check and try again.";
      }
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 border border-slate-200 text-slate-850">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Reset Password</h1>
          <p className="text-slate-500 text-sm">
            {step === 1
              ? "Verify your mobile number to reset password"
              : `Enter OTP sent to +91 ${phone}`}
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-left">
            <p className="text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <span>✓</span> {successMessage}
            </p>
          </div>
        )}

        {/* Server Errors */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-left">
            <p className="text-red-750 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> {serverError}
            </p>
          </div>
        )}

        {/* STEP 1: Enter Phone */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
            <InputField
              label="Mobile Number"
              name="phone"
              type="tel"
              placeholder="98765 43210"
              maxLength={10}
              prefix="+91"
              value={phone}
              error={errors.phone}
              isTouched={true}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                setErrors({});
              }}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Sending OTP..." : "Get OTP →"}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP and Enter New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
            <div className="text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-650 font-semibold">
                OTP sent to <span className="font-bold text-slate-800">{phone}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setServerError("");
                  setErrors({});
                }}
                className="mt-2 text-xs text-red-650 hover:text-red-700 font-bold underline focus:outline-none cursor-pointer"
              >
                Change Phone Number
              </button>
            </div>

            <InputField
              label="OTP Code"
              name="otp"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              error={errors.otp}
              isTouched={true}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                setErrors((prev) => ({ ...prev, otp: "" }));
              }}
              disabled={isLoading}
            />

            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              error={errors.newPassword}
              isTouched={true}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: "" }));
              }}
              disabled={isLoading}
            />

            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              error={errors.confirmPassword}
              isTouched={true}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>

            <div className="border-t border-slate-200 pt-4 text-center">
              <p className="text-xs text-slate-500 mb-2 font-semibold">Didn't receive the OTP?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || resendCountdown > 0}
                className={`w-full px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition shadow-xs cursor-pointer ${
                  isLoading || resendCountdown > 0
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
              >
                {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        <div className="my-6 border-t border-slate-200 pt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
