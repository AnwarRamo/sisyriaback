// src/routes/index.js
import express from "express";
import { upload } from "../utils/cloudinary.js"; // Ensure this path is correct
import { validateObjectId } from "../middlewares/validateObjectId.js"; // Ensure this path is correct
import { verifyToken, isAdmin } from "../middlewares/verifyToken.js"; // Ensure this path is correct

// Import all necessary controller functions
import {
  registerUser, loginUser, logoutUser, refreshToken,
  getCurrentUser, updateCurrentUser, getUserProfile, followUser,
  someControllerFunction, // Assuming this is still used or a placeholder
  addPreferredTripType // <<<< NEWLY IMPORTED
} from "../controllers/user.controller.js"; // Ensure this path is correct

import {
  addToCart, removeFromCart, updateCartQuantity, getAllProducts, checkoutCart
} from "../controllers/cart.controller.js"; // Ensure this path is correct

import {
  createTrip, getTrips, updateTrip, deleteTrip, uploadTripDocument,
  getTravelPackages, getTripOverview, // getRevenueData (check if this is from trip or admin controller)
  addTripDetails,registerUserForTrip,getRegisteredTrips
} from "../controllers/trip.controller.js"; // Ensure this path is correct

import {
  getAdminDashboard, promoteToAdmin, // getAdminUsers (see userManagement), getAdminUserById (see userManagement),
  getUsersAnalytics, getTripsAnalytics, getRevenueAnalytics,
  getBookingStatistics, getAppointmentStatistics, getBookingRevenue,
  // getRevenueData (check if this is from trip or admin controller)
} from "../controllers/admin.controller.js"; // Ensure this path is correct

import {
  addUser, getAllUsers, getUser, updateUser, deleteUser // These are for user management by admin
} from "../controllers/userMangment.js"; // Ensure this path is correct and naming is consistent

import {
  createOrder,
  getUserOrders,
  getOrderById
} from '../controllers/orderController.js'; // Ensure this path is correct

const router = express.Router();

//
// 🔓 PUBLIC ROUTES
//
router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/auth/refresh", refreshToken);
router.get("/trips", getTrips); // This likely fetches all trips for public view
router.get("/travel-packages", getTravelPackages); // Publicly viewable travel packages
router.post('/upload', upload.single('image'), someControllerFunction); // Example upload route

//
// 🔐 AUTH ROUTES (require token for all routes below this middleware)
//
router.use(verifyToken()); // Middleware to verify token for subsequent routes

// Auth & User Specific Routes (for the logged-in user)
router.post("/auth/logout", logoutUser);
router.get("/auth/me", getCurrentUser); // Get current logged-in user's details
router.put("/me", updateCurrentUser); // Update current logged-in user's general profile
router.post("/trips/preferred-type", addPreferredTripType); // <<<< NEW ROUTE: Add a trip type preference for logged-in user
router.get("/users/:username", getUserProfile); // Get a user's public profile by username
router.put("/users/follow/:username", followUser); // Follow/unfollow a user
router.post('/trips/register', registerUserForTrip);
router.get('/registered', getRegisteredTrips);

// Cart Routes
router.post("/cart/add", addToCart);
router.delete("/cart/remove/:productId", removeFromCart);
router.put("/cart/update/:productId", updateCartQuantity);
router.post("/cart/checkout", checkoutCart);
router.get('/products', getAllProducts); // Get all products (likely public after auth for cart interaction)

// Order Routes
router.post('/orders', createOrder); // createOrder was already token protected
router.get('/orders', getUserOrders); // getUserOrders was already token protected
router.get('/orders/:id', getOrderById); // getOrderById was already token protected

//
// 🛡️ ADMIN ROUTES (require admin role, in addition to token verification)
//
router.use(isAdmin); // Middleware to check for admin role for subsequent routes

// Admin: Dashboard & Analytics
router.get("/admin/dashboard", getAdminDashboard);
router.get("/admin/trip-overview", getTripOverview); // For admin dashboard
router.get("/admin/analytics/users", getUsersAnalytics);
router.get("/admin/analytics/trips", getTripsAnalytics);
router.get("/admin/analytics/revenue", getRevenueAnalytics);
router.get("/admin/booking-statistics", getBookingStatistics);
router.get("/admin/appointment-statistics", getAppointmentStatistics);
router.get("/admin/booking-revenue", getBookingRevenue);
// Note: getRevenueData might be duplicated or intended for a different scope (public vs admin). Consolidate if necessary.

// Admin: User Management (from userMangment.js)
router.post("/admin/users", addUser); // Create a new user (by admin)
router.get("/admin/users", getAllUsers); // Get all users (admin view)
router.get("/admin/users/:id", validateObjectId("id"), getUser); // Get specific user by ID (admin view, using getUser from userMangment)
router.put("/admin/users/:id", validateObjectId("id"), updateUser); // Update user by ID (admin)
router.delete("/admin/users/:id", validateObjectId("id"), deleteUser); // Delete user by ID (admin)
router.put("/admin/users/promote/:userId", validateObjectId("userId"), promoteToAdmin); // Promote user to admin

// Admin: Trip Management
router.get("/admin/trips", getTrips); // Get all trips (admin view, could be same as public or more detailed)
router.post("/admin/trips/create", upload.array("images", 5), createTrip); // Create a new trip
router.post( // Add details to an existing trip (ensure this route is unique and clear)
  '/admin/trips/add-details', // Changed from just '/add-details' for clarity
  upload.fields([ // Using upload.fields for multiple different file fields
    { name: 'dayImages', maxCount: 50 }, // Example: day_0_images, day_1_images etc.
    { name: 'hotelFiles', maxCount: 10 }  // Example: day_0_hotel, day_1_hotel etc.
    // Adjust maxCount and names based on how you handle them in addTripDetails controller
  ]),
  addTripDetails
);
router.route("/admin/trips/:id") // Routes for specific trip by ID
  .put(validateObjectId("id"), updateTrip)
  .delete(validateObjectId("id"), deleteTrip);
router.post("/admin/trips/:id/documents", validateObjectId("id"), upload.single("document"), uploadTripDocument); // Upload document for a specific trip

//
// ❌ 404 Catch-all (should be the very last route)
//
router.use("*", (req, res) => {
  res.status(404).json({ code: "ROUTE_NOT_FOUND", message: "The requested route does not exist." });
});

export default router;
