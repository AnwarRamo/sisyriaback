import Trip from "../models/trip.model.js";
import TravelPackage from "../models/TravelPackage.js";
import asyncHandler from 'express-async-handler';
import Revenue from "../models/revenue.model.js";
import { uploadToCloudinary } from '../utils/cloudinary.js';
import User from "../models/user.model.js";

// Create a trip
export const createTrip = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    destination,
    type,
    price,
    capacity,
    startDate,
    days,
  } = req.body;

  const user = req.user; // Populated by auth middleware

  if (!user) {
    return res.status(401).json({ message: "Unauthorized: user not found in token" });
  }

  // Example: Enhanced validation for required fields from body
  const requiredFields = { title, description, destination, type, price, capacity, startDate, days };
  for (const [key, value] of Object.entries(requiredFields)) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return res.status(400).json({ message: `Missing required field: ${key}` });
    }
  }

  if (description.length < 50) {
    return res.status(400).json({ message: "Description must be at least 50 characters long." });
  }

  // This part is likely correct in how it prepares data for uploadToCloudinary
  // The error "stream is not defined" happens *inside* uploadToCloudinary
  const images = await Promise.all(
    (req.files || []).map(async (file) => {
      if (!file.buffer) {
        // This check can prevent errors if a file object is malformed
        console.error("File object is missing buffer:", file);
        throw new Error(`File ${file.originalname || 'unknown file'} is missing its buffer content.`);
      }
      const result = await uploadToCloudinary(file.buffer);
      return result.secure_url;
    })
  );

  const start = new Date(startDate);
  const parsedDays = parseInt(days, 10);

  if (isNaN(parsedDays) || parsedDays <= 0) {
      return res.status(400).json({ message: "Invalid number of days provided." });
  }

  const end = new Date(start);
  end.setDate(start.getDate() + parsedDays);

  const parsedPrice = parseFloat(price);
  const parsedCapacity = parseInt(capacity, 10);

  if (isNaN(parsedPrice) || parsedPrice < 0) { // Price can be 0 for free trips, adjust if needed
      return res.status(400).json({ message: "Invalid price provided." });
  }
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({ message: "Invalid capacity provided." });
  }

  const trip = await Trip.create({
    title,
    description,
    destination,
    type,
    price: parsedPrice,
    capacity: parsedCapacity,
    startDate: start,
    endDate: end,
    images,
    createdBy: user.userId, // Ensure req.user has userId
    status: 'Upcoming', // Default status
  });

  res.status(201).json({
    success: true,
    data: trip, // Send back the created trip
    message: 'Trip created successfully',
  });
});




export const registerUserForTrip = async (req, res) => {
  try {
    console.log('User ID from req.user:', req.user?.userId);

    const userId = req.user.userId;          // From auth middleware
    const { tripId } = req.body;

    if (!tripId) {
      return res.status(400).json({ message: 'tripId is required' });
    }

    console.log('Looking for trip with ID:', tripId);

    // Find trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already registered for this trip
    if (user.registeredTrips && user.registeredTrips.includes(tripId)) {
      return res.status(400).json({ message: 'Already registered for this trip' });
    }

    // Add tripId to user's registeredTrips array (initialize if needed)
    if (!user.registeredTrips) {
      user.registeredTrips = [];
    }
    user.registeredTrips.push(tripId);

    await user.save();

    res.status(200).json({ message: 'Successfully registered for the trip' });
  } catch (error) {
    console.error('Error registering user for trip:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




export const addTripDetails = async (req, res) => {
  try {
    const { tripId } = req.body;
    
    // 1. Validate trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // 2. Process uploaded files
    const files = req.files;
    const dayPlans = [];
    const processedDays = new Set();

    // Group files by day index
    for (const [fieldname, fileArray] of Object.entries(files)) {
      // Parse day index from fieldname (e.g., "images_day_0_0" -> day 0)
      const dayMatch = fieldname.match(/day_(\d+)/);
      if (dayMatch) {
        const dayIndex = parseInt(dayMatch[1]);
        processedDays.add(dayIndex);

        if (!dayPlans[dayIndex]) {
          dayPlans[dayIndex] = {
            images: [],
            hotelDocument: null
          };
        }

        // Handle images
        if (fieldname.startsWith('images_day')) {
          const uploadedImage = await uploadToCloudinary(fileArray[0].path);
          dayPlans[dayIndex].images.push(uploadedImage.secure_url);
        }
        // Handle hotel document
        else if (fieldname.startsWith('hotelFile_day')) {
          const uploadedDoc = await uploadToCloudinary(fileArray[0].path);
          dayPlans[dayIndex].hotelDocument = uploadedDoc.secure_url;
        }
      }
    }

    // 3. Process text data (meals, details)
    for (const [key, value] of Object.entries(req.body)) {
      if (key.startsWith('dayPlans[')) {
        // Parse day index from key (e.g., "dayPlans[0][details]" -> day 0)
        const dayMatch = key.match(/\[(\d+)\]/);
        if (dayMatch) {
          const dayIndex = parseInt(dayMatch[1]);
          processedDays.add(dayIndex);

          if (!dayPlans[dayIndex]) {
            dayPlans[dayIndex] = {
              images: [],
              hotelDocument: null,
              details: '',
              meals: []
            };
          }

          // Handle details
          if (key.includes('[details]')) {
            dayPlans[dayIndex].details = value;
          }
          // Handle meals
          else if (key.includes('[meals]')) {
            const mealMatch = key.match(/\[meals\]\[(\d+)\]\[(\w+)\]/);
            if (mealMatch) {
              const mealIndex = parseInt(mealMatch[1]);
              const field = mealMatch[2]; // 'type' or 'details'
              
              if (!dayPlans[dayIndex].meals[mealIndex]) {
                dayPlans[dayIndex].meals[mealIndex] = {};
              }
              
              dayPlans[dayIndex].meals[mealIndex][field] = value;
            }
          }
        }
      }
    }

    // 4. Validate all days have required data
    for (let i = 0; i < trip.days; i++) {
      if (!dayPlans[i] || !dayPlans[i].details) {
        return res.status(400).json({ 
          message: `Missing details for day ${i + 1}` 
        });
      }
    }

    // 5. Update trip with day plans
    trip.dayPlans = dayPlans.filter(Boolean); // Remove empty slots
    trip.status = 'completed'; // Or whatever status you use
    await trip.save();

    res.status(200).json({
      message: 'Trip details added successfully',
      trip
    });

  } catch (error) {
    console.error('Error adding trip details:', error);
    res.status(500).json({ 
      message: 'Failed to add trip details',
      error: error.message 
    });
  }
};
// Upload a document to a trip
export const uploadTripDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No document uploaded'
    });
  }

  const result = await uploadToCloudinary(file.buffer);

  const updatedTrip = await Trip.findByIdAndUpdate(
    id,
    {
      $push: {
        documents: {
          url: result.secure_url,
          publicId: result.public_id,
          name: file.originalname,
        }
      }
    },
    { new: true }
  );

  res.json({
    success: true,
    data: updatedTrip,
    message: 'Document uploaded successfully'
  });
});

// Get all trips
export const getTrips = asyncHandler(async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("createdBy", "username displayName")
      .sort({ createdAt: -1 });

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

// Update an existing trip
export const updateTrip = asyncHandler(async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId }, // ✅ fix here
      req.body,
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({ message: "Trip not found or unauthorized" });
    }

    res.status(200).json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a trip
export const deleteTrip = asyncHandler(async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.userId // ✅ fix here
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found or unauthorized" });
    }

    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all travel packages
export const getTravelPackages = asyncHandler(async (req, res) => {
  try {
    const packages = await TravelPackage.find({}, {
      _id: 1,
      imageUrl: 1,
      destination: 1,
      price: 1,
      duration: 1,
      rating: 1,
      reviews: 1,
    });

    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a summary overview of trips
export const getTripOverview = asyncHandler(async (req, res) => {
  try {
    const overview = await Trip.aggregate([
      {
        $facet: {
          totalTrips: [{ $count: "count" }],
          upcomingTrips: [
            { $match: { startDate: { $gt: new Date() } } },
            { $count: "count" }
          ],
          tripStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          popularDestinations: [
            { $group: { _id: "$destination", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      },
      {
        $project: {
          totalTrips: { $arrayElemAt: ["$totalTrips.count", 0] },
          upcomingTrips: { $arrayElemAt: ["$upcomingTrips.count", 0] },
          statusDistribution: "$tripStatus",
          topDestinations: "$popularDestinations"
        }
      }
    ]);

    res.status(200).json(overview[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get revenue data (for dashboard analytics)
export const getRevenueData = asyncHandler(async (req, res) => {
  try {
    const monthlyRevenueData = await Revenue.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalRevenue: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const monthlyRevenue = monthlyRevenueData.map((item) => item.totalRevenue);

    const totalRevenue = monthlyRevenue.reduce((acc, val) => acc + val, 0);

    const revenueLastMonth = monthlyRevenueData.length
      ? monthlyRevenueData[monthlyRevenueData.length - 1].totalRevenue
      : 0;

    const totalTrips = await Trip.countDocuments();

    const totalCustomers = await User.countDocuments({ role: 'customer' });

    res.status(200).json({
      totalRevenue,
      revenueLastMonth,
      monthlyRevenue,
      totalTrips,
      totalCustomers,
    });

  } catch (error) {
    console.error('Failed to get revenue data:', error);
    res.status(500).json({ message: error.message });
  }
});
export const getRegisteredTrips = async (req, res) => {
  console.log('req.user:', req.user);  // <- check if user exists
  try {
    const userId = req.user.userId; // Will error if req.user is undefined

    const user = await User.findById(userId).populate('registeredTrips');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user.registeredTrips);
  } catch (err) {
    console.error('Error fetching registered trips:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
