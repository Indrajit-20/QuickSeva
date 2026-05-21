import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Input field component — outside Register to prevent re-mount on every render
const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  maxLength,
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
}) => (
  <div>
    <label className="block text-xs font-semibold text-indigo-200 mb-2">
      {label} <span className="text-red-400">*</span>
    </label>
    <input
      type={type}
      name={name}
      value={formData[name]}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
        errors[name] && touched[name]
          ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
          : !errors[name] && touched[name] && formData[name]
            ? "border-green-500/50 focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
      }`}
    />
    {errors[name] && touched[name] && (
      <p className="mt-1 text-xs text-red-300">⚠ {errors[name]}</p>
    )}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("none");
  const [successMessage, setSuccessMessage] = useState("");

  // Email validation
  const validateEmail = (email) => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Enter valid email";
    return null;
  };

  // Mobile validation
  const validateMobile = (mobile) => {
    if (!mobile) return "Mobile number is required";
    const digitsOnly = mobile.replace(/\D/g, "");
    if (digitsOnly.length !== 10) return "Mobile number must be 10 digits";
    return null;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === "mobileNumber") {
      sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    // Update form data first
    const newFormData = {
      ...formData,
      [name]: sanitizedValue,
    };
    setFormData(newFormData);

    // Then validate using new form data
    if (touched[name]) {
      validateFieldWithData(name, sanitizedValue, newFormData);
    }
  };

  // Validate with new form data (for immediate feedback)
  const validateFieldWithData = (name, value, currentFormData) => {
    let error = null;

    switch (name) {
      case "firstName":
        if (!value) error = "First name is required";
        else if (value.length < 2) error = "Must be at least 2 characters";
        break;
      case "lastName":
        if (!value) error = "Last name is required";
        else if (value.length < 2) error = "Must be at least 2 characters";
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "mobileNumber":
        error = validateMobile(value);
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Handle blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateFieldWithData(name, formData[name], formData);
  };

  // Validate individual field
  const validateField = (name, value) => {
    let error = null;

    switch (name) {
      case "firstName":
        if (!value) error = "First name is required";
        else if (value.length < 2) error = "Must be at least 2 characters";
        break;
      case "lastName":
        if (!value) error = "Last name is required";
        else if (value.length < 2) error = "Must be at least 2 characters";
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "mobileNumber":
        error = validateMobile(value);
        break;
      case "password":
        const passwordVal = validatePassword(value);
        error = passwordVal.error;
        break;
      case "confirmPassword":
        if (!value) error = "Confirm password is required";
        else if (value !== formData.password) error = "Passwords do not match";
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = formData.firstName
        ? "Must be at least 2 characters"
        : "First name is required";
      isValid = false;
    }
    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = formData.lastName
        ? "Must be at least 2 characters"
        : "Last name is required";
      isValid = false;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
      isValid = false;
    }

    const mobileError = validateMobile(formData.mobileNumber);
    if (mobileError) {
      newErrors.mobileNumber = mobileError;
      isValid = false;
    }

    const passwordVal = validatePassword(formData.password);
    if (passwordVal.error) {
      newErrors.password = passwordVal.error;
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";

      isValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";

      isValid = false;
    }

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      mobileNumber: true,
      password: true,
      confirmPassword: true,
    });

    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // ========================================
      // Store user data for registration
      // ========================================
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        password: formData.password,
      };

      // Store in localStorage (in production, send to backend)
      localStorage.setItem("registeredUser", JSON.stringify(userData));

      setSuccessMessage("✓ Registration Successful! Redirecting to login...");

      setTimeout(() => {
        // Reset form before redirecting
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          mobileNumber: "",
          password: "",
          confirmPassword: "",
        });
        setErrors({});
        setTouched({});
        setPasswordStrength("none");
        setSuccessMessage("");

        // Redirect to login
        navigate("/login");
      }, 2000);

      console.log("User registered successfully:", userData);
    } catch (err) {
      setErrors({
        submit: err.message || "An error occurred during registration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-3 py-6">
      <div className="bg-indigo-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8 border border-indigo-500/30 red-accent-line">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-indigo-200 text-sm">Join us today</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-200 text-xs flex items-center font-semibold">
              <span className="mr-2">✓</span>
              {successMessage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-xs flex items-center">
              <span className="mr-2">⚠</span>
              {errors.submit}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Grid: First Name + Last Name on same row */}
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="First Name"
              name="firstName"
              placeholder="John"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              label="Last Name"
              name="lastName"
              placeholder="Doe"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
          </div>
          {/* Email */}
          <InputField
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            formData={formData}
            errors={errors}
            touched={touched}
            handleChange={handleChange}
            handleBlur={handleBlur}
          />
          {/* Mobile Number */}
          <div>
            <label className="form-label">
              Mobile Number <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">
                +91
              </span>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="98765 43210"
                maxLength="10"
                className={`form-input pl-12 ${
                  errors.mobileNumber && touched.mobileNumber
                    ? "border-danger focus:ring-danger"
                    : !errors.mobileNumber &&
                        touched.mobileNumber &&
                        formData.mobileNumber
                      ? "border-success focus:ring-success"
                      : "focus:border-primary"
                }`}
              />
            </div>
            {errors.mobileNumber && touched.mobileNumber && (
              <p className="mt-1 text-xs text-danger">
                ⚠ {errors.mobileNumber}
              </p>
            )}
          </div>
          {/* Password */}
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
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border transition-all duration-200 placeholder-indigo-400 text-white focus:outline-none ${
                errors.password && touched.password
                  ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  : "border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              }`}
            />
            {errors.password && touched.password && (
              <p className="mt-1 text-xs text-red-300">⚠ {errors.password}</p>
            )}
          </div>{" "}
          {/* Confirm Password */}
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            formData={formData}
            errors={errors}
            touched={touched}
            handleChange={handleChange}
            handleBlur={handleBlur}
          />
          {/* Terms & Conditions */}
          <div className="flex items-start text-sm">
            <input
              type="checkbox"
              id="terms"
              required
              className="w-4 h-4 text-indigo-600 rounded mt-0.5 focus:ring-indigo-500 border-indigo-500/50 bg-indigo-950/40"
            />
            <label htmlFor="terms" className="ml-2 text-indigo-200">
              I agree to the{" "}
              <Link
                to="#"
                className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
              >
                Terms & Conditions
              </Link>
            </label>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 px-4 py-2.5 rounded-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center red-accent-top pt-6">
          <div className="grow border-t border-indigo-500/30"></div>
          <span className="px-4 text-indigo-300 text-sm">or</span>
          <div className="grow border-t border-indigo-500/30"></div>
        </div>

        {/* Link to Login */}
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
