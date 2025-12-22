import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Site settings table
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // booking, payment, general
  dataType: varchar("data_type").notNull(), // string, number, boolean, json
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// WhatsApp Business API configuration
export const whatsappConfig = pgTable("whatsapp_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accessToken: text("access_token").notNull(),
  phoneNumberId: varchar("phone_number_id").notNull(),
  businessAccountId: varchar("business_account_id").notNull(),
  webhookVerifyToken: varchar("webhook_verify_token"),
  // Template mappings for notifications
  bookingConfirmationTemplateId: varchar("booking_confirmation_template_id"),
  appointmentReminderTemplateId: varchar("appointment_reminder_template_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// WhatsApp message templates
export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateName: varchar("template_name").notNull(),
  templateId: varchar("template_id").notNull().unique(),
  category: varchar("category").notNull(), // booking_confirmation, appointment_reminder, etc.
  language: varchar("language").default("en").notNull(),
  status: varchar("status").notNull(), // APPROVED, PENDING, REJECTED
  components: jsonb("components").notNull(), // Template structure from Meta API
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  // Landing page content fields
  heroTitle: varchar("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  heroVideo: varchar("hero_video"), // YouTube/Vimeo URL or video file URL
  whyChoose: text("why_choose"),
  whatIncluded: jsonb("what_included").$type<string[]>(),
  process: jsonb("process").$type<{step: number, title: string, description: string, image?: string}[]>(),
  beforeAfter: jsonb("before_after").$type<{before: string, after: string, description?: string}[]>(),
  testimonials: jsonb("testimonials").$type<{name: string, rating: number, comment: string, image?: string}[]>(),
  faq: jsonb("faq").$type<{question: string, answer: string}[]>(),
  // Pricing and booking
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  discountText: varchar("discount_text"), // e.g., "Limited Time Offer!"
  duration: integer("duration").notNull(), // in minutes
  // Media
  images: jsonb("images").$type<string[]>(),
  gallery: jsonb("gallery").$type<{url: string, type: 'image' | 'video', caption?: string}[]>(),
  // SEO and conversion
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  ctaText: varchar("cta_text").default("Book Now"),
  urgencyText: varchar("urgency_text"), // e.g., "Only 3 slots left today!"
  guaranteeText: text("guarantee_text"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Available time slots for services
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  timeSlotId: varchar("time_slot_id").notNull(), // Changed: removed foreign key constraint for static time slots
  appointmentDate: varchar("appointment_date"), // Store the selected date (YYYY-MM-DD format)
  appointmentTime: varchar("appointment_time"), // Store the selected time (HH:MM format)
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentId: varchar("payment_id"),
  paymentStatus: varchar("payment_status").default("pending").notNull(), // pending, paid, failed
  bookingStatus: varchar("booking_status").default("confirmed").notNull(), // confirmed, completed, cancelled
  razorpayOrderId: varchar("razorpay_order_id"),
  whatsappSent: boolean("whatsapp_sent").default(false).notNull(),
  emailSent: boolean("email_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session storage for admin auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Blackout dates table - dates when booking is not allowed
export const blackoutDates = pgTable("blackout_dates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: varchar("date").notNull().unique(), // YYYY-MM-DD format
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Business hours table - cutoff times for each day of the week
export const businessHours = pgTable("business_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayOfWeek: integer("day_of_week").notNull().unique(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: varchar("day_name").notNull(), // Sunday, Monday, etc.
  isOpen: boolean("is_open").default(true).notNull(),
  openTime: varchar("open_time").default("09:00").notNull(), // HH:MM format
  cutoffTime: varchar("cutoff_time").default("18:00").notNull(), // HH:MM format - last booking time
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PPF & Ceramic Coating leads
export const ppfLeads = pgTable("ppf_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  vehicleType: varchar("vehicle_type").notNull(), // car, bike
  serviceInterest: varchar("service_interest").notNull(), // ppf, ceramic, both
  vehicleModel: varchar("vehicle_model"),
  message: text("message"),
  source: varchar("source").default("landing_page"), // landing_page, exit_intent
  status: varchar("status").default("new").notNull(), // new, contacted, converted, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = typeof timeSlots.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;

export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = typeof whatsappTemplates.$inferInsert;

export type BlackoutDate = typeof blackoutDates.$inferSelect;
export type InsertBlackoutDate = typeof blackoutDates.$inferInsert;

export type BusinessHour = typeof businessHours.$inferSelect;
export type InsertBusinessHour = typeof businessHours.$inferInsert;

export type PpfLead = typeof ppfLeads.$inferSelect;
export type InsertPpfLead = typeof ppfLeads.$inferInsert;

// Zod schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const bookingFormSchema = z.object({
  serviceId: z.string(),
  timeSlotId: z.string(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export const whatsappConfigSchema = z.object({
  accessToken: z.string().min(1),
  phoneNumberId: z.string().min(1),
  businessAccountId: z.string().min(1),
  webhookVerifyToken: z.string().optional(),
  bookingConfirmationTemplateId: z.string().optional(),
  appointmentReminderTemplateId: z.string().optional(),
});

export const whatsappTemplateSchema = z.object({
  templateName: z.string().min(1),
  templateId: z.string().min(1),
  category: z.string().min(1),
  language: z.string().default("en"),
  status: z.string(),
  components: z.any(),
});

export const insertBlackoutDateSchema = createInsertSchema(blackoutDates).omit({
  id: true,
  createdAt: true,
});

export const insertPpfLeadSchema = createInsertSchema(ppfLeads).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertBusinessHourSchema = createInsertSchema(businessHours).omit({
  id: true,
  updatedAt: true,
});

export const updateBusinessHourSchema = z.object({
  isOpen: z.boolean().optional(),
  openTime: z.string().optional(),
  cutoffTime: z.string().optional(),
});
