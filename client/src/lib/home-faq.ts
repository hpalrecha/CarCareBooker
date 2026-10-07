/**
 * Homepage FAQ, in ONE place: home.tsx renders it, lib/crawlable-content.ts bakes it into the
 * prerendered HTML, and scripts/prerender.mjs emits its FAQPage schema from the same list, so
 * the visible page, the raw HTML and the schema cannot disagree.
 *
 * Every answer restates something the site already says elsewhere (lib/seo-pages.ts, the
 * "Why P91" section, the warranty line). Nothing here is a new claim.
 *
 * NO PRICE AND NO DURATION IN HOURS OR DAYS APPEARS HERE, on purpose. Both live in the service
 * catalogue and change there (see the price rule at the top of lib/landing-pages.ts); a number
 * typed into an FAQ would go stale and contradict the page the visitor lands on next.
 */
export interface HomeFaq {
  question: string;
  answer: string;
}

/** The About section heading: carries both target phrases. Shared so the page and the raw HTML agree. */
export const HOME_ABOUT_H2 = "Ceramic coating and paint protection film, done properly.";

export const HOME_FAQ_HEADING = "Ceramic coating and paint protection film: your questions";

export const HOME_FAQS: HomeFaq[] = [
  {
    question: "What is the difference between ceramic coating and paint protection film?",
    answer:
      "Ceramic coating is a thin layer on the paint that helps it shrug off water and dirt and " +
      "widens the window before hard-water damage starts. Paint protection film (PPF) is a " +
      "self-healing urethane layer fitted over the paint, so stone chips and kerb damage hit the " +
      "film instead of the clearcoat. They protect against different things.",
  },
  {
    question: "How much does ceramic coating or PPF cost?",
    answer:
      "The price depends on your vehicle's body type and the package you choose. Every service " +
      "page shows the live price for each package, and a free estimate gives you the figure for " +
      "your car.",
  },
  {
    question: "How long does the job take?",
    answer:
      "Most detailing is finished the day you book. Ceramic coating and PPF take longer, because " +
      "paint preparation and a controlled cure come before the car goes back out. Each service " +
      "page shows the approximate studio time for its package.",
  },
  {
    question: "Is there a warranty?",
    answer:
      "Yes. Every coating and PPF job is backed by a written warranty from the film or coating " +
      "manufacturer, issued at handover. Ask to see the batch details before work starts.",
  },
];

/** FAQPage JSON-LD for the homepage. */
export function homeFaqSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
