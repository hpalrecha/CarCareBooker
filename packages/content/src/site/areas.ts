import type { AreaContent } from "./types.ts";
import { hubFaq } from "./sources.ts";
import { WARRANTY_HANDOVER_LINE } from "../warranty-wording.ts";

/**
 * /areas/<area> (Plan 2b Task 4). The studio is in Adugodi; it has never had a branch anywhere else
 * (local-business.ts:35). Area pages talk about coming to Adugodi from the area, never about a location there.
 * Drive times, routes and area jobs are [NEEDS] until the studio supplies them. Pickup wording: "On request,
 * confirmed on a call" (Plan 2a rule).
 *
 * Koramangala source: blog "ppf-koramangala-hsr-layout-shanti-nagar-adugodi" (blog-posts.ts:111-259), reshaped. Its
 * "written manufacturer warranty" lines (:167, :212) are replaced with the approved handover line, and its
 * "pickup and drop ... at cost" lines with the pickup rule.
 * HSR Layout: the blog's HSR mentions (:124, :234), faq-page.ts:115 and the SEO_PAGES[1] Outer Ring Road section.
 * Indiranagar: new copy.
 */
export type AreaPageContent = AreaContent;

const PICKUP = "On request, confirmed on a call";
const HOURS = "Open daily; times on the contact page";
const PHONE = "+91 74066 19191";

export const KORAMANGALA: AreaPageContent = {
  area: "Koramangala",
  h1: "PPF and ceramic coating near Koramangala",
  intro:
    "If you live in Koramangala, your car faces the same problems every day: stop-and-go traffic, tight parking, stone chips on the ORR and Hosur Road, monsoon rain and hard water spots. P91 Car Care's studio is in Ayappa Garden, Adugodi, next to Koramangala.",
  facts: [
    { k: "Studio", v: "49, 13th Cross, Ayappa Garden, Adugodi" },
    { k: "Drive from Koramangala", v: "[NEEDS: approx. drive time from Koramangala]" },
    { k: "Pickup and drop", v: PICKUP },
    { k: "Hours", v: HOURS },
    { k: "Phone", v: PHONE },
  ],
  routeNote: "Adugodi is next to Koramangala, so you can drive over, drop the car and come back for it. [NEEDS: the usual route from Koramangala and where to park at the studio]",
  services: [
    { h3: "PPF for Koramangala cars", text: "Daily drives on Hosur Road and the ORR throw grit at the bumper, bonnet and mirrors. Front PPF covers those panels; full body suits a car you plan to keep for years.", href: "/services/paint-protection-film", link: "Paint protection film" },
    { h3: "Ceramic coating for Koramangala cars", text: "Cars here mostly live outside in apartment and street parking, collecting dust, sap and water spots. A coating makes every wash quicker and gives you time before water marks the paint.", href: "/services/ceramic-coating", link: "Ceramic coating" },
    { h3: "Exterior detailing for Koramangala owners", text: "Swirls from dusty-cloth wipes, bird droppings and borewell water spots are the usual problems. A detail lifts the contamination and polishes the marks out.", href: "/services/exterior-detailing", link: "Exterior detailing" },
    { h3: "Interior detailing for Koramangala owners", text: "Short trips, takeaway food and damp monsoon days leave cabins stale. A deep interior clean resets seats, carpets and vents.", href: "/services/interior-detailing", link: "Interior detailing" },
    { h3: "Sun control film for Koramangala commutes", text: "Long waits at signals in the afternoon sun heat the cabin through the glass. Film chosen on its TSER figure cuts the heat, within legal VLT limits.", href: "/services/sun-control-film", link: "Sun control film" },
    { h3: "Car wash near Koramangala", text: "A hand wash with a foam pre-wash and a careful dry, for upkeep between detailing jobs.", href: "/services/car-wash", link: "Car wash" },
  ],
  jobs: [],
  sections: [
    {
      h2: "5 questions to ask before booking PPF in Bangalore",
      paras: [],
      bullets: [
        `**Is the warranty in writing?** ${WARRANTY_HANDOVER_LINE}`,
        "**Can I see the batch details before work starts?**",
        "**Which brand is the film?**",
        "**Is the work done in a controlled studio?**",
        "**Is there a package for my car size?** Hatchbacks, sedans and SUVs need different amounts of film.",
      ],
    },
    {
      h2: "How we do it at P91",
      paras: [
        "[STEK PPF](/brands/stek) in gloss and matte. [P91 Premium PPF](/brands/p91-premium-ppf), our own film line, in hatchback, sedan and SUV packages. [Nasiol](/brands/nasiol) nano-ceramic coating for water and stain repellence and UV and chemical resistance.",
        `Pricing depends on car size, film and coverage (front-end or full body). Message us your car model for an exact quote. ${WARRANTY_HANDOVER_LINE}`,
      ],
    },
  ],
  faq: [
    { q: "Where can I get PPF near Koramangala?", a: "P91 Car Care in Adugodi is a short drive from Koramangala. We fit STEK PPF and P91 Premium PPF with written warranty terms at handover." },
    hubFaq("finding-a-studio", "Where can I get ceramic coating near Koramangala?"),
    // faq-page.ts:125 said "at an additional cost, subject to availability"; pickup wording rule applied instead.
    { q: "Does P91 Car Care offer pickup and drop in Koramangala?", a: "Pickup and drop is on request. Call or WhatsApp us and we confirm it for your address in Koramangala on the call." },
    { q: "Can I see the film details before work starts?", a: "Yes. Ask for the batch details before we begin." },
  ],
  nearby: [
    { href: "/areas/hsr-layout", label: "From HSR Layout" },
    { href: "/areas/indiranagar", label: "From Indiranagar" },
  ],
};

export const HSR_LAYOUT: AreaPageContent = {
  area: "HSR Layout",
  h1: "PPF and ceramic coating for HSR Layout owners",
  intro:
    "P91 Car Care's studio is in Adugodi, and serves owners from HSR Layout as well as Koramangala and Shanti Nagar. Owners from HSR Layout drive over, or ask for pickup and drop, which is on request and confirmed on a call.",
  facts: [
    { k: "Studio", v: "49, 13th Cross, Ayappa Garden, Adugodi" },
    { k: "Drive from HSR Layout", v: "[NEEDS: approx. drive time from HSR Layout]" },
    { k: "Pickup and drop", v: PICKUP },
    { k: "Hours", v: HOURS },
    { k: "Phone", v: PHONE },
  ],
  routeNote: "[NEEDS: the usual route from HSR Layout to Adugodi, and whether pickup covers HSR Layout on most days]",
  services: [
    { h3: "PPF for HSR Layout commuters", text: "Stop-start traffic on the Outer Ring Road keeps your bumper behind someone else's tyres for long stretches. The damage collects on the bumper, the front of the bonnet and the mirrors, which is what front PPF covers.", href: "/services/paint-protection-film", link: "Paint protection film" },
    { h3: "Ceramic coating for HSR Layout cars", text: "A car washed every day in apartment parking with tank water and left to dry collects mineral marks fast. A coating makes those washes gentler and gives more time before water spots etch in.", href: "/services/ceramic-coating", link: "Ceramic coating" },
    { h3: "Hard water spot removal for HSR Layout cars", text: "Cars washed every morning and left to air-dry in open parking collect mineral spots on the roof, bonnet and glass. Fresh spots wash off; etched ones need polishing.", href: "/services/exterior-detailing/hard-water-spot-removal", link: "Hard water spot removal" },
    { h3: "Interior detailing for HSR Layout families", text: "School runs, pets and long weekend drives fill seat rails and carpets fast. Extraction cleaning lifts what a vacuum leaves behind.", href: "/services/interior-detailing", link: "Interior detailing" },
    { h3: "Windshield glass coating for ORR drives", text: "Heavy evening rain on the Outer Ring Road is where a coated windshield helps most: water beads and clears between wiper sweeps.", href: "/services/sun-control-film/windshield-glass-coating", link: "Windshield glass coating" },
    { h3: "Annual maintenance plan for HSR Layout cars", text: "Washes, interior and exterior sessions spread across the year, booked once.", href: "/services/maintenance-plan", link: "Annual maintenance plan" },
  ],
  jobs: [],
  faq: [
    { q: "Is there a ceramic coating studio near HSR Layout?", a: "Yes. We apply Nasiol nano-ceramic coating at our studio in Adugodi. Pickup and drop is on request: call or WhatsApp and we confirm it for HSR Layout on the call." },
    // faq-page.ts:113, first sentence word for word; its "available across Bangalore at cost" line follows the pickup rule instead.
    { q: "Does P91 Car Care serve customers outside Adugodi?", a: "Yes. P91 Car Care works from its Adugodi studio and serves owners from Koramangala, HSR Layout, Shanti Nagar and other parts of Bengaluru. Pickup and drop is on request, confirmed on a call." },
    { q: "How long will my car be away?", a: "It depends on the job. Each service page states its studio time, and we confirm it when you book." },
  ],
  nearby: [
    { href: "/areas/koramangala", label: "From Koramangala" },
    { href: "/areas/indiranagar", label: "From Indiranagar" },
  ],
};

export const INDIRANAGAR: AreaPageContent = {
  area: "Indiranagar",
  h1: "PPF and ceramic coating for Indiranagar owners",
  intro:
    "P91 Car Care has one studio, in Adugodi, and no branch in Indiranagar. Owners from Indiranagar drive over to Adugodi, or ask for pickup and drop, which is on request and confirmed on a call.",
  facts: [
    { k: "Studio", v: "49, 13th Cross, Ayappa Garden, Adugodi (not in Indiranagar)" },
    { k: "Drive from Indiranagar", v: "[NEEDS: approx. drive time from Indiranagar]" },
    { k: "Pickup and drop", v: PICKUP },
    { k: "Hours", v: HOURS },
    { k: "Phone", v: PHONE },
  ],
  routeNote: "[NEEDS: the usual route from Indiranagar to Adugodi]",
  services: [
    { h3: "PPF for Indiranagar cars", text: "Street parking on busy roads means door dings, scuffs from passing bags and scooters, and grit from traffic. Film on the doors and front takes those marks instead of the paint.", href: "/services/paint-protection-film", link: "Paint protection film" },
    { h3: "Ceramic coating for cars parked under trees", text: "Tree-lined streets drop sap, flowers and bird droppings on parked cars. A coated surface lets them wash off before they stain or etch the clear coat.", href: "/services/ceramic-coating", link: "Ceramic coating" },
    { h3: "Exterior detailing for Indiranagar owners", text: "Sap stains, bird-dropping etching and swirls from quick wipes are lifted and polished out in one detail.", href: "/services/exterior-detailing", link: "Exterior detailing" },
    { h3: "Interior detailing for Indiranagar owners", text: "Evenings out and takeaway food leave crumbs in the seat rails and smells in the fabric; a deep clean takes them out.", href: "/services/interior-detailing", link: "Interior detailing" },
    { h3: "Headlight restoration for Indiranagar cars", text: "Cars parked in the open, facing the sun, go cloudy at the headlights first. Restoration clears the lenses and seals them with a UV coat.", href: "/services/exterior-detailing/headlight-restoration", link: "Headlight restoration" },
    { h3: "Car wash for Indiranagar owners", text: "A hand wash with foam first, so street dust is lifted before anything touches the paint.", href: "/services/car-wash", link: "Car wash" },
  ],
  jobs: [],
  faq: [
    { q: "Do you have a studio in Indiranagar?", a: "No. P91 Car Care's only studio is in Ayappa Garden, Adugodi. Owners from Indiranagar drive over or ask for pickup and drop." },
    { q: "Can you pick the car up from Indiranagar?", a: "Pickup and drop is on request. Call or WhatsApp us and we confirm it for your address on the call." },
    { q: "Can I see the film or coating before booking?", a: "Yes. Visit the studio in Adugodi: you see the sealed roll and its batch number before work starts." },
  ],
  nearby: [
    { href: "/areas/koramangala", label: "From Koramangala" },
    { href: "/areas/hsr-layout", label: "From HSR Layout" },
  ],
};
