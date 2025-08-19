import EventBooking from '../models/EventBooking.model.js';
import Event from '../models/Event.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { NotificationService } from '../services/notificationService.js';

export const getEventTypes = async (req, res) => {
  // Static definition for now; could be stored in DB later
  const types = [
    {
      key: 'private',
      title: 'Private Events',
      services: ['Wedding Ceremonies', 'Anniversary Celebrations', 'Birthday Parties', 'Family Reunions'],
      startingPrice: 2500,
      image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1600&auto=format&fit=crop',
    },
    {
      key: 'public',
      title: 'Public Events',
      services: ['Corporate Conferences', 'Product Launches', 'Charity Galas', 'Award Ceremonies'],
      startingPrice: 5000,
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop',
    },
  ];
  res.json(types);
};

export const createEventBooking = async (req, res) => {
  try {
    const payload = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      eventType: req.body.eventType,
      eventDate: req.body.eventDate,
      guestCount: Number(req.body.guestCount) || 1,
      venue: req.body.venue,
      budgetRange: req.body.budgetRange,
      description: req.body.description,
      createdBy: req.user?.userId || undefined,
      status: 'pending',
    };

    const booking = await EventBooking.create(payload);
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const listEventBookings = async (req, res) => {
  try {
    const items = await EventBooking.find()
      .populate('createdBy', 'username displayName email phone')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// User: list own event bookings
export const getMyEventBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await EventBooking.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: update event booking status or details
export const updateEventBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['status', 'eventDate', 'guestCount', 'venue', 'budgetRange', 'description'];
    const updates = {};
    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') updates[key] = req.body[key];
    }

    const updated = await EventBooking.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Booking not found' });
    try {
      if (updated.createdBy && updates.status) {
        if (updates.status === 'approved') {
          await NotificationService.createUserEventApprovalNotification({
            userId: updated.createdBy,
            eventTitle: updated.description || (updated.eventType === 'private' ? 'Private Event' : 'Public Event'),
            eventDate: updated.eventDate,
            bookingId: updated._id,
          });
        } else if (updates.status === 'rejected') {
          await NotificationService.createUserEventRejectionNotification({
            userId: updated.createdBy,
            eventTitle: updated.description || (updated.eventType === 'private' ? 'Private Event' : 'Public Event'),
            eventDate: updated.eventDate,
            bookingId: updated._id,
            reason: req.body.rejectionReason,
          });
        }
      }
    } catch (notifyErr) {
      // Do not fail the request if notification fails
      console.error('Failed to create event user notification:', notifyErr);
    }
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Public: list organized events
export const listOrganizedEvents = async (_req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).lean();
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: create organized event (displayed on events page)
export const createOrganizedEvent = async (req, res) => {
  try {
    let imageUrl = req.body.image;
    if (req.file?.buffer) {
      const result = await uploadToCloudinary(req.file.buffer, { folder: 'events', resource_type: 'auto' });
      imageUrl = result.secure_url;
    }

    const payload = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
      services: Array.isArray(req.body.services) ? req.body.services : [],
      startingPrice: Number(req.body.startingPrice) || 0,
      image: imageUrl,
      createdBy: req.user.userId,
    };
    const ev = await Event.create(payload);
    res.status(201).json({ success: true, event: ev });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};



