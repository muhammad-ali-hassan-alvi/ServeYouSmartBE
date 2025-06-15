import express from "express";
import { 
  createOrUpdateCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCart
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Full cart operations
router.route("/")
  .post(protect, createOrUpdateCart)    // Create or update entire cart
  .get(protect, getCart)               // Get user's cart
  .delete(protect, clearCart);         // Clear entire cart

// Individual item operations
router.route("/items")
  .post(protect, addToCart);           // Add item to cart

router.route("/items/:productId")
  .put(protect, updateCartItem)        // Update item quantity
  .delete(protect, removeFromCart);    // Remove item from cart

export default router;