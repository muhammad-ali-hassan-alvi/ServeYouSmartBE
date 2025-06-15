import express from 'express';
import {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  deleteContactMessage,
} from '../controllers/contactUsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';


const router = express.Router()


router.post("/", createContactMessage)

router.get("/", protect, admin, getAllContactMessages)

router.route("/:id")
  .get(protect, admin, getContactMessageById)
  .delete(protect, admin, deleteContactMessage)

export default router