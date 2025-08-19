import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import {
  bookTicket,
  getUserTickets,
  updateTicketStatus,
  cancelTicket,
  getAvailableSeats,
  getTicketDetails,
  listTicketsAdmin
} from "../controllers/ticket.controller.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken());

// Book a ticket
router.post("/book", bookTicket);

// Get user's tickets
router.get("/my-tickets", getUserTickets);

// Update ticket status
router.put("/:tripId/:ticketNumber/status", 
  validateObjectId("tripId"), 
  updateTicketStatus
);

// Cancel ticket
router.delete("/:tripId/:ticketNumber", 
  validateObjectId("tripId"), 
  cancelTicket
);

// Get available seats for a trip
router.get("/:tripId/available-seats", 
  validateObjectId("tripId"), 
  getAvailableSeats
);

// Get specific ticket details
router.get("/:tripId/:ticketNumber", 
  validateObjectId("tripId"), 
  getTicketDetails
);

// Admin: list tickets (admin-only middleware is in admin router, but we can reuse here by checking role)
router.get("/", (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
}, listTicketsAdmin);

export default router; 