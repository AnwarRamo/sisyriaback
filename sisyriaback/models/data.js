import mongoose from 'mongoose';
import TravelPackage from './models/TravelPackage.js';
import Booking from './models/Booking.model.js';
import Appointment from './models/Appointment.model.js';
import Revenue from './models/Revenue.model.js'; // Assuming you have a revenue model

const data = {
  travelPackages: [
    {
      name: "Beach Getaway",
      description: "Enjoy a relaxing week at the beach.",
      price: 299.99,
      duration: "7 days",
      destination: "Hawaii",
      imageUrl: "https://example.com/images/beach-getaway.jpg"
    },
    {
      name: "Mountain Adventure",
      description: "Explore the great outdoors in the mountains.",
      price: 399.99,
      duration: "5 days",
      destination: "Colorado",
      imageUrl: "https://example.com/images/mountain-adventure.jpg"
    },
    {
      name: "City Tour",
      description: "Discover the highlights of the city.",
      price: 199.99,
      duration: "3 days",
      destination: "New York",
      imageUrl: "https://example.com/images/city-tour.jpg"
    }
  ],
  bookings: [
    {
      userId: "60d5ec49f1f2f1b1d4f03b1b",  // Replace with actual user ID
      travelPackageId: "60d5ec49f1f2f1b1d4f03b2a",  // Replace with actual travel package ID
      amount: 299.99,
      createdAt: "2025-01-10T10:00:00Z",
      status: "confirmed"
    },
    {
      userId: "60d5ec49f1f2f1b1d4f03b1c",  // Replace with actual user ID
      travelPackageId: "60d5ec49f1f2f1b1d4f03b2b",  // Replace with actual travel package ID
      amount: 399.99,
      createdAt: "2025-01-15T10:00:00Z",
      status: "pending"
    }
  ],
  appointments: [
    {
      userId: "60d5ec49f1f2f1b1d4f03b1b",  // Replace with actual user ID
      date: "2025-02-01T10:00:00Z",
      time: "10:00",
      status: "scheduled"
    },
    {
      userId: "60d5ec49f1f2f1b1d4f03b1c",  // Replace with actual user ID
      date: "2025-02-05T14:00:00Z",
      time: "14:00",
      status: "completed"
    }
  ],
  revenue: [
    {
      amount: 299.99,
      date: "2025-01-10T00:00:00Z"
    },
    {
      amount: 399.99,
      date: "2025-01-15T00:00:00Z"
    }
  ]
};

const insertData = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yourdbname', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await TravelPackage.insertMany(data.travelPackages);
    await Booking.insertMany(data.bookings);
    await Appointment.insertMany(data.appointments);
    await Revenue.insertMany(data.revenue);
    
    console.log("Data inserted successfully!");
  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    mongoose.connection.close();
  }
};

insertData();