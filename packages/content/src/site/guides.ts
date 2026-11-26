import type { GuideBlock, GuideContent, LinkItem, Photo } from "./types.ts";
import { GUIDE_SOURCES } from "./guides-data.ts";
import { REWRITTEN_GUIDES } from "./guides-rewritten.ts";

/**
 * /guides/<slug>. The seven migrated posts come from guides-data.ts (generated from BLOG_POSTS by
 * scripts/web/gen-guides.mjs); this file adds what the new site needs per guide: a verified photo
 * (or none), the three onward links (one main service, one sibling guide, one area), the registry
 * description, and the author / reviewer lines, which stay [NEEDS] until the owner names them.
 * Blog images are not reused where the photo catalogue says they do not match the topic (hard water,
 * monsoon, windshield) or are posters (best-car-detailing); a matching verified P91 photo or none is used.
 * Two guides are new copy: ppf-cost-bangalore and what-is-ppf (no prices, owner 26 Nov). Two migrated guides are rewritten
 * (guides-rewritten.ts, owner 26 Nov) so they answer the decision questions and stop repeating their service pages:
 * how-much-ppf-does-your-car-need and hard-water-spot-removal-bangalore. Their slugs, titles and onward links are kept.
 * Author and reviewer: while they are [NEEDS], the template shows "By the P91 Car Care team" and no reviewer line.
 */
const AUTHOR = "[NEEDS: author name]";
const REVIEWER = "[NEEDS: reviewer name and role]";
const P = (src: string, alt: string, width: number, height: number): Photo => ({ src: `/photos/${src}`, alt, width, height });

const PPF: LinkItem = { href: "/services/paint-protection-film", label: "Paint protection film" };
const KOR: LinkItem = { href: "/areas/koramangala", label: "From Koramangala" };
const HSR: LinkItem = { href: "/areas/hsr-layout", label: "From HSR Layout" };
const IND: LinkItem = { href: "/areas/indiranagar", label: "From Indiranagar" };
const G = (slug: string, label: string): LinkItem => ({ href: `/guides/${slug}`, label });

type Meta = { title: string; description: string; image: Photo | null; mainService: LinkItem; sibling: LinkItem; area: LinkItem };

export const GUIDE_META: Record<string, Meta> = {
  "ppf-vs-ceramic-coating-bangalore": {
    title: "PPF vs Ceramic Coating in Bangalore | P91 Car Care",
    description: "PPF or ceramic coating for Bangalore traffic and weather: what each one protects against, where they overlap, and when to choose both.",
    image: P("gle-nasiol-wall.webp", "White Mercedes-Benz GLE in front of the Nasiol wall in the P91 studio", 1084, 911),
    mainService: PPF, sibling: G("how-much-ppf-does-your-car-need", "How much PPF does your car need?"), area: KOR,
  },
  "hard-water-spot-removal-bangalore": {
    title: "Hard Water Spots on Car Paint | P91 Car Care",
    description: "Why borewell and tanker water spots so many cars in Bangalore, how to test your water, how to prevent spots at home, and when to call a studio.",
    image: P("polish-red-bonnet.webp", "Rotary polisher with a foam pad on the glossy bonnet of a red car", 720, 1280),
    mainService: { href: "/services/exterior-detailing/hard-water-spot-removal", label: "Hard water spot removal" },
    sibling: G("monsoon-damage-car-bangalore", "What the monsoon did to your car"), area: HSR,
  },
  "windshield-heat-rejection-film-summer": {
    title: "Windshield Heat Rejection Film | P91 Car Care",
    description: "VLT, IR rejection and TSER explained: which sun film number tells you how cool the cabin will be, and what to ask before film is fitted.",
    image: null,
    mainService: { href: "/services/sun-control-film", label: "Sun control film" },
    sibling: G("hard-water-spot-removal-bangalore", "Hard water spots on car paint"), area: IND,
  },
  "how-much-ppf-does-your-car-need": {
    title: "How Much PPF Does Your Car Need? | P91 Car Care",
    description: "How to choose PPF coverage from how your car is driven, where it is parked, how long you keep it and your budget, with three example owners.",
    image: P("creta-stek-ppf-studio.webp", "Hyundai Creta in the P91 studio beside the STEK wall", 3420, 1925),
    mainService: { href: "/services/paint-protection-film/front", label: "Front PPF" },
    sibling: G("is-your-ppf-really-made-in-usa", "Is your PPF really made in the USA?"), area: KOR,
  },
  "is-your-ppf-really-made-in-usa": {
    title: "Is Your PPF Really Made in the USA? | P91 Car Care",
    description: "Where paint protection film really comes from, why branded beats unbranded more than country of origin, and a buyer's checklist for PPF quotes.",
    image: P("ppf-install-door-edge.webp", "P91 installer fitting clear PPF around the rear door of a black SUV", 720, 1280),
    mainService: PPF, sibling: G("ppf-cost-bangalore", "PPF cost and why quotes differ"), area: HSR,
  },
  "monsoon-damage-car-bangalore": {
    title: "Monsoon Car Damage in Bangalore | P91 Car Care",
    description: "Five things a Bangalore monsoon does to a car that you cannot see yet: water spots, underbody rust, damp interiors, trim and glass, and what to do.",
    image: null,
    mainService: { href: "/services/exterior-detailing", label: "Exterior detailing" },
    sibling: G("hard-water-spot-removal-bangalore", "Hard water spots on car paint"), area: IND,
  },
  "best-car-detailing-in-bangalore": {
    title: "Choosing a Car Detailing Studio in Bangalore | P91",
    description: "What car detailing includes, which services are worth paying for, and seven things to check before you choose a detailing studio in Bangalore.",
    image: P("i20-after-studio.webp", "Orange Hyundai i20, glossy after detailing, in the P91 studio", 1400, 2488),
    mainService: { href: "/services/exterior-detailing", label: "Exterior detailing" },
    sibling: G("ppf-vs-ceramic-coating-bangalore", "PPF vs ceramic coating"), area: KOR,
  },
};

const NEW_PPF_COST: GuideBlock[] = [
  { t: "p", variant: "lede", text: "Two quotes for paint protection film on the same car can be far apart, and both can be honest. The difference is almost always in four things: the film, how much of the car is covered, the car itself, and the state of its paint." },
  { t: "h2", text: "What you are paying for" },
  { t: "p", text: "A PPF job is three things bought together: the film, the hours of preparation before it, and the fitting. Film is the part people compare, but a full-body job is mostly labour: washing and decontaminating the car, correcting the paint, cutting and fitting each panel, wrapping edges and checking the result. A low quote saves on one of those, and the saving shows on the car later." },
  { t: "h2", text: "The four things that move the cost" },
  { t: "h3", text: "1. Film brand and line" },
  { t: "p", text: "Genuine film with a traceable batch costs more than unbranded rolls, and premium lines cost more than standard ones. Within one brand, a premium line usually adds a thicker or tougher top layer and a longer written warranty. Ask to see the sealed roll and its batch number before work starts." },
  { t: "h3", text: "2. Coverage" },
  { t: "p", text: "Front only (bumper, bonnet, mirrors, sometimes headlights and fenders) versus every painted panel. Coverage changes the cost more than anything else, which is why the right question is where damage actually lands on your car. See [how much PPF your car needs](/guides/how-much-ppf-does-your-car-need)." },
  { t: "h3", text: "3. Car size and shape" },
  { t: "p", text: "An SUV has more panel area than a hatchback, and deep curves, vents and sharp creases take longer to fit cleanly than flat panels. That is why studios quote by body type: hatchback, sedan and SUV." },
  { t: "h3", text: "4. Paint condition" },
  { t: "p", text: "Film locks in whatever is under it. Swirls and light scratches stay visible under the film, so they are polished out first. A new car may need only a light polish; a car that has been washed with a dusty cloth for years needs more correction, and that time is part of the job." },
  { t: "h2", text: "Why some quotes are much cheaper" },
  { t: "ul", items: [
    "**Unbranded film.** No traceable batch, no local warranty process, and a higher chance of yellowing or peeling early.",
    "**No paint correction.** The film goes over swirls and marks that stay visible for the life of the film.",
    "**Fewer panels than you think.** \"Front\" can mean a partial bonnet with a visible cut line, without headlights or mirrors.",
    "**Rushed fitting.** Stretched edges, trapped dust and lifted corners are fitting faults, and no warranty covers them.",
  ] },
  { t: "h2", text: "How to compare two quotes" },
  { t: "ol", items: [
    "Ask for the film brand and the exact product line, in writing.",
    "Ask for the panel list, one by one, and whether the bonnet is full or partial.",
    "Ask whether paint correction is included, and how much.",
    "Ask how long the car stays in the studio.",
    "Ask for the written warranty terms, and who honours them in India.",
  ] },
  { t: "p", text: "Two quotes with the same answers to all five can be compared on price. Two quotes with different answers are quotes for different jobs." },
  { t: "h2", text: "How P91 quotes PPF" },
  { t: "p", text: "P91 fits [STEK](/brands/stek) film and its own [P91 Premium PPF](/brands/p91-premium-ppf) line. Full-body packages are quoted by body type, in a standard and a premium film line with different written warranty terms. The [paint protection film page](/services/paint-protection-film) explains what moves a quote. For the figure for your car, send a photo on WhatsApp or bring the car to the studio in Adugodi." },
  { t: "h2", text: "Questions" },
  { t: "faq", items: [
    { q: "Is full-body PPF worth it?", a: "For a car you plan to keep for years, drive hard or keep perfect, often yes. For a normal city car, front coverage plus a ceramic coating on the rest protects most of what matters for less." },
    { q: "Does a longer warranty mean better film?", a: "Usually a longer warranty comes with a premium line, but read what it covers: yellowing, peeling and cracking, and who you call if something goes wrong." },
    { q: "Why is my quote different from a friend's?", a: "Different car size, different panels, different paint condition or a different film line. Any one of those changes the work." },
  ] },
];

const NEW_WHAT_IS_PPF: GuideBlock[] = [
  { t: "p", variant: "lede", text: "Paint protection film, or PPF, is a clear urethane film fitted over a car's paint. Stone chips, light scratches and washing marks land on the film instead of the paint, and when the film comes off, the paint underneath is as it was when the film went on." },
  { t: "h2", text: "What the film is" },
  { t: "p", text: "PPF is a flexible, clear urethane sheet with an adhesive on one side and a protective top layer on the other. It is thick enough to absorb small impacts but thin and clear enough that gloss film is close to invisible on the car. It is cut to the shape of each panel and fitted wet, so it can be positioned, stretched slightly around curves and squeegeed flat." },
  { t: "h2", text: "What it protects against" },
  { t: "ul", items: [
    "**Stone chips** thrown up by the vehicle in front, the most common damage on a bonnet and bumper.",
    "**Light scratches and scuffs** from bags, keys, door edges and parking-lot brushes.",
    "**Washing marks**, the fine swirls a dusty cloth or brush wash leaves in paint.",
    "**Stains** from bird droppings, sap and bug splatter, which mark the film's surface instead of etching the paint.",
  ] },
  { t: "h2", text: "Self-healing" },
  { t: "p", text: "Many films have a self-healing top layer: light swirls in the film fade with heat, often just from the sun on a warm day. It works on fine marks, not on cuts or deep gouges, which go through the top layer." },
  { t: "h2", text: "Gloss or matte" },
  { t: "p", text: "Gloss film keeps the car's existing colour and appearance. Matte film turns gloss paint satin without repainting, and protects factory matte paint, which cannot be polished. See [matte PPF](/services/paint-protection-film/matte)." },
  { t: "h2", text: "What PPF does not do" },
  { t: "ul", items: [
    "It does not repair damage that is already there: chips and scratches stay visible under the film unless corrected first.",
    "It does not survive a collision; a hard impact or a deep gouge can cut through film and paint together.",
    "It is not a coating: it does not make the car bead water like a ceramic coating unless it is coated too.",
  ] },
  { t: "h2", text: "How it is fitted" },
  { t: "ol", items: [
    "The paint is inspected and the panels the job covers are agreed.",
    "The car is washed and decontaminated so nothing is trapped under the film.",
    "Swirls and light scratches are polished out first.",
    "The film is fitted panel by panel, with edges wrapped where the panel allows.",
    "The car is inspected and handed over with care instructions and written warranty terms.",
  ] },
  { t: "h2", text: "PPF and ceramic coating" },
  { t: "p", text: "They do different jobs. Film takes physical damage; a coating adds gloss and makes washing easier. Many owners do both: film on the panels that take hits, coating over everything. Read [PPF vs ceramic coating](/guides/ppf-vs-ceramic-coating-bangalore)." },
  { t: "h2", text: "Caring for PPF" },
  { t: "ul", items: [
    "Wait before the first wash for the time the studio gives at handover.",
    "Wash with a pH-neutral shampoo and a soft mitt; dry with a microfibre towel.",
    "Keep pressure-washer jets away from film edges and any lifted areas.",
    "Lift bird droppings and bug splatter soon, with water and a soft cloth.",
  ] },
  { t: "h2", text: "Questions" },
  { t: "faq", items: [
    { q: "Can PPF be removed?", a: "Yes. Genuine film peels off without lifting factory paint when a studio removes it." },
    { q: "Will people notice the film?", a: "Gloss film is close to invisible from normal viewing distance. Edges are wrapped where the panel allows, so most panel edges show no line." },
    { q: "How long does PPF last?", a: "It depends on the film line and how the car is kept. The written warranty for the line is the clearest guide; ask for it in writing before work starts." },
  ] },
];

const NEW: Record<string, { meta: Meta; h1: string; lede: string; date: string; readMinutes: number; blocks: GuideBlock[] }> = {
  "ppf-cost-bangalore": {
    meta: {
      title: "PPF Cost in Bangalore: Why Quotes Differ | P91",
      description: "What moves the cost of paint protection film in Bangalore: film line, coverage, car size and paint condition, and how to compare two PPF quotes.",
      image: P("ppf-install-rear-quarter.webp", "P91 installer positioning PPF on the rear quarter of a black SUV", 720, 1280),
      mainService: PPF, sibling: G("how-much-ppf-does-your-car-need", "How much PPF does your car need?"), area: KOR,
    },
    h1: "PPF cost in Bangalore: why quotes differ so much",
    lede: "What a paint protection film quote is made of, the four things that move it, and how to compare two quotes for the same car.",
    date: "2026-11-26", readMinutes: 5, blocks: NEW_PPF_COST,
  },
  "what-is-ppf": {
    meta: {
      title: "What Is PPF (Paint Protection Film)? | P91 Car Care",
      description: "What paint protection film is, what it protects against, self-healing, gloss or matte, what it does not do, how it is fitted and how to care for it.",
      image: P("ppf-install-door-handle.webp", "A P91 fitter tucking paint protection film around a door handle in the Adugodi studio", 720, 1280),
      mainService: PPF, sibling: G("ppf-vs-ceramic-coating-bangalore", "PPF vs ceramic coating"), area: HSR,
    },
    h1: "What is PPF? Paint protection film explained",
    lede: "A plain explanation of paint protection film: what it is, what it does and does not do, and how it goes on a car.",
    date: "2026-11-26", readMinutes: 5, blocks: NEW_WHAT_IS_PPF,
  },
};

function build(slug: string): GuideContent & { meta: Meta } {
  const n = NEW[slug];
  if (n) {
    return { slug, h1: n.h1, lede: n.lede, date: n.date, readMinutes: n.readMinutes, author: AUTHOR, reviewedBy: REVIEWER,
      image: n.meta.image, blocks: n.blocks, mainService: n.meta.mainService, sibling: n.meta.sibling, area: n.meta.area, meta: n.meta };
  }
  const src = GUIDE_SOURCES[slug];
  const m = GUIDE_META[slug];
  if (!src || !m) throw new Error(`no guide ${slug}`);
  const s = { ...src, ...(REWRITTEN_GUIDES[slug] ?? {}) };
  return { slug, h1: s.title, lede: s.lede, date: s.date, ...(s.updated ? { updated: s.updated } : {}), readMinutes: s.readMinutes,
    author: AUTHOR, reviewedBy: REVIEWER, image: m.image, blocks: s.blocks, mainService: m.mainService, sibling: m.sibling, area: m.area, meta: m };
}

export const GUIDE_SLUGS = [...Object.keys(NEW), ...Object.keys(GUIDE_META)];
export const GUIDES = GUIDE_SLUGS.map(build);
export function guideFor(slug: string) {
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) throw new Error(`no guide ${slug}`);
  return g;
}

/** /guides hub. Title and description from BLOG_INDEX_TITLE / BLOG_INDEX_DESCRIPTION (blog-posts.ts:1130-1132). */
export const GUIDES_HUB = {
  h1: "Car care guides",
  lede: "Straight answers on ceramic coating, paint protection film, hard water spots and sun control film, written for Bangalore conditions by the P91 Car Care studio.",
  intro: [
    "These guides answer the questions owners ask the studio most: what paint protection film is and what it costs, whether PPF or ceramic coating suits their car, how much of the car really needs film, why borewell water marks paint, and what the numbers on sun film mean.",
    "They are written for Bangalore: stop-start traffic that throws grit at the front of the car, mineral-heavy borewell water, a long monsoon, dust, and cars that are mostly parked outside. Where a guide talks about P91's own work, it says so; where it gives general advice, it is advice you can use whoever you book with.",
    "No guide quotes a price. What a job costs depends on your car, and each guide explains what moves it. For a figure for your car, send a photo on WhatsApp.",
  ],
  excerpts: {
    "ppf-cost-bangalore": "The four things that move a PPF quote, why some quotes are much cheaper, and how to compare two.",
    "what-is-ppf": "What paint protection film is, what it protects against, and what it does not do.",
  } as Record<string, string>,
};
