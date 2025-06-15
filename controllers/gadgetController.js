import Gadget from "../models/Gadget.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// ✅ Get all gadgets (with filters & pagination)
export const getAllGadgets = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: "i" } }
      : {};

    const count = await Gadget.countDocuments({ ...keyword });
    const gadgets = await Gadget.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ gadgets, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get a single gadget by ID
export const getGadgetById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid gadget ID" });
  }

  try {
    const gadget = await Gadget.findById(req.params.id);
    if (gadget) {
      res.json(gadget);
    } else {
      res.status(404).json({ message: "Gadget not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create a new gadget (Admin only)
export const createGadget = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    if (!req.files?.image) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload image to Cloudinary
    const image = req.files.image;
    const imageBase64 = `data:${image.mimetype};base64,${image.data.toString("base64")}`;
    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: "gadgets",
    });

    const gadget = new Gadget({
      name,
      description,
      price,
      category,
      stock,
      images: [uploadResponse.secure_url],
    });

    const createdGadget = await gadget.save();
    res.status(201).json(createdGadget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update gadget details (Admin only)
export const updateGadget = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid gadget ID" });
  }

  try {
    const { name, description, price, category, stock } = req.body;
    const gadget = await Gadget.findById(req.params.id);

    if (!gadget) {
      return res.status(404).json({ message: "Gadget not found" });
    }

    gadget.name = name || gadget.name;
    gadget.description = description || gadget.description;
    gadget.price = price || gadget.price;
    gadget.category = category || gadget.category;
    gadget.stock = stock || gadget.stock;

    if (req.files?.image) {
      // Delete old image from Cloudinary
      if (gadget.images.length > 0) {
        const publicId = gadget.images[0].split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`gadgets/${publicId}`);
      }

      // Upload new image
      const image = req.files.image;
      const imageBase64 = `data:${image.mimetype};base64,${image.data.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "gadgets",
      });
      gadget.images[0] = uploadResponse.secure_url;
    }

    const updatedGadget = await gadget.save();
    res.json(updatedGadget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a gadget (Admin only)
export const deleteGadget = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid gadget ID" });
  }

  try {
    const gadget = await Gadget.findById(req.params.id);
    if (!gadget) {
      return res.status(404).json({ message: "Gadget not found" });
    }

    // Delete images from Cloudinary
    for (const imgUrl of gadget.images) {
      const publicId = imgUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`gadgets/${publicId}`);
    }

    await gadget.deleteOne();
    res.json({ message: "Gadget removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Export all controllers in a single object
export default {
  getAllGadgets,
  getGadgetById,
  createGadget,
  updateGadget,
  deleteGadget,
};
