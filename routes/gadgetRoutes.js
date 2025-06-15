import express from "express";
import gadgetController from "../controllers/gadgetController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", gadgetController.getAllGadgets);
router.get("/:id", gadgetController.getGadgetById);
router.post("/", protect, admin, gadgetController.createGadget);
router.put("/:id", protect, admin, gadgetController.updateGadget);
router.delete("/:id", protect, admin, gadgetController.deleteGadget);

export default router;
