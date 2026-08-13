const { v4: uuidv4 } = require("uuid");

// Generate a unique order number like QS-20240609-XXXX
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QS-${date}-${rand}`;
};

// Calculate distance between two lat/lng points in km (Haversine formula)
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Paginate helper
const paginate = (page = 1, limit = 10) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  return { limit: parseInt(limit), offset };
};

// Success response formatter
const successRes = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

// Error response formatter
const errorRes = (res, message = "Something went wrong", statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// OTP expiry time (10 mins from now)
const otpExpiresAt = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10);
  return d;
};

// Data masking helpers for security & privacy
const maskPhoneNumber = (phone) => {
  if (!phone) return "";
  const str = String(phone).trim();
  if (str.length <= 4) return "****";
  return str.slice(0, 3) + "*****" + str.slice(-3);
};

const maskEmail = (email) => {
  if (!email) return "";
  const parts = String(email).trim().split("@");
  if (parts.length !== 2) return "*****";
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? name[0] + "***" + name.slice(-1) : name[0] + "***";
  return `${maskedName}@${domain}`;
};

module.exports = {
  generateOrderNumber,
  getDistanceKm,
  paginate,
  successRes,
  errorRes,
  generateOTP,
  otpExpiresAt,
  maskPhoneNumber,
  maskEmail,
};

