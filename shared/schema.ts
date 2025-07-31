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
  process: jsonb("process").$type<{step: number, title: string, description: string}[]>(),
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
  timeSlotId: varchar("time_slot_id").notNull().references(() => timeSlots.id),
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

// Schema types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = typeof timeSlots.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;

export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = typeof whatsappTemplates.$inferInsert;

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
