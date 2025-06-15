import express from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ GET /api/products → Get all products (with filters & pagination)
router.get("/", async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: "i" } }
      : {};

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET /api/products/:id → Get a single product by ID
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ POST /api/products → Add a new product (Admin only)
router.post("/", protect, admin, async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    if (!req.files?.image) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload image to Cloudinary
    const image = req.files.image;
    const imageBase64 = `data:${image.mimetype};base64,${image.data.toString('base64')}`;
    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: "products",
    });

    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      images: [uploadResponse.secure_url],
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ PUT /api/products/:id → Update product details (Admin only)
router.put("/:id", protect, admin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const { name, description, price, category, stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.stock = stock || product.stock;

    if (req.files?.image) {
      // Delete old image from Cloudinary
      if (product.images.length > 0) {
        const publicId = product.images[0].split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`products/${publicId}`);
      }

      // Upload new image
      const image = req.files.image;
      const imageBase64 = `data:${image.mimetype};base64,${image.data.toString('base64')}`;
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "products",
      });
      product.images[0] = uploadResponse.secure_url;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ DELETE /api/products/:id → Delete a product (Admin only)
router.delete("/:id", protect, admin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from Cloudinary
    for (const imgUrl of product.images) {
      const publicId = imgUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/${publicId}`);
    }

    await product.deleteOne();
    res.json({ message: "Product removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;