import type { FaqItem } from "./types.ts";
import { FAQ_INTRO, FAQ_SERVICE_CARDS, FAQ_GROUPS, FAQ_COMPARISON, FAQ_COMPARISON_AFTER, FAQ_LAST_UPDATED_LABEL } from "../faq-page.ts";
import { WARRANTY_HANDOVER_LINE, impliesManufacturerWarranty } from "../warranty-wording.ts";
import { remapLinks, remapPath } from "./link-map.ts";

/**
 * /faq (Plan 2b Task 5) from faq-page.ts: FAQ_INTRO, FAQ_SERVICE_CARDS, FAQ_GROUPS, FAQ_COMPARISON. Links remapped.
 * The only wording changes are in FIXES (manufacturer's-warranty lines, faq-page.ts:97, :110, :208, :214, :330, and
 * the lines that point to prices on service pages, which the new site no longer shows). Each fix must still match.
 */
export const FAQ_FIXES: [string, string][] = [
  ["Prices and warranty terms are on each service page, so they are always current.",
   "Warranty terms are on each service page, and a photo of your car on WhatsApp gets you a quote."],
  ["You can discuss film specifications, batch details, vehicle compatibility and the manufacturer's warranty before installation.",
   "You can discuss film specifications, batch details, vehicle compatibility and the written warranty terms before installation."],
  ["P91 Car Care publishes its services and packages online and issues the manufacturer's written warranty at handover.",
   `P91 Car Care publishes its services and packages online. ${WARRANTY_HANDOVER_LINE}`],
  ["P91 Car Care shows the current price for each package, by vehicle type, on its PPF page.",
   "P91 Car Care quotes each package by vehicle type, and its PPF page explains what moves the quote."],
  ["Manufacturer warranty documentation is provided as applicable to the selected film.",
   WARRANTY_HANDOVER_LINE],
  ["You can ask about the available gloss and matte films, coverage options, the installation procedure and the applicable manufacturer warranty.",
   "You can ask about the available gloss and matte films, coverage options, the installation procedure and the written warranty terms."],
  ["The current starting price for each ceramic coating package is shown on the ceramic coating page, so it is always up to date.",
   "Send a photo of your car on WhatsApp for a quote for your car."],
  ["Coating and PPF jobs are backed by the film or coating manufacturer's written warranty, issued at handover.",
   WARRANTY_HANDOVER_LINE],
];

const used = new Set<string>();
function fix(t: string): string {
  let s = t;
  for (const [from, to] of FAQ_FIXES) if (s.includes(from)) { s = s.split(from).join(to); used.add(from); }
  if (impliesManufacturerWarranty(s)) throw new Error(`faq: manufacturer's warranty survives: ${s}`);
  return remapLinks(s);
}

const intro = FAQ_INTRO.map(fix);
const cards = FAQ_SERVICE_CARDS.map((c) => ({ title: c.title, body: fix(c.body), href: remapPath(c.href), cta: c.cta }));
const groups = FAQ_GROUPS.map((g) => ({ id: g.id, heading: g.heading, items: g.items.map((i): FaqItem => ({ q: fix(i.question), a: fix(i.answer) })) }));
const unused = FAQ_FIXES.filter(([from]) => !used.has(from));
if (unused.length) throw new Error(`faq fixes no longer match: ${unused.map((u) => u[0].slice(0, 50)).join(" | ")}`);

export const FAQ_PAGE = {
  h1: "Car detailing, PPF and ceramic coating in Bangalore: questions and answers",
  updated: FAQ_LAST_UPDATED_LABEL,
  intro,
  cards,
  groups,
  comparison: FAQ_COMPARISON,
  comparisonAfter: FAQ_COMPARISON_AFTER,
};
