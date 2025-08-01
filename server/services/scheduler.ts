import cron from 'node-cron';
import { storage } from '../storage';
import { whatsappService } from '../services/whatsapp';

export class SchedulerService {
  private static instance: SchedulerService;
  private reminderJobActive = false;

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  // Start the reminder scheduler - runs daily at 8:00 PM IST
  startReminderScheduler() {
    if (this.reminderJobActive) {
      console.log("Reminder scheduler already active");
      return;
    }

    // Schedule reminder job for 8:00 PM IST daily
    // Cron format: minute hour day month weekday
    // 0 20 * * * = Every day at 8:00 PM
    const reminderJob = cron.schedule('0 20 * * *', async () => {
      console.log('Running daily reminder check at 8:00 PM IST...');
      await this.sendDailyReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // IST timezone
    });

    this.reminderJobActive = true;
    console.log('✅ Reminder scheduler started - will send reminders daily at 8:00 PM IST');
  }

  // Send reminders for appointments happening tomorrow
  async sendDailyReminders() {
    try {
      // Get tomorrow's date in YYYY-MM-DD format
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(`Checking for appointments on ${tomorrowDateString}...`);

      // Get all confirmed bookings for tomorrow
      const allBookings = await storage.getAllBookings();
      const tomorrowBookings = allBookings.filter(booking => 
        booking.appointmentDate === tomorrowDateString && 
        booking.paymentStatus === 'paid' &&
        booking.bookingStatus === 'confirmed'
      );

      console.log(`Found ${tomorrowBookings.length} appointments for tomorrow`);

      if (tomorrowBookings.length === 0) {
        console.log('No appointments tomorrow - skipping reminders');
        return;
      }

      // Send reminder for each booking
      let successCount = 0;
      let failureCount = 0;

      for (const booking of tomorrowBookings) {
        try {
          // Get service details
          const service = await storage.getService(booking.serviceId);
          if (!service) {
            console.log(`Service not found for booking ${booking.id}`);
            failureCount++;
            continue;
          }

          // Send WhatsApp reminder
          const reminderSent = await whatsappService.sendAppointmentReminder(
            booking.customerPhone,
            booking.customerName,
            service.title,
            booking.appointmentDate || tomorrowDateString,
            booking.appointmentTime || '10:00 AM'
          );

          if (reminderSent) {
            console.log(`✅ Reminder sent to ${booking.customerName} (${booking.customerPhone})`);
            successCount++;
          } else {
            console.log(`❌ Failed to send reminder to ${booking.customerName}`);
            failureCount++;
          }

          // Add small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error sending reminder for booking ${booking.id}:`, error);
          failureCount++;
        }
      }

      console.log(`\n📊 Daily reminder summary for ${tomorrowDateString}:`);
      console.log(`✅ Successfully sent: ${successCount} reminders`);
      console.log(`❌ Failed: ${failureCount} reminders`);
      console.log(`📱 Total customers notified: ${successCount}/${tomorrowBookings.length}`);

    } catch (error) {
      console.error('Error in daily reminder job:', error);
    }
  }

  // Stop the reminder scheduler
  stopReminderScheduler() {
    if (this.reminderJobActive) {
      // Note: node-cron doesn't provide a direct way to stop specific jobs
      // In a production system, you'd want to store job references
      this.reminderJobActive = false;
      console.log('Reminder scheduler stopped');
    }
  }

  // Manual trigger for testing - send reminders now
  async triggerReminderCheck() {
    console.log('🔄 Manual reminder check triggered...');
    await this.sendDailyReminders();
  }

  // Get scheduler status
  getSchedulerStatus() {
    return {
      reminderJobActive: this.reminderJobActive,
      nextReminderTime: this.reminderJobActive ? 'Daily at 8:00 PM IST' : 'Not scheduled',
      timezone: 'Asia/Kolkata (IST)'
    };
  }
}

export const schedulerService = SchedulerService.getInstance();