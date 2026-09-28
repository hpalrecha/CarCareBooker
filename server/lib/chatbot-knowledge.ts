// Assembles the chatbot's system prompt ("instructions") from data that already exists in
// the codebase, so the bot can never state a price, address or opening hour that disagrees
// with the live site. Nothing here is hand-typed content the bot recites from memory except
// the cancellation/refund bullet points and the guardrail sentences, which are policy text
// that doesn't come from a database table.
//
// Reused rather than re-derived:
//   - buildLlmsTxt()        (client/src/lib/llms-txt.ts)   — services, prices, hours, address, phone
//   - PRODUCT_BRANDS / PRODUCT_FINE_PRINT (client/src/lib/nav-menu.ts) — brand blurbs
//   - PHONE                 (client/src/lib/local-business.ts) — the one confirmed phone number
// server/routes.ts already imports from client/src the same way (buildLlmsTxt, for /llms.txt),
// so this is an established pattern here, not a new one.

import type { Service, BusinessHour, BlackoutDate } from "@shared/schema";
import { buildLlmsTxt } from "../../client/src/lib/llms-txt";
import { PRODUCT_BRANDS, PRODUCT_FINE_PRINT } from "../../client/src/lib/nav-menu";
import { PHONE } from "../../client/src/lib/local-business";
import { istNow } from "./slots";

export interface ChatbotKnowledgeDeps {
  getAllServices(): Promise<Service[]>;
  getAllBusinessHours(): Promise<BusinessHour[]>;
  getAllBlackoutDates(): Promise<BlackoutDate[]>;
}

export const DIRECTIONS_HREF =
  "https://www.google.com/maps/dir/?api=1&destination=P91+Car+Care+Adugodi+Bengaluru";

export const WHATSAPP_URL = `https://wa.me/${PHONE.replace(/^\+/, "")}`;

/**
 * Cancellation/refund figures, sourced from client/src/pages/refund-policy.tsx (the page
 * with the actual ₹ amounts tied to the real ₹299 booking fee).
 *
 * NOTE FOR WHOEVER EDITS THIS: client/src/pages/cancellation-policy.tsx currently states a
 * DIFFERENT window ("4+ hours before service = free cancellation") for the same booking fee.
 * The two site pages disagree with each other today. This constant follows refund-policy.tsx
 * because it is the page with concrete rupee amounts matching the booking fee logic
 * (server/lib/booking-amount.ts), not because the discrepancy has been resolved — that is a
 * separate content fix the business should make on one of the two pages.
 */
const POLICY_FACTS: string[] = [
  "Booking fee: ₹299 to reserve a slot, waived automatically during an active free-booking offer.",
  "Cancelling a paid booking: 24+ hours before the appointment = full refund of the booking fee; " +
    "12-24 hours before = 50% refund; under 12 hours or same-day = no refund.",
  "If P91 Car Care has to cancel a confirmed booking, the customer gets a full refund within 3-5 business days.",
  "Refunds are paid to the original payment method; exact timing depends on the customer's bank.",
];

/**
 * Real services P91 offers that are NOT in the services table as a fixed-price, bookable
 * SKU — so `get_services`/`propose_slot` never see them, and without this list the model
 * wrongly concluded "not in the catalogue" meant "not offered" (caught live: asked about
 * bike PPF, it said P91 doesn't do it at all — wrong; confirmed with the business: P91 does
 * bike PPF, it just has no fixed price because it depends on the bike, so it was never
 * added as a priced catalogue row).
 *
 * These can never be turned into a `propose_slot` booking link (there is no serviceId for
 * them), which is correct — they're quote-on-request, not a fixed-price slot to book.
 */
const UNPRICED_SERVICES_FACTS: string[] = [
  "Bike PPF (paint protection film): P91 DOES offer this. There is no fixed listed price — " +
    "cost depends on the specific bike — so never state or estimate a number for it. Say it's " +
    `available, price depends on the bike, and direct the customer to contact the studio ` +
    `(${PHONE}) for an exact quote. Never say bike PPF isn't offered.`,
];

const GUARDRAILS: string[] = [
  "You are the P91 Car Care website chat assistant. Be concise, friendly and accurate.",
  "Your reply is shown as plain text in a chat bubble, not rendered as Markdown or HTML. " +
    "Never use #, *, -, numbered lists, or [text](url) link syntax. Write plain sentences with " +
    "short line breaks between points, and write a URL or phone number as plain text.",
  "Only state a price, slot, warranty term or policy detail that appears below or that a tool call returned. Never invent one.",
  "Never tell a customer their booking is confirmed or that payment has been taken — only the site's own checkout (Razorpay) does that, and you have no way to do it from this chat.",
  "To suggest a specific date and time to a customer, you MUST call the propose_slot tool. Never just say a date/time in plain text — the server checks it is really available before showing it as a link.",
  "Use check_slot_availability before propose_slot when you are not already sure a date is open.",
  "After calling propose_slot, do NOT write out a booking URL or link yourself — the app already " +
    "shows a \"Book this slot\" button from the tool result. Just describe the slot in words " +
    "(service, date, time) and let the button handle the link.",
  `If asked something outside car/bike detailing, P91's services, or booking (legal, medical, unrelated topics), say it's outside what you can help with and give the phone/WhatsApp number: ${PHONE}.`,
  `If you cannot resolve something, or the customer asks for a human, give them the phone/WhatsApp number: ${PHONE} (${WHATSAPP_URL}).`,
];

export async function buildChatbotInstructions(deps: ChatbotKnowledgeDeps): Promise<string> {
  const [services, businessHours, blackoutDates] = await Promise.all([
    deps.getAllServices(),
    deps.getAllBusinessHours(),
    deps.getAllBlackoutDates(),
  ]);

  const siteFacts = buildLlmsTxt({
    origin: "https://p91carcare.com",
    services: services.map((s) => ({ title: s.title, slug: s.slug, price: s.price })),
    businessHours,
  });

  const blackoutLines = blackoutDates.length
    ? blackoutDates.map((b) => `- ${b.date}: ${b.reason}`).join("\n")
    : "None scheduled right now.";

  const brandLines = PRODUCT_BRANDS.map(
    (b) => `- ${b.name}: ${b.line} (${b.points.join(", ")})`,
  ).join("\n");

  // Grounds "today" / "tomorrow" / weekday names to a real calendar date.
  //
  // WITHOUT THIS the model has no way to know the actual current date and will guess —
  // caught live: asked to book "tomorrow", it proposed 2023-10-06. propose_slot is still
  // re-validated server-side regardless (a hallucinated date gets rejected there too, see
  // booking-validation.ts), but grounding this means a genuinely near-term request like
  // "tomorrow" resolves correctly instead of failing validation for no real reason.
  const { dateStr: todayIST } = istNow(new Date());
  const todayWeekday = new Date(`${todayIST}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long" });

  return [
    ...GUARDRAILS,
    "",
    `## Today`,
    `Today's date is ${todayIST} (${todayWeekday}), Indian Standard Time. Resolve "today", ` +
      `"tomorrow" and weekday names against this date — never guess a year or date on your own.`,
    "",
    "## Live site facts (services, prices, hours, address, phone)",
    siteFacts,
    "",
    "## Blackout dates — studio is closed, never propose these",
    blackoutLines,
    "",
    "## Brands / products fitted in-studio",
    brandLines,
    PRODUCT_FINE_PRINT,
    "",
    "## Services offered but not in the fixed-price catalogue above (quote on request)",
    ...UNPRICED_SERVICES_FACTS.map((f) => `- ${f}`),
    "",
    "## Cancellation & refund policy",
    ...POLICY_FACTS.map((f) => `- ${f}`),
    "",
    "## Directions",
    `- Get directions: ${DIRECTIONS_HREF}`,
  ].join("\n");
}
