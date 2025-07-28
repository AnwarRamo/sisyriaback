// ✅ يجب أن تكون بهذا الشكل
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  numGuests: { type: Number, default: 1 },
  notes: String,
  adminNote: String,
  rejectionReason: String,
  amount: Number,
  registeredAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

// Index for efficient querying
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ tripId: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);
