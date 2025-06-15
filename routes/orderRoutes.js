import express from "express";
import {
  confirmOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders, 
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
// Optionally import isAdmin if you want to restrict to admin only
// import { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/confirm", protect, confirmOrder);
router.get("/", protect, getUserOrders);
router.get("/all", protect, getAllOrders);
router.get("/:id", protect, getOrderById);
router.delete("/:orderId/cancel", protect, cancelOrder);
router.put("/:orderId/status", protect, updateOrderStatus )

export default router;
