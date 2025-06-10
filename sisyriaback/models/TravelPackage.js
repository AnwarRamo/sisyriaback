import mongoose from 'mongoose';

const travelPackageSchema = new mongoose.Schema({
    destination: { type: String, required: true },
    price: { type: Number, required: true },
    duration: String,
    imageUrl: String,
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    // other fields...
}, { timestamps: true });

const TravelPackage = mongoose.model('TravelPackage', travelPackageSchema);

export default TravelPackage;