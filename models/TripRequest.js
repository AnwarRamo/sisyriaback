// models/TripRequest.js
import mongoose from 'mongoose';

const DaySchema = new mongoose.Schema({
  date: Date,
  meals: {
    breakfast: {
      items: [String],
      images: [String],
      videos: [String],
      time: String,
    },
    lunch: {
      items: [String],
      images: [String],
      videos: [String],
      time: String,
    },
    dinner: {
      items: [String],
      images: [String],
      videos: [String],
      time: String,
    },
  },
  hotel: {
    name: String,
    pdfUrl: String,
    images: [String],
    videos: [String],
    checkin: Date,
    checkout: Date,
  },
  activities: [
    {
      title: String,
      description: String,
      time: String,
      images: [String],
      videos: [String],
    },
  ],
});

const TripRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    days: [DaySchema],
  },
  {
    timestamps: true,
  }
);

const TripRequest = mongoose.model('TripRequest', TripRequestSchema);

// ✅ Export properly for ES Modules
export default TripRequest;
