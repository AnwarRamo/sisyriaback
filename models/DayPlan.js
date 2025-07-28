import mongoose from 'mongoose';

// A sub-schema for meals to keep the main schema clean
const mealSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['Breakfast', 'Lunch', 'Dinner'], 
        required: true 
    },
    details: { 
        type: String, 
        trim: true 
    },
}, { _id: false }); // _id is not needed for subdocuments here

const dayPlanSchema = new mongoose.Schema({
    // A reference to the parent Trip document
    trip: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Trip',
        // Not required initially, as we link it back after creation
    },
    dayIndex: { 
        type: Number, 
        required: true 
    },
    details: { 
        type: String, 
        required: [true, "Activity details for the day are required."],
        trim: true 
    },
    meals: [mealSchema],
    images: [{ 
        type: String // Stores URLs from Cloudinary
    }],
    hotelDocument: { 
        type: String // Stores a single URL from Cloudinary
    },
}, { timestamps: true });

const DayPlan = mongoose.model('DayPlan', dayPlanSchema);

export default DayPlan;