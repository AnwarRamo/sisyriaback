import Notification from '../models/Notification.js';
import User from '../models/user.model.js';
import Trip from '../models/trip.model.js';

export const NotificationService = {
  // Create admin notification for new trip registration
  async createAdminRegistrationNotification(registration, user, trip) {
    try {
      const notification = await Notification.create({
        recipientType: 'admin',
        recipientId: user._id, // For admin notifications, we'll query by recipientType: 'admin'
        type: 'trip_registration',
        title: 'New Trip Registration',
        message: `New registration request for trip: ${trip.title}`,
        tripId: trip._id,
        bookingId: registration._id,
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

  // Event notifications
  async createUserEventApprovalNotification({ userId, eventTitle, eventDate, bookingId }) {
    try {
      const notification = await Notification.create({
        recipientType: 'user',
        recipientId: userId,
        type: 'event_approved',
        title: 'Event Request Approved!',
        message: `Your event request "${eventTitle}" is approved${eventDate ? ` for ${new Date(eventDate).toLocaleDateString()}` : ''}.`,
        bookingId,
      });
      return notification;
    } catch (error) {
      console.error('Error creating user event approval notification:', error);
      throw error;
    }
  },

  async createUserEventRejectionNotification({ userId, eventTitle, eventDate, bookingId, reason }) {
    try {
      const notification = await Notification.create({
        recipientType: 'user',
        recipientId: userId,
        type: 'event_rejected',
        title: 'Event Request Update',
        message: `Your event request "${eventTitle}" was not approved${reason ? `. Reason: ${reason}` : ''}.`,
        bookingId,
        metadata: { eventDate, reason }
      });
      return notification;
    } catch (error) {
      console.error('Error creating user event rejection notification:', error);
      throw error;
    }
  },

  // Create user notification for trip approval
  async createUserApprovalNotification(userId, tripId, bookingId, tripTitle) {
    try {
      const notification = await Notification.create({
        recipientType: 'user',
        recipientId: userId,
        type: 'trip_approved',
        title: 'Trip Registration Approved!',
        message: `Your registration for "${tripTitle}" has been approved. Get ready for your adventure!`,
        tripId,
        bookingId
      });
      return notification;
    } catch (error) {
      console.error('Error creating user approval notification:', error);
      throw error;
    }
  },

  // Create user notification for trip rejection
  async createUserRejectionNotification(userId, tripId, bookingId, tripTitle, rejectionReason) {
    try {
      const notification = await Notification.create({
        recipientType: 'user',
        recipientId: userId,
        type: 'trip_rejected',
        title: 'Trip Registration Update',
        message: `Your registration for "${tripTitle}" was not approved. Reason: ${rejectionReason}`,
        tripId,
        bookingId,
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
      const notification = await Notification.create({
        recipientType: 'user',
        recipientId: userId,
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
      const notifications = await Notification.find({ recipientType: 'admin' })
        .populate('recipientId', 'username email fullName')
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
      
      const notifications = await Notification.find({ 
        recipientType: 'user',
        recipientId: userId 
      })
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
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
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
      const notification = await Notification.findByIdAndUpdate(
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
      
      const count = await Notification.countDocuments({
        recipientType: 'user',
        recipientId: userId,
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
      const count = await Notification.countDocuments({
        recipientType: 'admin',
        isRead: false
      });
      return count;
    } catch (error) {
      console.error('Error getting unread admin notification count:', error);
      throw error;
    }
  },

  // Admin notification for ticket booking
  async createAdminTicketNotification({ ticket, user, trip }) {
    try {
      const notification = await Notification.create({
        recipientType: 'admin',
        recipientId: user._id,
        type: 'ticket_booking',
        title: 'New Ticket Booking',
        message: `New ticket booking for trip: ${trip.title}`,
        tripId: trip._id,
        userInfo: {
          fullName: user.displayName || user.username,
          email: user.email,
          phone: user.phone,
          nationalId: user.nationalId
        },
        metadata: {
          ticketNumber: ticket.ticketNumber,
          seatNumber: ticket.seatNumber,
          seatClass: ticket.seatClass,
          passengerName: ticket.passengerName,
          passengerId: ticket.passengerId,
          price: ticket.price
        },
        actionRequired: true
      });
      return notification;
    } catch (error) {
      console.error('Error creating admin ticket notification:', error);
      throw error;
    }
  },

  async createUserTicketApprovalNotification({ userId, tripId, ticketNumber, tripTitle, seatNumber }) {
    try {
      const notification = await Notification.create({
        recipientType: 'user',
        recipientId: userId,
        type: 'ticket_approved',
        title: 'Your Ticket is Confirmed! ✅',
        message: `Your ticket ${ticketNumber} for "${tripTitle}" is confirmed. Seat: ${seatNumber}.`,
        tripId,
        metadata: { ticketNumber, seatNumber }
      });
      return notification;
    } catch (error) {
      console.error('Error creating user ticket approval notification:', error);
      throw error;
    }
  },

  async createUserTicketRejectionNotification({ userId, tripId, ticketNumber, tripTitle, reason }) {
    try {
      const notification = await Notification.create({
        recipientType: 'user',
        recipientId: userId,
        type: 'ticket_rejected',
        title: 'Ticket Cancelled',
        message: `Your ticket ${ticketNumber} for "${tripTitle}" was cancelled. Reason: ${reason}.`,
        tripId,
        metadata: { ticketNumber, reason }
      });
      return notification;
    } catch (error) {
      console.error('Error creating user ticket rejection notification:', error);
      throw error;
    }
  }
}; 