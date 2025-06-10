import User from "../models/user.model.js";
import Trip from "../models/trip.model.js";
import Revenue from "../models/revenue.model.js"; // Assuming you have a model for revenue analytics
import TravelPackage from '../models/TravelPackage.js';
import Booking from '../models/Booking.model.js';
import Appointment from '../models/Appointment.model.js';
// Get Admin Dashboard Data (General statistics)
export const getAdminDashboard = async (req, res) => {
  try {
    // Example data: total number of users and trips
    const userCount = await User.countDocuments();
    const tripCount = await Trip.countDocuments();
    const revenueData = await Revenue.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.json({
      userCount,
      tripCount,
      totalRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get admin dashboard data" });
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

// Get Revenue from Bookings
export const getBookingRevenue = async (req, res) => {
  try {
    const revenue = await Booking.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    res.json({
      totalRevenue: revenue.length > 0 ? revenue[0].totalRevenue : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get booking revenue" });
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

// Get Users Analytics (e.g., active users, new registrations, etc.)
export const getUsersAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
    });

    res.json({
      totalUsers,
      newUsersLastMonth,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get users analytics" });
  }
};

// Get Trips Analytics (e.g., number of trips created, popular destinations, etc.)
export const getTripsAnalytics = async (req, res) => {
  try {
    const totalTrips = await Trip.countDocuments();
    const popularDestinations = await Trip.aggregate([
      {
        $group: {
          _id: "$destination",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalTrips,
      popularDestinations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get trips analytics" });
  }
};

// Get Revenue Analytics (e.g., total revenue, revenue per month)
export const getRevenueAnalytics = async (req, res) => {
  try {
    const totalRevenue = await Revenue.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    const revenueLastMonth = await Revenue.aggregate([
      { $match: { date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    res.json({
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0,
      revenueLastMonth: revenueLastMonth.length > 0 ? revenueLastMonth[0].totalRevenue : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get revenue analytics" });
  }
};
