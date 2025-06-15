import express from "express";
import { addReview, getReviews, deleteReview } from "../controllers/reviewController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:productId", protect, addReview);
router.get("/:productId", getReviews);
router.delete("/:reviewId", protect, deleteReview);

export default router;
