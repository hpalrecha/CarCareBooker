import { db } from "../db";
import { whatsappConfig, whatsappTemplates, type WhatsappConfig, type WhatsappTemplate } from "@shared/schema";
import { eq } from "drizzle-orm";

interface WhatsAppMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

export class WhatsAppService {
  private config: WhatsappConfig | null = null;

  async getConfig(): Promise<WhatsappConfig | null> {
    if (!this.config) {
      const [config] = await db
        .select()
        .from(whatsappConfig)
        .where(eq(whatsappConfig.isActive, true))
        .limit(1);
      this.config = config || null;
    }
    return this.config;
  }

  async saveConfig(configData: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookVerifyToken?: string;
    bookingConfirmationTemplateId?: string;
    appointmentReminderTemplateId?: string;
  }): Promise<WhatsappConfig> {
    // Deactivate existing configs
    await db.update(whatsappConfig).set({ isActive: false });

    // Insert new config
    const [newConfig] = await db
      .insert(whatsappConfig)
      .values({
        ...configData,
        isActive: true,
      })
      .returning();

    this.config = newConfig;
    return newConfig;
  }

  async fetchTemplatesFromMeta(): Promise<WhatsappTemplate[]> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error("WhatsApp configuration not found");
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.businessAccountId}/message_templates`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Meta API error: ${response.statusText}`);
      }

      const data = await response.json();
      const templates: WhatsappTemplate[] = [];

      // Check if we have templates data
      if (!data.data || !Array.isArray(data.data)) {
        console.log("No templates found in Meta API response:", data);
        return templates;
      }

      console.log(`Found ${data.data.length} templates from Meta API`);

      for (const template of data.data) {
        // Check if template exists first
        const [existingTemplate] = await db
          .select()
          .from(whatsappTemplates)
          .where(eq(whatsappTemplates.templateId, template.id))
          .limit(1);

        let savedTemplate;
        if (existingTemplate) {
          // Update existing template
          [savedTemplate] = await db
            .update(whatsappTemplates)
            .set({
              templateName: template.name,
              category: template.category,
              language: template.language,
              status: template.status,
              components: template.components,
              updatedAt: new Date(),
            })
            .where(eq(whatsappTemplates.templateId, template.id))
            .returning();
        } else {
          // Insert new template
          [savedTemplate] = await db
            .insert(whatsappTemplates)
            .values({
              templateName: template.name,
              templateId: template.id,
              category: template.category,
              language: template.language,
              status: template.status,
              components: template.components,
            })
            .returning();
        }

        templates.push(savedTemplate);
      }

      return templates;
    } catch (error) {
      console.error("Failed to fetch templates from Meta:", error);
      throw error;
    }
  }

  async getTemplates(): Promise<WhatsappTemplate[]> {
    return await db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.isActive, true));
  }

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    const config = await this.getConfig();
    if (!config) {
      console.log("WhatsApp not configured, skipping message");
      return false;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("WhatsApp API error:", error);
        return false;
      }

      const result = await response.json();
      console.log("WhatsApp message sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error);
      return false;
    }
  }

  async sendBookingConfirmation(
    customerPhone: string,
    customerName: string,
    serviceName: string,
    appointmentDate: string,
    appointmentTime: string,
    bookingAmount: string = "299"
  ): Promise<boolean> {
    console.log("🔍 WhatsApp sendBookingConfirmation called");
    console.log("🔍 Parameters:", { customerPhone, customerName, serviceName, appointmentDate, appointmentTime, bookingAmount });
    
    const config = await this.getConfig();
    if (!config) {
      console.log("❌ WhatsApp not configured, skipping booking confirmation");
      return false;
    }
    
    console.log("✅ WhatsApp config found:", {
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      hasAccessToken: !!config.accessToken,
      isActive: config.isActive
    });

    // Use the configured booking confirmation template directly
    const templates = await this.getTemplates();
    console.log("📋 Available templates:", templates.map(t => ({ name: t.templateName, status: t.status })));
    
    let bookingTemplate = templates.find(t => 
      t.templateId === config.bookingConfirmationTemplateId && t.status === "APPROVED"
    );
    
    // If no mapped template, use p91_booking_confirmation directly
    if (!bookingTemplate) {
      bookingTemplate = templates.find(t => 
        t.templateName === "p91_booking_confirmation" && t.status === "APPROVED"
      );
    }

    if (!bookingTemplate) {
      console.log("❌ No approved p91_booking_confirmation template found");
      console.log("❌ Available templates:", templates.map(t => t.templateName));
      return false;
    }

    console.log(`✅ Using WhatsApp template: ${bookingTemplate.templateName}`);

    // Ensure phone number is in correct format (country code without +)
    let formattedPhone = customerPhone.replace(/^\+/, "").replace(/\s/g, "");
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }
    
    console.log(`📞 Formatted phone: ${customerPhone} -> ${formattedPhone}`);

    const message: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: bookingTemplate.templateName,
        language: {
          code: bookingTemplate.language,
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: serviceName },
              { type: "text", text: `${appointmentDate} at ${appointmentTime}` },
              { type: "text", text: `₹${bookingAmount}` },
              { type: "text", text: `BOOK-${Date.now()}` }
            ],
          },
        ],
      },
    };

    return await this.sendMessage(message);
  }

  async sendAppointmentReminder(
    customerPhone: string,
    customerName: string,
    serviceName: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<boolean> {
    const config = await this.getConfig();
    if (!config) {
      console.log("WhatsApp not configured, skipping appointment reminder");
      return false;
    }

    // Use the configured reminder template or fall back to p91_booking_reminder
    const templates = await this.getTemplates();
    let reminderTemplate = templates.find(t => 
      t.templateId === config.appointmentReminderTemplateId && t.status === "APPROVED"
    );
    
    // If no mapped template, use p91_booking_reminder directly
    if (!reminderTemplate) {
      reminderTemplate = templates.find(t => 
        t.templateName === "p91_booking_reminder" && t.status === "APPROVED"
      );
    }

    if (!reminderTemplate) {
      console.log("No approved p91_booking_reminder template found");
      return false;
    }

    console.log(`Using reminder template: ${reminderTemplate.templateName}`);

    const message: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: customerPhone.replace(/^\+/, ""),
      type: "template",
      template: {
        name: reminderTemplate.templateName,
        language: {
          code: reminderTemplate.language,
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: serviceName },
              { type: "text", text: `${appointmentDate} at ${appointmentTime}` }
            ],
          },
        ],
      },
    };

    return await this.sendMessage(message);
  }
}

export const whatsappService = new WhatsAppService();