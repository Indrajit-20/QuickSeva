import apiClient from "./axiosConfig";

/**
 * ========================================
 * API SERVICE - Authentication Endpoints
 * ========================================
 * Production-ready API wrapper around backend auth routes.
 */

const unwrapSuccessData = (responseData) => {
  // Backend successRes format: { success: true, message, data: {...} }
  // Return the same shape but ensure data is present.
  const { data, ...rest } = responseData || {};
  return { ...rest, data };
};

// ========================================
// REGISTER
// POST /api/auth/register
// Payload: { name, phone, email, password, role? }
// ========================================
export const register = async ({
  name,
  phone,
  email,
  password,
  role = "buyer",
}) => {
  const response = await apiClient.post("/auth/register", {
    name,
    phone,
    email,
    password,
    role,
  });

  return unwrapSuccessData(response.data);
};

// ========================================
// LOGIN
// POST /api/auth/login
// Payload: { phone, password, captchaAnswer, captchaToken }
// ========================================
export const login = async ({ phone, password, captchaAnswer, captchaToken }) => {
  const response = await apiClient.post("/auth/login", {
    phone,
    password,
    captchaAnswer,
    captchaToken,
  });
  return unwrapSuccessData(response.data);
};

// ========================================
// GET CAPTCHA
// GET /api/auth/captcha
// ========================================
export const getCaptcha = async () => {
  const response = await apiClient.get("/auth/captcha");
  return unwrapSuccessData(response.data);
};

// ========================================
// GET CURRENT USER
// GET /api/auth/me (JWT protected)
// ========================================
export const getMe = async () => {
  const response = await apiClient.get("/auth/me");
  return unwrapSuccessData(response.data);
};

// ========================================
// SEND OTP (backend generic endpoint)
// POST /api/auth/send-otp
// Payload: { identifier, type? }
// ========================================
export const sendOtp = async ({ identifier, type = "login" }) => {
  const response = await apiClient.post("/auth/send-otp", { identifier, type });
  return unwrapSuccessData(response.data);
};

// ========================================
// VERIFY OTP (backend generic endpoint)
// POST /api/auth/verify-otp
// Payload: { identifier, otp, type? }
// ========================================
export const verifyOtp = async ({
  identifier,
  otp,
  sessionId,
  type = "login",
}) => {
  const response = await apiClient.post("/auth/verify-otp", {
    identifier,
    otp,
    sessionId,
    type,
  });
  return unwrapSuccessData(response.data);
};

// ========================================
// Error normalization helper
// ========================================
export const getBackendErrorMessage = (error) => {
  const resp = error?.response;
  if (resp?.data?.message) return resp.data.message;
  if (typeof resp?.data === "string") return resp.data;
  if (error?.message) return error.message;
  return "Something went wrong";
};
