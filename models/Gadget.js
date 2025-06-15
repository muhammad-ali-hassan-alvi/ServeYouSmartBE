import mongoose from "mongoose";

const gadgetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String, required: true }],
  },
  { timestamps: true }
);

export default mongoose.model("Gadget", gadgetSchema);
