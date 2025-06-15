import CarCare from "../models/CarCare.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// ✅ Get all car care services (with filters & pagination)
export const getAllCarCareServices = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? { serviceName: { $regex: req.query.keyword, $options: "i" } }
      : {};

    const count = await CarCare.countDocuments({ ...keyword });
    const carCareServices = await CarCare.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ carCareServices, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get a single car care service by ID
export const getCarCareById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid car care service ID" });
  }

  try {
    const carCare = await CarCare.findById(req.params.id);
    if (carCare) {
      res.json(carCare);
    } else {
      res.status(404).json({ message: "Car care service not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create a new car care service (Admin only)
export const createCarCare = async (req, res) => {
  try {
    const { serviceName, description, price, category, stock } = req.body;

    if (!req.files?.image) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload image to Cloudinary
    const image = req.files.image;
    const imageBase64 = `data:${image.mimetype};base64,${image.data.toString("base64")}`;
    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: "carCareServices",
    });

    const carCare = new CarCare({
      serviceName,
      description,
      price,
      category,
      stock,
      images: [uploadResponse.secure_url],
    });

    const createdCarCare = await carCare.save();
    res.status(201).json(createdCarCare);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update car care service details (Admin only)
export const updateCarCare = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid car care service ID" });
  }

  try {
    const { serviceName, description, price, category, stock } = req.body;
    const carCare = await CarCare.findById(req.params.id);

    if (!carCare) {
      return res.status(404).json({ message: "Car care service not found" });
    }

    carCare.serviceName = serviceName || carCare.serviceName;
    carCare.description = description || carCare.description;
    carCare.price = price || carCare.price;
    carCare.category = category || carCare.category;
    carCare.stock = stock || carCare.stock;

    if (req.files?.image) {
      // Delete old image from Cloudinary
      if (carCare.images.length > 0) {
        const publicId = carCare.images[0].split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`carCareServices/${publicId}`);
      }

      // Upload new image
      const image = req.files.image;
      const imageBase64 = `data:${image.mimetype};base64,${image.data.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "carCareServices",
      });
      carCare.images[0] = uploadResponse.secure_url;
    }

    const updatedCarCare = await carCare.save();
    res.json(updatedCarCare);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a car care service (Admin only)
export const deleteCarCare = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid car care service ID" });
  }

  try {
    const carCare = await CarCare.findById(req.params.id);
    if (!carCare) {
      return res.status(404).json({ message: "Car care service not found" });
    }

    // Delete images from Cloudinary
    for (const imgUrl of carCare.images) {
      const publicId = imgUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`carCareServices/${publicId}`);
    }

    await carCare.deleteOne();
    res.json({ message: "Car care service removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Export all controllers in a single object
export default {
  getAllCarCareServices,
  getCarCareById,
  createCarCare,
  updateCarCare,
  deleteCarCare,
};
