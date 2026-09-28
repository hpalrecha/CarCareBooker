// AI chat assistant for the website widget (replaces the WhatsApp-only floating button).
//
// SCOPE, ON PURPOSE: this service can answer questions and PROPOSE a service+date+time. It
// cannot create, confirm or pay for a booking — there is no "create_booking" tool at all.
// A proposed slot is re-validated server-side against the exact same rules POST /api/bookings
// and GET /api/slot-availability/:serviceId/:date already enforce (validateAppointmentSlot /
// computeAvailability), so the model's own claim about a slot being open is never trusted.
//
// API SURFACE: the OpenAI Responses API (`client.responses.create`), not Chat Completions —
// this is the current tool-calling surface for the official `openai` Node SDK. Model name is
// never hardcoded in logic: it is read from process.env.OPENAI_MODEL with a small fallback.
//
// STATELESS BY DESIGN: `store: false` on every call means OpenAI retains nothing about the
// conversation. That rules out `previous_response_id` chaining (it looks up a stored
// response — nothing is stored), so the tool-call loop below instead replays the growing
// `input` array itself on every round-trip. A little more token cost, zero server-side or
// OpenAI-side conversation retention anywhere.
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import type { BlackoutDate } from "@shared/schema";
import { storage } from "../storage";
import { validateAppointmentSlot, type SlotValidationDeps } from "../lib/booking-validation";
import { computeAvailability, generateHourlySlots, istNow } from "../lib/slots";
import { buildChatbotInstructions, DIRECTIONS_HREF, WHATSAPP_URL } from "../lib/chatbot-knowledge";
import { CHAT_LIMITS, type ChatMessage } from "../lib/chat-guards";
import { PHONE } from "../../client/src/lib/local-business";

const DEFAULT_MODEL = "gpt-4o-mini";

const FALLBACK_REPLY =
  `Sorry, I'm having trouble answering that right now. Please call or WhatsApp us at ${PHONE} ` +
  `(${WHATSAPP_URL}) and we'll help directly.`;

export class ChatbotUnavailableError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured");
    this.name = "ChatbotUnavailableError";
  }
}

export interface ProposedSlot {
  serviceId: string;
  slug: string;
  serviceTitle: string;
  date: string;
  time: string;
  bookingUrl: string;
}

export interface ChatResult {
  reply: string;
  proposedSlot: ProposedSlot | null;
}

/**
 * Storage surface the tool implementations need. `storage` already satisfies this.
 *
 * `getAllBlackoutDates` is re-declared with the full `BlackoutDate[]` return type (a
 * covariant, compatible override of `SlotValidationDeps`'s narrower `{date,reason}[]`) so
 * this interface is ALSO assignable to `ChatbotKnowledgeDeps`, which needs the full rows.
 */
export interface ChatbotStorageDeps extends SlotValidationDeps {
  getAllServices(): ReturnType<typeof storage.getAllServices>;
  getAllBusinessHours(): ReturnType<typeof storage.getAllBusinessHours>;
  getAllBlackoutDates(): Promise<BlackoutDate[]>;
  getActiveChatbotKnowledge(): ReturnType<typeof storage.getActiveChatbotKnowledge>;
  getService(id: string): ReturnType<typeof storage.getService>;
}

const TOOLS: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",
    name: "get_services",
    description: "List P91 Car Care's active services with their id, title and price.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    type: "function",
    name: "check_slot_availability",
    description: "Check bookable time slots for one service on one date.",
    parameters: {
      type: "object",
      properties: {
        serviceId: { type: "string", description: "Service id, from get_services." },
        date: { type: "string", description: "Date as YYYY-MM-DD." },
      },
      required: ["serviceId", "date"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "get_business_info",
    description: "Get P91 Car Care's phone, WhatsApp and directions link.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    type: "function",
    name: "propose_slot",
    description:
      "Propose one specific service+date+time to the customer as a bookable slot. The server " +
      "re-validates it before showing anything — always call this instead of stating a date/time in text.",
    parameters: {
      type: "object",
      properties: {
        serviceId: { type: "string", description: "Service id, from get_services." },
        date: { type: "string", description: "Date as YYYY-MM-DD." },
        time: { type: "string", description: "Whole-hour time as HH:MM, e.g. 14:00." },
      },
      required: ["serviceId", "date", "time"],
      additionalProperties: false,
    },
    strict: true,
  },
];

async function toolGetServices(deps: ChatbotStorageDeps) {
  const services = await deps.getAllServices();
  return services.map((s) => ({ id: s.id, slug: s.slug, title: s.title, price: s.price }));
}

async function toolCheckSlotAvailability(
  deps: ChatbotStorageDeps,
  args: { serviceId?: unknown; date?: unknown },
) {
  const serviceId = typeof args.serviceId === "string" ? args.serviceId : "";
  const date = typeof args.date === "string" ? args.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Invalid date format, expected YYYY-MM-DD." };
  }
  const service = await deps.getService(serviceId);
  if (!service || !service.isActive) {
    return { error: "Unknown or inactive service id. Call get_services first." };
  }

  const maxPerSlot = service.maxBookingsPerSlot || 3;
  const blackoutDates = await deps.getAllBlackoutDates();
  const blackout = blackoutDates.find((bd) => bd.date === date);
  const dayOfWeek = new Date(date + "T00:00:00").getDay();
  const hours = await deps.getBusinessHoursForDay(dayOfWeek);
  const { dateStr: todayIST, minutes: nowMinutes } = istNow(new Date());

  const candidateSlots = generateHourlySlots(hours ?? undefined);
  const bookedBySlot: Record<string, number> = {};
  for (const slotId of candidateSlots) {
    bookedBySlot[slotId] = await deps.getBookingCountForSlot(service.id, date, slotId);
  }

  const result = computeAvailability({
    hours: hours ?? undefined,
    isBlackout: !!blackout,
    blackoutReason: blackout?.reason ?? null,
    isToday: date === todayIST,
    nowMinutes,
    maxPerSlot,
    bookedBySlot,
  });

  return {
    date,
    available: result.available,
    reason: result.reason,
    reasonText: result.reasonText ?? null,
    openSlots: result.slots.filter((s) => s.available).map((s) => s.slotId),
  };
}

function toolGetBusinessInfo() {
  return {
    phone: PHONE,
    whatsapp: WHATSAPP_URL,
    directionsUrl: DIRECTIONS_HREF,
  };
}

/**
 * Independently re-validates a model-proposed service+date+time against the exact same
 * rules POST /api/bookings enforces (validateAppointmentSlot), regardless of what the model
 * claimed. Exported so this — the one path that can produce a customer-visible booking link
 * — is directly unit-testable without mocking OpenAI.
 */
export async function evaluateProposedSlot(
  deps: ChatbotStorageDeps,
  args: { serviceId?: unknown; date?: unknown; time?: unknown },
): Promise<{ ok: true; slot: ProposedSlot } | { ok: false; message: string }> {
  const serviceId = typeof args.serviceId === "string" ? args.serviceId : "";
  const date = typeof args.date === "string" ? args.date : "";
  const time = typeof args.time === "string" ? args.time : "";

  const service = await deps.getService(serviceId);
  if (!service || !service.isActive) {
    return { ok: false, message: "Unknown or inactive service id. Call get_services first." };
  }

  const maxPerSlot = service.maxBookingsPerSlot || 3;
  const validation = await validateAppointmentSlot(deps, {
    serviceId: service.id,
    date,
    time,
    timeSlotId: time,
    maxPerSlot,
  });

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  return {
    ok: true,
    slot: {
      serviceId: service.id,
      slug: service.slug,
      serviceTitle: service.title,
      date,
      time,
      bookingUrl: `/service/${encodeURIComponent(service.slug)}?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`,
    },
  };
}

async function runTool(
  deps: ChatbotStorageDeps,
  name: string,
  args: Record<string, unknown>,
): Promise<{ output: unknown; proposedSlot: ProposedSlot | null }> {
  switch (name) {
    case "get_services":
      return { output: await toolGetServices(deps), proposedSlot: null };
    case "check_slot_availability":
      return { output: await toolCheckSlotAvailability(deps, args), proposedSlot: null };
    case "get_business_info":
      return { output: toolGetBusinessInfo(), proposedSlot: null };
    case "propose_slot": {
      const result = await evaluateProposedSlot(deps, args);
      return { output: result, proposedSlot: result.ok ? result.slot : null };
    }
    default:
      return { output: { error: `Unknown tool ${name}` }, proposedSlot: null };
  }
}

function safeParseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function isFunctionCall(
  item: OpenAI.Responses.ResponseOutputItem,
): item is OpenAI.Responses.ResponseFunctionToolCall {
  return item.type === "function_call";
}

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new ChatbotUnavailableError();
  // Cached across requests in the same process, same as every other external client in this
  // codebase (db.ts, storage.ts) — not per-request, since construction itself is cheap but
  // there's no reason to repeat it.
  if (!cachedClient) cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

/**
 * Runs one turn of the chat: sends the conversation to OpenAI, executes any tool calls the
 * model requests against real data, and returns a plain-text reply plus an optional
 * server-validated slot proposal.
 *
 * `deps` defaults to the real `storage` singleton; tests inject a fake. `client` likewise
 * defaults to the real OpenAI client; tests inject a mock so no network call is ever made.
 */
export async function runChat(
  messages: ChatMessage[],
  options?: { deps?: ChatbotStorageDeps; client?: OpenAI },
): Promise<ChatResult> {
  const deps = options?.deps ?? storage;
  const openai = options?.client ?? getClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const instructions = await buildChatbotInstructions(deps);

  let input: ResponseInputItem[] = messages.map((m) => ({ role: m.role, content: m.content }));
  let response = await openai.responses.create({ model, instructions, input, tools: TOOLS, store: false });

  let proposedSlot: ProposedSlot | null = null;
  let rounds = 0;

  while (true) {
    const calls = response.output.filter(isFunctionCall);
    if (calls.length === 0) break;

    rounds += 1;
    if (rounds > CHAT_LIMITS.maxToolRounds) {
      return { reply: FALLBACK_REPLY, proposedSlot: null };
    }

    // Stateless replay (see header comment): carry the model's own prior output forward as
    // input, then append this round's tool results, and resend the whole thing — there is no
    // previous_response_id to lean on because store:false means nothing was retained to chain to.
    input = input.concat(response.output as unknown as ResponseInputItem[]);
    for (const call of calls) {
      const args = safeParseArgs(call.arguments);
      const { output, proposedSlot: slotFromThisCall } = await runTool(deps, call.name, args);
      if (slotFromThisCall) proposedSlot = slotFromThisCall;
      input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(output) });
    }

    response = await openai.responses.create({ model, instructions, input, tools: TOOLS, store: false });
  }

  return { reply: response.output_text?.trim() || FALLBACK_REPLY, proposedSlot };
}
