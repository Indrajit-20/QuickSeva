const express = require("express");
const router = express.Router();
const {
  submitReview, getSellerReviews, replyToReview,
} = require("../controllers/reviewController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");
const { uploadService } = require("../middleware/uploadMiddleware");

router.post("/",                   protect,            uploadService.array("images", 3), submitReview);
router.get("/seller/:sellerId",                        getSellerReviews);   // public
router.patch("/:id/reply",         protect, sellerOnly, replyToReview);

module.exports = router;
