import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import cors from "cors";
import fileUpload from "express-fileupload";
import productRoutes from "./controllers/productController.js"; 
import cloudinary from "./config/cloudinaryConfig.js";
import cartRoutes from "./routes/cartRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"
import gadgetRoutes from "./routes/gadgetRoutes.js"
import fragranceRoute from "./routes/fragranceRoutes.js"
import carcareRoute from "./routes/carCareRoutes.js"
import productDetailsRoutes from "./routes/productDetailsRoutes.js"; 
import contactRoutes from "./routes/contactRoutes.js"; 

// Load environment variables FIRST
dotenv.config();

const app = express();

// Verify Cloudinary configuration on startup
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "***loaded***" : "missing",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "***loaded***" : "missing"
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data
app.use(cors({
  origin: process.env.FRONTEND_URL || "*", // Adjust as needed
  credentials: true
}));


app.use(fileUpload({
  useTempFiles: false, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 10MB
  abortOnLimit: true 
}));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/gadgets", gadgetRoutes)
app.use("/api/fragnance", fragranceRoute)
app.use("/api/carcare", carcareRoute)
app.get('/productdetails/:id', productDetailsRoutes)
app.use("/api/contact", contactRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    cloudinary: cloudinary.config().api_key ? "Configured" : "Not Configured"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Cloudinary configured: ${!!cloudinary.config().api_key}`);
});