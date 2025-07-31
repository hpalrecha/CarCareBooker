interface WhatsAppMessage {
  to: string;
  message: string;
}

export async function sendWhatsAppMessage({ to, message }: WhatsAppMessage): Promise<boolean> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.error("WhatsApp credentials not configured");
      return false;
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/[^0-9]/g, ""), // Remove non-numeric characters
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

export function generateBookingConfirmationMessage(
  customerName: string,
  serviceName: string,
  date: string,
  time: string
): string {
  return `🎉 Hi ${customerName}! Your booking is CONFIRMED!

📅 Service: ${serviceName}
🕐 Date & Time: ${date} at ${time}
💰 Booking Fee: ₹299 PAID ✅

🎁 BONUS: You've earned a FREE Car Wash Voucher worth ₹500! 
✨ Show this confirmation at our store to claim your voucher.

📍 P91 Car Care, Adugodi, Bangalore
🗺️ Location: https://g.co/kgs/45xsTvV
📞 Call: +91 98765 43210

Thank you for choosing P91 Car Care! 
Your slot is secured. See you soon! 🚗✨`;
}
