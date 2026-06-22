import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LocationPicker from "../components/LocationPicker";
import apiClient from "../api/axiosConfig";

export default function BecomeSeller() {
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();

  const [formData, setFormData] = useState({
    businessName: "",
    experienceYrs: "",
    bio: "",
    location: { lat: null, lng: null, address: "" },
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validateForm = () => {
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
      formData.location.lng === null
    ) {
      nextErrors.location = "Please select your service location on the map";
    }

    setErrors(nextErrors);
    setTouched({
      businessName: true,
      experienceYrs: true,
      location: true,
    });

    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) return;

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
            lng: formData.location.lng
          });
        }

        // Refresh auth state to detect new seller role
        await refreshAuth();
        navigate("/seller/dashboard", { replace: true });
      } else {
        setApiError(resp?.data?.message || "Failed to upgrade profile");
      }
    } catch (err) {
      setApiError(
        err?.response?.data?.message || err?.message || "Failed to upgrade profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4 py-12">
      <div className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-indigo-500/30 red-accent-line">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Register as a Seller
          </h1>
          <p className="text-indigo-200 text-sm">
            Upgrade your account to offer services on QuickSeva
          </p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-xs flex items-center">
              <span className="mr-2">⚠</span>
              {apiError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Read-only User Details */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/10">
            <div>
              <span className="block text-[10px] text-indigo-300 uppercase font-semibold">Owner Name</span>
              <span className="text-white text-sm font-medium">{user?.name}</span>
            </div>
            <div>
              <span className="block text-[10px] text-indigo-300 uppercase font-semibold">Phone</span>
              <span className="text-white text-sm font-medium">{user?.phone}</span>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Business Name <span className="text-red-400">*</span>
            </label>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="e.g. Super Clean Services"
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                errors.businessName && touched.businessName
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              }`}
            />
            {errors.businessName && touched.businessName && (
              <p className="mt-1 text-xs text-red-300">⚠ {errors.businessName}</p>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Years of Experience <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="experienceYrs"
              value={formData.experienceYrs}
              onChange={handleChange}
              placeholder="e.g. 3"
              min="0"
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                errors.experienceYrs && touched.experienceYrs
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              }`}
            />
            {errors.experienceYrs && touched.experienceYrs && (
              <p className="mt-1 text-xs text-red-300">⚠ {errors.experienceYrs}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Bio / Business Description
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the services you offer..."
              className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border border-indigo-500/30 placeholder-indigo-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          {/* Location Picker */}
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Service Location <span className="text-red-400">*</span>
            </label>
            <LocationPicker
              onChange={({ lat, lng, address }) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { lat, lng, address },
                }))
              }
            />
            {errors.location && touched.location && (
              <p className="mt-1 text-xs text-red-300">⚠ {errors.location}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 px-4 py-2.5 rounded-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? "Upgrading Account..." : "Register as Seller"}
          </button>
        </form>
      </div>
    </div>
  );
}
