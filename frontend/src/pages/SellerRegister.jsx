import React, { useState, useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";
import apiClient from "../api/axiosConfig";

const SellerRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    mobileNumber: "",
    location: { lat: null, lng: null, address: "" },
    categoryIds: [],
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [apiError, setApiError] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // useEffect(() => {
  //   let isMounted = true;
  //   const fetchCategories = async () => {
  //     try {
  //       // const resp = await apiClient.get("/categories");
  //       const list = resp?.data?.data || resp?.data?.categories || resp?.data || [];
  //       if (isMounted) setCategories(Array.isArray(list) ? list : []);
  //     } catch (err) {
  //       if (isMounted) setCategories([]);
  //     } finally {
  //       if (isMounted) setCategoriesLoading(false);
  //     }
  //   };
  //   fetchCategories();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, []);

  const validateEmail = (email) => {
    if (!email) return "Email is required";
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

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.businessName || formData.businessName.length < 2)
      nextErrors.businessName = "Business name is required";

    if (!formData.ownerName || formData.ownerName.length < 2)
      nextErrors.ownerName = "Owner name is required";

    const emailError = validateEmail(formData.email);
    if (emailError) nextErrors.email = emailError;

    const mobileError = validateMobile(formData.mobileNumber);
    if (mobileError) nextErrors.mobileNumber = mobileError;

    if (
      !formData.location ||
      formData.location.lat === null ||
      formData.location.lng === null
    ) {
      nextErrors.location = "Please pin your service location on the map";
    }

    // Commented out since categories are optional and selection UI is commented out
    // if (!Array.isArray(formData.categoryIds) || formData.categoryIds.length === 0) {
    //   nextErrors.categoryIds = "Please select at least one category";
    // }

    setErrors(nextErrors);
    setTouched({
      businessName: true,
      ownerName: true,
      email: true,
      mobileNumber: true,
      location: true,
      // categoryIds: true,
    });

    const isValid = Object.keys(nextErrors).length === 0;
    if (!isValid) {
      console.warn("SellerRegister validation failed:", nextErrors);
    }
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const sanitizedValue =
      name === "mobileNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));

    if (touched[name]) {
      // lightweight revalidation on blur/after touched
      validateForm();
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData((prev) => {
      const exists = prev.categoryIds.includes(categoryId);
      const nextIds = exists
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      return { ...prev, categoryIds: nextIds };
    });
    setTouched((prev) => ({ ...prev, categoryIds: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // password is intentionally omitted for seller registration

    setSuccessMessage("");
    setApiError("");

    if (!validateForm()) return;

    // location already validated in validateForm (lat/lng not null)
    const { lat, lng, address } = formData.location || {};

    setIsLoading(true);
    try {
      const payload = {
        ownerName: formData.ownerName,
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.mobileNumber,
        address: address || "",
        lat,
        lng,
        // categoryIds: formData.categoryIds,
      };

      const resp = await apiClient.post("/sellers/register", payload);

      if (resp?.data?.success) {
        setSuccessMessage("Registration successful. Please login.");
        navigate("/login", { replace: true });
      } else {
        setApiError(resp?.data?.message || "Registration failed");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Registration failed";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4">
      <div className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-indigo-500/30 red-accent-line">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Become a Partner
          </h1>
          <p className="text-indigo-200 text-sm">Seller registration</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                errors.businessName && touched.businessName
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              }`}
            />
            {errors.businessName && touched.businessName && (
              <p className="mt-1 text-xs text-red-300">
                ⚠ {errors.businessName}
              </p>
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

          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Email {/*<span className="text-red-400">*</span> */}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="you@example.com"
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                errors.email && touched.email
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              }`}
            />
            {/* {errors.email && touched.email && (
              <p className="mt-1 text-xs text-red-300">⚠ {errors.email}</p>
            )}*/}
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
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                errors.mobileNumber && touched.mobileNumber
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              }`}
            />
            {errors.mobileNumber && touched.mobileNumber && (
              <p className="mt-1 text-xs text-red-300">
                ⚠ {errors.mobileNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Your Service Location <span className="text-red-400">*</span>
            </label>

            <LocationPicker
              onChange={({ lat, lng, address }) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { lat, lng, address },
                }))
              }
            />
            {errors.location && (
              <p className="mt-1 text-xs text-red-300">⚠ {errors.location}</p>
            )}
          </div>
          {/* 
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-2">
              Service Categories <span className="text-red-400">*</span>
            </label>

            {categoriesLoading ? (
              <p className="text-xs text-indigo-300">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="text-xs text-red-300">
                ⚠ Could not load categories. Please refresh and try again.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const checked = formData.categoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all duration-200 ${
                        checked
                          ? "bg-indigo-600/30 border-indigo-500 text-white"
                          : "bg-indigo-950/40 border-indigo-500/30 text-indigo-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-indigo-500/50 bg-indigo-950/40"
                      />
                      {cat.icon ? `${cat.icon} ` : ""}
                      {cat.name}
                    </label>
                  );
                })}
              </div>
            )}

            {errors.categoryIds && touched.categoryIds && (
              <p className="mt-1 text-xs text-red-300">
                ⚠ {errors.categoryIds}
              </p>
            )}
          </div> */}

          <div className="flex items-start text-sm">
            <input
              type="checkbox"
              id="sellerTerms"
              required
              className="w-4 h-4 text-indigo-600 rounded mt-0.5 focus:ring-indigo-500 border-indigo-500/50 bg-indigo-950/40"
            />
            <label htmlFor="sellerTerms" className="ml-2 text-indigo-200">
              I agree to be contacted about partner onboarding
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 px-4 py-2.5 rounded-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? "Submitting..." : "Register as Partner"}
          </button>

          <p className="text-center text-indigo-200 text-sm">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-bold text-red-400 hover:text-red-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SellerRegister;
