import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    shippingInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String },
      country: { type: String },
    },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, default: "Cash on Delivery" },
    status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered"], default: "Pending" },
  },
  { timestamps: true }
);


export default mongoose.model("Order", orderSchema);
