import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";
import { scrollToFirstError } from "../utils/scrollUtils";
import { API_BASE_URL } from "../config/api";

const SellerRegister = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { authenticateSession } = useAuth();

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
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationNotFoundMsg, setLocationNotFoundMsg] = useState("");
  const suppressNextSearchRef = useRef(false);
  const locationSearchRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (suppressNextSearchRef.current) {
        suppressNextSearchRef.current = false;
        return;
      }
      if (locationQuery.trim().length >= 3) {
        searchLocation(locationQuery);
      } else {
        setLocationResults([]);
        setLocationNotFoundMsg("");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (locationSearchRef.current && !locationSearchRef.current.contains(e.target)) {
        setLocationResults([]);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const searchLocation = async (queryVal) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryVal)}&format=json&limit=5&countrycodes=in&addressdetails=1&email=support@quickseva.com`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "QuickSeva/1.0",
          },
        }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data && data.length > 0) {
        setLocationResults(data);
        setLocationNotFoundMsg("");
      } else {
        setLocationResults([]);
        setLocationNotFoundMsg("No results found");
      }
    } catch (err) {
      console.error("Location search error:", err);
      setLocationResults([]);
      setLocationNotFoundMsg("Search failed");
    }
  };

  const handleLocationResultClick = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    suppressNextSearchRef.current = true;
    setLocationQuery(result.display_name || "");
    setLocationResults([]);

    const pinVal = result.address?.postcode || "";

    setFormData((prev) => ({
      ...prev,
      location: {
        lat,
        lng,
        address: result.display_name || "",
        pincode: pinVal || prev.location?.pincode || "",
      }
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next.location;
      delete next.pincode;
      return next;
    });
  };

  const handlePincodeLookup = async (pincodeVal) => {
    if (!/^[1-9][0-9]{5}$/.test(pincodeVal)) return;
    setIsPincodeLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${pincodeVal}&format=json&limit=1&countrycodes=in&addressdetails=1&email=support@quickseva.com`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "QuickSeva/1.0",
          },
        }
      );
      if (!res.ok) throw new Error("Lookup failed");
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        const addr = result.address || {};
        const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || "";
        const cityOrTown = addr.city || addr.town || addr.village || addr.municipality || "";
        const district = addr.county || addr.state_district || "";
        const state = addr.state || "";

        const autoAddress = [neighbourhood, cityOrTown, district, state]
          .filter((val, index, self) => val && self.indexOf(val) === index)
          .join(", ");

        suppressNextSearchRef.current = true;
        setLocationQuery(autoAddress);

        setFormData((prev) => ({
          ...prev,
          location: {
            lat,
            lng,
            address: autoAddress,
            pincode: pincodeVal,
          }
        }));

        setErrors((prev) => {
          const next = { ...prev };
          delete next.location;
          delete next.pincode;
          return next;
        });
      } else {
        setErrors((prev) => ({ ...prev, pincode: "Invalid pincode or not found" }));
      }
    } catch (err) {
      console.error("Pincode lookup error:", err);
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...(prev.location || {}),
        pincode: val,
      }
    }));

    if (val.length === 6) {
      handlePincodeLookup(val);
    }
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...(prev.location || {}),
        address: val,
      }
    }));
  };
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
        setSuccessMessage("Partner registration successful! Logging you in...");
        const data = resp.data.data || resp.data;
        if (data?.token && data?.user) {
          authenticateSession(data.token, data.user);
          setTimeout(() => navigate("/", { replace: true }), 1800);
        } else {
          setTimeout(() => navigate("/login", { replace: true }), 1800);
        }
      } else {
        setApiError(resp?.data?.message || "Registration failed");
      }
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition shadow-xs font-medium";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div
        ref={formRef}
        style={{ scrollMarginTop: "90px" }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 border border-slate-200 text-slate-850"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Become a Partner
          </h1>
          <p className="text-slate-500 text-sm">
            {step === 1 ? "Seller registration details" : `Verify OTP sent to +91 ${formData.mobileNumber}`}
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-emerald-700 text-xs flex items-center font-semibold">
              <span className="mr-2">✓</span>
              {successMessage}
            </p>
          </div>
        )}

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-xs flex items-center font-semibold">
              <span className="mr-2">⚠</span>
              {apiError}
            </p>
          </div>
        )}

        {/* STEP 1: Details & Credentials Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-left">
            {/* Row 1: Business Name & Owner Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="QuickSeva Partner Pvt. Ltd"
                  disabled={isLoading}
                  className={`${inputClass} ${errors.businessName && touched.businessName ? "border-red-300 focus:ring-red-100" : ""}`}
                />
                {errors.businessName && touched.businessName && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.businessName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John Doe"
                  disabled={isLoading}
                  className={`${inputClass} ${errors.ownerName && touched.ownerName ? "border-red-300 focus:ring-red-100" : ""}`}
                />
                {errors.ownerName && touched.ownerName && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.ownerName}</p>
                )}
              </div>
            </div>

            {/* Row 2: Email & Mobile Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
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
                  className={`${inputClass} ${errors.email && touched.email ? "border-red-300 focus:ring-red-100" : ""}`}
                />
                {errors.email && touched.email && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Mobile Number <span className="text-red-500">*</span>
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
                  className={`${inputClass} ${errors.mobileNumber && touched.mobileNumber ? "border-red-300 focus:ring-red-100" : ""}`}
                />
                {errors.mobileNumber && touched.mobileNumber && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.mobileNumber}</p>
                )}
              </div>
            </div>

            {/* Row 3: Password & Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={`${inputClass} ${errors.password && touched.password ? "border-red-300 focus:ring-red-100" : ""}`}
                />
                {errors.password && touched.password && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.password}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  {isPincodeLoading && (
                    <span className="text-[10px] text-blue-600 flex items-center gap-1 font-bold">
                      <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-blue-600 border-t-transparent" />
                      Searching...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="pincode"
                  value={formData.location?.pincode || ""}
                  onChange={handlePincodeChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  disabled={isLoading}
                  className={`${inputClass} ${errors.pincode ? "border-red-300 focus:ring-red-100" : ""}`}
                />
                {errors.pincode && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.pincode}</p>
                )}
              </div>
            </div>

            {/* Row 4: Partner Type Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                Partner Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "individual", label: "Individual / व्यक्तिगत", desc: "I work alone" },
                  { value: "agency", label: "Agency / ठेकेदार", desc: "I manage workers" },
                  { value: "business", label: "Shop / Business / दुकान", desc: "I have a store" }
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-all duration-200 ${formData.sellerType === opt.value
                        ? "border-blue-500 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                  >
                    <input
                      type="radio"
                      name="sellerType"
                      value={opt.value}
                      checked={formData.sellerType === opt.value}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sellerType: e.target.value }))}
                      disabled={isLoading}
                      className="mt-0.5 h-3.5 w-3.5 text-blue-600 border-slate-305 focus:ring-blue-100"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 leading-tight">{opt.label}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 font-semibold">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 5: Search Address */}
            <div ref={locationSearchRef}>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                Search Service Location / पता खोजें <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Search your area, street, city or landmark..."
                  disabled={isLoading}
                  className={`${inputClass} ${errors.location ? "border-red-300 focus:ring-red-100" : ""}`}
                />

                {(locationResults.length > 0 || locationNotFoundMsg) && (
                  <div className="absolute left-0 right-0 top-full z-[1100] mt-2 max-h-56 overflow-y-auto rounded-lg shadow-2xl border border-slate-200 bg-white">
                    {locationResults.map((result) => (
                      <button
                        key={`${result.place_id}-${result.lat}-${result.lon}`}
                        type="button"
                        onClick={() => handleLocationResultClick(result)}
                        className="block w-full text-left text-[11px] text-slate-600 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer"
                      >
                        {result.display_name}
                      </button>
                    ))}
                    {locationNotFoundMsg && (
                      <div className="text-xs text-slate-400 px-3 py-2 font-semibold">
                        {locationNotFoundMsg}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.location && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.location}</p>
              )}
            </div>

            <div className="flex items-start text-sm pt-2">
              <input
                type="checkbox"
                id="sellerTerms"
                required
                className="w-4 h-4 text-blue-600 rounded mt-0.5 border-slate-300"
              />
              <label htmlFor="sellerTerms" className="ml-2 text-slate-600 cursor-pointer select-none font-semibold">
                I agree to be contacted about partner onboarding
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Validating details..." : "Get OTP →"}
            </button>
          </form>
        )}

        {/* STEP 2: SMS Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpAndRegister} className="space-y-5 text-left">
            <div className="text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-600 font-semibold">
                OTP sent to <span className="font-bold text-slate-800">{formData.mobileNumber}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setApiError("");
                }}
                className="mt-2 text-xs text-red-650 hover:text-red-700 font-bold underline focus:outline-none cursor-pointer"
              >
                Change Phone / Details
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                Enter OTP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                disabled={isLoading}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Verifying & Registering..." : "Verify & Complete Registration"}
            </button>

            <div className="border-t border-slate-200 pt-4 text-center">
              <p className="text-xs text-slate-500 mb-2 font-semibold">Didn't receive the OTP?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || resendCountdown > 0}
                className={`w-full px-4 py-2 rounded-lg font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition shadow-xs cursor-pointer ${isLoading || resendCountdown > 0
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
          <p className="text-slate-500 text-sm font-semibold">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
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
