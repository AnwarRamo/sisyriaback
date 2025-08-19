import express from 'express';
import { verifyToken, optionalAuth } from '../middlewares/verifyToken.js';
import { upload as uploadImage } from '../utils/cloudinary.js';
import { getEventTypes, createEventBooking, listEventBookings, getMyEventBookings, updateEventBooking, listOrganizedEvents, createOrganizedEvent } from '../controllers/events.controller.js';
import { isAdmin } from '../middlewares/verifyToken.js';

const router = express.Router();

// Public
router.get('/types', getEventTypes);
router.post('/book', optionalAuth, createEventBooking); // createdBy set if token exists
router.get('/organized', listOrganizedEvents);

// Admin
router.get('/bookings', verifyToken(), isAdmin, listEventBookings);
router.get('/my-bookings', verifyToken(), getMyEventBookings);
router.patch('/bookings/:id', verifyToken(), isAdmin, updateEventBooking);
router.post('/organized', verifyToken(), isAdmin, uploadImage.single('image'), createOrganizedEvent);

export default router;



