import express from "express";
import carCareController from "../controllers/carCareController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", carCareController.getAllCarCareServices);
router.get("/:id", carCareController.getCarCareById);

// Admin routes (protect and admin middleware)
router.post("/", protect, admin, carCareController.createCarCare);
router.put("/:id", protect, admin, carCareController.updateCarCare);
router.delete("/:id", protect, admin, carCareController.deleteCarCare);

export default router;
