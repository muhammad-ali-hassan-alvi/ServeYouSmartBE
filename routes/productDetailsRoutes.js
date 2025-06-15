// routes/productRoutes.js
import express from "express";
import {
  getUnifiedProducts,
  getUnifiedProductById,
} from "../controllers/productDetailController.js";

const router = express.Router();

// Unified product routes
router.get("/unified", getUnifiedProducts);
router.get("/productdetails/:id", getUnifiedProductById); // Fixed this route

export default router;
