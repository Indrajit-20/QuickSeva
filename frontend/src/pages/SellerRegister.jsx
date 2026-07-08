import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";
import apiClient from "../api/axiosConfig";
import { scrollToFirstError } from "../utils/scrollUtils";
import { API_BASE_URL } from "../config/api";

const SellerRegister = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP Verification
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    mobileNumber: "",
    password: "",
    location: { lat: null, lng: null, address: "", pincode: "" },
    categoryIds: [],
    sellerType: "individual",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");

  // OTP State
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const resendTimerRef = useRef(null);

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

  const validateEmail = (email) => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Enter valid email";
    return null;
  };

  const validateMobile = (mobile) => {
    if (!mobile) return "Mobile number is required";
    const digitsOnly = mobile.replace(/\D/g, "");
    if (digitsOnly.length !== 10) return "Mobile number must be 10 digits";
    return null;
  };

  const validateForm = (shouldScroll = false, markAllTouched = false) => {
    const nextErrors = {};

    if (!formData.businessName || formData.businessName.trim().length < 2)
      nextErrors.businessName = "Business name is required";

    if (!formData.ownerName || formData.ownerName.trim().length < 2)
      nextErrors.ownerName = "Owner name is required";

    const emailError = validateEmail(formData.email);
    if (emailError) nextErrors.email = emailError;

    const mobileError = validateMobile(formData.mobileNumber);
    if (mobileError) nextErrors.mobileNumber = mobileError;

    if (!formData.password || formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (
      !formData.location ||
      formData.location.lat === null ||
      formData.location.lng === null ||
      !formData.location.address ||
      formData.location.address.trim().length < 3
    ) {
      nextErrors.location = "Please select a valid service location";
    }

    if (!formData.location?.pincode) {
      nextErrors.pincode = "Pincode is required";
    } else {
      const pinRegex = /^[1-9][0-9]{5}$/;
      if (!pinRegex.test(formData.location.pincode)) {
        nextErrors.pincode = "Enter a valid 6-digit pincode";
      }
    }

    setErrors(nextErrors);

    if (markAllTouched) {
      setTouched({
        businessName: true,
        ownerName: true,
        email: true,
        mobileNumber: true,
        password: true,
        location: true,
        pincode: true,
      });
    }

    const isValid = Object.keys(nextErrors).length === 0;
    if (!isValid && shouldScroll) {
      scrollToFirstError(nextErrors);
    }
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue =
      name === "mobileNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (touched[name]) {
      validateForm(false, false);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateForm(false, false);
  };

  // Step 1 Submission: Requests OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    if (!validateForm(true, true)) {
      if (!formData.location || formData.location.lat === null || formData.location.lng === null) {
        alert("📍 Location Required: Please select a location to proceed.");
      }
      return;
    }

    setIsLoading(true);
    try {
      // First, check duplicate mobile or email via API endpoint or let auth do it
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.mobileNumber,
          type: "seller-register",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setSessionId(data.data?.sessionId ?? "");
      startResendTimer();
      setStep(2);
    } catch (err) {
      setApiError(err.message || "Onboarding initialization failed.");
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setApiError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.mobileNumber,
          type: "seller-register",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");

      setSessionId(data.data?.sessionId ?? "");
      setOtp("");
      startResendTimer();
    } catch (err) {
      setApiError(err.message || "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Submission: Verifies OTP & completes database insertion
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!otp || !/^\d{6}$/.test(otp)) {
      setApiError("Please enter the 6-digit OTP code");
      return;
    }

    setIsLoading(true);
    try {
      const { lat, lng, address, pincode } = formData.location || {};
      const payload = {
        ownerName: formData.ownerName,
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.mobileNumber,
        password: formData.password,
        address: address || "",
        lat,
        lng,
        pincode,
        sellerType: formData.sellerType,
        otp,
        sessionId,
      };

      const resp = await apiClient.post("/sellers/register", payload);

      if (resp?.data?.success) {
        setSuccessMessage("Partner registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login", { replace: true }), 1800);
      } else {
        setApiError(resp?.data?.message || "Registration failed");
      }
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4 py-12">
      <div
        ref={formRef}
        style={{ scrollMarginTop: "90px" }}
        className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-8 border border-indigo-500/30 red-accent-line"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Become a Partner
          </h1>
          <p className="text-indigo-200 text-sm">
            {step === 1 ? "Seller registration details" : `Verify OTP sent to +91 ${formData.mobileNumber}`}
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-200 text-xs flex items-center font-semibold">
              <span className="mr-2">✓</span>
              {successMessage}
            </p>
          </div>
        )}

        {apiError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-xs flex items-center">
              <span className="mr-2">⚠</span>
              {apiError}
            </p>
          </div>
        )}

        {/* STEP 1: Details & Credentials Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="QuickSeva Partner Pvt. Ltd"
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                  errors.businessName && touched.businessName
                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
              />
              {errors.businessName && touched.businessName && (
                <p className="mt-1 text-xs text-red-300">⚠ {errors.businessName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Owner Name <span className="text-red-400">*</span>
              </label>
              <input
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                  errors.ownerName && touched.ownerName
                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
              />
              {errors.ownerName && touched.ownerName && (
                <p className="mt-1 text-xs text-red-300">⚠ {errors.ownerName}</p>
              )}
            </div>

            {/* Partner Type Options */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Partner Type <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {[
                  { value: "individual", label: "Individual / व्यक्तिगत", desc: "I work alone" },
                  { value: "agency", label: "Agency / ठेकेदार", desc: "I manage a team of workers" },
                  { value: "business", label: "Shop / Business / दुकान", desc: "I have a physical store" }
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                      formData.sellerType === opt.value
                        ? "border-[#0284c7] bg-[#0284c7]/15 shadow-[0_0_12px_rgba(2,132,199,0.25)]"
                        : "border-indigo-500/20 bg-indigo-950/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sellerType"
                      value={opt.value}
                      checked={formData.sellerType === opt.value}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sellerType: e.target.value }))}
                      disabled={isLoading}
                      className="mt-1 h-4 w-4 text-indigo-600 border-indigo-500/30 bg-indigo-950/40 focus:ring-indigo-500/50"
                    />
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-white leading-tight">{opt.label}</span>
                      <span className="block text-xs text-indigo-300/80 mt-1">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                  errors.email && touched.email
                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-xs text-red-300">⚠ {errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Mobile Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="98765 43210"
                maxLength={10}
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                  errors.mobileNumber && touched.mobileNumber
                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
              />
              {errors.mobileNumber && touched.mobileNumber && (
                <p className="mt-1 text-xs text-red-300">⚠ {errors.mobileNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                  errors.password && touched.password
                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                }`}
              />
              {errors.password && touched.password && (
                <p className="mt-1 text-xs text-red-300">⚠ {errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Your Service Location <span className="text-red-400">*</span>
              </label>
              <LocationPicker
                hideMap={true}
                onChange={({ lat, lng, address, pincode }) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: { lat, lng, address, pincode },
                  }))
                }
              />
              {errors.location && (
                <p className="mt-1 text-xs text-red-300">⚠ {errors.location}</p>
              )}
              {errors.pincode && (
                <p className="mt-1 text-xs text-red-300">⚠ {errors.pincode}</p>
              )}
            </div>

            <div className="flex items-start text-sm pt-2">
              <input
                type="checkbox"
                id="sellerTerms"
                required
                className="w-4 h-4 text-indigo-600 rounded mt-0.5 border-indigo-500/50 bg-indigo-950/40"
              />
              <label htmlFor="sellerTerms" className="ml-2 text-indigo-200 cursor-pointer select-none">
                I agree to be contacted about partner onboarding
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 px-4 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Validating details..." : "Get OTP →"}
            </button>
          </form>
        )}

        {/* STEP 2: SMS Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpAndRegister} className="space-y-5">
            <div className="text-center bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3">
              <p className="text-sm text-indigo-200">
                OTP sent to <span className="font-semibold text-white">{formData.mobileNumber}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setApiError("");
                }}
                className="mt-1 text-xs text-red-400 hover:text-red-300 font-medium underline focus:outline-none"
              >
                Change Phone / Details
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-2">
                Enter OTP <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border border-indigo-500/30 transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Verifying & Registering..." : "Verify & Complete Registration"}
            </button>

            <div className="border-t border-indigo-500/20 pt-4 text-center">
              <p className="text-xs text-indigo-300 mb-2">Didn't receive the OTP?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || resendCountdown > 0}
                className={`w-full px-4 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-md ${
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

        <div className="my-6 border-t border-indigo-500/30 pt-6 text-center">
          <p className="text-indigo-200 text-sm">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-bold text-red-400 hover:text-red-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerRegister;
