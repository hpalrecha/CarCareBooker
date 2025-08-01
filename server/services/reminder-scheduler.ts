import { storage } from "../storage";
import { WhatsAppTemplates, sendWhatsAppMessage, type BookingDetails } from "../templates/whatsapp-messages";

export class ReminderScheduler {
  private reminderIntervals: NodeJS.Timeout[] = [];

  constructor() {
    // Start the reminder service
    this.startReminderService();
  }

  private startReminderService() {
    // Check for reminders every hour
    const interval = setInterval(async () => {
      await this.checkAndSendReminders();
    }, 60 * 60 * 1000); // 1 hour

    this.reminderIntervals.push(interval);
  }

  private async checkAndSendReminders() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const twoHoursLater = new Date(now);
      twoHoursLater.setHours(twoHoursLater.getHours() + 2);

      // Get all paid bookings
      const bookings = await storage.getBookingsByStatus("paid");
      
      for (const booking of bookings) {
        if (!booking.appointmentDate || !booking.appointmentTime) continue;

        const appointmentDateTime = new Date(`${booking.appointmentDate} ${booking.appointmentTime}`);
        
        // Send 24-hour reminder
        if (this.isTomorrow(appointmentDateTime, now) && !booking.reminder24hSent) {
          await this.send24HourReminder(booking);
        }
        
        // Send 2-hour reminder
        if (this.isInTwoHours(appointmentDateTime, now) && !booking.reminder2hSent) {
          await this.send2HourReminder(booking);
        }
      }
    } catch (error) {
      console.error("Reminder service error:", error);
    }
  }

  private isTomorrow(appointmentDate: Date, now: Date): boolean {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return (
      appointmentDate.getDate() === tomorrow.getDate() &&
      appointmentDate.getMonth() === tomorrow.getMonth() &&
      appointmentDate.getFullYear() === tomorrow.getFullYear()
    );
  }

  private isInTwoHours(appointmentDate: Date, now: Date): boolean {
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    
    // Send reminder when appointment is between 1.5 to 2.5 hours away
    return timeDiff > (1.5 * 60 * 60 * 1000) && timeDiff <= (2.5 * 60 * 60 * 1000);
  }

  private async send24HourReminder(booking: any) {
    try {
      const service = await storage.getService(booking.serviceId);
      if (!service) return;

      const bookingDetails: BookingDetails = {
        customerName: booking.customerName,
        serviceName: service.title,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        amount: parseFloat(booking.amount),
        bookingId: booking.id,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail
      };

      const reminderMessage = WhatsAppTemplates.appointmentReminder(bookingDetails);
      await sendWhatsAppMessage(booking.customerPhone, reminderMessage);

      // Mark as sent
      await storage.updateBooking(booking.id, { reminder24hSent: true });
      
      console.log(`24-hour reminder sent to ${booking.customerName} for booking ${booking.id}`);
    } catch (error) {
      console.error("Failed to send 24-hour reminder:", error);
    }
  }

  private async send2HourReminder(booking: any) {
    try {
      const service = await storage.getService(booking.serviceId);
      if (!service) return;

      const bookingDetails: BookingDetails = {
        customerName: booking.customerName,
        serviceName: service.title,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        amount: parseFloat(booking.amount),
        bookingId: booking.id,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail
      };

      const reminderMessage = WhatsAppTemplates.todayReminder(bookingDetails);
      await sendWhatsAppMessage(booking.customerPhone, reminderMessage);

      // Mark as sent
      await storage.updateBooking(booking.id, { reminder2hSent: true });
      
      console.log(`2-hour reminder sent to ${booking.customerName} for booking ${booking.id}`);
    } catch (error) {
      console.error("Failed to send 2-hour reminder:", error);
    }
  }

  // Manual trigger for testing
  async sendTestReminder(bookingId: string, type: '24h' | '2h' = '24h') {
    try {
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      if (type === '24h') {
        await this.send24HourReminder(booking);
      } else {
        await this.send2HourReminder(booking);
      }

      return { success: true, message: `${type} reminder sent successfully` };
    } catch (error) {
      console.error("Test reminder failed:", error);
      return { success: false, message: "Failed to send test reminder" };
    }
  }

  // Clean up intervals
  destroy() {
    this.reminderIntervals.forEach(interval => clearInterval(interval));
    this.reminderIntervals = [];
  }
}

// Export singleton instance
export const reminderScheduler = new ReminderScheduler();