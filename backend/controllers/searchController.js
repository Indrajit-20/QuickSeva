const { pool } = require("../config/db");

// @desc    Get nearby sellers and their services based on lat, lng, and radius
// @route   GET /api/search/nearby
// @access  Public
exports.searchNearby = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius || 5);

    if (isNaN(lat) || isNaN(lng)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "lat and lng are required and must be numbers",
        });
    }

    // 1. Fetch nearby sellers
    const [sellers] = await pool.query(
      `SELECT
        s.id AS id,
        s.id AS sellerId,
        s.business_name AS businessName,
        s.business_name AS name,
        u.name AS ownerName,
        c.name AS categoryName,
        c.name AS service,
        COALESCE(s.latitude, u.lat) AS lat,
        COALESCE(s.longitude, u.lng) AS lng,
        s.avg_rating AS rating,
        s.total_reviews AS reviews,
        s.service_mode AS serviceMode,
        s.instant_service AS instantService,
        s.is_premium AS isPremium,
        s.plan AS plan,
        s.premium_expires_at AS premiumExpiresAt,
        s.location_address AS address,
        u.phone AS phone,
        w.balance AS walletBalance,
        s.is_available AS isAvailable,
        s.is_available AS is_available,
        u.profile_pic AS profilePhotoUrl,
        u.profile_pic AS profile_pic,
        (
          6371 *
          ACOS(
            COS(RADIANS(?))
            * COS(RADIANS(COALESCE(s.latitude, u.lat)))
            * COS(RADIANS(COALESCE(s.longitude, u.lng)) - RADIANS(?))
            + SIN(RADIANS(?))
            * SIN(RADIANS(COALESCE(s.latitude, u.lat)))
          )
        ) AS distance
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN wallets w ON s.user_id = w.user_id
      WHERE u.is_active = 1 AND (s.latitude IS NOT NULL OR u.lat IS NOT NULL)
      HAVING distance <= ?
      ORDER BY distance ASC`,
      [lat, lng, lat, radius],
    );

    if (sellers.length === 0) {
      return res.json([]);
    }

    // 2. Fetch services for these sellers
    const sellerIds = sellers.map((s) => s.id);
    const [services] = await pool.query(
      `SELECT id, seller_id, title AS name, description, price, duration, is_instant
       FROM services
       WHERE seller_id IN (?) AND is_active = 1`,
      [sellerIds],
    );

    // Group services by seller_id
    const servicesBySeller = {};
    services.forEach((svc) => {
      if (!servicesBySeller[svc.seller_id]) {
        servicesBySeller[svc.seller_id] = [];
      }
      servicesBySeller[svc.seller_id].push({
        id: svc.id,
        name: svc.name,
        description: svc.description,
        price: parseFloat(svc.price),
        duration: svc.duration,
        is_instant: Boolean(svc.is_instant),
      });
    });

    // 3. Attach services and complete mapping
    const result = sellers.map((s) => {
      const distanceKm = parseFloat(s.distance || 0);
      return {
        id: s.id,
        sellerId: s.sellerId,
        businessName: s.businessName,
        name: s.businessName,
        ownerName: s.ownerName,
        serviceName: s.categoryName, // serviceName in API format
        service: s.categoryName, // service in card format
        categoryName: s.categoryName,
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lng),
        rating: parseFloat(s.rating || 0),
        reviews: parseInt(s.reviews || 0),
        serviceMode: s.serviceMode || "offline",
        instantService: s.instantService ? true : false,
        isPremium: (s.isPremium && Number(s.walletBalance || 0) > 0 && s.premiumExpiresAt && new Date(s.premiumExpiresAt) > new Date()) ? true : false,
        plan: s.plan,
        premiumExpiresAt: s.premiumExpiresAt,
        address: s.address,
        phone: s.phone,
        distanceKm: distanceKm,
        distance: distanceKm,
        services: servicesBySeller[s.id] || [],
      };
    });

    return res.json(result);
  } catch (err) {
    console.error("searchNearby error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
