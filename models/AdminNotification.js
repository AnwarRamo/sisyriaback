import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['trip_registration', 'trip_approval', 'trip_rejection', 'system_alert'],
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  userInfo: {
    fullName: String,
    email: String,
    phone: String,
    nationality: String,
    nationalId: String,
    personalId: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionRequired: {
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
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

export default AdminNotification; 