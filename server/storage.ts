import {
  admins,
  services,
  timeSlots,
  bookings,
  siteSettings,
  blackoutDates,
  ppfLeads,
  businessHours,
  type Admin,
  type InsertAdmin,
  type Service,
  type InsertService,
  type TimeSlot,
  type InsertTimeSlot,
  type Booking,
  type InsertBooking,
  type SiteSetting,
  type InsertSiteSetting,
  type BlackoutDate,
  type InsertBlackoutDate,
  type PpfLead,
  type InsertPpfLead,
  type BusinessHour,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // Admin operations
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Service operations
  getAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  getServiceBySlug(slug: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Time slot operations
  getServiceTimeSlots(serviceId: string, date?: Date): Promise<TimeSlot[]>;
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot>;
  deleteTimeSlot(id: string): Promise<void>;

  // Booking operations
  getAllBookings(): Promise<(Booking & { service: Service; timeSlot: TimeSlot })[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;
  getBookingsByStatus(status: string): Promise<Booking[]>;

  // Settings operations
  getSetting(key: string): Promise<SiteSetting | undefined>;
  getSettingsByCategory(category: string): Promise<SiteSetting[]>;
  getAllSettings(): Promise<SiteSetting[]>;
  upsertSetting(setting: InsertSiteSetting): Promise<SiteSetting>;
  deleteSetting(key: string): Promise<void>;

  // Blackout date operations
  getAllBlackoutDates(): Promise<BlackoutDate[]>;
  getBlackoutDate(date: string): Promise<BlackoutDate | undefined>;
  createBlackoutDate(blackoutDate: InsertBlackoutDate): Promise<BlackoutDate>;
  deleteBlackoutDate(id: string): Promise<void>;

  // PPF leads operations
  getAllPpfLeads(): Promise<PpfLead[]>;
  getPpfLead(id: string): Promise<PpfLead | undefined>;
  createPpfLead(lead: InsertPpfLead): Promise<PpfLead>;
  updatePpfLeadStatus(id: string, status: string): Promise<PpfLead>;
  deletePpfLead(id: string): Promise<void>;

  // Business hours operations
  getAllBusinessHours(): Promise<BusinessHour[]>;
  getBusinessHoursForDay(dayOfWeek: number): Promise<BusinessHour | undefined>;
  initializeBusinessHours(): Promise<BusinessHour[]>;
  updateBusinessHours(dayOfWeek: number, updates: { isOpen?: boolean; openTime?: string; cutoffTime?: string }): Promise<BusinessHour>;
}

export class DatabaseStorage implements IStorage {
  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  // Service operations
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.title));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getServiceBySlug(slug: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.slug, slug));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const slug = service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const [newService] = await db.insert(services).values({ ...service, slug }).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Time slot operations
  async getServiceTimeSlots(serviceId: string, date?: Date): Promise<TimeSlot[]> {
    if (date) {
      const dateStr = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      
      return await db.select()
        .from(timeSlots)
        .where(
          and(
            eq(timeSlots.serviceId, serviceId),
            sql`DATE(${timeSlots.date}) = ${dateStr}`
          )
        )
        .orderBy(asc(timeSlots.startTime));
    }
    
    return await db.select()
      .from(timeSlots)
      .where(eq(timeSlots.serviceId, serviceId))
      .orderBy(asc(timeSlots.date), asc(timeSlots.startTime));
  }

  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const [timeSlot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return timeSlot;
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [newTimeSlot] = await db.insert(timeSlots).values(timeSlot).returning();
    return newTimeSlot;
  }

  async updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot> {
    const [updatedTimeSlot] = await db
      .update(timeSlots)
      .set(timeSlot)
      .where(eq(timeSlots.id, id))
      .returning();
    return updatedTimeSlot;
  }

  async deleteTimeSlot(id: string): Promise<void> {
    await db.delete(timeSlots).where(eq(timeSlots.id, id));
  }

  // Booking operations
  async getAllBookings(): Promise<(Booking & { service: Service; timeSlot: TimeSlot })[]> {
    const result = await db
      .select({
        booking: bookings,
        service: services,
        timeSlot: timeSlots,
      })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
      .orderBy(desc(bookings.createdAt));

    return result.map(row => ({
      ...row.booking,
      service: row.service!,
      timeSlot: row.timeSlot!,
    }));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async getBookingsByStatus(status: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.paymentStatus, status));
  }

  async getBookingByPaymentOrderId(orderId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.razorpayOrderId, orderId));
    return booking;
  }

  // Settings operations
  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async getSettingsByCategory(category: string): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings).where(eq(siteSettings.category, category));
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async upsertSetting(settingData: InsertSiteSetting): Promise<SiteSetting> {
    const [setting] = await db
      .insert(siteSettings)
      .values(settingData)
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: settingData.value,
          description: settingData.description,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(siteSettings).where(eq(siteSettings.key, key));
  }

  // Blackout date operations
  async getAllBlackoutDates(): Promise<BlackoutDate[]> {
    return await db.select().from(blackoutDates).orderBy(asc(blackoutDates.date));
  }

  async getBlackoutDate(date: string): Promise<BlackoutDate | undefined> {
    const [blackoutDate] = await db.select().from(blackoutDates).where(eq(blackoutDates.date, date));
    return blackoutDate;
  }

  async createBlackoutDate(blackoutDate: InsertBlackoutDate): Promise<BlackoutDate> {
    const [newBlackoutDate] = await db.insert(blackoutDates).values(blackoutDate).returning();
    return newBlackoutDate;
  }

  async deleteBlackoutDate(id: string): Promise<void> {
    await db.delete(blackoutDates).where(eq(blackoutDates.id, id));
  }

  // PPF leads operations
  async getAllPpfLeads(): Promise<PpfLead[]> {
    return await db.select().from(ppfLeads).orderBy(desc(ppfLeads.createdAt));
  }

  async getPpfLead(id: string): Promise<PpfLead | undefined> {
    const [lead] = await db.select().from(ppfLeads).where(eq(ppfLeads.id, id));
    return lead;
  }

  async createPpfLead(lead: InsertPpfLead): Promise<PpfLead> {
    const [newLead] = await db.insert(ppfLeads).values(lead).returning();
    return newLead;
  }

  async updatePpfLeadStatus(id: string, status: string): Promise<PpfLead> {
    const [updatedLead] = await db
      .update(ppfLeads)
      .set({ status })
      .where(eq(ppfLeads.id, id))
      .returning();
    return updatedLead;
  }

  async deletePpfLead(id: string): Promise<void> {
    await db.delete(ppfLeads).where(eq(ppfLeads.id, id));
  }

  // Business hours operations
  async getAllBusinessHours(): Promise<BusinessHour[]> {
    return await db.select().from(businessHours).orderBy(asc(businessHours.dayOfWeek));
  }

  async getBusinessHoursForDay(dayOfWeek: number): Promise<BusinessHour | undefined> {
    const [hours] = await db.select().from(businessHours).where(eq(businessHours.dayOfWeek, dayOfWeek));
    return hours;
  }

  async initializeBusinessHours(): Promise<BusinessHour[]> {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const defaultHours = dayNames.map((dayName, index) => ({
      dayOfWeek: index,
      dayName,
      isOpen: index !== 0, // Sunday closed by default
      openTime: '09:00',
      cutoffTime: index === 6 ? '14:00' : '18:00', // Saturday half day (2 PM), others full day (6 PM)
    }));

    // Insert all days, ignore conflicts (already exists)
    for (const hours of defaultHours) {
      const existing = await this.getBusinessHoursForDay(hours.dayOfWeek);
      if (!existing) {
        await db.insert(businessHours).values(hours);
      }
    }

    return this.getAllBusinessHours();
  }

  async updateBusinessHours(dayOfWeek: number, updates: { isOpen?: boolean; openTime?: string; cutoffTime?: string }): Promise<BusinessHour> {
    const [updated] = await db
      .update(businessHours)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businessHours.dayOfWeek, dayOfWeek))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
