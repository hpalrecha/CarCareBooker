import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import express from "express";
import { storage } from "./storage";
import { authenticateAdmin, hashPassword, comparePassword } from "./middleware/auth";
import { createPaymentOrder, verifyPaymentSignature } from "./services/payment";
import { whatsappService } from "./services/whatsapp";
import { schedulerService } from "./services/scheduler";
import { sendBookingConfirmationEmail } from "./services/email";
import { sendBookingWebhook } from "./services/webhook";
import { z } from "zod";
import {
  adminLoginSchema,
  bookingFormSchema,
  insertServiceSchema,
  insertTimeSlotSchema,
  whatsappConfigSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const pgStore = connectPg(session);
  app.use(
    session({
      store: new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        tableName: "sessions",
      }),
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Set to false to work with Replit deployments
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        sameSite: 'lax'
      },
    })
  );

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      console.log("Admin login attempt:", { email: req.body.email, timestamp: new Date().toISOString() });
      
      const { email, password } = adminLoginSchema.parse(req.body);
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        console.log("Admin not found:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, admin.password);
      if (!isValidPassword) {
        console.log("Invalid password for admin:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      console.log("Admin login successful:", { adminId: admin.id, email: admin.email });
      
      res.json({ message: "Login successful", admin: { id: admin.id, email: admin.email, name: admin.name } });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/admin/logout", authenticateAdmin, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/admin/me", authenticateAdmin, (req, res) => {
    const admin = (req as any).admin;
    res.json({ id: admin.id, email: admin.email, name: admin.name });
  });

  // Service Management Routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      // Check if this is a slug or an ID
      const param = req.params.id;
      let service;
      
      if (param.includes('-')) {
        // Looks like a slug
        service = await storage.getServiceBySlug(param);
      } else {
        // Looks like an ID
        service = await storage.getService(param);
      }
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Get service error:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", authenticateAdmin, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.put("/api/services/:id", authenticateAdmin, async (req, res) => {
    try {
      // Pre-process the data to handle string-to-number conversions
      const body = { ...req.body };
      
      // Convert string numbers to proper types
      if (body.price !== undefined) {
        body.price = String(body.price);
      }
      if (body.originalPrice !== undefined) {
        body.originalPrice = body.originalPrice ? String(body.originalPrice) : null;
      }
      if (body.duration !== undefined) {
        body.duration = parseInt(String(body.duration), 10);
      }
      
      // For partial updates, we don't need strict validation
      // Just pass the cleaned data directly to storage
      const service = await storage.updateService(req.params.id, body);
      res.json(service);
    } catch (error) {
      console.error("Update service error:", error);
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.delete("/api/services/:id", authenticateAdmin, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Settings Routes
  app.get("/api/settings", authenticateAdmin, async (req, res) => {
    try {
      const category = req.query.category as string;
      const settings = category 
        ? await storage.getSettingsByCategory(category)
        : await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Get setting error:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.put("/api/settings/:key", authenticateAdmin, async (req, res) => {
    try {
      const { value, description, category, dataType } = req.body;
      const settingData = {
        key: req.params.key,
        value: value.toString(),
        description,
        category: category || "general",
        dataType: dataType || "string",
      };
      const setting = await storage.upsertSetting(settingData);
      res.json(setting);
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(400).json({ message: "Failed to update setting" });
    }
  });

  app.delete("/api/settings/:key", authenticateAdmin, async (req, res) => {
    try {
      await storage.deleteSetting(req.params.key);
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Delete setting error:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Blackout Dates Routes
  app.get("/api/blackout-dates", async (req, res) => {
    try {
      const blackoutDates = await storage.getAllBlackoutDates();
      res.json(blackoutDates);
    } catch (error) {
      console.error("Get blackout dates error:", error);
      res.status(500).json({ message: "Failed to fetch blackout dates" });
    }
  });

  app.post("/api/blackout-dates", authenticateAdmin, async (req, res) => {
    try {
      const { date, reason } = req.body;
      
      if (!date || !reason) {
        return res.status(400).json({ message: "Date and reason are required" });
      }

      const existingBlackout = await storage.getBlackoutDate(date);
      if (existingBlackout) {
        return res.status(400).json({ message: "This date is already blocked" });
      }

      const blackoutDate = await storage.createBlackoutDate({ date, reason });
      res.json(blackoutDate);
    } catch (error) {
      console.error("Create blackout date error:", error);
      res.status(400).json({ message: "Failed to create blackout date" });
    }
  });

  app.delete("/api/blackout-dates/:id", authenticateAdmin, async (req, res) => {
    try {
      await storage.deleteBlackoutDate(req.params.id);
      res.json({ message: "Blackout date deleted successfully" });
    } catch (error) {
      console.error("Delete blackout date error:", error);
      res.status(500).json({ message: "Failed to delete blackout date" });
    }
  });

  // Business Hours Routes
  app.get("/api/business-hours", async (req, res) => {
    try {
      const hours = await storage.getAllBusinessHours();
      res.json(hours);
    } catch (error) {
      console.error("Get business hours error:", error);
      res.status(500).json({ message: "Failed to fetch business hours" });
    }
  });

  app.post("/api/business-hours/initialize", authenticateAdmin, async (req, res) => {
    try {
      const hours = await storage.initializeBusinessHours();
      res.json(hours);
    } catch (error) {
      console.error("Initialize business hours error:", error);
      res.status(500).json({ message: "Failed to initialize business hours" });
    }
  });

  app.patch("/api/business-hours/:dayOfWeek", authenticateAdmin, async (req, res) => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);
      const { isOpen, openTime, cutoffTime } = req.body;
      
      const updated = await storage.updateBusinessHours(dayOfWeek, { isOpen, openTime, cutoffTime });
      res.json(updated);
    } catch (error) {
      console.error("Update business hours error:", error);
      res.status(400).json({ message: "Failed to update business hours" });
    }
  });

  // PPF Leads Routes
  app.get("/api/ppf-leads", authenticateAdmin, async (req, res) => {
    try {
      const leads = await storage.getAllPpfLeads();
      res.json(leads);
    } catch (error) {
      console.error("Get PPF leads error:", error);
      res.status(500).json({ message: "Failed to fetch PPF leads" });
    }
  });

  app.post("/api/ppf-leads", async (req, res) => {
    try {
      const { name, email, phone, vehicleType, serviceInterest, vehicleModel, message, source } = req.body;
      
      if (!name || !email || !phone || !vehicleType || !serviceInterest) {
        return res.status(400).json({ message: "Name, email, phone, vehicle type, and service interest are required" });
      }

      const lead = await storage.createPpfLead({
        name,
        email,
        phone,
        vehicleType,
        serviceInterest,
        vehicleModel: vehicleModel || null,
        message: message || null,
        source: source || "landing_page",
      });
      res.json(lead);
    } catch (error) {
      console.error("Create PPF lead error:", error);
      res.status(400).json({ message: "Failed to create lead" });
    }
  });

  app.patch("/api/ppf-leads/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const lead = await storage.updatePpfLeadStatus(req.params.id, status);
      res.json(lead);
    } catch (error) {
      console.error("Update PPF lead status error:", error);
      res.status(400).json({ message: "Failed to update lead status" });
    }
  });

  app.delete("/api/ppf-leads/:id", authenticateAdmin, async (req, res) => {
    try {
      await storage.deletePpfLead(req.params.id);
      res.json({ message: "Lead deleted successfully" });
    } catch (error) {
      console.error("Delete PPF lead error:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Time Slot Routes
  app.get("/api/services/:serviceId/slots/:date", async (req, res) => {
    try {
      const { serviceId, date } = req.params;
      const serviceDate = new Date(date);
      const slots = await storage.getServiceTimeSlots(serviceId, serviceDate);
      res.json(slots);
    } catch (error) {
      console.error("Get time slots error:", error);
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  app.post("/api/services/:serviceId/slots", authenticateAdmin, async (req, res) => {
    try {
      const slotData = insertTimeSlotSchema.parse({
        ...req.body,
        serviceId: req.params.serviceId,
      });
      const slot = await storage.createTimeSlot(slotData);
      res.json(slot);
    } catch (error) {
      console.error("Create time slot error:", error);
      res.status(400).json({ message: "Invalid time slot data" });
    }
  });

  // Booking Routes
  app.post("/api/bookings", async (req, res) => {
    try {
      console.log("Booking request body:", req.body);
      
      // Parse booking data with extended schema to include amount and appointment fields
      const extendedBookingSchema = bookingFormSchema.extend({
        amount: z.number().optional(),
        isBookingFee: z.boolean().optional(),
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
      });
      
      const bookingData = extendedBookingSchema.parse(req.body);
      
      // Check if appointment date is a blackout date
      if (bookingData.appointmentDate) {
        const blackoutDates = await storage.getAllBlackoutDates();
        const isBlackout = blackoutDates.some(bd => bd.date === bookingData.appointmentDate);
        
        if (isBlackout) {
          const blackoutDate = blackoutDates.find(bd => bd.date === bookingData.appointmentDate);
          return res.status(400).json({ 
            message: `Booking not available for this day – ${blackoutDate?.reason}. Please choose another date before or after.` 
          });
        }
      }

      // Check business hours and cutoff time
      if (bookingData.appointmentDate && bookingData.appointmentTime) {
        const appointmentDay = new Date(bookingData.appointmentDate + 'T00:00:00').getDay();
        const businessHours = await storage.getBusinessHoursForDay(appointmentDay);
        
        if (businessHours) {
          // Check if the store is open on this day
          if (!businessHours.isOpen) {
            return res.status(400).json({ 
              message: `Sorry, we are closed on ${businessHours.dayName}. Please select another day.` 
            });
          }
          
          // Check if booking time is after cutoff
          const bookingTime = bookingData.appointmentTime;
          const cutoffTime = businessHours.cutoffTime;
          
          if (bookingTime > cutoffTime) {
            return res.status(400).json({ 
              message: `Bookings after ${cutoffTime.replace(':', ':')} are not available on ${businessHours.dayName}. Please select an earlier time slot.` 
            });
          }
          
          // Check if booking time is before opening
          const openTime = businessHours.openTime;
          if (bookingTime < openTime) {
            return res.status(400).json({ 
              message: `We open at ${openTime} on ${businessHours.dayName}. Please select a later time slot.` 
            });
          }
        }
      }
      
      // Skip time slot validation - using static time slots
      // No need to check database for time slot availability
      
      // Get service details
      const service = await storage.getService(bookingData.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get booking fee amount from settings or use default
      let bookingFeeAmount = bookingData.amount || 299; // Default ₹299 booking fee
      
      // Check if this is the Annual Maintenance Package - charge full price
      if (service.slug === 'annual-maintenance-package') {
        bookingFeeAmount = parseFloat(service.price);
        console.log("Annual Maintenance Package - charging full price:", bookingFeeAmount);
      } else {
        try {
          const bookingAmountSetting = await storage.getSetting("booking_amount");
          if (bookingAmountSetting && bookingAmountSetting.value) {
            bookingFeeAmount = parseFloat(bookingAmountSetting.value);
          }
        } catch (error) {
          console.log("Using default booking amount due to setting fetch error:", error);
        }
      }
      
      // Check if payment service is configured
      if (!process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_TEST_KEY_ID) {
        // For development, create booking without payment
        const booking = await storage.createBooking({
          serviceId: bookingData.serviceId,
          timeSlotId: bookingData.timeSlotId,
          appointmentDate: bookingData.appointmentDate,
          appointmentTime: bookingData.appointmentTime,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          amount: bookingFeeAmount.toString(),
          razorpayOrderId: `dev_order_${Date.now()}`,
          paymentStatus: "completed", // Skip payment for development
        });

        // Skip marking time slot as unavailable - using static time slots
        
        // Send webhook for booking creation (development mode)
        try {
          await sendBookingWebhook(booking, service, 'booking_created');
        } catch (webhookError) {
          console.error("Failed to send booking webhook (development):", webhookError);
          // Don't fail the booking if webhook fails
        }
        
        return res.json({
          booking,
          paymentOrder: {
            id: `dev_order_${Date.now()}`,
            amount: bookingFeeAmount * 100, // Convert to paisa
            currency: "INR",
            key: "dev_key",
          },
          message: "Development mode: Booking created without payment"
        });
      }
      
      // Create Razorpay order with booking fee
      const paymentOrder = await createPaymentOrder(
        bookingFeeAmount,
        `booking_${Date.now()}`
      );

      // Create booking with pending payment
      const booking = await storage.createBooking({
        serviceId: bookingData.serviceId,
        timeSlotId: bookingData.timeSlotId,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        amount: bookingFeeAmount.toString(),
        razorpayOrderId: paymentOrder.id,
        paymentStatus: "pending",
      });

      // Skip marking time slot as unavailable - using static time slots
      
      // Send webhook for booking creation (production mode)
      try {
        await sendBookingWebhook(booking, service, 'booking_created');
      } catch (webhookError) {
        console.error("Failed to send booking webhook (production):", webhookError);
        // Don't fail the booking if webhook fails
      }
      
      res.json({
        booking,
        paymentOrder: {
          id: paymentOrder.id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          key: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      console.error("Create booking error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        });
      }
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  // Payment confirmation endpoint (called by frontend after successful payment)
  app.post("/api/confirm-payment", async (req, res) => {
    try {
      console.log("🔄 Payment confirmation called at", new Date().toISOString());
      console.log("📦 Payment payload:", req.body);
      
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error("Missing required payment fields");
        return res.status(400).json({ message: "Missing required payment fields" });
      }

      // Verify payment signature
      const isValid = await verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      console.log("Payment signature verification:", isValid);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Find booking by order ID
      console.log("🔍 Looking for booking with order ID:", razorpay_order_id);
      const bookings = await storage.getBookingsByStatus("pending");
      console.log("📊 Found", bookings.length, "pending bookings");
      console.log("🎯 Pending booking order IDs:", bookings.map(b => b.razorpayOrderId));
      
      const booking = bookings.find(b => b.razorpayOrderId === razorpay_order_id);

      if (!booking) {
        console.error("❌ Booking not found for order ID:", razorpay_order_id);
        return res.status(404).json({ message: "Booking not found" });
      }
      
      console.log("✅ Found booking:", booking.id, "for customer:", booking.customerName);

      // Update booking status
      console.log("💳 Updating booking status to paid...");
      const updatedBooking = await storage.updateBooking(booking.id, {
        paymentId: razorpay_payment_id,
        paymentStatus: "paid",
      });
      console.log("✅ Booking status updated successfully");

      // Get service and time slot details for notifications
      const service = await storage.getService(booking.serviceId);
      const timeSlot = await storage.getTimeSlot(booking.timeSlotId);

      let whatsappSent = false;
      if (service) {
        // Send WhatsApp confirmation using the proper service
        console.log("📱 Sending WhatsApp confirmation...");
        console.log("📱 Customer phone:", booking.customerPhone);
        console.log("📱 Customer name:", booking.customerName);
        console.log("📱 Service title:", service.title);
        console.log("📱 Appointment date:", booking.appointmentDate);
        console.log("📱 Appointment time:", booking.appointmentTime);
        console.log("📱 Amount:", booking.amount);
        
        whatsappSent = await whatsappService.sendBookingConfirmation(
          booking.customerPhone,
          booking.customerName,
          service.title,
          booking.appointmentDate || new Date().toLocaleDateString(),
          booking.appointmentTime || "10:00 AM",
          booking.amount.toString()
        );
        console.log("📱 WhatsApp sent result:", whatsappSent);

        // Send email confirmation (if email service is configured)
        let emailSent = false;
        try {
          // Email service would go here if configured
          console.log("📧 Email service not configured, skipping email notification");
        } catch (error) {
          console.log("📧 Email service error:", error);
        }

        // Update notification status
        await storage.updateBooking(booking.id, {
          whatsappSent,
          emailSent,
        });
      }

      // Send webhook for booking payment confirmation
      try {
        await sendBookingWebhook(updatedBooking, service || null, 'booking_payment_confirmed');
      } catch (webhookError) {
        console.error("Failed to send payment confirmation webhook:", webhookError);
        // Don't fail the payment confirmation if webhook fails
      }

      console.log("🎉 Payment confirmation complete!");
      res.json({ 
        message: "Payment confirmed",
        booking: updatedBooking,
        whatsappSent,
        success: true
      });
    } catch (error) {
      console.error("Payment webhook error:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  app.get("/api/bookings", authenticateAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", authenticateAdmin, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings/:id/send-whatsapp", authenticateAdmin, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const service = await storage.getService(booking.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Send WhatsApp notification
      const whatsappSent = await whatsappService.sendBookingConfirmation({
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        serviceName: service.title,
        date: new Date().toLocaleDateString(),
        time: booking.timeSlotId,
        amount: booking.amount,
        bookingId: booking.id,
      });

      if (whatsappSent) {
        await storage.updateBooking(booking.id, { whatsappSent: true });
        res.json({ message: "WhatsApp notification sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send WhatsApp notification" });
      }
    } catch (error) {
      console.error("Send WhatsApp error:", error);
      res.status(500).json({ message: "Failed to send WhatsApp notification" });
    }
  });

  // WhatsApp Business API Routes
  app.get("/api/whatsapp/config", authenticateAdmin, async (req, res) => {
    try {
      const config = await whatsappService.getConfig();
      if (!config) {
        return res.json(null);
      }
      // Don't expose sensitive data
      res.json({
        id: config.id,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        isActive: config.isActive,
        createdAt: config.createdAt,
      });
    } catch (error) {
      console.error("Get WhatsApp config error:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp configuration" });
    }
  });

  app.post("/api/whatsapp/config", authenticateAdmin, async (req, res) => {
    try {
      const configData = whatsappConfigSchema.parse(req.body);
      const config = await whatsappService.saveConfig(configData);
      res.json({
        id: config.id,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        isActive: config.isActive,
        createdAt: config.createdAt,
      });
    } catch (error) {
      console.error("Save WhatsApp config error:", error);
      res.status(400).json({ message: "Invalid WhatsApp configuration data" });
    }
  });

  app.get("/api/whatsapp/templates", authenticateAdmin, async (req, res) => {
    try {
      const templates = await whatsappService.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get WhatsApp templates error:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp templates" });
    }
  });

  app.post("/api/whatsapp/templates/fetch", authenticateAdmin, async (req, res) => {
    try {
      const templates = await whatsappService.fetchTemplatesFromMeta();
      res.json(templates);
    } catch (error) {
      console.error("Fetch WhatsApp templates error:", error);
      res.status(500).json({ message: "Failed to fetch templates from Meta API" });
    }
  });

  // Test route for debugging payment flow
  app.post("/api/test-payment", async (req, res) => {
    try {
      console.log("Test payment called with:", req.body);
      res.json({ status: "success", message: "Test payment endpoint working" });
    } catch (error) {
      console.error("Test payment error:", error);
      res.status(500).json({ message: "Test payment failed" });
    }
  });

  // Test payment confirmation manually (for debugging)
  app.post("/api/test-payment-confirmation", async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID required" });
      }
      
      console.log("🧪 Testing payment confirmation for booking:", bookingId);
      
      // Get the booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Update to paid status
      await storage.updateBooking(bookingId, {
        paymentStatus: "paid",
        paymentId: `test_${Date.now()}`
      });
      
      // Get service for WhatsApp
      const service = await storage.getService(booking.serviceId);
      if (service) {
        const whatsappSent = await whatsappService.sendBookingConfirmation(
          booking.customerPhone,
          booking.customerName,
          service.title,
          booking.appointmentDate || new Date().toLocaleDateString(),
          booking.appointmentTime || "10:00 AM",
          booking.amount.toString()
        );
        
        console.log("🧪 Test WhatsApp result:", whatsappSent);
        
        res.json({ 
          success: true, 
          message: "Test payment confirmation complete",
          whatsappSent,
          booking: booking
        });
      } else {
        res.json({ success: false, message: "Service not found" });
      }
    } catch (error) {
      console.error("Test payment confirmation error:", error);
      res.status(500).json({ message: "Test failed" });
    }
  });

  // Razorpay Webhook for payment confirmations
  app.post("/api/razorpay-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (webhookSecret) {
        const crypto = require("crypto");
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(req.body)
          .digest("hex");
        
        if (expectedSignature !== webhookSignature) {
          console.error("Invalid webhook signature");
          return res.status(400).json({ message: "Invalid signature" });
        }
      }

      const event = JSON.parse(req.body.toString());
      console.log("Razorpay webhook event:", event.event);

      // Handle payment success events
      if (event.event === "payment.captured" || event.event === "payment.authorized") {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        
        // Find booking by payment order ID
        const booking = await storage.getBookingByPaymentOrderId(orderId);
        if (booking && booking.status === "pending") {
          await storage.updateBooking(booking.id, {
            status: "paid",
            paymentId: payment.id,
          });
          
          console.log(`Booking ${booking.id} marked as paid via webhook`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Contact form submission route
  const contactFormSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    subject: z.string().min(5),
    message: z.string().min(10),
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = contactFormSchema.parse(req.body);
      
      // Store contact submission (you can add a contacts table if needed)
      console.log("Contact form submission:", contactData);
      
      // For now, we'll just log the contact form submission
      // In a real application, you would:
      // 1. Store it in database
      // 2. Send email notification to admin
      // 3. Send auto-reply to customer
      
      res.json({ message: "Contact form submitted successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(400).json({ message: "Invalid contact form data" });
    }
  });

  // Test WhatsApp endpoint - send actual booking confirmation
  app.post("/api/test-whatsapp", async (req, res) => {
    try {
      const { to, customerName, serviceName, appointmentDate, appointmentTime, bookingAmount } = req.body;
      
      console.log("Sending booking confirmation WhatsApp message to:", to);
      
      const config = await whatsappService.getConfig();
      if (!config) {
        return res.status(500).json({ success: false, message: "WhatsApp not configured" });
      }

      // Use the booking reminder template
      const bookingMessage = {
        messaging_product: "whatsapp",
        to: to.replace(/^\+/, ""),
        type: "template",
        template: {
          name: "p91_booking_reminder",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName || "Jagpreet" },
                { type: "text", text: serviceName || "Headlight Restoration - Both Lights" },
                { type: "text", text: `${appointmentDate || "August 2, 2025"} at ${appointmentTime || "11:00 AM"}` }
              ]
            }
          ]
        }
      };

      console.log("Sending booking confirmation:", JSON.stringify(bookingMessage, null, 2));

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingMessage),
        }
      );

      const result = await response.json();
      console.log("WhatsApp API response:", result);

      if (response.ok) {
        console.log("Booking confirmation sent successfully to:", to);
        res.json({ 
          success: true, 
          message: `Booking confirmation sent to ${to}`,
          details: {
            customerName: customerName || "Jagpreet",
            serviceName: serviceName || "Headlight Restoration - Both Lights",
            appointmentDate: appointmentDate || "August 2, 2025",
            appointmentTime: appointmentTime || "11:00 AM",
            bookingAmount: `₹${bookingAmount || "299"}`
          },
          whatsappResponse: result
        });
      } else {
        console.log("Failed to send booking confirmation:", result);
        res.status(500).json({ 
          success: false, 
          message: "Failed to send booking confirmation",
          error: result
        });
      }
    } catch (error) {
      console.error("Booking confirmation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error sending booking confirmation",
        error: error.message 
      });
    }
  });

  // Manual payment status update for debugging (Admin only)
  app.post("/api/admin/bookings/:id/mark-paid", authenticateAdmin, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const { paymentId } = req.body;
      
      console.log("🔧 Manual payment status update for booking:", bookingId);
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Update booking status manually
      const updatedBooking = await storage.updateBooking(bookingId, {
        paymentId: paymentId || `manual_${Date.now()}`,
        paymentStatus: "paid",
      });
      
      // Get service details for notifications
      const service = await storage.getService(booking.serviceId);
      
      if (service) {
        // Send WhatsApp confirmation
        const whatsappSent = await whatsappService.sendBookingConfirmation(
          booking.customerPhone,
          booking.customerName,
          service.title,
          booking.appointmentDate || new Date().toLocaleDateString(),
          booking.appointmentTime || "10:00 AM",
          booking.amount
        );
        
        // Update notification status
        await storage.updateBooking(bookingId, {
          whatsappSent,
          emailSent: false,
        });
        
        console.log("✅ Booking marked as paid and notification sent");
        
        res.json({ 
          success: true, 
          message: "Booking marked as paid and WhatsApp notification sent",
          booking: updatedBooking,
          whatsappSent 
        });
      } else {
        res.json({ 
          success: true, 
          message: "Booking marked as paid",
          booking: updatedBooking 
        });
      }
    } catch (error) {
      console.error("Manual payment update error:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Scheduler management endpoints (Admin only)
  app.get("/api/admin/scheduler/status", authenticateAdmin, async (req, res) => {
    try {
      const status = schedulerService.getSchedulerStatus();
      res.json(status);
    } catch (error) {
      console.error("Scheduler status error:", error);
      res.status(500).json({ message: "Failed to get scheduler status" });
    }
  });

  app.post("/api/admin/scheduler/test-reminders", authenticateAdmin, async (req, res) => {
    try {
      console.log("Manual reminder test triggered by admin");
      await schedulerService.triggerReminderCheck();
      res.json({ 
        success: true, 
        message: "Reminder check completed successfully" 
      });
    } catch (error) {
      console.error("Manual reminder test error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to run reminder check",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
