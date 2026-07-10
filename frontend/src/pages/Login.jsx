import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCaptcha } from "../api/authService";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithPassword, isLoading, authError } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const [localErrors, setLocalErrors] = useState({});
  const [localMessage, setLocalMessage] = useState("");
  const [fetchingCaptcha, setFetchingCaptcha] = useState(false);

  const digitsOnlyPhone = phone.replace(/\D/g, "");

  // Load Captcha on mount
  useEffect(() => {
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4">
      <div className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-8 border border-indigo-500/30 red-accent-line">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-indigo-200">Login to your account</p>
        </div>

        {/* Global Errors */}
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

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(val);
                setLocalErrors((prev) => ({ ...prev, phone: "" }));
              }}
              placeholder="98765 43210"
              maxLength={10}
              disabled={isLoading}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${localErrors.phone
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
            />
            {localErrors.phone && (
              <p className="mt-1 text-xs text-red-300">⚠ {localErrors.phone}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-indigo-200">
                Password <span className="text-red-400">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${localErrors.password
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
            />
            {localErrors.password && (
              <p className="mt-1 text-xs text-red-300">⚠ {localErrors.password}</p>
            )}
          </div>

          {/* Captcha Field */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Verify Captcha <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <div className="grow flex items-center justify-center bg-indigo-950/60 border border-indigo-500/30 rounded-lg text-white font-bold select-none py-2 px-3 text-center tracking-wider text-base">
                {fetchingCaptcha ? "Generating..." : captchaQuestion}
              </div>
              <button
                type="button"
                onClick={fetchNewCaptcha}
                disabled={fetchingCaptcha || isLoading}
                className="px-3 py-2 bg-indigo-900/60 border border-indigo-500/30 hover:bg-indigo-800 rounded-lg text-indigo-300 text-sm font-semibold active:scale-95 transition-transform"
                title="Refresh Captcha"
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
              className={`w-full mt-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${localErrors.captcha
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
            />
            {localErrors.captcha && (
              <p className="mt-1 text-xs text-red-300">⚠ {localErrors.captcha}</p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading || fetchingCaptcha}
            className="w-full mt-2 px-4 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

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
