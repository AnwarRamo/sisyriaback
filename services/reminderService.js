import { NotificationService } from './notificationService.js';
import Booking from '../models/Booking.model.js';
import Trip from '../models/trip.model.js';

export const ReminderService = {
  // Send trip reminders for upcoming trips
  async sendTripReminders() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      // Find approved registrations for trips starting in the next 3-7 days
      const upcomingTrips = await Booking.find({
        status: 'approved',
        'tripId.startDate': {
          $gte: now,
          $lte: sevenDaysFromNow
        }
      }).populate('tripId', 'title startDate');

      for (const booking of upcomingTrips) {
        const trip = booking.tripId;
        const daysUntilTrip = Math.ceil((trip.startDate - now) / (1000 * 60 * 60 * 24));

        // Send reminder if trip is in 3 days or 1 day
        if (daysUntilTrip === 3 || daysUntilTrip === 1) {
          await NotificationService.createTripReminderNotification(
            booking.userId,
            trip._id,
            trip.title,
            daysUntilTrip
          );
        }
      }

      console.log(`Sent ${upcomingTrips.length} trip reminders`);
    } catch (error) {
      console.error('Error sending trip reminders:', error);
    }
  },

  // Check for trips that are starting today and send final reminders
  async sendFinalReminders() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));

      const todayTrips = await Booking.find({
        status: 'approved',
        'tripId.startDate': {
          $gte: today,
          $lt: tomorrow
        }
      }).populate('tripId', 'title startDate');

      for (const booking of todayTrips) {
        const trip = booking.tripId;
        
        await NotificationService.createTripReminderNotification(
          booking.userId,
          trip._id,
          trip.title,
          0 // Today
        );
      }

      console.log(`Sent ${todayTrips.length} final trip reminders`);
    } catch (error) {
      console.error('Error sending final reminders:', error);
    }
  },

  // Clean up old notifications (older than 30 days)
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      
      // This would require adding a cleanup method to the notification service
      // For now, we'll just log the cleanup
      console.log('Cleaning up notifications older than 30 days');
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
}; 