import mongoose from 'mongoose';

const userNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['trip_approved', 'trip_rejected', 'trip_reminder', 'trip_cancelled', 'system_alert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSeen: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
userNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, isSeen: 1, createdAt: -1 });

const UserNotification = mongoose.model('UserNotification', userNotificationSchema);

export default UserNotification; 