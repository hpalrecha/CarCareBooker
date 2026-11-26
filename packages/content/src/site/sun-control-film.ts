import type { ServiceContent } from "./types.ts";
import { seoPage, seoFaq, hubFaq } from "./sources.ts";

/**
 * /services/sun-control-film. Sources (reshaped, not rewritten):
 * - SEO_PAGES[3] "glass-sun-control-film-bangalore" (seo-pages.ts:236): lede, includes, VLT/IR/TSER section, FAQs.
 * - /faq hub group "sun-control-film" (faq-page.ts:296).
 * - Legal-tint section: the figures are the ones Plan 2b sets (CMVR Rule 100); the caution sentences are the
 *   approved FAQ answers.
 * No price range: the catalogue has no active sun control film row yet. No hero photo: the window-film footage
 * in attached_assets is probably another installer's (photo catalogue), so none is used.
 */
const SEO = seoPage("glass-sun-control-film-bangalore");

export const SUN_CONTROL_FILM: ServiceContent = {
  family: null,
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/sun-control-film", label: "Sun control film" },
  ],
  eyebrow: "Heat and glare control · Adugodi",
  h1: "Sun control film in Bangalore",
  shortAnswer:
    "Sun control film is heat-rejection film for the cabin glass. Judge it by its TSER figure, not by how dark it looks, and check the legal VLT limits before it is fitted. It is a different job from windshield glass coating, the rain-repellent treatment, but people usually ask about both. [NEEDS: time in the studio]",
  hero: null,
  rangeNote: "Send a photo of your car on WhatsApp for the price of the film you choose. [NEEDS: a sun control film row in the catalogue, so the price range can be shown]",
  sections: [
    {
      h2: SEO.context.heading,
      paras: SEO.context.paragraphs ?? [],
    },
    {
      h2: "What the law allows",
      paras: [
        "Under Rule 100 of the Central Motor Vehicles Rules, the front and rear glass must let through at least 70% of visible light (VLT), and the side windows at least 50%.",
        "Automotive glazing and aftermarket film are subject to Indian motor vehicle regulations and court directions. A film's visible light transmission rating alone does not prove that installation is legally permitted, so confirm the current rules before you install.",
        "Ask for the VLT figure of the exact film before it is fitted, and keep the spec sheet in the car.",
      ],
    },
    {
      h2: "What the job includes",
      paras: [],
      bullets: SEO.includes.filter((i) => !/rain-repellent/i.test(i)),
    },
    // ── New sections (owner, 26 Nov: longer pages). General window-film knowledge; no figures. ──
    {
      h2: "The main kinds of film",
      paras: ["Window film is sold under many brand names, but most of it falls into a few types. The type matters more than the shade:"],
      bullets: [
        "**Dyed film** darkens the glass and cuts glare. It is the cheapest kind and does least for heat.",
        "**Metallised film** reflects heat with a thin metal layer. It can look mirror-like from outside, and metal in the film can interfere with phone and GPS signals.",
        "**Carbon film** absorbs heat without metal, so it does not affect signals, and has a matte look.",
        "**Ceramic or nano-ceramic film** uses non-metal particles to reject heat. It can reject a lot of heat while staying fairly light, which matters where VLT limits apply.",
      ],
    },
    {
      h2: "What moves the price",
      paras: ["Sun film quotes differ for a few plain reasons:"],
      bullets: [
        "**The film line.** Higher heat rejection (TSER) usually costs more than a film that only looks dark.",
        "**How much glass is covered.** The windshield only, or the side and rear glass as well.",
        "**The car.** More windows, larger glass and deeply curved rear screens take more film and more fitting time.",
        "**Old film.** Removing an old film and cleaning off its adhesive adds work before the new film goes on.",
      ],
    },
    {
      h2: "Why heat control matters in Bangalore",
      paras: [
        "Most of the heat in a parked car comes through the glass. The dashboard, seats and steering wheel soak it up, and the cabin stays hot long after the air conditioning is switched on.",
        "Sunlight through glass also fades dashboards and upholstery over time and makes the low evening sun on east-west roads hard to drive into. A film chosen on its TSER figure deals with heat; a film chosen only on darkness mostly deals with looks.",
      ],
    },
    {
      h2: "Signs of a poorly fitted film",
      paras: ["A good fit is hard to notice. These are the things to look for at handover and in the weeks after:"],
      bullets: [
        "Bubbles or water pockets that are still there once the film has cured.",
        "Dust specks or hairs trapped between film and glass.",
        "Uneven edges, gaps along the top of a side window, or corners starting to lift.",
        "Creases on the curved rear screen, where the film was not shrunk to shape.",
        "A purple or brown tint appearing over time, typical of cheap dyed film fading.",
      ],
    },
    {
      h2: "The first days after fitting",
      paras: [
        "Film is fitted wet, and the water between film and glass takes some days to dry out. A slight haze or small water pockets in that time are normal and clear as the film cures.",
        "Keep the windows rolled up for [NEEDS: days before the windows can be rolled down], so the film edge is not lifted by the window seal. After that, clean the glass with a soft microfibre cloth and a mild, ammonia-free glass cleaner; never scrape the film or use anything abrasive.",
      ],
    },
    {
      h2: "What to ask before you book",
      paras: ["The answers to these tell you what is going on your car, and whether it is legal:"],
      bullets: [
        "The exact film name and line, not just the brand.",
        "Its VLT and TSER figures, from the manufacturer's spec sheet.",
        "Which windows are being covered, and whether each one stays within the legal VLT limit.",
        "Whether removing old film is included.",
        "The warranty terms, in writing at handover.",
      ],
    },
  ],
  steps: [
    { title: "Prepare the glass", text: "Glass decontaminated and the edges prepared, so nothing is trapped under the film.", photo: null },
    { title: "Cut the film", text: "Film plotter-cut to the shape of each window.", photo: null },
    { title: "Shape it", text: "Heat-shrunk to the curvature of the screen where required.", photo: null },
    { title: "Fit and squeegee", text: "Fitted wet in a controlled, dust-managed bay and squeegeed flat.", photo: null },
    { title: "Hand over the spec sheet", text: "The manufacturer spec sheet for the film fitted, to keep in the car.", photo: null },
  ],
  faq: [
    hubFaq("sun-control-film", "What is the difference between IR rejection and TSER?"),
    seoFaq("glass-sun-control-film-bangalore", "Does darker film mean a cooler cabin?"),
    hubFaq("sun-control-film", "Is automotive sun film legal in Bangalore?"),
    seoFaq("glass-sun-control-film-bangalore", "What does windshield glass coating do?"),
  ],
  related: [
    { href: "/services/sun-control-film/windshield-glass-coating", label: "Windshield glass coating" },
    { href: "/guides/windshield-heat-rejection-film-summer", label: "Windshield heat rejection film: what the numbers mean" },
    { href: "/services/ceramic-coating", label: "Ceramic coating" },
    { href: "/services/interior-detailing", label: "Interior detailing" },
  ],
  labels: {
    pricesH2: "Sun control film price",
    pricesIntro: "The price depends on the film you choose.",
    faqH2: "Sun control film questions",
  },
};
