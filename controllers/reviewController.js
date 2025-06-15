import Order from "../models/Order.js";
import Review from "../models/Reviews.js";

// @desc Add a review & rating
// @route POST /api/reviews/:productId
// @access Private
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user._id;
    const { productId } = req.params;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Please enter a rating between 1 & 5" });
    }

    // Find an order with the given user and productId, and with a 'confirmed' status
    const order = await Order.findOne({
      user: userId,
      status: "confirmed",
      "items.product": productId, // Match the product ID inside the items array
    });

    if (!order) {
      return res.status(400).json({ message: "You can only review products from confirmed orders" });
    }

    // Create a new review
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    await review.save();

    res.status(200).json({ message: "Review added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all reviews of a product
// @route GET /api/reviews/:productId
// @access Public
export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId }).populate("user", "name");

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error..." });
  }
};

// @desc Delete a review
// @route DELETE /api/reviews/:reviewId
// @access Private (Admin or Review Owner)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.isAdmin; // Admin check

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Allow deletion only if the user owns the review or is an admin
    if (review.user.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await review.deleteOne();
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
