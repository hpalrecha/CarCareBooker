import type { PpfLead } from '@shared/schema';

/**
 * Lead -> Google Sheet, through an Apps Script web app the studio owns.
 *
 * The URL comes from GOOGLE_SHEET_WEBHOOK_URL. There is deliberately no fallback: when the
 * variable is unset the sync is skipped, and the lead still lands in the database and the
 * admin Leads tab. A Sheet outage or a bad URL must never fail the visitor's form submit,
 * so every call here is fire-and-forget and never throws.
 */

const REQUEST_TIMEOUT_MS = 10_000;

export function leadSheetPayload(lead: PpfLead) {
  return {
    id: lead.id,
    createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : String(lead.createdAt),
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    vehicleType: lead.vehicleType,
    vehicleModel: lead.vehicleModel ?? '',
    serviceInterest: lead.serviceInterest,
    message: lead.message ?? '',
    source: lead.source ?? '',
    channel: lead.channel ?? '',
    utmCampaign: lead.utmCampaign ?? '',
    status: lead.status,
  };
}

/** Starts the Sheet write and returns at once. Failures are logged, never thrown. */
export function sendLeadToSheet(lead: PpfLead): void {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadSheetPayload(lead)),
    signal: controller.signal,
    redirect: 'follow',
  })
    .then(async (res) => {
      if (!res.ok) console.warn(`[lead-sheet] ${lead.id} rejected: HTTP ${res.status}`);
    })
    .catch((err: unknown) => {
      const reason = err instanceof Error ? err.name : 'unknown';
      console.warn(`[lead-sheet] ${lead.id} not sent: ${reason}`);
    })
    .finally(() => clearTimeout(timer));
}
