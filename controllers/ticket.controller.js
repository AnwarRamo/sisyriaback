import Trip from "../models/trip.model.js";
import Booking from "../models/Booking.model.js";
import User from "../models/user.model.js";
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { NotificationService } from "../services/notificationService.js";

// Generate seat number based on class and availability
const generateSeatNumber = (seatClass, existingSeats) => {
  const classPrefix = {
    'Economy': 'E',
    'Business': 'B',
    'First': 'F'
  };
  
  const prefix = classPrefix[seatClass] || 'E';
  let seatNumber = 1;
  
  while (existingSeats.includes(`${prefix}${seatNumber}`)) {
    seatNumber++;
  }
  
  return `${prefix}${seatNumber}`;
};

// Book a ticket for a trip
export const bookTicket = asyncHandler(async (req, res) => {
  const { tripId, seatClass = 'Economy', passengerName, passengerId, notes, seatNumber: requestedSeatNumber } = req.body;
  const userId = req.user.userId;

  if (!tripId || !passengerName || !passengerId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Trip ID, passenger name, and passenger ID are required' 
    });
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ 
      success: false, 
      message: 'Trip not found' 
    });
  }

  if (trip.availableSeats <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'No seats available for this trip' 
    });
  }

  // If user selected a seat, validate it; otherwise auto-generate.
  let seatNumber = requestedSeatNumber;
  if (seatNumber) {
    const classPrefix = { 'Economy': 'E', 'Business': 'B', 'First': 'F' };
    const expectedPrefix = classPrefix[seatClass] || 'E';
    const isValidPrefix = seatNumber.startsWith(expectedPrefix);
    const alreadyReserved = trip.reservedSeats.includes(seatNumber);
    if (!isValidPrefix || alreadyReserved) {
      return res.status(400).json({
        success: false,
        message: 'Selected seat is invalid or already reserved'
      });
    }
  } else {
    seatNumber = generateSeatNumber(seatClass, trip.reservedSeats);
  }

  const ticket = {
    ticketNumber: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    seatNumber,
    seatClass,
    passengerName,
    passengerId,
    flightNumber: trip.flightNumber,
    departureAirport: trip.departureAirport,
    arrivalAirport: trip.arrivalAirport,
    departureTime: trip.departureTime,
    arrivalTime: trip.returnTime || new Date(trip.departureTime.getTime() + 2 * 60 * 60 * 1000),
    airline: trip.airline,
    status: 'Reserved',
    price: trip.ticketPrice,
    issuedAt: new Date(),
    issuedBy: userId,
    notes
  };

  const updatedTrip = await Trip.findByIdAndUpdate(
    tripId,
    {
      $push: { tickets: ticket },
      $push: { reservedSeats: seatNumber },
      $inc: { availableSeats: -1 }
    },
    { new: true }
  );

  // Create admin notification so admins can review ticket booking
  try {
    const user = await User.findById(userId);
    await NotificationService.createAdminTicketNotification({
      ticket,
      trip: updatedTrip,
      user
    });
  } catch (err) {
    // Do not fail booking if notification fails
    console.warn('Failed to create admin ticket notification:', err?.message);
  }

  res.status(201).json({
    success: true,
    message: 'Ticket booked successfully',
    data: {
      ticket,
      trip: {
        id: updatedTrip._id,
        title: updatedTrip.title,
        availableSeats: updatedTrip.availableSeats,
        ticketStatus: updatedTrip.ticketStatus
      }
    }
  });
});

// Get user's tickets
export const getUserTickets = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const trips = await Trip.find({
    'tickets.issuedBy': userId
  }).select('title tickets destination startDate');

  const userTickets = trips.map(trip => ({
    tripId: trip._id,
    tripTitle: trip.title,
    destination: trip.destination,
    startDate: trip.startDate,
    tickets: trip.tickets.filter(ticket => 
      ticket.issuedBy.toString() === userId
    )
  }));

  res.status(200).json({
    success: true,
    data: userTickets
  });
});

// Update ticket status
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { tripId, ticketNumber } = req.params;
  const { status, notes } = req.body;
  const userId = req.user.userId;

  const validStatuses = ['Reserved', 'Confirmed', 'Boarded', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid status' 
    });
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ 
      success: false, 
      message: 'Trip not found' 
    });
  }

  const ticketIndex = trip.tickets.findIndex(ticket => 
    ticket.ticketNumber === ticketNumber
  );

  if (ticketIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Ticket not found' 
    });
  }

  const previousStatus = trip.tickets[ticketIndex].status;
  trip.tickets[ticketIndex].status = status;
  if (notes) {
    trip.tickets[ticketIndex].notes = notes;
  }

  // If admin cancels a ticket, free the seat and increase availability
  if (status === 'Cancelled' && ['Reserved', 'Confirmed'].includes(previousStatus)) {
    const seatNum = trip.tickets[ticketIndex].seatNumber;
    const seatIdx = trip.reservedSeats.indexOf(seatNum);
    if (seatIdx > -1) {
      trip.reservedSeats.splice(seatIdx, 1);
    }
    trip.availableSeats += 1;
  }

  await trip.save();

  // Send user notification on status updates
  try {
    const ticket = trip.tickets[ticketIndex];
    if (status === 'Confirmed') {
      await NotificationService.createUserTicketApprovalNotification({
        userId: ticket.issuedBy,
        tripId: trip._id,
        ticketNumber: ticket.ticketNumber,
        tripTitle: trip.title,
        seatNumber: ticket.seatNumber
      });
    } else if (status === 'Cancelled') {
      await NotificationService.createUserTicketRejectionNotification({
        userId: ticket.issuedBy,
        tripId: trip._id,
        ticketNumber: ticket.ticketNumber,
        tripTitle: trip.title,
        reason: notes || 'Your ticket was cancelled by admin'
      });
    }
  } catch (err) {
    console.warn('Failed to create user ticket notification:', err?.message);
  }

  res.status(200).json({
    success: true,
    message: 'Ticket status updated successfully',
    data: trip.tickets[ticketIndex]
  });
});

// Cancel ticket
export const cancelTicket = asyncHandler(async (req, res) => {
  const { tripId, ticketNumber } = req.params;
  const userId = req.user.userId;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ 
      success: false, 
      message: 'Trip not found' 
    });
  }

  const ticketIndex = trip.tickets.findIndex(ticket => 
    ticket.ticketNumber === ticketNumber && 
    ticket.issuedBy.toString() === userId
  );

  if (ticketIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Ticket not found or unauthorized' 
    });
  }

  const ticket = trip.tickets[ticketIndex];
  
  const seatIndex = trip.reservedSeats.indexOf(ticket.seatNumber);
  if (seatIndex > -1) {
    trip.reservedSeats.splice(seatIndex, 1);
  }

  trip.availableSeats += 1;
  trip.tickets.splice(ticketIndex, 1);

  await trip.save();

  res.status(200).json({
    success: true,
    message: 'Ticket cancelled successfully',
    data: {
      availableSeats: trip.availableSeats,
      ticketStatus: trip.ticketStatus
    }
  });
});

// Get available seats for a trip
export const getAvailableSeats = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId).select('availableSeats reservedSeats seatClasses capacity');
  if (!trip) {
    return res.status(404).json({ 
      success: false, 
      message: 'Trip not found' 
    });
  }

  const availableSeats = {};
  trip.seatClasses.forEach(seatClass => {
    const classPrefix = {
      'Economy': 'E',
      'Business': 'B',
      'First': 'F'
    };
    
    const prefix = classPrefix[seatClass];
    const reservedSeatsInClass = trip.reservedSeats.filter(seat => 
      seat.startsWith(prefix)
    );
    
    const maxSeatsInClass = Math.floor(trip.capacity / trip.seatClasses.length);
    const availableSeatsInClass = [];
    
    for (let i = 1; i <= maxSeatsInClass; i++) {
      const seatNumber = `${prefix}${i}`;
      if (!reservedSeatsInClass.includes(seatNumber)) {
        availableSeatsInClass.push(seatNumber);
      }
    }
    
    availableSeats[seatClass] = availableSeatsInClass;
  });

  res.status(200).json({
    success: true,
    data: {
      totalAvailable: trip.availableSeats,
      availableSeats,
      reservedSeats: trip.reservedSeats,
      seatClasses: trip.seatClasses
    }
  });
}); 

// Get specific ticket details
export const getTicketDetails = asyncHandler(async (req, res) => {
  const { tripId, ticketNumber } = req.params;

  const trip = await Trip.findById(tripId).select('title destination startDate tickets');
  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  const ticket = trip.tickets.find(t => t.ticketNumber === ticketNumber);
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  res.status(200).json({ success: true, data: { tripId: trip._id, tripTitle: trip.title, ticket } });
});

// Admin: list tickets across trips
export const listTicketsAdmin = asyncHandler(async (req, res) => {
  const { status } = req.query; // optional filter

  // Aggregate tickets across trips
  const trips = await Trip.find().select('title destination startDate tickets');
  const tickets = [];
  trips.forEach(trip => {
    trip.tickets.forEach(t => {
      if (!status || t.status === status) {
        tickets.push({
          tripId: trip._id,
          tripTitle: trip.title,
          destination: trip.destination,
          startDate: trip.startDate,
          ticket: t
        });
      }
    });
  });

  res.status(200).json({ success: true, data: tickets });
});