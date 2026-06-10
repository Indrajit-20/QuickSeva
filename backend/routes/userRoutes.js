const express = require("express");
const router = express.Router();
const {
  getProfile, updateProfile, updateFcmToken,
  getAllUsers, toggleUserStatus,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { uploadProfile } = require("../middleware/uploadMiddleware");

router.get("/profile",            protect, getProfile);
router.put("/profile",            protect, uploadProfile.single("profile_pic"), updateProfile);
router.put("/fcm-token",          protect, updateFcmToken);

// Admin
router.get("/",                   protect, adminOnly, getAllUsers);
router.patch("/:id/toggle",       protect, adminOnly, toggleUserStatus);

module.exports = router;
