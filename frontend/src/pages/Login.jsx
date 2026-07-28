import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCaptcha } from "../api/authService";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithPassword, isLoading, authError, clearAuthError } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const [localErrors, setLocalErrors] = useState({});
  const [localMessage, setLocalMessage] = useState("");
  const [fetchingCaptcha, setFetchingCaptcha] = useState(false);

  const digitsOnlyPhone = phone.replace(/\D/g, "");

  // Clear auth errors and load Captcha on mount
  useEffect(() => {
    if (clearAuthError) clearAuthError();
    fetchNewCaptcha();
  }, []);

  const fetchNewCaptcha = async () => {
    setFetchingCaptcha(true);
    setCaptchaAnswer("");
    try {
      const result = await getCaptcha();
      if (result?.data) {
        setCaptchaQuestion(result.data.question);
        setCaptchaToken(result.data.captchaToken);
      }
    } catch (err) {
      console.error("Failed to load captcha:", err);
      setLocalErrors((prev) => ({ ...prev, captcha: "Failed to load captcha question." }));
    } finally {
      setFetchingCaptcha(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!digitsOnlyPhone) {
      errors.phone = "Phone number is required";
    } else if (digitsOnlyPhone.length !== 10) {
      errors.phone = "Phone number must be 10 digits";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!captchaAnswer) {
      errors.captcha = "Captcha answer is required";
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalErrors({});
    setLocalMessage("");

    if (!validateForm()) return;

    try {
      const result = await loginWithPassword({
        phone: digitsOnlyPhone,
        password,
        captchaAnswer,
        captchaToken,
      });

      const role = result?.user?.role;
      if (role === "seller") {
        return navigate("/seller/dashboard", { replace: true });
      }
      if (role === "admin") {
        return navigate("/admin/dashboard", { replace: true });
      }
      return navigate("/", { replace: true });
    } catch (err) {
      // Refresh captcha on login failure so they must enter a new one
      fetchNewCaptcha();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in">

        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo accent */}
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl mb-4 mx-auto">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="auth-heading">Welcome Back</h1>
          <p className="auth-subheading mt-1">Sign in to your QuickSeva account</p>
        </div>

        {/* Global Errors */}
        {(authError || localErrors.submit) && (
          <div className="auth-alert-error mb-4">
            <span>⚠️</span>
            <span>{authError || localErrors.submit}</span>
          </div>
        )}

        {localMessage && (
          <div className="auth-alert-success mb-4">
            {localMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          {/* Phone Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-phone">
              Phone Number <span className="required">*</span>
            </label>
            <div className="relative flex items-center">
              <span
                className="z-10 pointer-events-none select-none"
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                +91
              </span>
              <input
                id="login-phone"
                type="tel"
                value={phone}
                autoComplete="off"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(val);
                  setLocalErrors((prev) => ({ ...prev, phone: "" }));
                }}
                placeholder="98765 43210"
                maxLength={10}
                disabled={isLoading}
                className={`form-input${localErrors.phone ? " error" : ""}`}
                style={{ paddingLeft: "3.25rem" }}
              />
            </div>
            {localErrors.phone && (
              <p className="form-error">⚠ {localErrors.phone}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="flex justify-between items-center">
              <label className="form-label" htmlFor="login-password">
                Password <span className="required">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold"
                style={{ backgroundImage: "none" }}
              >
                Forgot Password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="••••••••"
              disabled={isLoading}
              className={`form-input${localErrors.password ? " error" : ""}`}
            />
            {localErrors.password && (
              <p className="form-error">⚠ {localErrors.password}</p>
            )}
          </div>

          {/* Captcha Field */}
          <div className="form-group">
            <label className="form-label">
              Verify Captcha <span className="required">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <div className="auth-captcha-box">
                {fetchingCaptcha ? "Generating..." : captchaQuestion}
              </div>
              <button
                type="button"
                onClick={fetchNewCaptcha}
                disabled={fetchingCaptcha || isLoading}
                title="Refresh Captcha"
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "var(--qs-surface-2)",
                  border: "1.5px solid var(--qs-border)",
                  borderRadius: "var(--qs-radius-sm)",
                  color: "var(--qs-muted)",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "var(--qs-transition)",
                  flexShrink: 0,
                }}
              >
                🔄
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={captchaAnswer}
              onChange={(e) => {
                setCaptchaAnswer(e.target.value.replace(/\D/g, ""));
                setLocalErrors((prev) => ({ ...prev, captcha: "" }));
              }}
              placeholder="Enter answer"
              disabled={isLoading}
              className={`form-input${localErrors.captcha ? " error" : ""}`}
            />
            {localErrors.captcha && (
              <p className="form-error">⚠ {localErrors.captcha}</p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading || fetchingCaptcha}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem 1.25rem", fontSize: "0.9375rem" }}
          >
            {isLoading ? (
              <>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Logging in...
              </>
            ) : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="text-center text-sm" style={{ color: "var(--qs-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            style={{ color: "var(--qs-primary)", fontWeight: 700, backgroundImage: "none", textDecoration: "none" }}
          >
            Create one now
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
