import express from "express";
import connectDB from "../config/db.js";
import cors from "cors";
import fileUpload from "express-fileupload";
import productRoutes from "../controllers/productController.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(fileUpload({ useTempFiles: true }));

// Connect to MongoDB
connectDB();

// Register routes
app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
