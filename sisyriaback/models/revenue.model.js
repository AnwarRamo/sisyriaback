import mongoose from 'mongoose';

// Define the Revenue Schema
const revenueSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now, // automatically set the date to the current time if not provided
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip', // Assuming you have a 'Trip' model and you want to associate revenue with a trip
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming you have a 'User' model for the person who generated the revenue
    },
  },
  { timestamps: true }
);

// Create and export the Revenue model
const Revenue = mongoose.model('Revenue', revenueSchema);
export default Revenue;
