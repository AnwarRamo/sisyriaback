import { Schema } from "mongoose";
import mongoose from "mongoose";

const tripSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [20, "Description should be at least 20 characters"], // Corrected from 50 to 20 as in your original schema
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
    },
    type: {
      type: String,
      required: [true, "Trip type is required"],
      enum: ['Adventure', 'Cultural', 'Beach', 'Cruise', 'Family'],
      default: 'Adventure',
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'],
      default: 'Upcoming',
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: { // Replaced min: Date.now with a custom validator
        validator: function(value) {
          // 'value' is the incoming startDate (typically YYYY-MM-DDT00:00:00.000Z from client date string)
          const today = new Date();
          // Create a date for midnight UTC of the current day on the server
          const serverTodayAtMidnightUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
          
          // Ensure the incoming date (value) is on or after midnight UTC of the server's current day
          return value.getTime() >= serverTodayAtMidnightUTC.getTime();
        },
        message: props => `Start date (${new Date(props.value).toLocaleDateString()}) cannot be in the past.`
      }
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function(value) {
          // Ensure endDate is after startDate. Both are Date objects here.
          return value.getTime() > this.startDate.getTime();
        },
        message: "End date must be after start date",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
  registeredUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    images: [String],
    activities: [String], // Consider if this should be an array of objects for more detail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Add virtual for duration in days
tripSchema.virtual('durationInDays').get(function() { // Renamed for clarity
  if (this.endDate && this.startDate) {
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  return 0; // Or null, or undefined, depending on how you want to handle missing dates
});

// Indexes for better query performance
tripSchema.index({ destination: 1, type: 1 });
tripSchema.index({ startDate: 1, status: 1 });

export default mongoose.model("Trip", tripSchema);