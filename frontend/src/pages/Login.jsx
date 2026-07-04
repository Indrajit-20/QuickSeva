import React, { useEffect, useMemo, useRef, useReducer } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const TIMER_SECONDS = 60;
const LS_RESEND_EXPIRES_AT = "otpResendExpiresAt";
const LS_LOGIN_PHONE = "otpLoginPhone";
const LS_LOGIN_SESSION_ID = "otpLoginSessionId";

const initialState = {
  step: "phone", // 'phone' or 'otp'
  phone: "",
  otp: "",
  localErrors: {},
  localMessage: "",
  sessionId: null,
  resendTimer: 0,
};

function loginReducer(state, action) {
  console.log("loginReducer action:", action.type, "payload:", action.payload, "prev state:", state);
  switch (action.type) {
    case "SET_PHONE":
      return {
        ...state,
        phone: action.payload,
        localErrors: { ...state.localErrors, phone: "" },
      };
    case "SET_OTP":
      return {
        ...state,
        otp: action.payload,
        localErrors: { ...state.localErrors, otp: "" },
      };
    case "SET_ERRORS":
      return {
        ...state,
        localErrors: action.payload,
      };
    case "SET_MESSAGE":
      return {
        ...state,
        localMessage: action.payload,
      };
    case "OTP_SENT_SUCCESS":
      localStorage.setItem(LS_LOGIN_PHONE, action.payload.phone);
      if (action.payload.sessionId) {
        localStorage.setItem(LS_LOGIN_SESSION_ID, action.payload.sessionId);
      }
      return {
        ...state,
        step: "otp",
        sessionId: action.payload.sessionId || state.sessionId,
        resendTimer: TIMER_SECONDS,
        localMessage: "OTP sent. Please enter the 6-digit code.",
        localErrors: {},
        otp: "",
      };
    case "SET_TIMER":
      return {
        ...state,
        resendTimer: action.payload,
      };
    case "RESTORE_SESSION":
      return {
        ...state,
        step: "otp",
        phone: action.payload.phone,
        sessionId: action.payload.sessionId,
        resendTimer: action.payload.resendTimer,
        localErrors: {},
      };
    case "RESET_TO_PHONE":
      localStorage.removeItem(LS_RESEND_EXPIRES_AT);
      localStorage.removeItem(LS_LOGIN_PHONE);
      localStorage.removeItem(LS_LOGIN_SESSION_ID);
      return {
        ...state,
        step: "phone",
        otp: "",
        localErrors: {},
        localMessage: "",
        sessionId: null,
        resendTimer: 0,
      };
    default:
      return state;
  }
}

const Login = () => {
  const navigate = useNavigate();
  const { sendOtp, loginWithOtp, isLoading, authError } = useAuth();
  const [state, dispatch] = useReducer(loginReducer, initialState);
  console.log("Login component rendering, step =", state.step);
  const intervalRef = useRef(null);

  const digitsOnlyPhone = useMemo(() => state.phone.replace(/\D/g, ""), [state.phone]);

  const clearCountdown = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    dispatch({ type: "SET_TIMER", payload: 0 });
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

      dispatch({ type: "SET_TIMER", payload: Math.ceil(remainingMs / 1000) });
    }, 250);

    dispatch({ type: "SET_TIMER", payload: TIMER_SECONDS });
  };

  useEffect(() => {
    // Survive refresh: resume or clear countdown
    const stored = localStorage.getItem(LS_RESEND_EXPIRES_AT);
    const expiry = stored ? parseInt(stored, 10) : 0;
    const savedPhone = localStorage.getItem(LS_LOGIN_PHONE);
    const savedSessionId = localStorage.getItem(LS_LOGIN_SESSION_ID);

    const remainingMs = expiry - Date.now();
    if (expiry && remainingMs > 0 && savedPhone && savedSessionId) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      dispatch({
        type: "RESTORE_SESSION",
        payload: {
          phone: savedPhone,
          sessionId: savedSessionId,
          resendTimer: remainingSeconds,
        },
      });

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const storedInner = localStorage.getItem(LS_RESEND_EXPIRES_AT);
        const expiryInner = storedInner ? parseInt(storedInner, 10) : 0;
        const remainingMsInner = expiryInner - Date.now();
        if (!expiryInner || remainingMsInner <= 0) {
          clearCountdown();
          return;
        }
        dispatch({ type: "SET_TIMER", payload: Math.ceil(remainingMsInner / 1000) });
      }, 250);
    } else {
      // Clear inconsistent or expired state to prevent any desync
      localStorage.removeItem(LS_RESEND_EXPIRES_AT);
      localStorage.removeItem(LS_LOGIN_PHONE);
      localStorage.removeItem(LS_LOGIN_SESSION_ID);
    }

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

    dispatch({ type: "SET_ERRORS", payload: errors });
    return Object.keys(errors).length === 0;
  };

  const validateOtp = () => {
    const errors = {};
    if (!state.otp) errors.otp = "OTP is required";
    else if (!/^\d{6}$/.test(state.otp)) errors.otp = "OTP must be 6 digits";

    dispatch({ type: "SET_ERRORS", payload: errors });
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    dispatch({ type: "SET_ERRORS", payload: {} });
    dispatch({ type: "SET_MESSAGE", payload: "" });

    if (!validatePhone()) {
      console.log("Phone number validation failed.");
      return;
    }

    // Security/UX: prevent repeated OTP requests during countdown
    const stored = localStorage.getItem(LS_RESEND_EXPIRES_AT);
    const expiry = stored ? parseInt(stored, 10) : 0;
    if (expiry && expiry - Date.now() > 0) {
      console.log("Countdown active, ignoring send OTP request.");
      return;
    }

    console.log("handleSendOtp called for:", digitsOnlyPhone);
    try {
      const result = await sendOtp({ identifier: digitsOnlyPhone });
      console.log("sendOtp resolved with result:", result);
      const newSessionId = result?.data?.sessionId || null;
      console.log("newSessionId extracted:", newSessionId);

      dispatch({
        type: "OTP_SENT_SUCCESS",
        payload: {
          phone: state.phone,
          sessionId: newSessionId,
        },
      });
      console.log("Dispatched OTP_SENT_SUCCESS");
      startCountdown();
    } catch (err) {
      console.error("handleSendOtp caught error:", err);
      // AuthContext already sets authError
    }
  };

  const handleResendOtp = async () => {
    if (state.resendTimer > 0) return;

    dispatch({ type: "SET_ERRORS", payload: {} });
    dispatch({ type: "SET_MESSAGE", payload: "" });

    try {
      const result = await sendOtp({ identifier: digitsOnlyPhone });
      const newSessionId = result?.data?.sessionId || null;

      dispatch({
        type: "OTP_SENT_SUCCESS",
        payload: {
          phone: state.phone,
          sessionId: newSessionId,
        },
      });
      startCountdown();
    } catch {
      // AuthContext already sets authError
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    dispatch({ type: "SET_ERRORS", payload: {} });
    dispatch({ type: "SET_MESSAGE", payload: "" });

    if (state.step !== "otp") {
      dispatch({ type: "SET_ERRORS", payload: { submit: "Please request OTP first." } });
      return;
    }

    if (!validateOtp()) return;

    try {
      if (!state.sessionId) {
        throw new Error("sessionId missing. Please resend OTP.");
      }
      const result = await loginWithOtp({
        identifier: digitsOnlyPhone,
        otp: state.otp,
        sessionId: state.sessionId,
      });

      // Clear timer/session values from localStorage on successful login
      localStorage.removeItem(LS_RESEND_EXPIRES_AT);
      localStorage.removeItem(LS_LOGIN_PHONE);
      localStorage.removeItem(LS_LOGIN_SESSION_ID);

      const role = result?.user?.role;

      console.log("LOGIN ROLE:", role);
      console.log("LOGIN USER:", result?.user);

      if (role === "seller") {
        return navigate("/seller/dashboard", { replace: true });
      }
      if (role === "admin") {
        return navigate("/admin/dashboard", { replace: true });
      }
      return navigate("/", { replace: true });
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

        {(authError || state.localErrors.submit) && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{authError || state.localErrors.submit}</span>
          </div>
        )}

        {state.localMessage && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 rounded-lg text-sm">
            {state.localMessage}
          </div>
        )}

        {state.step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={state.phone}
                onChange={(e) => dispatch({ type: "SET_PHONE", payload: e.target.value })}
                onBlur={() => validatePhone()}
                placeholder="98765 43210"
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                  state.localErrors.phone
                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
              />
              {state.localErrors.phone && (
                <p className="mt-1 text-xs text-red-300">⚠ {state.localErrors.phone}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 px-4 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3">
              <p className="text-sm text-indigo-200">
                OTP sent to <span className="font-semibold text-white">{state.phone}</span>
              </p>
              <button
                type="button"
                onClick={() => dispatch({ type: "RESET_TO_PHONE" })}
                className="mt-1 text-xs text-red-400 hover:text-red-300 font-medium underline focus:outline-none"
              >
                Change Phone Number
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-2">
                  Enter OTP <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={state.otp}
                  onChange={(e) =>
                    dispatch({ type: "SET_OTP", payload: e.target.value.replace(/\D/g, "").slice(0, 6) })
                  }
                  onBlur={() => validateOtp()}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                    state.localErrors.otp
                      ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                      : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  }`}
                />
                {state.localErrors.otp && (
                  <p className="mt-1 text-xs text-red-300">⚠ {state.localErrors.otp}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <div className="border-t border-indigo-500/20 pt-4 text-center">
              <p className="text-xs text-indigo-300 mb-2">Didn't receive the OTP?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || state.resendTimer > 0}
                className={`w-full px-4 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-md ${
                  isLoading || state.resendTimer > 0
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
              >
                {state.resendTimer > 0 ? `Resend OTP in ${state.resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </div>
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
