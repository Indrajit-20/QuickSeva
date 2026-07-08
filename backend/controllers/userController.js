const UserModel = require("../models/userModel");
const { successRes, errorRes, paginate } = require("../utils/helpers");

// Get logged-in user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return errorRes(res, "User not found", 404);
    return successRes(res, { user });
  } catch (err) {
    return errorRes(res, "Failed to fetch profile");
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, address, city, state, pincode, lat, lng, gender, dob } = req.body;
    const fields = {};

    if (name)    fields.name    = name;
    if (email) {
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail && existingEmail.id !== req.user.id) {
        return errorRes(res, "Email is already in use by another account", 409);
      }
      fields.email = email;
    }
    if (address) fields.address = address;
    if (city)    fields.city    = city;
    if (state)   fields.state   = state;
    if (pincode) fields.pincode = pincode;
    if (lat)     fields.lat     = lat;
    if (lng)     fields.lng     = lng;
    if (gender)  fields.gender  = gender;
    if (dob)     fields.dob     = dob;

    if (req.file) {
      fields.profile_pic = `/uploads/profiles/${req.file.filename}`;
    }

    if (!Object.keys(fields).length) {
      return errorRes(res, "No fields to update", 400);
    }

    await UserModel.update(req.user.id, fields);
    const updated = await UserModel.findById(req.user.id);

    return successRes(res, { user: updated }, "Profile updated successfully");
  } catch (err) {
    console.error("Update profile error:", err);
    return errorRes(res, "Failed to update profile");
  }
};

// Update FCM token (push notifications)
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    await UserModel.update(req.user.id, { fcm_token });
    return successRes(res, null, "FCM token updated");
  } catch (err) {
    return errorRes(res, "Failed to update FCM token");
  }
};

// ── Admin only ───────────────────────────────────────────────────────────────

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { limit: lim, offset } = paginate(page, limit);
    const { users, total } = await UserModel.getAll(lim, offset);
    return successRes(res, { users, total, page: parseInt(page), limit: lim });
  } catch (err) {
    return errorRes(res, "Failed to fetch users");
  }
};

// Toggle user active/inactive
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) return errorRes(res, "User not found", 404);

    await UserModel.update(id, { is_active: user.is_active ? 0 : 1 });
    return successRes(res, null, `User ${user.is_active ? "deactivated" : "activated"}`);
  } catch (err) {
    return errorRes(res, "Failed to update user status");
  }
};
