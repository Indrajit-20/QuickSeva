const { pool } = require("../config/db");
const { successRes, errorRes } = require("../utils/helpers");

const isFiniteNumber = (n) => typeof n === "number" && Number.isFinite(n);

// Normalize/validate service radius.
// We store numeric km. Use 999 to represent "Entire City".
const normalizeServiceRadiusKm = (serviceRadius) => {
  if (
    serviceRadius === undefined ||
    serviceRadius === null ||
    serviceRadius === ""
  ) {
    return 5;
  }

  const n = Number(serviceRadius);
  if (!Number.isFinite(n) || n < 0) return null;

  // Allow 2/5/10/20/999
  const allowed = new Set([2, 5, 10, 20, 999]);
  if (!allowed.has(n)) {
    // If a custom value is sent, clamp/round to int.
    return n;
  }
  return n;
};

exports.saveSellerLocation = async (req, res) => {
  try {
    const sellerIdRow = await pool.query(
      `SELECT id FROM sellers WHERE user_id = ? LIMIT 1`,
      [req.user.id],
    );
    const sellerId = sellerIdRow?.[0]?.[0]?.id;
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const { latitude, longitude, address, serviceRadius } = req.body || {};

    const lat = typeof latitude === "string" ? Number(latitude) : latitude;
    const lng = typeof longitude === "string" ? Number(longitude) : longitude;

    if (!isFiniteNumber(lat) || lat < -90 || lat > 90) {
      return errorRes(res, "Invalid latitude", 400);
    }
    if (!isFiniteNumber(lng) || lng < -180 || lng > 180) {
      return errorRes(res, "Invalid longitude", 400);
    }

    const trimmedAddress = typeof address === "string" ? address.trim() : "";
    if (!trimmedAddress) {
      return errorRes(res, "Address is required", 400);
    }

    const radiusKm = normalizeServiceRadiusKm(serviceRadius);
    if (radiusKm === null) return errorRes(res, "Invalid serviceRadius", 400);

    // Set verified=true immediately after seller saves (per requirement)
    await pool.query(
      `UPDATE sellers
       SET latitude = ?,
           longitude = ?,
           location_address = ?,
           location_updated_at = CURRENT_TIMESTAMP,
           is_location_verified = 1,
           service_radius = ?
       WHERE id = ?`,
      [lat, lng, trimmedAddress, radiusKm, sellerId],
    );

    const [rows] = await pool.query(
      `SELECT latitude,
              longitude,
              location_address,
              location_updated_at,
              is_location_verified,
              service_radius
       FROM sellers WHERE id = ?`,
      [sellerId],
    );

    const location = rows?.[0] || null;
    return successRes(
      res,
      {
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        address: location?.location_address ?? "",
        serviceRadius: location?.service_radius ?? 5,
        locationUpdatedAt: location?.location_updated_at ?? null,
        isLocationVerified: location?.is_location_verified ? true : false,
      },
      "Location saved successfully",
    );
  } catch (err) {
    console.error("saveSellerLocation error:", err);
    return errorRes(res, "Failed to save seller location");
  }
};

exports.getSellerLocation = async (req, res) => {
  try {
    const sellerIdRow = await pool.query(
      `SELECT id FROM sellers WHERE user_id = ? LIMIT 1`,
      [req.user.id],
    );
    const sellerId = sellerIdRow?.[0]?.[0]?.id;
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const [rows] = await pool.query(
      `SELECT latitude,
              longitude,
              location_address,
              location_updated_at,
              is_location_verified,
              service_radius
       FROM sellers WHERE id = ?`,
      [sellerId],
    );

    const location = rows?.[0] || null;

    return successRes(res, {
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      address: location?.location_address ?? "",
      serviceRadius: location?.service_radius ?? 5,
      locationUpdatedAt: location?.location_updated_at ?? null,
      isLocationVerified: location?.is_location_verified ? true : false,
    });
  } catch (err) {
    console.error("getSellerLocation error:", err);
    return errorRes(res, "Failed to fetch seller location");
  }
};
