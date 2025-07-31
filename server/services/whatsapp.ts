import { db } from "../db";
import { whatsappConfig, whatsappTemplates, type WhatsappConfig, type WhatsappTemplate } from "@shared/schema";
import { eq } from "drizzle-orm";

interface WhatsAppMessage {
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

      for (const template of data.data) {
        const [savedTemplate] = await db
          .insert(whatsappTemplates)
          .values({
            templateName: template.name,
            templateId: template.id,
            category: template.category,
            language: template.language,
            status: template.status,
            components: template.components,
          })
          .onConflictDoUpdate({
            target: whatsappTemplates.templateId,
            set: {
              status: template.status,
              components: template.components,
              updatedAt: new Date(),
            },
          })
          .returning();

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
    // Try to find booking confirmation template
    const templates = await this.getTemplates();
    const bookingTemplate = templates.find(t => 
      t.category === "booking_confirmation" && t.status === "APPROVED"
    );

    if (!bookingTemplate) {
      console.log("No approved booking confirmation template found");
      return false;
    }

    const message: WhatsAppMessage = {
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
    const templates = await this.getTemplates();
    const reminderTemplate = templates.find(t => 
      t.category === "appointment_reminder" && t.status === "APPROVED"
    );

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