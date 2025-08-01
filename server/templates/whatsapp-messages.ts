export interface BookingDetails {
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  amount: number;
  bookingId: string;
  customerPhone: string;
  customerEmail: string;
}

export const WhatsAppTemplates = {
  // Booking Confirmation Message
  bookingConfirmation: (booking: BookingDetails): string => {
    return `🚗 *P91 Car Care - Booking Confirmed* ✅

Hello ${booking.customerName}! 👋

Your car service booking has been *CONFIRMED*:

📋 *Service Details:*
• Service: ${booking.serviceName}
• Date: ${booking.appointmentDate}
• Time: ${booking.appointmentTime}
• Amount Paid: ₹${booking.amount}
• Booking ID: #${booking.bookingId.slice(0, 8).toUpperCase()}

📍 *Location:*
P91 Car Care Center
Bangalore, Karnataka

🔗 *Live Location:* https://maps.google.com/?q=12.9716,77.5946

📞 *Contact Us:*
WhatsApp: +91 74066 19191
Email: info@p91carcare.com

⏰ *Important Notes:*
• Please arrive 10 minutes before your scheduled time
• Bring a valid ID proof
• Our team will contact you 1 day before your appointment

Thank you for choosing P91 Car Care! 🙏
We're excited to serve you and make your car shine! ✨

*P91 Car Care - Where Every Car Gets Premium Treatment* 🌟`;
  },

  // Appointment Reminder Message (24 hours before)
  appointmentReminder: (booking: BookingDetails): string => {
    return `⏰ *P91 Car Care - Reminder* 🚗

Hello ${booking.customerName}! 👋

This is a friendly reminder about your car service appointment *TOMORROW*:

📋 *Your Appointment:*
• Service: ${booking.serviceName}
• Date: ${booking.appointmentDate}
• Time: ${booking.appointmentTime}
• Booking ID: #${booking.bookingId.slice(0, 8).toUpperCase()}

📍 *Location:*
P91 Car Care Center
Bangalore, Karnataka

🔗 *Live Location:* https://maps.google.com/?q=12.9716,77.5946

✅ *What to Bring:*
• Valid ID proof
• Vehicle registration documents
• Keys and any special instructions

📞 *Need to Reschedule?*
WhatsApp: +91 74066 19191
Call: +91 74066 19191

⭐ *Pro Tip:* Arrive 10 minutes early to ensure we start your service on time!

We're looking forward to serving you tomorrow! 🙏

*P91 Car Care - Premium Car Care Solutions* ✨`;
  },

  // Appointment Reminder Message (2 hours before)
  todayReminder: (booking: BookingDetails): string => {
    return `🚨 *P91 Car Care - Today's Appointment* ⏰

Hello ${booking.customerName}! 👋

Your car service appointment is *TODAY in 2 hours*:

📋 *Appointment Details:*
• Service: ${booking.serviceName}
• Time: ${booking.appointmentTime}
• Booking ID: #${booking.bookingId.slice(0, 8).toUpperCase()}

📍 *Our Address:*
P91 Car Care Center
Bangalore, Karnataka

🔗 *Navigate Now:* https://maps.google.com/?q=12.9716,77.5946

⏰ *Please arrive 10 minutes early*

📞 *Emergency Contact:*
WhatsApp: +91 74066 19191

See you soon! 🚗✨

*P91 Car Care Team*`;
  },

  // Service Completion Message
  serviceCompleted: (booking: BookingDetails): string => {
    return `✅ *P91 Car Care - Service Completed* 🚗✨

Hello ${booking.customerName}! 👋

Your *${booking.serviceName}* service has been completed successfully! 🎉

📋 *Service Summary:*
• Service: ${booking.serviceName}
• Date: ${booking.appointmentDate}
• Booking ID: #${booking.bookingId.slice(0, 8).toUpperCase()}

⭐ *Rate Your Experience:*
We'd love to hear your feedback! Please rate us on Google:
🔗 https://g.page/p91carcare/review

📸 *Show Off Your Car:*
Share photos of your freshly serviced car and tag us!
Instagram: @p91carcare

🎁 *Next Service Discount:*
Get 10% OFF on your next booking! 
Use code: LOYAL10

📞 *Stay Connected:*
WhatsApp: +91 74066 19191
Website: www.p91carcare.com

Thank you for choosing P91 Car Care! 🙏
Your car looks amazing! 🌟

*P91 Car Care - Premium Car Care Solutions*`;
  },

  // Payment Confirmation Message
  paymentReceived: (booking: BookingDetails): string => {
    return `💳 *P91 Car Care - Payment Received* ✅

Hello ${booking.customerName}! 👋

Your payment has been received successfully! 🎉

💰 *Payment Details:*
• Amount: ₹${booking.amount}
• Service: ${booking.serviceName}
• Booking ID: #${booking.bookingId.slice(0, 8).toUpperCase()}
• Status: PAID ✅

📋 *Next Steps:*
• Your appointment is confirmed
• We'll send a reminder 24 hours before
• Arrive 10 minutes early on your appointment day

📍 *Service Location:*
P91 Car Care Center
Bangalore, Karnataka

📞 *Questions?*
WhatsApp: +91 74066 19191

Thank you for your payment! 🙏
We're excited to serve you! 🚗✨

*P91 Car Care Team*`;
  },

  // Welcome Message for First-Time Customers
  welcomeMessage: (booking: BookingDetails): string => {
    return `🎉 *Welcome to P91 Car Care Family!* 👋

Hello ${booking.customerName}! 

Thank you for choosing P91 Car Care for your first service! 🚗✨

🌟 *What Makes Us Special:*
• Premium quality products
• Experienced technicians
• Transparent pricing
• Customer satisfaction guarantee

📋 *Your Booking:*
• Service: ${booking.serviceName}
• Date: ${booking.appointmentDate}
• Time: ${booking.appointmentTime}

📱 *Stay Updated:*
Follow us for car care tips and offers:
Instagram: @p91carcare
WhatsApp: +91 74066 19191

🎁 *First-Timer Bonus:*
You'll receive a complimentary car freshener! 

We can't wait to serve you! 🙏

*P91 Car Care - Where Premium Meets Affordable*`;
  }
};

// Utility function to send WhatsApp message
export const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
  // This would integrate with WhatsApp Business API
  console.log(`Sending WhatsApp to ${phoneNumber}:`, message);
  
  // TODO: Implement actual WhatsApp Business API integration
  // Example using Meta WhatsApp Cloud API:
  /*
  const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: message }
    })
  });
  */
};