import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

try {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  
  if (smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    console.warn("Email credentials not found. Email functionality will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize email service:", error);
}

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  date: string;
  time: string;
  amount: string;
  bookingId: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<boolean> {
  if (!transporter) {
    console.warn("Email service not configured. Skipping email send.");
    return false;
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #0A0A0B; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00FF94; color: #0A0A0B; padding: 20px; text-align: center; }
          .content { background-color: #1A1A1B; padding: 30px; }
          .detail-row { margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #333334; }
          .label { font-weight: bold; color: #00FF94; }
          .footer { background-color: #333334; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>P91 Car Care</h1>
            <h2>Booking Confirmed!</h2>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Your booking has been successfully confirmed. Here are the details:</p>
            
            <div class="detail-row">
              <span class="label">Service:</span> ${data.serviceName}
            </div>
            <div class="detail-row">
              <span class="label">Date & Time:</span> ${data.date} at ${data.time}
            </div>
            <div class="detail-row">
              <span class="label">Amount Paid:</span> ₹${data.amount}
            </div>
            <div class="detail-row">
              <span class="label">Booking ID:</span> ${data.bookingId}
            </div>
            <div class="detail-row">
              <span class="label">Location:</span> P91 Car Care, 123 Service Road, Adugodi, Bangalore 560030
            </div>
            
            <p>Please arrive 10 minutes before your scheduled time. If you need to reschedule or cancel, please contact us at least 2 hours in advance.</p>
            
            <p><strong>Contact Information:</strong><br>
            Phone: +91 98765 43210<br>
            WhatsApp: +91 98765 43210<br>
            Email: support@p91carcare.com</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing P91 Car Care!</p>
            <p>© 2024 P91 Car Care. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "P91 Car Care <noreply@p91carcare.com>",
      to: data.customerEmail,
      subject: "Booking Confirmed – P91 Car Care",
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}
