import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LocationPicker from "../components/LocationPicker";
import apiClient from "../api/axiosConfig";
import { scrollToFirstError } from "../utils/scrollUtils";

export default function BecomeSeller() {
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    businessName: "",
    experienceYrs: "",
    bio: "",
    location: { lat: null, lng: null, address: "", pincode: "" },
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validateForm = (shouldScroll = false, markAllTouched = false) => {
    const nextErrors = {};

    if (!formData.businessName || formData.businessName.trim().length < 2) {
      nextErrors.businessName = "Business name is required";
    }

    if (formData.experienceYrs === "" || Number(formData.experienceYrs) < 0) {
      nextErrors.experienceYrs = "Please enter valid years of experience";
    }

    if (
      !formData.location ||
      formData.location.lat === null ||
      formData.location.lng === null ||
      !formData.location.address ||
      formData.location.address.trim().length < 3
    ) {
      nextErrors.location = "Please search/detect your service location and enter a valid address";
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
        experienceYrs: true,
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm(true, true)) {
      if (!formData.location || formData.location.lat === null || formData.location.lng === null) {
        alert("📍 Location Required: Please allow location access and click 'Use My Current Location', or select a location manually to proceed.");
      }
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create seller profile (category_id is omitted/null)
      const payload = {
        business_name: formData.businessName,
        category_id: null,
        bio: formData.bio,
        experience_yrs: Number(formData.experienceYrs),
      };

      const resp = await apiClient.post("/sellers", payload);

      if (resp?.data?.success) {
        // Update user location on users table as well if they pinned a location
        if (formData.location.lat && formData.location.lng) {
          await apiClient.put("/sellers/me/profile", {
            business_name: formData.businessName,
            category_id: null,
            bio: formData.bio,
            experience_yrs: Number(formData.experienceYrs),
            address: formData.location.address,
            lat: formData.location.lat,
            lng: formData.location.lng,
            pincode: formData.location.pincode
          });
        }

        // Refresh auth state to detect new seller role
        await refreshAuth();
        navigate("/seller/dashboard", { replace: true });
      } else {
        setApiError(resp?.data?.message || "Failed to upgrade profile");
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      setApiError(
        err?.response?.data?.message || err?.message || "Failed to upgrade profile"
      );
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-105 focus:border-blue-500 transition font-medium shadow-xs";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div
        ref={formRef}
        style={{ scrollMarginTop: "90px" }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 border border-slate-200 text-slate-850"
      >
        <div className="text-center mb-6 text-slate-850">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Register as a Seller
          </h1>
          <p className="text-slate-500 text-sm font-semibold">
            Upgrade your account to offer services on QuickSeva
          </p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-left">
            <p className="text-red-700 text-xs flex items-center font-semibold">
              <span className="mr-2">⚠</span>
              {apiError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Read-only User Details */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Owner Name</span>
              <span className="text-slate-800 text-sm font-bold mt-0.5 block">{user?.name}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Phone</span>
              <span className="text-slate-800 text-sm font-bold mt-0.5 block">{user?.phone}</span>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="e.g. Super Clean Services"
              className={`${inputClass} ${errors.businessName && touched.businessName ? "border-red-300 focus:ring-red-100" : ""}`}
            />
            {errors.businessName && touched.businessName && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.businessName}</p>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="experienceYrs"
              value={formData.experienceYrs}
              onChange={handleChange}
              placeholder="e.g. 3"
              min="0"
              className={`${inputClass} ${errors.experienceYrs && touched.experienceYrs ? "border-red-300 focus:ring-red-100" : ""}`}
            />
            {errors.experienceYrs && touched.experienceYrs && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.experienceYrs}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Bio / Business Description
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the services you offer..."
              className={inputClass}
            />
          </div>

          {/* Location Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Service Location <span className="text-red-500">*</span>
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
            {errors.location && touched.location && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.location}</p>
            )}
            {errors.pincode && touched.pincode && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {errors.pincode}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? "Upgrading Account..." : "Register as Seller"}
          </button>
        </form>
      </div>
    </div>
  );
}
