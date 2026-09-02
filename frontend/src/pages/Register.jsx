import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { scrollToFirstError } from "../utils/scrollUtils";
import { useAuth } from "../context/AuthContext";


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
  <div className="form-group">
    <label className="form-label" htmlFor={`reg-${name}`}>
      {label}{" "}
      {required && <span className="required">*</span>}
    </label>
    <div className="relative flex items-center">
      {prefix && (
        <span
          className="z-10 pointer-events-none select-none"
          style={{
            position: "absolute",
            left: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--qs-muted)",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          {prefix}
        </span>
      )}
      <input
        id={`reg-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`form-input${error && isTouched ? " error" : ""}${!error && isTouched && value ? " success" : ""}`}
        style={prefix ? { paddingLeft: "3.25rem" } : {}}
      />
    </div>
    {error && isTouched && (
      <p className="form-error">⚠ {error}</p>
    )}
  </div>
);

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ current, labels }) => (
  <div className="auth-step-indicator">
    {labels.map((label, i) => {
      const step = i + 1;
      const done = current > step;
      const active = current === step;
      return (
        <React.Fragment key={step}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              className={`auth-step-dot${done ? " auth-step-dot--done" : active ? " auth-step-dot--active" : " auth-step-dot--pending"}`}
            >
              {done ? "✓" : step}
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                color: active ? "var(--qs-primary)" : done ? "var(--qs-secondary)" : "var(--qs-muted)",
                transition: "color 0.3s ease",
              }}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className={`auth-step-connector${current > step ? " auth-step-connector--done" : " auth-step-connector--pending"}`}
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
  const { authenticateSession } = useAuth();

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
    password:     "",
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
    password: (v) =>
      !v ? "Password is required" : v.length < 6 ? "Must be at least 6 characters" : null,
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

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const isValid = runFieldValidation(name, formData[name]);

    if (name === "email" && isValid && value && value.trim()) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        if (data?.data?.available === false) {
          setErrors((prev) => ({ ...prev, email: data.data.message }));
        }
      } catch (err) {
        // ignore network error
      }
    }
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
    if (!valid) {
      scrollToFirstError(newErrors);
    }
    return valid;
  };

  // ── Step 1 → Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validateAllFields()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          identifier: formData.mobileNumber,
          email:      formData.email,
          type:       "register",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setSessionId(data.data?.sessionId ?? "");
      startResendTimer();   // begin 60-second cooldown
      setStep(2);
    } catch (err) {
      const msg = err.message || "Something went wrong. Please try again.";
      setServerError(msg);
      if (msg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: msg }));
        setTouched((prev) => ({ ...prev, email: true }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setServerError("");
    setOtpError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          identifier: formData.mobileNumber,
          email:      formData.email,
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
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          identifier: formData.mobileNumber,
          otp,
          sessionId,
          type:       "register",
          name:       `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email:      formData.email,
          password:   formData.password,
          role:       "buyer",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      setSuccess("Account created successfully! Logging you in...");
      if (data?.data?.token && data?.data?.user) {
        authenticateSession(data.data.token, data.data.user);
        setTimeout(() => navigate("/"), 1800);
      } else {
        setTimeout(() => navigate("/login"), 1800);
      }
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
    <div className="auth-page" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
      <div className="auth-card animate-scale-in">

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-2xl mb-3 mx-auto">
            <span className="text-xl">👤</span>
          </div>
          <h1 className="auth-heading">Create Account</h1>
          <p className="auth-subheading mt-1">
            {step === 1
              ? "Fill in your details to get started"
              : `OTP sent to +91 ${formData.mobileNumber}`}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} labels={["Your Details", "Verify OTP"]} />

        {/* Success Banner */}
        {successMessage && (
          <div className="auth-alert-success mb-4">
            <span>✓</span> {successMessage}
          </div>
        )}

        {/* Server / Network Error */}
        {serverError && (
          <div className="auth-alert-error mb-4">
            <span>⚠️</span> {serverError}
          </div>
        )}

        {/* ── STEP 1: Details ────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-3" noValidate>

            {/* First + Last Name on one row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
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

            {/* Mobile — with +91 prefix */}
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

            {/* Password */}
            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              error={errors.password}
              isTouched={touched.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />

            {/* Terms & Conditions */}
            <div className="form-group">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="reg-terms"
                  checked={formData.agreeToTerms}
                  onChange={handleTermsChange}
                  disabled={isLoading}
                  style={{
                    width: 16,
                    height: 16,
                    marginTop: 2,
                    accentColor: "var(--qs-primary)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <label
                  htmlFor="reg-terms"
                  style={{ fontSize: "0.8125rem", color: "var(--qs-muted)", cursor: "pointer", lineHeight: 1.4 }}
                >
                  I agree to the{" "}
                  <Link
                    to="/terms-of-service"
                    style={{ color: "var(--qs-primary)", fontWeight: 600, backgroundImage: "none" }}
                  >
                    Terms & Conditions
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && touched.agreeToTerms && (
                <p className="form-error">⚠ {errors.agreeToTerms}</p>
              )}
            </div>

            {/* CTA */}
            <button
              type="submit"
              id="register-submit-btn"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem 1.25rem", fontSize: "0.9375rem" }}
            >
              {isLoading ? "Sending OTP…" : "Get OTP →"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP Verification ───────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>

            {/* Summary card */}
            <div className="auth-summary-box">
              <p style={{ marginBottom: "0.25rem" }}>
                <span>Name: </span>
                <strong style={{ color: "var(--qs-text)" }}>{formData.firstName} {formData.lastName}</strong>
              </p>
              {formData.email && (
                <p style={{ marginBottom: "0.25rem" }}>
                  <span>Email: </span>
                  <strong style={{ color: "var(--qs-text)" }}>{formData.email}</strong>
                </p>
              )}
              <p>
                <span>Mobile: </span>
                <strong style={{ color: "var(--qs-text)" }}>+91 {formData.mobileNumber}</strong>
              </p>
            </div>

            {/* OTP input */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-otp">
                Enter OTP <span className="required">*</span>
              </label>
              <input
                id="reg-otp"
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
                className={`form-input${otpError ? " error" : otp.length === 6 ? " success" : ""}`}
                style={{
                  fontSize: "1.25rem",
                  letterSpacing: "0.4em",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              />
              {otpError && (
                <p className="form-error">⚠ {otpError}</p>
              )}

              {/* Resend OTP */}
              <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--qs-muted)" }}>
                  Sent to +91 {formData.mobileNumber}
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isLoading}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: resendCountdown > 0 || isLoading ? "var(--qs-muted-light)" : "var(--qs-primary)",
                    background: "none",
                    border: "none",
                    cursor: resendCountdown > 0 || isLoading ? "not-allowed" : "pointer",
                    padding: 0,
                    transition: "color 0.2s ease",
                    textDecoration: resendCountdown === 0 && !isLoading ? "underline" : "none",
                  }}
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
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem 1.25rem", fontSize: "0.9375rem" }}
            >
              {isLoading ? "Creating Account…" : "Create Account ✓"}
            </button>

            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ width: "100%", fontSize: "0.875rem" }}
            >
              ← Change Details
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="auth-divider" style={{ marginTop: "1.5rem" }}>
          <span>or</span>
        </div>

        {/* Sign-in link */}
        <p className="text-center text-sm" style={{ color: "var(--qs-muted)" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--qs-primary)", fontWeight: 700, backgroundImage: "none", textDecoration: "none" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
