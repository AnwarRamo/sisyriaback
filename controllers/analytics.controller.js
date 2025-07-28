// controllers/analytics.controller.js
import User from "../models/user.model.js";
import Trip from "../models/trip.model.js";
import Booking from "../models/Booking.model.js";

export const getUsersAnalytics = async (req, res) => {
    try {
      const data = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } }
          }
        }
      ]);
      
      // Return default values if no data
      const result = data[0] || {
        totalUsers: 0,
        activeUsers: 0,
        admins: 0
      };
      
      res.json(result);
    } catch (error) {
      console.error('Users Analytics Error:', error);
      res.status(500).json({ 
        message: error.message,
        totalUsers: 0,
        activeUsers: 0,
        admins: 0
      });
    }
  };
  
  export const getTripsAnalytics = async (req, res) => {
    try {
      const data = await Trip.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalRevenue: { $sum: "$price" }
          }
        }
      ]);
      
      // Return empty array if no data
      res.json(data || []);
    } catch (error) {
      console.error('Trips Analytics Error:', error);
      res.status(500).json({ 
        message: error.message,
        data: []
      });
    }
  };
  
  export const getRevenueAnalytics = async (req, res) => {
    try {
      // Use Booking model for revenue analytics since that's where actual revenue is tracked
      const data = await Booking.aggregate([
        {
          $group: {
            _id: { $month: "$createdAt" },
            totalRevenue: { $sum: "$amount" },
            bookingsCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Return empty array if no data
      res.json(data || []);
    } catch (error) {
      console.error('Revenue Analytics Error:', error);
      res.status(500).json({ 
        message: error.message,
        data: []
      });
    }
  };