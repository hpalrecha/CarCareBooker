import type { Booking, Service } from '@shared/schema';

/**
 * Booking -> n8n integration ("Appointmnet Booking P91 CC", workflow UvrwB78oldxJotbH).
 *
 * The n8n host was migrated off n8n.subspace.money onto self-hosted AWS. The URL used to be
 * hardcoded here, which meant re-pointing it required a code change + redeploy — that is how
 * the integration silently broke. The URL now comes from N8N_BOOKING_WEBHOOK_URL.
 *
 * There is deliberately NO hardcoded production fallback: a missing variable must surface as a
 * visible, retryable failure rather than quietly posting to a dead host.
 */

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

export type ErpSyncStatus = 'sent' | 'failed' | 'skipped';

export type ErpSyncErrorKind =
  | 'not_configured'
  | 'timeout'
  | 'network'
  | 'client_error'
  | 'server_error'
  | 'unknown';

export interface BookingWebhookResult {
  ok: boolean;
  status: ErpSyncStatus;
  /** True when a later retry could plausibly succeed. */
  retryable: boolean;
  attempts: number;
  httpStatus?: number;
  errorKind?: ErpSyncErrorKind;
  /** Short, safe summary — never contains tokens or full customer payloads. */
  error?: string;
  n8nExecutionId?: string;
}

export interface BookingWebhookPayload {
  /** Canonical idempotency key. n8n must reuse an existing ERP doc carrying this value. */
  idempotencyKey: string;

  // Booking Details
  bookingId: string;
  bookingStatus: string;
  paymentStatus: string;

  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Service Information
  serviceName: string;
  serviceId: string;
  serviceSlug?: string;

  // Appointment Details
  appointmentDate: string;
  appointmentTime: string;
  timeSlotId: string;

  // Payment Information
  amount: string;
  paymentId?: string;
  razorpayOrderId?: string;

  // Timestamps
  bookedOn: string;
  updatedAt: string;

  // Communication Status
  whatsappSent: boolean;
  emailSent: boolean;

  // Event Type
  eventType: 'booking_payment_confirmed';
}

/** +919886682013 -> +91******2013 */
function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '(none)';
  const s = String(phone);
  if (s.length <= 4) return '****';
  return s.slice(0, 3) + '*'.repeat(Math.max(0, s.length - 7)) + s.slice(-4);
}

/** someone@example.com -> s*****@example.com */
function maskEmail(email: string | null | undefined): string {
  if (!email) return '(none)';
  const s = String(email);
  const at = s.indexOf('@');
  if (at < 1) return '****';
  return s[0] + '*'.repeat(Math.max(1, at - 1)) + s.slice(at);
}

/** Strip anything that could carry credentials or PII out of a response body. */
function safeResponseSummary(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 200);
}

function resolveWebhookUrl(): string | null {
  const url = process.env.N8N_BOOKING_WEBHOOK_URL?.trim();
  return url && url.length > 0 ? url : null;
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function classifyHttpStatus(status: number): ErpSyncErrorKind {
  if (status >= 500) return 'server_error';
  if (status >= 400) return 'client_error';
  return 'unknown';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildBookingWebhookPayload(
  booking: Booking,
  service: Service | null,
): BookingWebhookPayload {
  return {
    idempotencyKey: booking.id,

    bookingId: booking.id,
    bookingStatus: booking.bookingStatus || 'confirmed',
    paymentStatus: booking.paymentStatus || 'pending',

    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,

    serviceName: service?.title || 'Unknown Service',
    serviceId: booking.serviceId,
    serviceSlug: service?.slug,

    appointmentDate: booking.appointmentDate || '',
    appointmentTime: booking.appointmentTime || '',
    timeSlotId: booking.timeSlotId,

    amount: booking.amount,
    paymentId: booking.paymentId || undefined,
    razorpayOrderId: booking.razorpayOrderId || undefined,

    bookedOn: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),

    whatsappSent: booking.whatsappSent || false,
    emailSent: booking.emailSent || false,

    eventType: 'booking_payment_confirmed',
  };
}

/**
 * POST the booking to n8n. Only ever called for a booking whose payment is confirmed paid.
 * Never throws — always returns a structured result the caller can persist.
 */
export async function sendBookingWebhook(
  booking: Booking,
  service: Service | null,
): Promise<BookingWebhookResult> {
  const url = resolveWebhookUrl();

  if (!url) {
    // Loud, because this means ERP sync is entirely disabled.
    console.error(
      '❌ [erp-sync] N8N_BOOKING_WEBHOOK_URL is not set — ERP sync is DISABLED. ' +
        `Booking ${booking.id} was NOT sent to n8n.`,
    );
    return {
      ok: false,
      status: 'failed',
      retryable: true,
      attempts: 0,
      errorKind: 'not_configured',
      error: 'N8N_BOOKING_WEBHOOK_URL is not configured',
    };
  }

  const payload = buildBookingWebhookPayload(booking, service);
  const target = (() => {
    try {
      return new URL(url).host;
    } catch {
      return '(unparseable url)';
    }
  })();

  console.log(
    `📡 [erp-sync] booking=${booking.id} -> ${target} ` +
      `phone=${maskPhone(booking.customerPhone)} email=${maskEmail(booking.customerEmail)}`,
  );

  let lastResult: BookingWebhookResult = {
    ok: false,
    status: 'failed',
    retryable: true,
    attempts: 0,
    errorKind: 'unknown',
    error: 'no attempt made',
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'P91CarCare/1.0',
          // Lets n8n/ERP de-duplicate retries and browser+webhook double-delivery.
          'X-Idempotency-Key': payload.idempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const bodyText = await response.text().catch(() => '');

      if (response.ok) {
        // n8n returns the execution id on some configurations; capture it when present.
        let n8nExecutionId: string | undefined;
        try {
          const parsed = bodyText ? JSON.parse(bodyText) : null;
          const candidate = parsed?.executionId ?? parsed?.execution_id;
          if (candidate) n8nExecutionId = String(candidate);
        } catch {
          /* non-JSON response is fine */
        }

        console.log(
          `✅ [erp-sync] booking=${booking.id} accepted by n8n ` +
            `http=${response.status} attempt=${attempt}` +
            (n8nExecutionId ? ` execution=${n8nExecutionId}` : ''),
        );

        return {
          ok: true,
          status: 'sent',
          retryable: false,
          attempts: attempt,
          httpStatus: response.status,
          n8nExecutionId,
        };
      }

      const retryable = isRetryableHttpStatus(response.status);
      lastResult = {
        ok: false,
        status: 'failed',
        retryable,
        attempts: attempt,
        httpStatus: response.status,
        errorKind: classifyHttpStatus(response.status),
        error: `n8n responded ${response.status}: ${safeResponseSummary(bodyText)}`,
      };

      console.error(
        `❌ [erp-sync] booking=${booking.id} http=${response.status} ` +
          `attempt=${attempt}/${MAX_ATTEMPTS} retryable=${retryable} ` +
          `body="${safeResponseSummary(bodyText)}"`,
      );

      if (!retryable) return lastResult;
    } catch (error: unknown) {
      const isTimeout =
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError');
      const errorKind: ErpSyncErrorKind = isTimeout ? 'timeout' : 'network';
      const message = error instanceof Error ? error.message : String(error);

      lastResult = {
        ok: false,
        status: 'failed',
        retryable: true,
        attempts: attempt,
        errorKind,
        error: `${errorKind}: ${message.slice(0, 200)}`,
      };

      console.error(
        `❌ [erp-sync] booking=${booking.id} ${errorKind} ` +
          `attempt=${attempt}/${MAX_ATTEMPTS} target=${target} msg="${message.slice(0, 200)}"`,
      );
    }

    if (attempt < MAX_ATTEMPTS) {
      await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  return lastResult;
}
