import type { ServiceContent } from "./types.ts";
import { seoFaq, hubFaq } from "./sources.ts";

/**
 * /services/sun-control-film/windshield-glass-coating. Sources:
 * - /faq hub "What is windshield glass coating?" (faq-page.ts:317) and SEO_PAGES[3] FAQ "What does windshield glass
 *   coating do?" (seo-pages.ts:277).
 * - Catalogue row windshield-glass-coating-new: studio time ("{time}"); its FAQ answers "lasts 6-12 months depending
 *   on usage and maintenance" and "suitable for windshields, side windows, and mirrors" (reworded, not typed as prices).
 *   The row's descriptions carry exact prices and a "24 hours" stay that differs from its own time field; neither is used.
 * - Catalogue row windshield-glass-polishing: "Removes water spots and light scratches", "No curing time required".
 * New sections: how it works, wipers, care, what to ask. General glass-care knowledge, no new figures.
 */
export const GLASS_COATING: ServiceContent = {
  family: "windshield-glass-coating",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/sun-control-film", label: "Sun control film" },
    { href: "/services/sun-control-film/windshield-glass-coating", label: "Windshield glass coating" },
  ],
  eyebrow: "Rain repellent · Windshield · Adugodi",
  h1: "Windshield glass coating in Bangalore",
  shortAnswer:
    "Windshield glass coating is a surface treatment that makes rain bead up and clear off the glass at speed, which helps most with night driving in the monsoon. It lasts about 6 to 12 months depending on usage and maintenance. The car stays {time} so the coating can cure.",
  hero: null,
  timeSlug: "windshield-glass-coating-new",
  sections: [
    {
      h2: "What the coating does",
      paras: [
        "Untreated glass lets rain spread into a film that the wipers smear around. Coated glass is hydrophobic: water pulls into beads and, once the car is moving, the airflow pushes them off the screen. On a highway in heavy rain the windshield can stay clear between wiper sweeps, and at night there is less smear to scatter oncoming headlights.",
        "Dirt, dust and bird droppings also stick less to coated glass, so the screen is quicker to clean, and hard-water spots have less chance to dry in place.",
      ],
    },
    {
      h2: "What it does not do",
      paras: [
        "It does not replace properly working wipers: at low speed and in traffic, rain still needs to be wiped. It is not sun film either, so it does nothing for heat or glare in the cabin; that is [sun control film](/services/sun-control-film), a different job that people often book at the same visit.",
        "It also cannot hide damage already in the glass. Chips, cracks and deep scratches stay as they are, and wiper arcs or water spots etched into the glass show through unless they are polished out first.",
      ],
    },
    {
      h2: "Why it helps in the Bangalore monsoon",
      paras: [
        "Monsoon rain here often arrives in heavy bursts, frequently in the evening rush. With an uncoated screen, the wipers on full speed still leave a smeared film, and at night every streetlight and oncoming headlight flares across it.",
        "Underpasses, flooded stretches and the spray thrown up by buses and trucks make it worse. A coated screen sheds that water faster between wiper sweeps, so the view stays clearer for longer in the moments when it matters most."
      ],
    },
    {
      h2: "Polish first, then coat",
      paras: [
        "The coating bonds best to clean, bare glass. If the windshield already has water spots, wiper haze or light scratches, glass polishing removes water spots and light scratches before the coating goes on, so the clear finish is not locked over old marks.",
        "Polishing alone needs no curing time; the coating does, which is why the car stays in the studio after it is applied.",
      ],
    },
    {
      h2: "Side windows and mirrors",
      paras: [
        "The same coating suits side windows and mirrors as well as the windshield. Coated side windows and mirrors shed rain the same way, which helps most with the view in the side mirrors when changing lanes in the rain. [NEEDS: is all-glass coating a separate package, and how is it priced?]",
      ],
    },
    {
      h2: "Wipers on coated glass",
      paras: [
        "Old, hardened wiper blades can judder or chatter on coated glass. Fresh, soft blades glide over it. If the wipers chatter after a coating, the blades are usually the cause, not the coating.",
        "Wiping a dry, dusty screen scratches glass with or without a coating; use the washer fluid first.",
      ],
    },
    {
      h2: "Studio coating or a spray from a shop",
      paras: [
        "Rain-repellent sprays sold for home use work on the same idea, but they go onto glass that has not been deep cleaned or polished, and they wear off quickly, so they need reapplying often.",
        "A studio coating starts with glass that has been cleaned and polished where needed, so the coating bonds to bare glass, and it is left to cure before the car goes out. That preparation is most of why it lasts longer."
      ],
    },
    {
      h2: "Caring for the coating",
      bullets: [
        "Leave the glass dry and unwashed for the curing period you are given at handover.",
        "Clean with plain water and a soft microfibre cloth, or a mild glass cleaner.",
        "Avoid abrasive pastes, scourers and household cleaners with harsh chemicals.",
        "Top up the washer bottle with plain water or a mild washer fluid; some strong additives wear coatings faster.",
        "When water stops beading on a clean screen, it is time to reapply.",
      ],
      paras: ["A coated screen needs less cleaning, but how it is cleaned decides how long the coating lasts:"],
    },
    {
      h2: "When to reapply",
      paras: [
        "The coating wears gradually rather than stopping on one day. Signs it is near the end: rain no longer forms tight beads on a clean screen, the wipers start to leave a film again, or the screen needs the wipers at speeds where it used to stay clear.",
        "The part of the screen the wipers sweep wears first, so it is normal for the edges of the glass to bead longer than the middle."
      ],
    },
    {
      h2: "What to ask before you book",
      bullets: [
        "Is the windshield polished first, or coated as it is?",
        "Which glass is included: windshield only, or side windows and mirrors too?",
        "How long does the car need to stay for the coating to cure?",
        "How long is it expected to last on your kind of driving?",
        "Should the wiper blades be replaced at the same time?",
      ],
      paras: [],
    },
  ],
  steps: [
    { title: "Inspect the glass", text: "The windshield checked for spots, wiper haze and chips.", photo: null },
    { title: "Clean and prepare", text: "Glass deep cleaned, and polished where needed, so the coating bonds to bare glass.", photo: null },
    { title: "Apply", text: "Windshield glass coating applied and buffed to a streak-free finish.", photo: null },
    { title: "Cure", text: "The car stays in the studio while the coating cures.", photo: null },
  ],
  faq: [
    hubFaq("sun-control-film", "What is windshield glass coating?"),
    seoFaq("glass-sun-control-film-bangalore", "What does windshield glass coating do?"),
    { q: "How long does it last?", a: "About 6 to 12 months, depending on usage and maintenance. Highway driving, frequent wiper use and harsh cleaners wear it faster." },
    { q: "Can I pick the car up early?", a: "The coating needs its full curing time to bond and repel water as it should, so plan to leave the car for the time you are given when you book." },
    { q: "Does it work on side windows and mirrors?", a: "Yes. It suits windshields, side windows and mirrors." },
    { q: "Will the coating affect the wipers?", a: "Not good ones. Old, hardened blades can judder on coated glass; fresh, soft blades glide over it and the coating helps them clear water." },
    { q: "Can the coating be removed?", a: "It wears off on its own over its life, and glass polishing removes it completely if needed." },
    { q: "Do I still need to clean the windshield inside?", a: "Yes. The coating goes on the outside of the glass. Haze on the inside, from the dashboard and air conditioning, needs its own cleaning." },
  ],
  related: [
    { href: "/services/sun-control-film", label: "Sun control film" },
    { href: "/services/exterior-detailing/headlight-restoration", label: "Headlight restoration" },
    { href: "/services/exterior-detailing/hard-water-spot-removal", label: "Hard water spot removal" },
    { href: "/guides/windshield-heat-rejection-film-summer", label: "Windshield heat rejection film: what the numbers mean" },
  ],
  labels: {
    stepsH2: "How the coating goes on",
    faqH2: "Glass coating questions",
  },
};
