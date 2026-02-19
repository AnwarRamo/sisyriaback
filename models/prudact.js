// models/product.model.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    enum: ["souvenir", "travel", "accessory", "fashion", "home", "electronics", "music", "other"],
    default: "other",
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ soldCount: -1 }); // Sort by best selling
productSchema.index({ title: 'text' }); // Search by title

export default mongoose.model("Product", productSchema);
