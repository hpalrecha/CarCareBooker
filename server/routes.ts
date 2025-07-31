import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { authenticateAdmin, hashPassword, comparePassword } from "./middleware/auth";
import { createPaymentOrder, verifyPaymentSignature } from "./services/payment";
import { whatsappService } from "./services/whatsapp";
import { sendBookingConfirmationEmail } from "./services/email";
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
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    })
  );

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = adminLoginSchema.parse(req.body);
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
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
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, serviceData);
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
      const bookingData = bookingFormSchema.parse(req.body);
      
      // Check if time slot is available
      const timeSlot = await storage.getTimeSlot(bookingData.timeSlotId);
      if (!timeSlot || !timeSlot.isAvailable) {
        return res.status(400).json({ message: "Time slot not available" });
      }

      // Get service details
      const service = await storage.getService(bookingData.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Use booking fee amount (₹299) instead of full service price
      const bookingFeeAmount = bookingData.amount || 299; // ₹299 booking fee
      
      // Create Razorpay order with booking fee
      const paymentOrder = await createPaymentOrder(
        bookingFeeAmount,
        `booking_${Date.now()}`
      );

      // Create booking with pending payment
      const booking = await storage.createBooking({
        ...bookingData,
        amount: bookingFeeAmount.toString(), // Store as booking fee amount
        razorpayOrderId: paymentOrder.id,
        paymentStatus: "pending",
      });

      // Mark time slot as unavailable
      await storage.updateTimeSlot(bookingData.timeSlotId, { isAvailable: false });

      res.json({
        booking,
        paymentOrder: {
          id: paymentOrder.id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          key: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID,
        },
      });
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.post("/api/payment-webhook", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      // Verify payment signature
      const isValid = await verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Find booking by order ID
      const bookings = await storage.getBookingsByStatus("pending");
      const booking = bookings.find(b => b.razorpayOrderId === razorpay_order_id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking status
      const updatedBooking = await storage.updateBooking(booking.id, {
        paymentId: razorpay_payment_id,
        paymentStatus: "paid",
      });

      // Get service and time slot details for notifications
      const service = await storage.getService(booking.serviceId);
      const timeSlot = await storage.getTimeSlot(booking.timeSlotId);

      if (service && timeSlot) {
        // Send WhatsApp confirmation
        const whatsappMessage = generateBookingConfirmationMessage(
          booking.customerName,
          service.title,
          timeSlot.date.toLocaleDateString(),
          timeSlot.startTime
        );

        const whatsappSent = await sendWhatsAppMessage({
          to: booking.customerPhone,
          message: whatsappMessage,
        });

        // Send email confirmation
        const emailSent = await sendBookingConfirmationEmail({
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          serviceName: service.title,
          date: timeSlot.date.toLocaleDateString(),
          time: timeSlot.startTime,
          amount: booking.amount,
          bookingId: booking.id,
        });

        // Update notification status
        await storage.updateBooking(booking.id, {
          whatsappSent,
          emailSent,
        });
      }

      res.json({ message: "Payment confirmed" });
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

  const httpServer = createServer(app);
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

  return httpServer;
}
