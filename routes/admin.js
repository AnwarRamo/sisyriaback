import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import {
  getPendingRegistrations,
  updateRegistrationStatus,
  getAdminNotifications,
  markAdminNotificationAsRead,
  getTripRegistrationStats
} from "../controllers/trip.controller.js";
import {
  getAdminDashboard,
  getTravelPackages,
  getBookingStatistics,
  getAppointmentStatistics,
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAllRegisteredTrips,
  promoteToAdmin,
  getAdminUsers,
  getAdminUserById,
  getAllTrips,
  getTripById,
  getTripOverview,
  getUpcomingTrips,
  getTopDestinations
} from "../controllers/admin.controller.js";
import {
  getUsersAnalytics,
  getTripsAnalytics,
  getRevenueAnalytics
} from "../controllers/analytics.controller.js";

const router = express.Router();

// Admin middleware - ensure user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Apply admin middleware to all routes
router.use(verifyToken(), adminOnly);

// Dashboard and Analytics
router.get("/dashboard", getAdminDashboard);
router.get("/analytics/users", getUsersAnalytics);
router.get("/analytics/trips", getTripsAnalytics);
router.get("/analytics/revenue", getRevenueAnalytics);

// Travel Packages
router.get("/travel-packages", getTravelPackages);

// Trip Management
router.get("/trips", getAllTrips);
router.get("/trips/:tripId", validateObjectId("tripId"), getTripById);
router.get("/trip-overview", getTripOverview);
router.get("/upcoming-trips", getUpcomingTrips);
router.get("/top-destinations", getTopDestinations);

// Booking and Registration Management
router.get("/register", getAllRegisteredTrips);
router.get("/booking-statistics", getBookingStatistics);
router.get("/registrations/pending", getPendingRegistrations);
router.put("/registrations/:registrationId/status", validateObjectId("registrationId"), updateRegistrationStatus);
router.get("/trips/:tripId/registration-stats", validateObjectId("tripId"), getTripRegistrationStats);

// User Management
router.get("/users", getAdminUsers);
router.get("/users/:id", validateObjectId("id"), getAdminUserById);
router.put("/users/promote/:userId", validateObjectId("userId"), promoteToAdmin);

// Appointment Management
router.get("/appointments", getAllAppointments);
router.post("/appointments", createAppointment);
router.put("/appointments/:id", validateObjectId("id"), updateAppointment);
router.delete("/appointments/:id", validateObjectId("id"), deleteAppointment);
router.get("/appointment-statistics", getAppointmentStatistics);

// Admin notifications
router.get("/notifications", getAdminNotifications);
router.put("/notifications/:notificationId/read", validateObjectId("notificationId"), markAdminNotificationAsRead);

export default router; 