import type { BusinessHour } from "@shared/schema";
import { formatINR } from "./canonical-services";
import { ADDRESS_CONFIRMED, STREET_ADDRESS, POSTAL_CODE, PHONE } from "./local-business";

/**
 * /llms.txt — a plain-text map of the site for AI answer engines (the llmstxt.org
 * convention: an H1, a one-paragraph summary, then sections of links).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * Production answered /llms.txt with 404. It is served at request time by
 * server/routes.ts so services and hours are live, the same as sitemap.xml.
 *
 * CONTENT RULE: only facts the site already publishes. The address and phone come from
 * lib/local-business.ts (the confirmed Google Business Profile values), services and
 * prices from the services table, opening hours from the business_hours table, and the
 * guide pages from their content modules. Nothing is written here that a visitor could
 * not read on the site — no ratings, counts, awards or offers. The booking fee is NOT
 * stated: it depends on the live free-booking offer and would go stale.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

export interface LlmsService {
  title?: string | null;
  slug: string;
  price?: string | number | null;
}

export interface LlmsLink {
  title: string;
  path: string;
  note?: string;
}

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "10:30" -> "10:30"; tolerant of "10:30:00". */
const hhmm = (t: string | null | undefined) => String(t || "").slice(0, 5);

/**
 * The business_hours table stores an opening time and a CUTOFF — the last bookable slot,
 * per shared/schema.ts — not a closing time. Stating "open 10:30–16:30" would assert a
 * closing time nobody has confirmed, so the line says what the data actually is.
 */
function hoursLines(hours: BusinessHour[] | undefined): string[] {
  if (!hours?.length) return [];
  const rows = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  return rows.map((h) =>
    h.isOpen
      ? `- ${DAY[h.dayOfWeek]}: opens ${hhmm(h.openTime)}, last booking ${hhmm(h.cutoffTime)}`
      : `- ${DAY[h.dayOfWeek]}: closed`,
  );
}

export function buildLlmsTxt(input: {
  origin: string;
  services: LlmsService[];
  businessHours?: BusinessHour[];
  guides?: LlmsLink[];
  campaignPages?: LlmsLink[];
  articles?: LlmsLink[];
}): string {
  const { origin } = input;
  const link = (title: string, path: string, note?: string) =>
    `- [${title}](${origin}${path})${note ? `: ${note}` : ""}`;

  const address = ADDRESS_CONFIRMED
    ? `${STREET_ADDRESS}, Bengaluru, Karnataka ${POSTAL_CODE}, India`
    : "Bengaluru, Karnataka, India";
  const phone = PHONE.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

  const out: string[] = [
    "# P91 Car Care",
    "",
    "> Car and bike detailing studio in Adugodi, Bangalore: ceramic coating, paint " +
      "protection film (PPF), interior and exterior detailing, glass coating and sun-control " +
      "film, and headlight restoration. Services are booked online and carried out at the studio.",
    "",
    "## Business overview",
    "",
    "P91 Car Care provides paint protection, vehicle appearance restoration and detailing " +
      "for new and pre-owned cars and motorcycles, depending on the service. It fits STEK " +
      "paint protection film, P91 Premium PPF and Nasiol ceramic coatings. Warranty on PPF and " +
      "ceramic coating jobs is the film or coating manufacturer's, issued in writing at handover. " +
      "Pickup and drop is available across Bangalore at cost.",
    "",
    "## Studio",
    "",
    `- Address: ${address}`,
    `- Phone and WhatsApp: ${phone}`,
    `- Website: ${origin}`,
  ];

  const hours = hoursLines(input.businessHours);
  if (hours.length) out.push("", "## Opening hours", "", ...hours);

  const services = input.services.filter((s) => s.slug && String(s.title || "").trim());
  if (services.length) {
    out.push("", "## Services and prices", "");
    for (const s of services) {
      const price = formatINR(s.price ?? undefined);
      // Price only: where it is paid differs by service (the annual package is paid online).
      out.push(link(String(s.title).trim(), `/service/${s.slug}`, price || undefined));
    }
  }

  const section = (heading: string, links?: LlmsLink[]) => {
    if (!links?.length) return;
    out.push("", `## ${heading}`, "");
    for (const l of links) out.push(link(l.title, l.path, l.note));
  };
  out.push(
    "",
    "## Product brands",
    "",
    link("STEK", "/products/stek", "paint protection film and sun-control film, gloss and matte finishes"),
    link("P91 Premium PPF", "/products/p91-premium-ppf", "P91's own paint protection film line"),
    link("Nasiol", "/products/nasiol", "nano-ceramic coating for cars and motorcycles"),
    "",
    "## Service area",
    "",
    "The studio is in Adugodi, Bengaluru. It serves owners from areas including Koramangala, " +
      "HSR Layout and Shanti Nagar, and from across Bengaluru. These are areas served, not " +
      "separate studio locations. Bangalore and Bengaluru are the same city.",
  );

  section("Booking pages", input.campaignPages);
  section("Guides", input.guides);
  section("Articles", input.articles);

  out.push(
    "",
    "## Source accuracy",
    "",
    "This website is the primary source for P91 Car Care's services, prices and booking details. " +
      "Prices, durations and warranty terms vary by service and product and are shown on each " +
      "service page, not in this file. P91 Car Care is an automotive detailing and paint " +
      "protection studio in Adugodi, Bengaluru; it is not a ranked or independently rated " +
      '"best" studio.',
    "",
    "## Optional",
    "",
    link(
      "Car detailing, PPF and ceramic coating FAQs",
      "/faq",
      "answers on PPF, ceramic coating, STEK films, detailing, sun-control film, warranty and maintenance",
    ),
    link("All services", "/services"),
    link("Gallery: our work, reels and current offers", "/gallery"),
    link("Contact and directions", "/contact"),
    link("Refund policy", "/refund-policy"),
    "",
  );
  return out.join("\n");
}
