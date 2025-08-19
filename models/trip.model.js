import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  type: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner'], required: true },
  details: { type: String, required: true },
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true },
  seatNumber: { type: String, required: true },
  seatClass: { 
    type: String, 
    enum: ['Economy', 'Business', 'First'], 
    default: 'Economy' 
  },
  passengerName: { type: String, required: true },
  passengerId: { type: String, required: true }, // National ID or Passport
  flightNumber: { type: String, required: true },
  departureAirport: { type: String, required: true },
  arrivalAirport: { type: String, required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  airline: { type: String, required: true },
  status: {
    type: String,
    enum: ['Reserved', 'Confirmed', 'Boarded', 'Completed', 'Cancelled'],
    default: 'Reserved'
  },
  price: { type: Number, required: true },
  issuedAt: { type: Date, default: Date.now },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String
});

const dayPlanSchema = new mongoose.Schema({
  dayIndex: { type: Number, required: true },
  details: { type: String, required: true },
  meals: [mealSchema],
  images: [{ type: String }],
  hotelDocument: { type: String },
  // Removed per simplification; tickets are tracked at trip level only
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
    // Ticket/Plane System Fields
    includeFlights: { type: Boolean, default: true },
    departureCity: { type: String, required: true },
    arrivalCity: { type: String, required: true },
    departureAirport: { type: String, required: true },
    arrivalAirport: { type: String, required: true },
    departureTime: { type: Date, required: true },
    returnTime: { type: Date },
    airline: { type: String, required: true },
    flightNumber: { type: String, required: true },
    returnFlightNumber: { type: String },
    seatClasses: {
      type: [String],
      enum: ['Economy', 'Business', 'First'],
      default: ['Economy']
    },
    ticketPrice: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    reservedSeats: [{ type: String }], // Array of reserved seat numbers
    tickets: [ticketSchema], // All tickets for this trip
    ticketStatus: {
      type: String,
      enum: ['Available', 'Limited', 'Sold Out'],
      default: 'Available'
    }
  },
  { timestamps: true }
);

// Generate unique ticket number
ticketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await mongoose.model('Trip').countDocuments();
    this.ticketNumber = `TKT-${Date.now()}-${count + 1}`;
  }
  next();
});

// Update ticket status based on available seats
tripSchema.pre('save', function(next) {
  if (this.availableSeats <= 0) {
    this.ticketStatus = 'Sold Out';
  } else if (this.availableSeats <= 5) {
    this.ticketStatus = 'Limited';
  } else {
    this.ticketStatus = 'Available';
  }
  next();
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
