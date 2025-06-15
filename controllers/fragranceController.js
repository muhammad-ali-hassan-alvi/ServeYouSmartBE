import Fragrance from "../models/Fragrance.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";


// ✅ Get all fragrances (with filters & pagination)
export const getAllFragrances = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: "i" } }
      : {};

    const count = await Fragrance.countDocuments({ ...keyword });
    const fragrances = await Fragrance.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ fragrances, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get a single fragrance by ID
export const getFragranceById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid fragrance ID" });
  }

  try {
    const fragrance = await Fragrance.findById(req.params.id);
    if (fragrance) {
      res.json(fragrance);
    } else {
      res.status(404).json({ message: "Fragrance not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create a new fragrance (Admin only)
export const createFragrance = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    if (!req.files?.image) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload image to Cloudinary
    const image = req.files.image;
    const imageBase64 = `data:${image.mimetype};base64,${image.data.toString("base64")}`;
    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: "fragrances",
    });

    const fragrance = new Fragrance({
      name,
      description,
      price,
      category,
      stock,
      images: [uploadResponse.secure_url],
    });

    const createdFragrance = await fragrance.save();
    res.status(201).json(createdFragrance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update fragrance details (Admin only)
export const updateFragrance = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid fragrance ID" });
  }

  try {
    const { name, description, price, category, stock } = req.body;
    const fragrance = await Fragrance.findById(req.params.id);

    if (!fragrance) {
      return res.status(404).json({ message: "Fragrance not found" });
    }

    fragrance.name = name || fragrance.name;
    fragrance.description = description || fragrance.description;
    fragrance.price = price || fragrance.price;
    fragrance.category = category || fragrance.category;
    fragrance.stock = stock || fragrance.stock;

    if (req.files?.image) {
      // Delete old image from Cloudinary
      if (fragrance.images.length > 0) {
        const publicId = fragrance.images[0].split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`fragrances/${publicId}`);
      }

      // Upload new image
      const image = req.files.image;
      const imageBase64 = `data:${image.mimetype};base64,${image.data.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "fragrances",
      });
      fragrance.images[0] = uploadResponse.secure_url;
    }

    const updatedFragrance = await fragrance.save();
    res.json(updatedFragrance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a fragrance (Admin only)
export const deleteFragrance = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid fragrance ID" });
  }

  try {
    const fragrance = await Fragrance.findById(req.params.id);
    if (!fragrance) {
      return res.status(404).json({ message: "Fragrance not found" });
    }

    // Delete images from Cloudinary
    for (const imgUrl of fragrance.images) {
      const publicId = imgUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`fragrances/${publicId}`);
    }

    await fragrance.deleteOne();
    res.json({ message: "Fragrance removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Export all controllers in a single object
export default {
  getAllFragrances,
  getFragranceById,
  createFragrance,
  updateFragrance,
  deleteFragrance,
};
