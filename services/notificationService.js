import AdminNotification from '../models/AdminNotification.js';
import UserNotification from '../models/UserNotification.js';
import User from '../models/user.model.js';
import Trip from '../models/trip.model.js';

export const NotificationService = {
  // Create admin notification for new trip registration
  async createAdminRegistrationNotification(registration, user, trip) {
    try {
      const notification = await AdminNotification.create({
        type: 'trip_registration',
        title: 'New Trip Registration',
        message: `New registration request for trip: ${trip.title}`,
        userId: user._id,
        tripId: trip._id,
        registrationId: registration._id,
        userInfo: {
          fullName: user.displayName || user.username,
          email: user.email,
          phone: user.phone,
          nationalId: user.nationalId
        },
        actionRequired: true,
        metadata: {
          numGuests: registration.numGuests,
          notes: registration.notes,
          amount: registration.amount
        }
      });
      return notification;
    } catch (error) {
      console.error('Error creating admin notification:', error);
      throw error;
    }
  },

  // Create user notification for trip approval
  async createUserApprovalNotification(userId, tripId, registrationId, tripTitle) {
    try {
      const notification = await UserNotification.create({
        userId,
        type: 'trip_approved',
        title: 'Trip Registration Approved!',
        message: `Your registration for "${tripTitle}" has been approved. Get ready for your adventure!`,
        tripId,
        registrationId
      });
      return notification;
    } catch (error) {
      console.error('Error creating user approval notification:', error);
      throw error;
    }
  },

  // Create user notification for trip rejection
  async createUserRejectionNotification(userId, tripId, registrationId, tripTitle, rejectionReason) {
    try {
      const notification = await UserNotification.create({
        userId,
        type: 'trip_rejected',
        title: 'Trip Registration Update',
        message: `Your registration for "${tripTitle}" was not approved. Reason: ${rejectionReason}`,
        tripId,
        registrationId,
        metadata: { rejectionReason }
      });
      return notification;
    } catch (error) {
      console.error('Error creating user rejection notification:', error);
      throw error;
    }
  },

  // Create trip reminder notification
  async createTripReminderNotification(userId, tripId, tripTitle, daysUntilTrip) {
    try {
      const notification = await UserNotification.create({
        userId,
        type: 'trip_reminder',
        title: 'Trip Reminder',
        message: `Your trip "${tripTitle}" starts in ${daysUntilTrip} days! Don't forget to prepare.`,
        tripId,
        metadata: { daysUntilTrip }
      });
      return notification;
    } catch (error) {
      console.error('Error creating trip reminder notification:', error);
      throw error;
    }
  },

  // Get admin notifications
  async getAdminNotifications(limit = 50, offset = 0) {
    try {
      const notifications = await AdminNotification.find()
        .populate('userId', 'username email fullName')
        .populate('tripId', 'title destination')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);
      
      return notifications;
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      throw error;
    }
  },

  // Get user notifications
  async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      console.log('NotificationService.getUserNotifications - userId:', userId);
      console.log('NotificationService.getUserNotifications - limit:', limit);
      console.log('NotificationService.getUserNotifications - offset:', offset);
      
      const notifications = await UserNotification.find({ userId })
        .populate('tripId', 'title destination startDate')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);
      
      console.log('NotificationService.getUserNotifications - found notifications:', notifications.length);
      console.log('NotificationService.getUserNotifications - notifications:', notifications);
      
      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await UserNotification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark admin notification as read
  async markAdminNotificationAsRead(notificationId) {
    try {
      const notification = await AdminNotification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking admin notification as read:', error);
      throw error;
    }
  },

  // Get unread notification count for user
  async getUnreadNotificationCount(userId) {
    try {
      console.log('NotificationService.getUnreadNotificationCount - userId:', userId);
      
      const count = await UserNotification.countDocuments({
        userId,
        isRead: false
      });
      
      console.log('NotificationService.getUnreadNotificationCount - count:', count);
      return count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  },

  // Get unread admin notification count
  async getUnreadAdminNotificationCount() {
    try {
      const count = await AdminNotification.countDocuments({
        isRead: false
      });
      return count;
    } catch (error) {
      console.error('Error getting unread admin notification count:', error);
      throw error;
    }
  }
}; 