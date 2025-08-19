// ✅ Unified Notification Model
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient info
  recipientType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification content
  type: {
    type: String,
    enum: [
      // Trip related
      'trip_registration', 'trip_approved', 'trip_rejected', 'trip_reminder', 'trip_cancelled',
      // Ticket related  
      'ticket_booking', 'ticket_approved', 'ticket_rejected',
      // Event related
      'event_booking', 'event_approved', 'event_rejected',
      // System
      'system_alert'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Related entities
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  
  // User info for admin notifications
  userInfo: {
    fullName: String,
    email: String,
    phone: String,
    nationality: String,
    nationalId: String,
    personalId: String
  },
  
  // Metadata for additional data
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Status
  isRead: { type: Boolean, default: false },
  isSeen: { type: Boolean, default: false },
  actionRequired: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ recipientType: 1, recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 