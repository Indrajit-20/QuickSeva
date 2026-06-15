import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const TIMER_SECONDS = 60;
const LS_RESEND_EXPIRES_AT = "otpResendExpiresAt";

const Login = () => {
  const navigate = useNavigate();
  const { sendOtp, loginWithOtp, isLoading, authError } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [localErrors, setLocalErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const [resendTimer, setResendTimer] = useState(0); // seconds remaining
  const intervalRef = useRef(null);

  const digitsOnlyPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const clearCountdown = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setResendTimer(0);
    localStorage.removeItem(LS_RESEND_EXPIRES_AT);
  };

  const startCountdown = () => {
    const expiresAt = Date.now() + TIMER_SECONDS * 1000;
    localStorage.setItem(LS_RESEND_EXPIRES_AT, String(expiresAt));

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const stored = localStorage.getItem(LS_RESEND_EXPIRES_AT);
      const expiry = stored ? parseInt(stored, 10) : 0;

      const remainingMs = expiry - Date.now();
      if (!expiry || remainingMs <= 0) {
        clearCountdown();
        return;
      }

      setResendTimer(Math.ceil(remainingMs / 1000));
    }, 250);

    setResendTimer(TIMER_SECONDS);
  };

  useEffect(() => {
    // Survive refresh: resume or clear countdown
    const stored = localStorage.getItem(LS_RESEND_EXPIRES_AT);
    const expiry = stored ? parseInt(stored, 10) : 0;

    if (!expiry) return;

    const remainingMs = expiry - Date.now();
    if (remainingMs <= 0) {
      clearCountdown();
      return;
    }

    setResendTimer(Math.ceil(remainingMs / 1000));

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const storedInner = localStorage.getItem(LS_RESEND_EXPIRES_AT);
      const expiryInner = storedInner ? parseInt(storedInner, 10) : 0;
      const remainingMsInner = expiryInner - Date.now();
      if (!expiryInner || remainingMsInner <= 0) {
        clearCountdown();
        return;
      }
      setResendTimer(Math.ceil(remainingMsInner / 1000));
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validatePhone = () => {
    const errors = {};

    if (!digitsOnlyPhone) errors.phone = "Phone number is required";
    else if (digitsOnlyPhone.length !== 10)
      errors.phone = "Phone number must be 10 digits";

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOtp = () => {
    const errors = {};
    if (!otp) errors.otp = "OTP is required";
    else if (!/^\d{6}$/.test(otp)) errors.otp = "OTP must be 6 digits";

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLocalErrors({});
    setLocalMessage("");

    if (!validatePhone()) return;

    // Security/UX: prevent repeated OTP requests during countdown
    const stored = localStorage.getItem(LS_RESEND_EXPIRES_AT);
    const expiry = stored ? parseInt(stored, 10) : 0;
    if (expiry && expiry - Date.now() > 0) {
      return;
    }

    try {
      const result = await sendOtp({ identifier: digitsOnlyPhone });
      setOtpSent(true);
      if (result?.data?.sessionId) {
        setSessionId(result.data.sessionId);
      }
      setLocalMessage("OTP sent. Please enter the 6-digit code.");
      startCountdown();
    } catch {
      // AuthContext already sets authError
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalErrors({});
    setLocalMessage("");

    if (!otpSent) {
      setLocalErrors({ submit: "Please request OTP first." });
      return;
    }

    if (!validateOtp()) return;

    try {
      if (!sessionId) {
        throw new Error("sessionId missing. Please resend OTP.");
      }
      await loginWithOtp({ identifier: digitsOnlyPhone, otp, sessionId });
      navigate("/", { replace: true });
    } catch {
      // AuthContext already sets authError
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4">
      <div className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-indigo-500/30 red-accent-line">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-indigo-200">Login using OTP</p>
        </div>

        {(authError || localErrors.submit) && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{authError || localErrors.submit}</span>
          </div>
        )}

        {localMessage && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 rounded-lg text-sm">
            {localMessage}
          </div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => validatePhone()}
              placeholder="98765 43210"
              disabled={isLoading}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                localErrors.phone
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              }`}
            />
            {localErrors.phone && (
              <p className="mt-1 text-xs text-red-300">⚠ {localErrors.phone}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || resendTimer > 0}
            className={`w-full mt-1 px-4 py-2.5 rounded-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 shadow-lg ${
              isLoading || resendTimer > 0
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100"
            }`}
          >
            {isLoading
              ? "Sending OTP..."
              : resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : "Send OTP"}
          </button>
        </form>

        {otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 mt-6">
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Enter OTP <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onBlur={() => validateOtp()}
                placeholder="123456"
                maxLength={6}
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                  localErrors.otp
                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
              />
              {localErrors.otp && (
                <p className="mt-1 text-xs text-red-300">⚠ {localErrors.otp}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        <div className="my-6 flex items-center red-accent-top pt-6">
          <div className="grow border-t border-indigo-500/30" />
          <span className="px-4 text-indigo-300 text-sm">or</span>
          <div className="grow border-t border-indigo-500/30" />
        </div>

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
