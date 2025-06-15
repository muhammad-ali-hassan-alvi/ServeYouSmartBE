import ContactForm from "../models/ContactForm.js";
import mongoose from "mongoose";

// @desc Create new contact message
// @route POST /api/contact
// @access Public

export const createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMsg = await ContactForm.create({ name, email, subject, message });

    res.status(201).json({ message: "Contact Message send successfully" });
  } catch (error) {
    console.error("Contact Form Submission Error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc Get all contact messages (Admin)
// @route GET /api/contact
// @access Admin

export const getAllContactMessages = async (req, res) => {
  
  try {
    const messages = await ContactForm.find().sort({ createdAt: -1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error Fetching the contact messages", error);
    return res.status(500).json({ message: "Internal Server Error " });
  }
};

// @desc Get single contact message by ID
// @route GET /api/contact/:id
// @access Admin


export const getContactMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if ID exists
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "No ID provided in request parameters" 
      });
    }

    // 2. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid ID format - must be a 24 character hex string" 
      });
    }

    // 3. Try to find the message
    const message = await ContactForm.findById(id);

    // 4. Handle case where message doesn't exist
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "No message found with the provided ID" 
      });
    }

    // 5. Return successful response
    return res.status(200).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error("Error fetching contact message:", error);
    
    // Handle specific MongoDB errors
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: error.message
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching contact message",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc Delete contact message
// @route DELETE /api/contact/:id
// @access Admin

export const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = ContactForm.findById(id);

    if (!message) {
      return res.status(404).json({ message: "Message not Found" });
    }

    await ContactForm.findByIdAndDelete(id);

    res.status(201).json({ message: "Message Deleted Succesfully " });
  } catch (error) {
    console.error("Deleting contact message error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
