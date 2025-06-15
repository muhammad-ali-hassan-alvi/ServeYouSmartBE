// controllers/productController.js
import Product from "../models/Product.js";
import Gadget from "../models/Gadget.js";
import Fragrance from "../models/Fragrance.js";
import mongoose from "mongoose";

// ✅ GET unified products from all collections
export const getUnifiedProducts = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const category = req.query.category; // Optional category filter
    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: "i" } }
      : {};

    // Build base query
    const baseQuery = { ...keyword };
    if (category) {
      baseQuery.category = category;
    }

    // Query all collections in parallel
    const [products, gadgets, fragrances] = await Promise.all([
      Product.find(baseQuery)
        .limit(pageSize)
        .skip(pageSize * (page - 1)),
      Gadget.find(baseQuery)
        .limit(pageSize)
        .skip(pageSize * (page - 1)),
      Fragrance.find(baseQuery)
        .limit(pageSize)
        .skip(pageSize * (page - 1)),
    ]);

    // Combine results
    const unifiedProducts = [...products, ...gadgets, ...fragrances];

    // Get total counts for pagination
    const [productCount, gadgetCount, fragranceCount] = await Promise.all([
      Product.countDocuments(baseQuery),
      Gadget.countDocuments(baseQuery),
      Fragrance.countDocuments(baseQuery),
    ]);
    const count = productCount + gadgetCount + fragranceCount;

    res.json({
      products: unifiedProducts,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET unified product by ID
// ✅ GET unified product by ID based on category and name from params and query
export const getUnifiedProductById = async (req, res) => {
    const { id } = req.params; // Get product ID from URL params
    const { name, category } = req.query; // Get name and category from query parameters
  
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
  
    try {
      let foundProduct = null;
  
      // Conditional logic based on the category
      if (category === 'Test' || category === 'Interior' || category === 'Exterior') {
        // Search in the Product collection if category is Test, Interior, or Exterior
        foundProduct = await Product.findOne({ _id: id, name: name });
      } else if (category === 'Gadgets') {
        // Search in the Gadget collection if category is Gadgets
        foundProduct = await Gadget.findOne({ _id: id, name: name });
      } else if (category === 'Fragrance') {
        // Search in the Fragrance collection if category is Fragrance
        foundProduct = await Fragrance.findOne({ _id: id, name: name });
      } else {
        // If category is invalid, return an error
        return res.status(400).json({ message: "Invalid category" });
      }
  
      if (foundProduct) {
        res.json(foundProduct);
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  