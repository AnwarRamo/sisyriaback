import mongoose from 'mongoose';

const eventBookingSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  eventType: { type: String, enum: ['private', 'public'], required: true },
  eventDate: { type: Date, required: true },
  guestCount: { type: Number, min: 1, default: 1 },
  venue: { type: String, trim: true },
  budgetRange: { type: String, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'reviewed', 'approved', 'rejected'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

eventBookingSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('EventBooking', eventBookingSchema);



