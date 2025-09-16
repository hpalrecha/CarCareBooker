import type { Booking, Service } from '@shared/schema';

const WEBHOOK_URL = "https://n8n.subspace.money/webhook/51cc1474-e1e5-4dea-b81c-857f7c8f0bc2";

export interface BookingWebhookPayload {
  // Booking Details
  bookingId: string;
  bookingStatus: string;
  paymentStatus: string;
  
  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Service Information
  serviceName: string;
  serviceId: string;
  serviceSlug?: string;
  
  // Appointment Details
  appointmentDate: string;
  appointmentTime: string;
  timeSlotId: string;
  
  // Payment Information
  amount: string;
  paymentId?: string;
  razorpayOrderId?: string;
  
  // Timestamps
  bookedOn: string; // createdAt
  updatedAt: string;
  
  // Communication Status
  whatsappSent: boolean;
  emailSent: boolean;
  
  // Event Type
  eventType: 'booking_created' | 'booking_payment_confirmed' | 'booking_updated';
}

export async function sendBookingWebhook(
  booking: Booking, 
  service: Service | null, 
  eventType: 'booking_created' | 'booking_payment_confirmed' | 'booking_updated'
): Promise<boolean> {
  try {
    console.log(`📡 Sending booking webhook for ${eventType}:`, booking.id);
    
    const payload: BookingWebhookPayload = {
      // Booking Details
      bookingId: booking.id,
      bookingStatus: booking.bookingStatus || 'confirmed',
      paymentStatus: booking.paymentStatus || 'pending',
      
      // Customer Information
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      
      // Service Information
      serviceName: service?.title || 'Unknown Service',
      serviceId: booking.serviceId,
      serviceSlug: service?.slug,
      
      // Appointment Details
      appointmentDate: booking.appointmentDate || '',
      appointmentTime: booking.appointmentTime || '',
      timeSlotId: booking.timeSlotId,
      
      // Payment Information
      amount: booking.amount,
      paymentId: booking.paymentId || undefined,
      razorpayOrderId: booking.razorpayOrderId || undefined,
      
      // Timestamps
      bookedOn: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      
      // Communication Status
      whatsappSent: booking.whatsappSent || false,
      emailSent: booking.emailSent || false,
      
      // Event Type
      eventType: eventType
    };
    
    console.log(`📡 Webhook payload:`, JSON.stringify(payload, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'P91CarCare/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log(`✅ Webhook sent successfully for booking ${booking.id}, status:`, response.status);
      return true;
    } else {
      console.error(`❌ Webhook failed for booking ${booking.id}, status:`, response.status, await response.text());
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Webhook error for booking ${booking.id}:`, error);
    return false;
  }
}