import express from "express";
import fragranceController from "../controllers/fragranceController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", fragranceController.getAllFragrances);
router.get("/:id", fragranceController.getFragranceById);
router.post("/", protect, admin, fragranceController.createFragrance);
router.put("/:id", protect, admin, fragranceController.updateFragrance);
router.delete("/:id", protect, admin, fragranceController.deleteFragrance);

export default router;
