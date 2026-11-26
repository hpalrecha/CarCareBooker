// Request-shape guards for POST /api/chat, checked BEFORE any OpenAI call is made.
//
// WHY THIS EXISTS SEPARATELY FROM rate-limit.ts. rateLimit() (per-IP, fixed-window) fails
// OPEN by design — a bug there must never block a paying customer from booking. That is the
// right failure mode for a form. It is the wrong one, alone, for an endpoint that spends real
// OpenAI credits per call: a request that is malformed, absurdly long, or would loop the model
// forever must be REJECTED, not let through. So these checks fail CLOSED (400, no API call)
// and sit in front of the OpenAI call in server/services/chatbot.ts.
//
// Pure functions, no Express types, no network — cheap to unit test in isolation.

export const CHAT_LIMITS = {
  /** Single message body cap. Generous for a real question, small next to a scripted flood. */
  maxMessageLength: 2000,
  /** Conversation cap. Each request resends the whole history (store:false — see chatbot.ts),
   *  so an unbounded conversation means unbounded token cost per turn, not just per session. */
  maxMessages: 20,
  /** Tool-call round-trips allowed per single user turn before falling back to a plain reply. */
  maxToolRounds: 4,
} as const;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatGuardResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; status: number; message: string };

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (v.role === "user" || v.role === "assistant") &&
    typeof v.content === "string"
  );
}

/**
 * Validates the raw request body for POST /api/chat.
 *
 * Deliberately strict about shape (reject, don't coerce): a malformed body is far more
 * likely to be a script probing the endpoint than a real widget bug, and coercing "helps"
 * exactly the wrong caller.
 */
export function validateChatRequestBody(body: unknown): ChatGuardResult {
  if (!body || typeof body !== "object" || !Array.isArray((body as any).messages)) {
    return { ok: false, status: 400, message: "Expected { messages: {role, content}[] }." };
  }

  const rawMessages = (body as { messages: unknown[] }).messages;

  if (rawMessages.length === 0) {
    return { ok: false, status: 400, message: "Conversation cannot be empty." };
  }
  if (rawMessages.length > CHAT_LIMITS.maxMessages) {
    return {
      ok: false,
      status: 400,
      message: "This conversation has gotten long — please call or WhatsApp us to continue.",
    };
  }

  const messages: ChatMessage[] = [];
  for (const raw of rawMessages) {
    if (!isChatMessage(raw)) {
      return { ok: false, status: 400, message: "Each message needs a role and text content." };
    }
    const content = raw.content.trim();
    if (content.length === 0) {
      return { ok: false, status: 400, message: "Message text cannot be empty." };
    }
    if (content.length > CHAT_LIMITS.maxMessageLength) {
      return {
        ok: false,
        status: 400,
        message: `Message is too long (max ${CHAT_LIMITS.maxMessageLength} characters).`,
      };
    }
    messages.push({ role: raw.role, content });
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return { ok: false, status: 400, message: "The last message must be from the customer." };
  }

  return { ok: true, messages };
}
