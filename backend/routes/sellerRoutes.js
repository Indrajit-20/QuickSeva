const express = require("express");
const router = express.Router();
const {
  createSellerProfile,
  getMySellerProfile,
  getSellerById,
  updateSellerProfile,
  toggleAvailability,
  uploadDocuments,
  getAllSellers,
  verifySeller,
  registerSeller,
  getMySellerCategories,
  getSellerAvailability,
  updateSellerAvailability,
  purchasePackage,
  getPackageHistory,
  uploadProfilePic,
  uploadWorkImages,
  deleteWorkImage,
} = require("../controllers/sellerController");

const {
  protect,
  sellerOnly,
  adminOnly,
} = require("../middleware/authMiddleware");
const {
  uploadProfile,
  uploadWork,
  uploadDocuments: uploadDocs,
} = require("../middleware/uploadMiddleware");

// Public
router.get("/:id", getSellerById);

// Public: Seller registration
router.post("/register", registerSeller);

// Authenticated
router.post("/", protect, createSellerProfile);

router.get("/me/categories", protect, sellerOnly, getMySellerCategories);
router.get("/me/availability", protect, sellerOnly, getSellerAvailability);
router.patch("/me/availability", protect, sellerOnly, updateSellerAvailability);
router.get("/me/profile", protect, getMySellerProfile);
router.put("/me/profile", protect, sellerOnly, updateSellerProfile);
router.post("/me/profile-pic", protect, sellerOnly, uploadProfile.single("profile_pic"), uploadProfilePic);
router.post("/me/work-images", protect, sellerOnly, uploadWork.array("work_images", 10), uploadWorkImages);
router.delete("/me/work-images/:imageId", protect, sellerOnly, deleteWorkImage);
router.post("/packages/purchase", protect, sellerOnly, purchasePackage);
router.get("/packages/history", protect, sellerOnly, getPackageHistory);
router.patch(
  "/me/toggle-availability",
  protect,
  sellerOnly,
  toggleAvailability,
);
router.post(
  "/me/documents",
  protect,
  sellerOnly,
  uploadDocs.array("documents", 5),
  uploadDocuments,
);

// Admin
router.get("/", protect, adminOnly, getAllSellers);
router.patch("/:id/verify", protect, adminOnly, verifySeller);

// QuickSeva - Map Performance Feature
router.get("/in-view", async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({ error: "Missing bounding box query parameters" });
    }

    const { pool } = require("../config/db");

    // Query sellers within the bounding box with all details required by client layout
    const [rows] = await pool.query(
      `SELECT * FROM (
        SELECT s.id,
               s.id AS sellerId,
               s.business_name AS businessName,
               s.business_name AS name,
               u.name AS ownerName,
               c.name AS categoryName,
               c.name AS service,
               COALESCE(s.latitude, u.lat) AS lat,
               COALESCE(s.longitude, u.lng) AS lng,
               s.avg_rating AS rating,
               s.avg_rating,
               s.total_reviews AS reviews,
               s.service_mode AS serviceMode,
               s.instant_service AS instantService,
               s.is_premium AS isPremium,
               s.plan AS plan,
               s.premium_expires_at AS premiumExpiresAt,
               s.location_address AS address,
               u.phone AS phone,
               s.is_available,
               s.is_available AS isAvailable,
               u.profile_pic,
               u.profile_pic AS profilePhotoUrl
        FROM sellers s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN categories c ON s.category_id = c.id
        GROUP BY s.id
      ) AS sellers_in_view
      WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
      LIMIT 200`,
      [minLat, maxLat, minLng, maxLng]
    );

    const parsedRows = rows.map((r) => ({
      ...r,
      lat: r.lat !== null && r.lat !== undefined ? parseFloat(r.lat) : null,
      lng: r.lng !== null && r.lng !== undefined ? parseFloat(r.lng) : null,
      rating: r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : 0,
      avg_rating: r.avg_rating !== null && r.avg_rating !== undefined ? parseFloat(r.avg_rating) : 0,
      reviews: r.reviews !== null && r.reviews !== undefined ? parseInt(r.reviews) : 0,
      isPremium: (r.isPremium && r.premiumExpiresAt && new Date(r.premiumExpiresAt) > new Date()) ? true : false,
      instantService: r.instantService ? true : false,
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error("Error fetching sellers in view:", err);
    res.status(500).json({ error: "Failed to fetch sellers in view" });
  }
});

// Move /in-view route before /:id in the router stack so it is matched first
const inViewLayer = router.stack.pop();
const idLayerIndex = router.stack.findIndex(
  (layer) => layer.route && layer.route.path === "/:id"
);
if (idLayerIndex !== -1) {
  router.stack.splice(idLayerIndex, 0, inViewLayer);
} else {
  router.stack.push(inViewLayer);
}

module.exports = router;
