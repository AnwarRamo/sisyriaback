import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  type: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner'], required: true },
  details: { type: String, required: true },
});

const dayPlanSchema = new mongoose.Schema({
  dayIndex: { type: Number, required: true },
  details: { type: String, required: true },
  meals: [mealSchema],
  images: [{ type: String }],
  hotelDocument: { type: String },
});

const tripSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    destination: { type: String, required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    capacity: { type: Number, required: true },
    startDate: { type: Date, required: true },
    days: { type: Number, required: true },
    endDate: { type: Date },
    images: [{ type: String }],
    sliderImage: { type: String }, // Dedicated image for slider
    sliderVideo: { type: String }, // Dedicated video for slider
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'], // ✅ تم تضمين "Completed"
      default: 'Upcoming',
    },
    dayPlans: [dayPlanSchema], // ✅ تفاصيل الأيام
    included: [{ type: String }], // What the trip provides
    notIncluded: [{ type: String }], // What the trip does NOT provide
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
