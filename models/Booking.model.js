// ✅ Unified Booking & TripRequest Model
import mongoose from 'mongoose';

const dayPlanSchema = new mongoose.Schema({
  date: Date,
  meals: {
    breakfast: { items: [String], images: [String], videos: [String], time: String },
    lunch: { items: [String], images: [String], videos: [String], time: String },
    dinner: { items: [String], images: [String], videos: [String], time: String }
  },
  hotel: {
    name: String,
    pdfUrl: String,
    images: [String],
    videos: [String],
    checkin: Date,
    checkout: Date
  },
  activities: [{
    title: String,
    description: String,
    time: String,
    images: [String],
    videos: [String]
  }]
});

const bookingSchema = new mongoose.Schema({
  // Core booking fields
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" }, // Optional for custom trip requests
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["trip_registration", "custom_trip_request"],
    default: "trip_registration"
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  
  // Trip registration fields
  numGuests: { type: Number, default: 1 },
  amount: Number,
  
  // Custom trip request fields
  title: String,
  days: [dayPlanSchema],
  
  // Common fields
  notes: String,
  adminNote: String,
  rejectionReason: String,
  registeredAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, {
  timestamps: true
});

// Indexes for efficient querying
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ tripId: 1, status: 1 });
bookingSchema.index({ type: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);
