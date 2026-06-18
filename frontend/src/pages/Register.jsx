import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

// Strip trailing /api so it's never doubled regardless of .env value
// e.g. "http://localhost:5000/api" → "http://localhost:5000"
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/?$/, "");

// ─── Shared Input Component ───────────────────────────────────────────────────
// Kept outside Register so it doesn't re-mount on every parent render.
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
  <div>
    <label className="block text-xs font-semibold text-indigo-200 mb-2">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-semibold text-sm pointer-events-none select-none">
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
        className={`w-full ${prefix ? "pl-12 pr-3" : "px-3"} py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
          error && isTouched
            ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            : !error && isTouched && value
            ? "border-green-500/50 focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        }`}
      />
    </div>
    {error && isTouched && (
      <p className="mt-1 text-xs text-red-300">⚠ {error}</p>
    )}
  </div>
);

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ current, labels }) => (
  <div className="flex items-center justify-center gap-0 mb-6">
    {labels.map((label, i) => {
      const step = i + 1;
      const done = current > step;
      const active = current === step;
      return (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done
                  ? "bg-green-600 text-white"
                  : active
                  ? "bg-indigo-600 text-white ring-2 ring-indigo-400/40"
                  : "bg-indigo-900/60 text-indigo-500 border border-indigo-500/30"
              }`}
            >
              {done ? "✓" : step}
            </div>
            <span
              className={`text-[10px] font-medium transition-colors ${
                active ? "text-indigo-200" : done ? "text-green-400" : "text-indigo-600"
              }`}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className={`h-0.5 w-14 mb-4 mx-1 transition-all duration-300 ${
                current > step ? "bg-green-600/60" : "bg-indigo-800"
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Register Page ─────────────────────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();

  // ── UI State ───────────────────────────────────────────────────────────────
  const [step, setStep]               = useState(1); // 1 = details, 2 = OTP
  const [isLoading, setIsLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccess]  = useState("");

  // ── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    firstName:    "",
    lastName:     "",
    email:        "",
    mobileNumber: "",
    agreeToTerms: false,
  });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});

  // ── OTP State ──────────────────────────────────────────────────────────────
  const [otp,       setOtp]       = useState("");
  const [sessionId, setSessionId] = useState("");
  const [otpError,  setOtpError]  = useState("");

  // ── Resend OTP State ────────────────────────────────────────────────────────
  const [resendCountdown, setResendCountdown] = useState(0);   // seconds left
  const resendTimerRef                        = useRef(null);   // interval ref

  // Cleanup interval when component unmounts
  useEffect(() => () => clearInterval(resendTimerRef.current), []);

  // Start/restart a 60-second cooldown after every OTP send
  const startResendTimer = () => {
    clearInterval(resendTimerRef.current);
    setResendCountdown(60);
    resendTimerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { clearInterval(resendTimerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Field Validators ───────────────────────────────────────────────────────
  const validators = {
    firstName: (v) =>
      !v ? "First name is required" : v.length < 2 ? "At least 2 characters required" : null,
    lastName: (v) =>
      !v ? "Last name is required" : v.length < 2 ? "At least 2 characters required" : null,
    email: (v) => {
      if (!v) return null;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
      return null;
    },
    mobileNumber: (v) => {
      if (!v) return "Mobile number is required";
      if (v.replace(/\D/g, "").length !== 10) return "Must be exactly 10 digits";
      return null;
    },
    agreeToTerms: (v) => (!v ? "You must accept the Terms & Conditions" : null),
  };

  const runFieldValidation = (name, value) => {
    const err = validators[name]?.(value) ?? null;
    setErrors((prev) => ({ ...prev, [name]: err }));
    return !err;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized =
      name === "mobileNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prev) => ({ ...prev, [name]: sanitized }));
    if (touched[name]) runFieldValidation(name, sanitized);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    runFieldValidation(name, formData[name]);
  };

  const handleTermsChange = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({ ...prev, agreeToTerms: checked }));
    setTouched((prev) => ({ ...prev, agreeToTerms: true }));
    setErrors((prev) => ({
      ...prev,
      agreeToTerms: validators.agreeToTerms(checked),
    }));
  };

  const validateAllFields = () => {
    // Mark everything touched so errors become visible
    setTouched(
      Object.keys(validators).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    );
    const newErrors = {};
    let valid = true;
    for (const [key, fn] of Object.entries(validators)) {
      const err = fn(formData[key]);
      if (err) { newErrors[key] = err; valid = false; }
    }
    setErrors(newErrors);
    return valid;
  };

  // ── Step 1 → Send OTP ─────────────────────────────────────────────────────
  // POST /api/auth/send-otp  { identifier, type: "register" }
  // Checks user does NOT exist → sends OTP → returns sessionId
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validateAllFields()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          identifier: formData.mobileNumber,
          type:       "register",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setSessionId(data.data?.sessionId ?? "");
      startResendTimer();   // begin 60-second cooldown
      setStep(2);
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  // Allowed only after the 60-second cooldown expires.
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setServerError("");
    setOtpError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          identifier: formData.mobileNumber,
          type:       "register",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");

      setSessionId(data.data?.sessionId ?? "");
      setOtp("");
      startResendTimer();
    } catch (err) {
      setServerError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2 → Verify OTP + Create Account ──────────────────────────────────
  // POST /api/auth/verify-otp  { identifier, otp, sessionId, type: "register",
  //                              name, email, role }
  // Verifies OTP → creates user → creates wallet → returns JWT + user
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    setOtpError("");

    if (!otp || !/^\d{6}$/.test(otp)) {
      setOtpError("Please enter the 6-digit code sent to your phone.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          identifier: formData.mobileNumber,
          otp,
          sessionId,
          type:       "register",
          name:       `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email:      formData.email,
          role:       "buyer",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      setSuccess("Account created successfully! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Go back to step 1 ─────────────────────────────────────────────────────
  const handleBack = () => {
    setStep(1);
    setOtp("");
    setOtpError("");
    setServerError("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-3 py-6">
      <div className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-indigo-500/30 red-accent-line">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-indigo-300 text-sm">
            {step === 1
              ? "Fill in your details to get started"
              : `OTP sent to +91 ${formData.mobileNumber}`}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} labels={["Your Details", "Verify OTP"]} />

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-200 text-xs font-semibold flex items-center gap-2">
              <span>✓</span> {successMessage}
            </p>
          </div>
        )}

        {/* Server / Network Error */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-xs flex items-center gap-2">
              <span>⚠️</span> {serverError}
            </p>
          </div>
        )}

        {/* ── STEP 1: Details ────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-3" noValidate>

            {/* First + Last Name on one row */}
            <div className="grid grid-cols-2 gap-2">
              <InputField
                label="First Name"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                error={errors.firstName}
                isTouched={touched.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              />
              <InputField
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                error={errors.lastName}
                isTouched={touched.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              error={errors.email}
              isTouched={touched.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              required={false}
            />

            {/* Mobile — with +91 prefix, uses InputField for consistency */}
            <InputField
              label="Mobile Number"
              name="mobileNumber"
              type="tel"
              placeholder="98765 43210"
              maxLength={10}
              prefix="+91"
              value={formData.mobileNumber}
              error={errors.mobileNumber}
              isTouched={touched.mobileNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />

            {/* Terms & Conditions */}
            <div>
              <div className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeToTerms}
                  onChange={handleTermsChange}
                  disabled={isLoading}
                  className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-indigo-500/50 bg-indigo-950/40 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
                />
                <label htmlFor="terms" className="text-indigo-200 cursor-pointer select-none">
                  I agree to the{" "}
                  <Link
                    to="#"
                    className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
                  >
                    Terms & Conditions
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && touched.agreeToTerms && (
                <p className="mt-1 text-xs text-red-300">⚠ {errors.agreeToTerms}</p>
              )}
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 px-4 py-2.5 rounded-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? "Sending OTP…" : "Get OTP →"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP Verification ───────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>

            {/* Summary card */}
            <div className="bg-indigo-950/50 border border-indigo-500/20 rounded-xl p-4 space-y-1 text-sm">
              <p className="text-indigo-300">
                <span className="text-indigo-500 font-medium">Name: </span>
                {formData.firstName} {formData.lastName}
              </p>
              <p className="text-indigo-300">
                <span className="text-indigo-500 font-medium">Email: </span>
                {formData.email}
              </p>
              <p className="text-indigo-300">
                <span className="text-indigo-500 font-medium">Mobile: </span>
                +91 {formData.mobileNumber}
              </p>
            </div>

            {/* OTP input */}
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Enter OTP <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(v);
                  if (otpError) setOtpError("");
                }}
                placeholder="• • • • • •"
                maxLength={6}
                disabled={isLoading}
                className={`w-full px-3 py-2.5 rounded-lg text-lg tracking-[0.4em] font-bold text-center bg-indigo-950/40 border transition-all duration-200 text-white focus:outline-none disabled:opacity-60 ${
                  otpError
                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    : otp.length === 6
                    ? "border-green-500/50 focus:ring-2 focus:ring-green-500/30"
                    : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
              />
              {otpError && (
                <p className="mt-1 text-xs text-red-300">⚠ {otpError}</p>
              )}

              {/* Sent-to hint + Resend OTP */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-indigo-400">
                  Sent to +91 {formData.mobileNumber}
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isLoading}
                  className={`text-xs font-semibold transition-all duration-200 ${
                    resendCountdown > 0 || isLoading
                      ? "text-indigo-600 cursor-not-allowed"
                      : "text-indigo-400 hover:text-indigo-200 hover:underline cursor-pointer"
                  }`}
                >
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : isLoading
                    ? "Sending…"
                    : "Resend OTP"}
                </button>
              </div>
            </div>

            {/* Verify button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? "Creating Account…" : "Create Account ✓"}
            </button>

            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg font-medium text-indigo-300 bg-transparent border border-indigo-500/30 hover:bg-indigo-800/30 transition-all duration-200 text-sm disabled:opacity-50"
            >
              ← Change Details
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center red-accent-top pt-6">
          <div className="grow border-t border-indigo-500/30" />
          <span className="px-4 text-indigo-300 text-sm">or</span>
          <div className="grow border-t border-indigo-500/30" />
        </div>

        {/* Sign-in link */}
        <p className="text-center text-indigo-200 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-red-400 hover:text-red-300 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
