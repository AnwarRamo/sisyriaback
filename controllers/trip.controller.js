import Trip from "../models/trip.model.js";
import TravelPackage from "../models/TravelPackage.js";
import asyncHandler from 'express-async-handler';
import Revenue from "../models/revenue.model.js";
import { uploadToCloudinary } from '../utils/cloudinary.js';
import User from "../models/user.model.js";
import Booking from "../models/Booking.model.js"; // ✅ هذا هو المطلوب
import { NotificationService } from '../services/notificationService.js';

import mongoose from "mongoose";

export const fullTripCreate = asyncHandler(async (req, res) => {
    // --- 1. Destructure and Validate Basic Info ---
    const {
        title, description, destination, type, price,
        capacity, startDate, days, dayPlansJSON,
        // Ticket/Plane System Fields
        includeFlights = true,
        departureCity, arrivalCity, departureAirport, arrivalAirport,
        departureTime, returnTime, airline, flightNumber, returnFlightNumber,
        seatClasses = ['Economy'], ticketPrice, availableSeats
    } = req.body;

    const user = req.user;
    if (!user || !user.userId) {
        res.status(401);
        throw new Error("Unauthorized: User not found or token is invalid.");
    }

    // Validate required text fields
    const requiredFields = { title, description, destination, type, price, capacity, startDate, days, dayPlansJSON };
    for (const [key, value] of Object.entries(requiredFields)) {
        if (value === undefined || String(value).trim() === "") {
            res.status(400);
            throw new Error(`Missing or empty required field: ${key}`);
        }
    }

    // --- 2. Parse and Validate Numeric and Date values ---
    const parsedPrice = parseFloat(price);
    const parsedCapacity = parseInt(capacity, 10);
    const parsedDays = parseInt(days, 10);

    if (isNaN(parsedPrice) || isNaN(parsedCapacity) || isNaN(parsedDays) || parsedDays <= 0) {
        res.status(400);
        throw new Error("Price, capacity, and days must be valid positive numbers.");
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
        res.status(400);
        throw new Error("Invalid startDate format. Please use YYYY-MM-DD.");
    }
    
    const end = new Date(start);
    end.setDate(start.getDate() + parsedDays - 1);

    // --- 3. Parse and Validate dayPlans JSON ---
    let dayPlans;
    try {
        dayPlans = JSON.parse(dayPlansJSON);
        if (!Array.isArray(dayPlans)) throw new Error();
    } catch (e) {
        res.status(400);
        throw new Error("Invalid format for dayPlansJSON. Expected a valid JSON array string.");
    }

    if (dayPlans.length !== parsedDays) {
        res.status(400);
        throw new Error(`The number of day plans (${dayPlans.length}) does not match the trip duration (${parsedDays}).`);
    }
    
    dayPlans.forEach((plan, index) => {
        if (!plan || typeof plan.details !== 'string' || plan.details.trim() === '') {
            res.status(400);
            throw new Error(`Missing or invalid 'details' for day ${index + 1}.`);
        }
    });
    
    const dayPlansWithMedia = JSON.parse(JSON.stringify(dayPlans));

    // --- 4. Process File Uploads from `req.files` (as an ARRAY) ---
    const tripImageUrls = [];
    
    // `upload.any()` creates a `req.files` ARRAY. We must check it as an array.
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Loop directly over the array of files.
        for (const file of req.files) {
            const { buffer, fieldname } = file;

            const result = await uploadToCloudinary(buffer, {
                resource_type: "auto",
                folder: `trips/${title.replace(/\s+/g, '_')}`
            });

            const secureUrl = result.secure_url;

            // Handle main trip images (sent with fieldname 'images')
            if (fieldname === "images") {
                tripImageUrls.push(secureUrl);
            } 
            // Handle day-specific images (e.g., 'day_0_images')
            else if (fieldname.startsWith('day_') && fieldname.endsWith('_images')) {
                const dayIndex = parseInt(fieldname.split('_')[1], 10);
                if (dayIndex >= 0 && dayIndex < parsedDays) {
                    dayPlansWithMedia[dayIndex].images = dayPlansWithMedia[dayIndex].images || [];
                    dayPlansWithMedia[dayIndex].images.push(secureUrl);
                }
            }
            // Handle day-specific hotel documents (e.g., 'day_0_hotel')
            else if (fieldname.startsWith('day_') && fieldname.endsWith('_hotel')) {
                const dayIndex = parseInt(fieldname.split('_')[1], 10);
                if (dayIndex >= 0 && dayIndex < parsedDays) {
                    dayPlansWithMedia[dayIndex].hotelDocument = secureUrl;
                }
            }
        }
    }

    // --- 5. Create the Trip in the Database ---
    const finalDayPlans = dayPlansWithMedia.map((plan, i) => ({
        ...plan,
        dayIndex: i,
        meals: (plan.meals || []).filter(m => m && m.type && m.details) 
    }));

    const trip = await Trip.create({
        title,
        description,
        destination,
        type: type.toLowerCase(),
        price: parsedPrice,
        capacity: parsedCapacity,
        startDate: start,
        endDate: end,
        days: parsedDays,
        images: tripImageUrls,
        dayPlans: finalDayPlans,
        createdBy: user.userId,
        status: "Completed",
        // Ticket/Plane System Fields
        includeFlights,
        departureCity,
        arrivalCity,
        departureAirport,
        arrivalAirport,
        departureTime: departureTime ? new Date(departureTime) : start,
        returnTime: returnTime ? new Date(returnTime) : null,
        airline,
        flightNumber,
        returnFlightNumber,
        seatClasses,
        ticketPrice: ticketPrice || parsedPrice,
        availableSeats: availableSeats || parsedCapacity,
        reservedSeats: []
    });

    res.status(201).json({ 
        success: true, 
        message: "Trip created successfully with all details!", 
        data: trip 
    });
});

// ... include other controller functions from trip.controller.js







export const uploadTripDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No document uploaded' });

  const result = await uploadToCloudinary(file.buffer);
  const updatedTrip = await Trip.findByIdAndUpdate(id, {
    $push: {
      documents: {
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
      }
    }
  }, { new: true });

  res.json({ success: true, data: updatedTrip, message: 'Document uploaded successfully' });
});

export const getTrips = asyncHandler(async (req, res) => {
  try {
    console.log('Getting all trips...');
    const trips = await Trip.find().populate("createdBy", "username displayName").sort({ createdAt: -1 });
    console.log(`Found ${trips.length} trips`);
    res.status(200).json(trips);
  } catch (error) {
    console.error('Error getting trips:', error);
    res.status(500).json({ 
      message: 'Failed to fetch trips',
      error: error.message 
    });
  }
});

export const updateTrip = asyncHandler(async (req, res) => {
  // Fetch the trip first
  const trip = await Trip.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!trip) return res.status(404).json({ message: "Trip not found or unauthorized" });

  // If startDate or days is being updated, recalculate endDate
  let newStart = trip.startDate;
  let newDays = trip.days;
  if (req.body.startDate) newStart = new Date(req.body.startDate);
  if (req.body.days) newDays = parseInt(req.body.days, 10);
  let newEnd = trip.endDate;
  if (req.body.startDate || req.body.days) {
    newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + newDays - 1);
    req.body.endDate = newEnd;
  }

  // Update the trip
  const updatedTrip = await Trip.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.userId },
    req.body,
    { new: true, runValidators: true }
  );
  res.status(200).json(updatedTrip);
});

export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOneAndDelete({ _id: req.params.id, createdBy: req.user.userId });
  if (!trip) return res.status(404).json({ message: "Trip not found or unauthorized" });
  res.status(200).json({ message: "Trip deleted successfully" });
});

export const getTravelPackages = asyncHandler(async (req, res) => {
  const packages = await TravelPackage.find({}, {
    _id: 1, imageUrl: 1, destination: 1, price: 1, duration: 1, rating: 1, reviews: 1
  });
  res.status(200).json(packages);
});

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
    
    // Provide default values if no data exists
    const result = overview[0] || {
      totalTrips: 0,
      upcomingTrips: 0,
      statusDistribution: [],
      topDestinations: []
    };
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Trip Overview Error:', error);
    res.status(500).json({
      totalTrips: 0,
      upcomingTrips: 0,
      statusDistribution: [],
      topDestinations: [],
      error: error.message
    });
  }
});

export const getRevenueData = asyncHandler(async (req, res) => {
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
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const monthlyRevenue = monthlyRevenueData.map(item => item.totalRevenue);
  const totalRevenue = monthlyRevenue.reduce((acc, val) => acc + val, 0);
  const revenueLastMonth = monthlyRevenueData.at(-1)?.totalRevenue || 0;
  const totalTrips = await Trip.countDocuments();
  const totalCustomers = await User.countDocuments({ role: 'customer' });

  res.status(200).json({
    totalRevenue,
    revenueLastMonth,
    monthlyRevenue,
    totalTrips,
    totalCustomers,
  });
});

export const getRegisteredTrips = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId).populate('registeredTrips');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json(user.registeredTrips);
});
export const getUserTripRegistration = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { tripId } = req.params;

  // تأكد من تحويلها إلى ObjectId
  const userObjectId = new mongoose.Types.ObjectId(userId);
const tripObjectId = new mongoose.Types.ObjectId(tripId);
  const registration = await Booking.findOne({ userId: userObjectId, tripId: tripObjectId });

  if (!registration) {
    return res.status(404).json({ message: "Registration not found" });
  }

  res.status(200).json({
    userId: registration.userId,
    tripId: registration.tripId,
    status: registration.status
  });
});

export const registerUserForTrip = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { tripId, numGuests = 1, notes = "" } = req.body;

  if (!tripId) return res.status(400).json({ message: 'tripId is required' });

  const trip = await Trip.findById(tripId);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const existing = await Booking.findOne({ userId, tripId });
  if (existing) {
    return res.status(400).json({ message: 'Already registered for this trip' });
  }

  // Check if trip has capacity
  const currentRegistrations = await Booking.countDocuments({ 
    tripId, 
    status: { $in: ['pending', 'approved'] } 
  });
  
  if (currentRegistrations >= trip.capacity) {
    return res.status(400).json({ message: 'Trip is full' });
  }

  // ✅ احسب المبلغ بناءً على عدد الأشخاص
  const amount = trip.price * numGuests;

  const newRegistration = await Booking.create({
    userId,
    tripId,
    status: "pending",
    numGuests,
    notes,
    amount
  });

  // Create admin notification
  try {
    await NotificationService.createAdminRegistrationNotification(newRegistration, user, trip);
  } catch (error) {
    console.error('Failed to create admin notification:', error);
    // Don't fail the registration if notification fails
  }

  res.status(201).json({
    message: "Successfully registered for the trip",
    registration: newRegistration
  });
});


export const getTripById = async (req, res) => {
    try {
        // Find the trip by its ID
        const trip = await Trip.findById(req.params.id)
            // Correctly populate the 'createdBy' field instead of 'user'
            .populate('createdBy', 'username email') 
            .lean();

        if (!trip) {
            return res.status(404).json({
                success: false,
                error: 'Trip not found'
            });
        }

        // Return the full trip object with populated user details
        res.status(200).json({
            success: true,
            data: trip
        });

    } catch (error) {
        console.error('❌ Get Trip By ID Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error: Could not retrieve trip'
        });
    }
};
export const getTopDestinations = asyncHandler(async (req, res) => {
  try {
    // 1. تجميع الرحلات حسب الوجهة
    const aggregated = await Trip.aggregate([
      {
        $group: {
          _id: "$destination",
          count: { $sum: 1 },
          imageUrl: { $first: { $arrayElemAt: ["$images", 0] } }, // أول صورة من الصور (إن وجدت)
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 }, // عرض أفضل 5 وجهات
    ]);

    // 2. حساب المجموع الكلي
    const totalTrips = aggregated.reduce((sum, dest) => sum + dest.count, 0);

    // 3. تنسيق النتيجة
    const formatted = aggregated.map((item) => ({
      _id: item._id,
      name: item._id,
      imageUrl: item.imageUrl || '/images/default-package.jpg',
      percentage: totalTrips > 0 ? Math.round((item.count / totalTrips) * 100) : 0,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Top Destinations Error:', error);
    res.status(500).json([]);
  }
});

export const getUpcomingTrips = asyncHandler(async (req, res) => {
  try {
    const today = new Date();

    const trips = await Trip.find({ startDate: { $gt: today } })
      .sort({ startDate: 1 })
      .limit(5)
      .select("title startDate images capacity");

    const formatted = trips.map(trip => ({
      _id: trip._id,
      title: trip.title,
      startDate: trip.startDate,
      images: trip.images || [],
      participants: trip.capacity,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Upcoming Trips Error:', error);
    res.status(500).json([]);
  }
});
export const getPendingRegistrations = asyncHandler(async (req, res) => {
  const pending = await Booking.find({ status: 'pending' })
    .populate('userId', 'name email phone nationalId')
    .populate('tripId', 'title destination');

  const formatted = pending.map(reg => ({
    registrationId: reg._id,
    status: reg.status,
    user: {
      userId: reg.userId._id,
      name: reg.userId.name || reg.userId.username,
      email: reg.userId.email,
      phone: reg.userId.phone,
    },
    userInfo: {
      fullName: reg.userId.name || reg.userId.username,
      email: reg.userId.email,
      phone: reg.userId.phone,
      nationalId: reg.userId.nationalId
    },
    trip: {
      _id: reg.tripId._id,
      title: reg.tripId.title,
      destination: reg.tripId.destination,
    },
    registeredAt: reg.createdAt,
  }));

  res.status(200).json(formatted);
});


export const updateRegistrationStatus = asyncHandler(async (req, res) => {
  console.log('updateRegistrationStatus called with:', {
    params: req.params,
    body: req.body,
    userId: req.user?.userId
  });
  
  const { registrationId } = req.params;
  const { status, rejectionReason, adminNote } = req.body;
  const adminId = req.user.userId;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  // إيجاد التسجيل وتحديث الحالة
  console.log('Looking for registration with ID:', registrationId);
  const registration = await Booking.findById(registrationId)
    .populate('userId', 'username email fullName')
    .populate('tripId', 'title destination');
    
  if (!registration) {
    console.log('Registration not found for ID:', registrationId);
    return res.status(404).json({ message: 'Registration not found' });
  }
  
  console.log('Found registration:', {
    id: registration._id,
    status: registration.status,
    userId: registration.userId._id,
    tripId: registration.tripId._id
  });

  // Update registration with admin info
  registration.status = status;
  registration.adminNote = adminNote;
  
  if (status === 'approved') {
    registration.approvedAt = new Date();
    registration.approvedBy = adminId;
  } else if (status === 'rejected') {
    registration.rejectedAt = new Date();
    registration.rejectedBy = adminId;
    registration.rejectionReason = rejectionReason;
  }
  
  await registration.save();
  console.log('Registration updated successfully. New status:', registration.status);

  // Create user notification
  try {
    if (status === 'approved') {
      await NotificationService.createUserApprovalNotification(
        registration.userId._id,
        registration.tripId._id,
        registration._id,
        registration.tripId.title
      );
    } else if (status === 'rejected') {
      await NotificationService.createUserRejectionNotification(
        registration.userId._id,
        registration.tripId._id,
        registration._id,
        registration.tripId.title,
        rejectionReason || 'No reason provided'
      );
    }
  } catch (error) {
    console.error('Failed to create user notification:', error);
    // Don't fail the status update if notification fails
  }

  res.status(200).json({
    message: `Registration ${status}`,
    registration
  });
});
export const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  console.log("req.user:", req.user);

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const bookings = await Booking.find({ userId: userId })
    .populate("tripId", "title destination startDate endDate images dayPlans capacity")
    .select("status numGuests notes registeredAt approvedAt rejectedAt rejectionReason adminNote")
    .sort({ registeredAt: -1 });

  if (bookings.length === 0) {
    return res.status(404).json({ message: "No bookings found for this user" });
  }

  res.status(200).json(bookings);
});

// New functions for enhanced trip registration system
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  console.log("getUserNotifications - req.user:", req.user);
  console.log("getUserNotifications - userId:", userId);

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const { limit = 20, offset = 0 } = req.query;
  console.log("getUserNotifications - query params:", { limit, offset });

  try {
    console.log("Calling NotificationService.getUserNotifications...");
    const notifications = await NotificationService.getUserNotifications(userId, parseInt(limit), parseInt(offset));
    console.log("getUserNotifications - notifications found:", notifications.length);
    console.log("getUserNotifications - notifications:", notifications);
    
    console.log("Calling NotificationService.getUnreadNotificationCount...");
    const unreadCount = await NotificationService.getUnreadNotificationCount(userId);
    console.log("getUserNotifications - unreadCount:", unreadCount);
    
    const response = {
      notifications,
      unreadCount,
      hasMore: notifications.length === parseInt(limit)
    };
    
    console.log("getUserNotifications - sending response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error('getUserNotifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { notificationId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const notification = await NotificationService.markNotificationAsRead(notificationId, userId);
    res.status(200).json(notification);
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

export const getAdminNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  try {
    const notifications = await NotificationService.getAdminNotifications(parseInt(limit), parseInt(offset));
    const unreadCount = await NotificationService.getUnreadAdminNotificationCount();
    
    res.status(200).json({
      notifications,
      unreadCount,
      hasMore: notifications.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin notifications' });
  }
});

export const markAdminNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await NotificationService.markAdminNotificationAsRead(notificationId);
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark admin notification as read' });
  }
});



export const cancelTripRegistration = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { registrationId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const registration = await Booking.findOne({ _id: registrationId, userId });
  if (!registration) {
    return res.status(404).json({ message: 'Registration not found' });
  }

  if (registration.status === 'approved') {
    return res.status(400).json({ message: 'Cannot cancel approved registration. Please contact admin.' });
  }

  await Booking.findByIdAndDelete(registrationId);
  res.status(200).json({ message: 'Registration cancelled successfully' });
});

export const getTripRegistrationStats = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  try {
    const stats = await Booking.aggregate([
      { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalGuests: { $sum: '$numGuests' }
        }
      }
    ]);

    const trip = await Trip.findById(tripId).select('capacity');
    const totalCapacity = trip?.capacity || 0;

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      totalGuests: 0,
      availableSpots: totalCapacity
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      if (stat._id === 'approved') {
        formattedStats.totalGuests = stat.totalGuests;
        formattedStats.availableSpots = totalCapacity - stat.totalGuests;
      }
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch registration stats' });
  }
});

