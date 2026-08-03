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

/**
 * Result of a WhatsApp send. A boolean is not proof of delivery — only a provider
 * message ID is, so callers can persist `messageId` for audit and reconciliation.
 */
export interface WhatsAppSendResult {
  success: boolean;
  /** Meta message id, e.g. "wamid.HBg..." — present only on a successful send. */
  messageId?: string;
  httpStatus?: number;
  /** Short, safe error summary. Never contains the access token. */
  error?: string;
}

/** +919886682013 -> +91******2013 */
function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '(none)';
  const s = String(phone);
  if (s.length <= 4) return '****';
  return s.slice(0, 3) + '*'.repeat(Math.max(0, s.length - 7)) + s.slice(-4);
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

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const config = await this.getConfig();
    if (!config) {
      console.log("WhatsApp not configured, skipping message");
      return { success: false, error: "WhatsApp not configured" };
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

      const bodyText = await response.text().catch(() => "");

      if (!response.ok) {
        // Meta nests the useful bit at error.message; keep it short and token-free.
        let summary = bodyText.slice(0, 200);
        try {
          const parsed = JSON.parse(bodyText);
          if (parsed?.error?.message) summary = String(parsed.error.message).slice(0, 200);
        } catch {
          /* non-JSON error body */
        }
        console.error(
          `WhatsApp API error to=${maskPhone(message.to)} http=${response.status} msg="${summary}"`
        );
        return { success: false, httpStatus: response.status, error: summary };
      }

      let messageId: string | undefined;
      try {
        const parsed = JSON.parse(bodyText);
        messageId = parsed?.messages?.[0]?.id;
      } catch {
        /* shouldn't happen on 2xx, but never fail the send over parsing */
      }

      console.log(
        `WhatsApp message sent to=${maskPhone(message.to)} http=${response.status} ` +
          `messageId=${messageId ?? "(none returned)"}`
      );
      return { success: true, messageId, httpStatus: response.status };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Failed to send WhatsApp message to=${maskPhone(message.to)}: ${msg}`);
      return { success: false, error: msg.slice(0, 200) };
    }
  }

  async sendBookingConfirmation(
    customerPhone: string,
    customerName: string,
    serviceName: string,
    appointmentDate: string,
    appointmentTime: string,
    bookingAmount: string = "299"
  ): Promise<WhatsAppSendResult> {
    console.log("🔍 WhatsApp sendBookingConfirmation called");
    console.log("🔍 Parameters:", {
      customerPhone: maskPhone(customerPhone),
      customerName,
      serviceName,
      appointmentDate,
      appointmentTime,
      bookingAmount,
    });

    const config = await this.getConfig();
    if (!config) {
      console.log("❌ WhatsApp not configured, skipping booking confirmation");
      return { success: false, error: "WhatsApp not configured" };
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
      return { success: false, error: "No approved p91_booking_confirmation template found" };
    }

    console.log(`✅ Using WhatsApp template: ${bookingTemplate.templateName}`);

    // Ensure phone number is in correct format with country code (91 for India)
    let formattedPhone = customerPhone.replace(/^\+/, "").replace(/\s/g, "").replace(/-/g, "");
    
    // If phone number doesn't start with 91 and is 10 digits, add country code
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }
    
    // If it starts with 0, remove 0 and add 91 (common Indian format)
    if (formattedPhone.startsWith("0") && formattedPhone.length === 11) {
      formattedPhone = "91" + formattedPhone.substring(1);
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
              { type: "text", text: bookingAmount },
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
  ): Promise<WhatsAppSendResult> {
    const config = await this.getConfig();
    if (!config) {
      console.log("WhatsApp not configured, skipping appointment reminder");
      return { success: false, error: "WhatsApp not configured" };
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
      return { success: false, error: "No approved p91_booking_reminder template found" };
    }

    console.log(`Using reminder template: ${reminderTemplate.templateName}`);

    // Format phone number with country code
    let formattedPhone = customerPhone.replace(/^\+/, "").replace(/\s/g, "").replace(/-/g, "");
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }
    if (formattedPhone.startsWith("0") && formattedPhone.length === 11) {
      formattedPhone = "91" + formattedPhone.substring(1);
    }

    const message: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: formattedPhone,
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