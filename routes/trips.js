import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import {
  getTrips,
  getTripById,
  registerUserForTrip,
  getRegisteredTrips,
  getTripOverview,
  getTopDestinations,
  getUpcomingTrips,
  getPendingRegistrations,
  updateRegistrationStatus,
  getUserTripRegistration,
  getUserBookings,
  updateTrip,
  deleteTrip,
  uploadTripDocument,
  getTravelPackages,
  fullTripCreate,
  getUserNotifications,
  markNotificationAsRead,
  getAdminNotifications,
  markAdminNotificationAsRead,
  cancelTripRegistration,
  getTripRegistrationStats,

} from "../controllers/trip.controller.js";
const router = express.Router();

// Public
router.get("/", getTrips);
router.get("/travel-packages", getTravelPackages);

// Protected
router.use(verifyToken());

// Specific routes (must come before parameterized routes)
router.get("/notifications", getUserNotifications);
router.put("/notifications/:notificationId/read", validateObjectId("notificationId"), markNotificationAsRead);
router.get("/registered", getRegisteredTrips);
router.get("/user-bookings", getUserBookings);
router.post("/register", registerUserForTrip);
router.get("/user-registration-status/:tripId", validateObjectId("tripId"), getUserTripRegistration);
router.delete("/registrations/:registrationId", validateObjectId("registrationId"), cancelTripRegistration);
router.get("/:tripId/registration-stats", validateObjectId("tripId"), getTripRegistrationStats);

// Parameterized routes (must come last)
router.get("/:id", validateObjectId("id"), getTripById); // <-- now last

export default router; 