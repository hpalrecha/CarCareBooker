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
    const config = await this.getConfig();
    if (!config) {
      console.log("WhatsApp not configured, skipping booking confirmation");
      return false;
    }

    // Use mapped template if available, otherwise fall back to category search
    let bookingTemplate;
    if (config.bookingConfirmationTemplateId && config.bookingConfirmationTemplateId !== "none") {
      const templates = await this.getTemplates();
      bookingTemplate = templates.find(t => 
        t.templateId === config.bookingConfirmationTemplateId && t.status === "APPROVED"
      );
    }
    
    // Fallback to category search or use any available utility template
    if (!bookingTemplate) {
      const templates = await this.getTemplates();
      bookingTemplate = templates.find(t => 
        t.category === "booking_confirmation" && t.status === "APPROVED"
      );
      
      // If no booking confirmation template, try booking reminder
      if (!bookingTemplate) {
        bookingTemplate = templates.find(t => 
          t.templateName === "p91_booking_reminder" && t.status === "APPROVED"
        );
      }
      
      // Last fallback - use hello_world for testing
      if (!bookingTemplate) {
        bookingTemplate = templates.find(t => 
          t.templateName === "hello_world" && t.status === "APPROVED"
        );
        console.log("Using hello_world template as fallback for booking confirmation");
      }
    }

    if (!bookingTemplate) {
      console.log("No approved templates found at all");
      return false;
    }

    const message: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: customerPhone.replace(/^\+/, ""), // Remove + prefix
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
              { type: "text", text: appointmentDate },
              { type: "text", text: appointmentTime },
              { type: "text", text: `₹${bookingAmount}` },
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

    // Use mapped template if available, otherwise fall back to category search
    let reminderTemplate;
    if (config.appointmentReminderTemplateId && config.appointmentReminderTemplateId !== "none") {
      const templates = await this.getTemplates();
      reminderTemplate = templates.find(t => 
        t.templateId === config.appointmentReminderTemplateId && t.status === "APPROVED"
      );
    }
    
    // Fallback to category search
    if (!reminderTemplate) {
      const templates = await this.getTemplates();
      reminderTemplate = templates.find(t => 
        t.category === "appointment_reminder" && t.status === "APPROVED"
      );
    }

    if (!reminderTemplate) {
      console.log("No approved appointment reminder template found");
      return false;
    }

    const message: WhatsAppMessage = {
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
              { type: "text", text: appointmentDate },
              { type: "text", text: appointmentTime },
            ],
          },
        ],
      },
    };

    return await this.sendMessage(message);
  }
}

export const whatsappService = new WhatsAppService();