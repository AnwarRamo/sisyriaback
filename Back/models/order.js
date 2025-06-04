// models/Order.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', // Assuming your Product model is named 'Product'
    required: true 
  },
  name: { type: String, required: true }, // Denormalized product name for easier order display
  quantity: { type: Number, required: true, min: 1 },
  priceAtPurchase: { type: Number, required: true } // Price of one unit at the time of purchase
}, { _id: false }); // Don't create separate _id for subdocuments unless needed

const orderSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', // Assuming your User model is named 'User'
    required: true 
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed'],
    default: 'Pending', // Or 'Paid' if payment is integrated/assumed immediate
  },
  // Consider adding:
//   shippingAddress: { type: addressSchema }, // If you have an address schema
  paymentResult: { id: String, status: String, update_time: String, email_address: String },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

export default mongoose.model('Order', orderSchema);