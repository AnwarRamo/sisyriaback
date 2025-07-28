import User from "../models/user.model.js";
import Trip from "../models/trip.model.js";
import Revenue from "../models/revenue.model.js"; // Assuming you have a model for revenue analytics
import TravelPackage from '../models/TravelPackage.js';
import Booking from '../models/Booking.model.js';
import Appointment from '../models/Appointment.model.js';
// Get Admin Dashboard Data (General statistics)
export const getAdminDashboard = async (req, res) => {
  try {
    // Get total counts
    const userCount = await User.countDocuments();
    const tripCount = await Trip.countDocuments();
    const bookingCount = await Booking.countDocuments();
    
    // Get total revenue from bookings
    const revenueData = await Booking.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.json({
      userCount,
      tripCount,
      bookingCount,
      totalRevenue,
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({ 
      message: "Failed to get admin dashboard data",
      userCount: 0,
      tripCount: 0,
      bookingCount: 0,
      totalRevenue: 0
    });
  }
};
export const getTravelPackages = async (req, res) => {
  try {
    const packages = await TravelPackage.find();
    res.json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch travel packages" });
  }
};

// Get Booking Statistics
export const getBookingStatistics = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const bookingsLastMonth = await Booking.countDocuments({
      createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
    });

    res.json({
      totalBookings,
      bookingsLastMonth,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get booking statistics" });
  }
};

// Get Appointment Statistics
export const getAppointmentStatistics = async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const appointmentsLastMonth = await Appointment.countDocuments({
      createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
    });

    res.json({
      totalAppointments,
      appointmentsLastMonth,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get appointment statistics" });
  }
};

// Get All Appointments
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

// Create Appointment
export const createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create appointment" });
  }
};

// Update Appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(id, req.body, { new: true });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update appointment" });
  }
};

// Delete Appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete appointment" });
  }
};

// Get Revenue from Bookings
export const getAllRegisteredTrips = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("tripId", "title destination startDate images")
      .populate("userId", "username email");

    const formatted = Array.isArray(bookings)
      ? bookings
          .filter((b) => b.tripId && b.userId)
          .map((b) => ({
            bookingId: b._id,
            user: b.userId,
            trip: b.tripId,
            status: b.status || 'Confirmed',
            amount: b.amount,
            date: b.createdAt,
          }))
      : [];

    res.status(200).json({ trips: formatted });
  } catch (err) {
    console.error("❌ Failed to fetch registered trips:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Promote a user to admin role
export const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = 'admin'; // Assuming you have a `role` field for users
    await user.save();

    res.json({ message: "User promoted to admin", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to promote user to admin" });
  }
};

// Get a list of all users (for admin)
export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Get user details by ID (admin only)
export const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

// Get All Trips
export const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
};

// Get Trip by ID
export const getTripById = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch trip details" });
  }
};

// Get Trip Overview
export const getTripOverview = async (req, res) => {
  try {
    const totalTrips = await Trip.countDocuments();
    const activeTrips = await Trip.countDocuments({ status: 'active' });
    const upcomingTrips = await Trip.countDocuments({
      startDate: { $gte: new Date() }
    });

    res.json({
      totalTrips,
      activeTrips,
      upcomingTrips
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get trip overview" });
  }
};

// Get Upcoming Trips
export const getUpcomingTrips = async (req, res) => {
  try {
    const upcomingTrips = await Trip.find({
      startDate: { $gte: new Date() }
    }).sort({ startDate: 1 }).limit(10);

    res.json(upcomingTrips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch upcoming trips" });
  }
};

// Get Top Destinations
export const getTopDestinations = async (req, res) => {
  try {
    const destinations = await Trip.aggregate([
      {
        $group: {
          _id: "$destination",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$price" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(destinations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch top destinations" });
  }
};


