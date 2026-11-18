/**
 * The FAQ for /ceramic-coating/bike.
 *
 * The catalogue row behind the bike page (1-year-bike-ceramic-coating) carries a FAQ that was copied from the car
 * row: "Is the coating safe for my bike paint? Absolutely! ... 100% safe", "creates a permanent bond", and a
 * process and "why choose" text that are word for word the car page's. That made /ceramic-coating/bike and
 * /ceramic-coating/car carry 12 identical paragraphs.
 *
 * The page itself is already written for motorcycles (tank, fairings, chain fling, outdoor parking: see
 * landing-pages.ts). This module gives the bike page a FAQ of its own on the same footing, without a database change:
 * the same idea as lib/ceramic-timing.ts, which already overrides one row answer in code. It applies to the landing
 * page only (the page, the server HTML and the FAQPage JSON-LD all go through withBikeLandingCopy), and the original
 * rows and their records are untouched.
 *
 * Every statement here comes from facts already published on the page or in the catalogue row (12 months, 9H, tank,
 * fairings and painted panels, pH-neutral shampoo, care kit, the confirmed 36-48 hours) or is a plain "call us first"
 * for cases the site does not promise (matte paint, wraps, repaints, other parts). Nothing claims a result the studio
 * has not stated. Where the studio should confirm a sentence, it is listed in the implementation notes.
 *
 * Relative imports only: server/vite.ts is bundled by esbuild and imports this directly.
 */
import { CERAMIC_TIMING, CERAMIC_TIMING_QUESTION } from "./ceramic-timing";

export const BIKE_CERAMIC_SLUG = "1-year-bike-ceramic-coating";

const PHONE = "+91 74066 19191";

export function bikeLandingFaq(): Array<{ question: string; answer: string }> {
  return [
    {
      question: "Which parts of my motorcycle are coated?",
      answer:
        "The fuel tank, the fairings and the painted body panels. If you want anything else coated, such as alloy " +
        `wheels or plastics, call us on ${PHONE} before you book so we can tell you what is possible.`,
    },
    {
      question: "Can any motorcycle be coated?",
      answer:
        "Painted bikes of any colour can. Matte or satin paint, wrapped bikes and bikes that have been repainted need a " +
        `conversation first, so call or WhatsApp us on ${PHONE} with a few photos before you book.`,
    },
    {
      question: CERAMIC_TIMING_QUESTION,
      answer: CERAMIC_TIMING[BIKE_CERAMIC_SLUG].answer,
    },
    {
      question: "How do I wash a coated bike?",
      answer:
        "Use a pH-neutral bike shampoo and a clean microfibre towel, and avoid automatic washes with harsh brushes. " +
        "Wipe off petrol splashes and chain lube when you see them instead of leaving them on the paint. We provide a " +
        "care guide and a care kit with the coating.",
    },
    {
      question: "Will the coating stop scratches and chips?",
      answer:
        "It makes washing gentler and reduces fine wash marks, but it will not stop deep scratches, stone chips or damage " +
        "from a fall. It is a gloss and easy-cleaning layer, not armour.",
    },
    {
      question: "How is this different from waxing my bike?",
      answer:
        "Wax sits on top of the paint and wears off within weeks, so it has to be redone often. This is a 1-year coating: " +
        "it is made to last about 12 months with proper care.",
    },
    {
      question: "What happens after 12 months?",
      answer:
        "You can book a fresh coat. The coating wears down gradually rather than stopping on one day, but a new coat " +
        "brings back full protection and gloss.",
    },
  ];
}

interface BikeLandingRecord {
  slug?: string | null;
  faq?: unknown;
  whyChoose?: unknown;
  process?: unknown;
}

/**
 * The bike landing page's record: the bike FAQ in place of the copied one, and the car-worded "why choose" and process
 * text dropped (the page renders neither; only the server HTML carried them). Any other record passes through
 * unchanged, as the same object.
 */
export function withBikeLandingCopy<T extends BikeLandingRecord>(service: T): T;
export function withBikeLandingCopy<T extends BikeLandingRecord>(service: T | undefined | null): T | undefined | null;
export function withBikeLandingCopy<T extends BikeLandingRecord>(service: T | undefined | null): T | undefined | null {
  if (!service || service.slug !== BIKE_CERAMIC_SLUG) return service;
  return { ...service, faq: bikeLandingFaq(), whyChoose: "", process: [] } as T;
}
