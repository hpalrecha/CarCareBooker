import type { ServiceContent } from "./types.ts";
import { seoPage, seoFaq } from "./sources.ts";

/**
 * /services/interior-detailing. Source: SEO_PAGES[2] "interior-detailing-bangalore" (seo-pages.ts:191): lede,
 * includes, the Bangalore section and two of its FAQs, reshaped onto the service template.
 * Studio time is read from the catalogue row interior-detailing-service ("{time}"). The source FAQ "How long does
 * interior detailing take? Most cars take a few hours" contradicts the catalogue's time, so it is not used.
 * Sections marked "new" were added for length (owner, 26 Nov): general interior-care knowledge, no figures.
 */
const SEO = seoPage("interior-detailing-bangalore");

export const INTERIOR: ServiceContent = {
  family: "interior-detailing",
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/interior-detailing", label: "Interior detailing" },
  ],
  eyebrow: "Vacuum · Steam · Fabric and leather · Adugodi",
  h1: "Car interior detailing in Bangalore",
  shortAnswer:
    "Seats shampooed, vents cleared, leather conditioned and the cabin deodorised: a full reset of the space you sit in. The car stays {time} in the studio, because the upholstery has to dry properly before the car goes back out.",
  hero: { src: "/photos/interior-vacuum-footwell.webp", alt: "Vacuuming debris from a rear footwell carpet", width: 800, height: 1422 },
  timeSlug: "interior-detailing-service",
  sections: [
    {
      h2: SEO.context.heading,
      paras: SEO.context.paragraphs ?? [],
    },
    {
      h2: "What the job includes",
      paras: [],
      bullets: SEO.includes,
    },
    // ── New sections ──
    {
      h2: "What makes an interior job bigger",
      paras: [
        "No two cabins arrive in the same state, and the work grows with what is in them. A seven-seater has a third row of seats and more carpet. Light fabric shows every mark. Pet hair weaves itself into carpet and needs more than one pass. Old spills, food crumbs in seat rails and child-seat marks take extra time, and so does smoke or a musty smell that has soaked into the foam.",
        "None of that is a reason to put a detail off. It is a reason to send a few photos of the cabin on WhatsApp first, so the time in the studio is planned around the car you actually have.",
      ],
    },
    {
      h2: "Fabric, leather and plastics need different care",
      paras: [
        "**Fabric seats and carpets** hold dirt deep in the weave. Shampoo loosens it and extraction pulls the dirty water back out; scrubbing alone pushes it further in.",
        "**Leather** is cleaned with a pH-suitable product and conditioned afterwards, so it stays supple instead of drying and cracking. An all-purpose cleaner strips it.",
        "**Dashboard, console and door plastics** are cleaned and then given a UV-protective dressing, because a dashboard sits under the windscreen in full sun every day. Glossy, greasy dressings attract dust and glare on the windscreen, so the finish should be matte.",
      ],
    },
    {
      h2: "Steam for the places a cloth cannot reach",
      paras: [
        "A cabin is full of corners: air vents, cup holders, seat rails, switch surrounds, textured door plastics and the stitching on seats. Dust and old spills settle in all of them, and a cloth only pushes the dirt deeper into the gaps.",
        "Steam loosens that grime with heat and very little water, so it can be wiped or vacuumed away without soaking the fabric or the electronics around it. It is also useful on stubborn marks on the steering wheel and gear lever, the parts of the cabin your hands touch every day.",
      ],
    },
    {
      h2: "Where cabin smells come from",
      paras: [
        "A car that smells musty or stale usually has a source you cannot see. Damp foam under the seat covers after the monsoon is the most common one. Spilled milk, juice or food that soaked into carpet is another, and smoke leaves a film on the headliner, belts and fabric that keeps releasing smell.",
        "Air fresheners cover a smell for a while; cleaning removes where it comes from. That is why odour work starts with extraction cleaning of the fabric and carpets, and finishes with odour treatment, not the other way round.",
        "If the smell comes back every time the air conditioning starts, the source may be inside the AC system itself. That needs a workshop that services AC units, and it is worth doing alongside an interior detail so the clean cabin stays fresh.",
      ],
    },
    {
      h2: "Keeping the cabin clean between details",
      paras: ["Most of what makes a cabin smell or look tired builds up slowly. A few habits slow it down:"],
      bullets: [
        "Take the floor mats out and let them dry fully after a wet day, especially in the monsoon.",
        "Do not leave wet umbrellas, gym clothes or food in the car overnight.",
        "Wipe spills straight away, before they soak into fabric or the foam underneath.",
        "Vacuum the footwells and seat rails every couple of weeks; the fine dust comes back fastest there.",
        "Use a windscreen sunshade when you park in the open, to keep heat and UV off the dashboard.",
      ],
    },
    {
      h2: "When it is worth booking",
      paras: [
        "After the monsoon, when damp carpets and seats start to smell. Before you sell the car, or after you buy a used one and want to start clean. After a spill, a pet trip or a long family journey. And once or twice a year as routine, so dirt never gets the time to set into the fabric.",
        "If you want interior work spread across the year with washes and an exterior session, the [annual maintenance plan](/services/maintenance-plan) covers it in one booking.",
      ],
    },
    {
      h2: "What to ask before you book",
      paras: ["Clear answers here avoid surprises at handover:"],
      bullets: [
        "Which surfaces are included: seats, carpets, headliner, boot and door panels.",
        "Whether the seats are removed for cleaning. [NEEDS: does P91 remove seats, and for which cars]",
        "How long the car needs to stay so the upholstery dries properly.",
        "Whether the boot, the spare-wheel well and the seat belts are part of the job.",
        "Which stains may not come out fully. Old dye, ink and set-in stains can fade without disappearing, and it is better to know that before you book.",
      ],
    },
  ],
  steps: [
    { title: "Dry vacuum", text: "Seats, carpets, boot and crevices vacuumed, including under and between the seats.", photo: { src: "/photos/interior-vacuum-footwell.webp", alt: "Vacuuming debris from a rear footwell carpet", width: 800, height: 1422 } },
    { title: "Shampoo and extract", text: "Fabric seats and carpets shampooed, then extracted so the dirty water comes back out.", photo: null },
    { title: "Leather", text: "Leather cleaned with a pH-suitable product, then conditioned.", photo: null },
    { title: "Dashboard, console and doors", text: "Dashboard, console, door panels, trim and air vents cleaned, with UV protection for the plastics.", photo: null },
    { title: "Stains and odour", text: "Stain treatment where needed, then odour treatment and air freshening.", photo: null },
    { title: "Dry and hand over", text: "The upholstery dries properly before the car goes back out, which is why it stays in the studio.", photo: null },
  ],
  faq: [
    seoFaq("interior-detailing-bangalore", "Will it remove smoke or pet odour?"),
    seoFaq("interior-detailing-bangalore", "Are the products safe for leather?"),
    { q: "How do I know if the cabin needs a detail, not just a vacuum?", a: "If it smells musty or stale, if stains have set into the seats, if the vents blow dust, or if a vacuum no longer makes it look clean, the dirt is in the fabric and the corners, and a vacuum cannot reach it." },
  ],
  related: [
    { href: "/services/exterior-detailing", label: "Exterior detailing" },
    { href: "/services/car-wash", label: "Car wash" },
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
    { href: "/gallery", label: "See our work" },
  ],
  labels: {
    faqH2: "Interior detailing questions",
    cta: { title: "Send a photo of the cabin", body: "We reply on WhatsApp with what it needs. The studio is in Adugodi, near Koramangala." },
  },
};
