/**
 * The studio's own social carousels, in one place.
 *
 * These are the artwork the business already publishes on Instagram, imported into
 * attached_assets/carousels/<dir>/01.jpg ... NN.jpg. Two very different parts of the site
 * render them — the blog posts they illustrate, and the hero of a campaign landing page —
 * so the alt text lives here rather than being written twice and drifting.
 *
 * WHY THE ALT TEXT IS SO LONG.
 *
 * Every slide is a picture OF TEXT. To a crawler and to a screen reader an image of a
 * sentence is worth exactly nothing, so each entry carries that slide's real words. This
 * is transcription, not description: it is what the slide says, in the order it says it.
 *
 * The count of `slides` IS the count of images. There is no separate number to keep in
 * step, and adding a slide to a folder without adding its line here simply will not render.
 */
export interface Carousel {
  /** Folder under attached_assets/carousels/. */
  dir: string;
  /** Shown under the track. Says what the reader is looking at, not what it claims. */
  caption: string;
  slides: string[];
}

/** PPF vs ceramic coating — 11 slides. */
export const PPF_VS_CERAMIC: Carousel = {
  dir: "ppf-vs-ceramic",
  caption: "The same comparison, slide by slide.",
  slides: [
    "PPF vs Ceramic Coating — P91 Car Care.",
    "Confused by conflicting advice? You are not alone. One protects from impact, the other protects from the elements. Choosing wrong can cost you later.",
    "Body armour versus weather shield. PPF is body armour against physical damage. Ceramic is a weather shield against sun, dirt and chemicals. Different jobs, different strengths.",
    "What PPF actually does: physical impact protection. Absorbs rock chips, gravel and road debris. Prevents scratches and minor abrasions. Self-healing film removes light swirl marks.",
    "Where PPF matters most — the high-impact zones need armour: front bumper, bonnet and fenders, side mirrors, rocker panels. Anywhere damage happens first.",
    "What ceramic coating does: protection for the finish and shine. UV resistance prevents fading and oxidation. A hydrophobic surface repels water and dirt. Enhances gloss and makes washing effortless.",
    "The truth most people miss: ceramic does not stop rock chips. Ceramic is a liquid polymer, not a shield. It cannot absorb physical impacts. It looks amazing but will not stop damage.",
    "Why they are better together — the protection combination. PPF stops damage ceramic cannot. Ceramic over PPF keeps the film cleaner and glossier. The car stays protected and easy to maintain.",
    "Choose your path. Tight budget: PPF on the high-impact zones first. Low usage or garage kept: ceramic may be enough. Long-term ownership: PPF and ceramic together is ideal.",
    "Longevity and value — protection that pays back. PPF lasts five to ten years. Ceramic lasts one to five or more years. Better paint means higher resale and lower repaint costs.",
    "Protect once, regret never. There is no single right answer, only the right strategy. The best setups are tailored, not generic. Get expert advice before your paint pays the price.",
  ],
};

/** How much PPF coverage a car actually needs — 9 slides. */
export const PPF_COVERAGE: Carousel = {
  dir: "ppf-coverage",
  caption: "The three coverage levels we fit, and who each one is for.",
  slides: [
    "Before you get your PPF done, read this — P91 Car Care.",
    "Do not PPF your whole car until you read this. More film does not always mean smarter protection. Most cars only need PPF in specific places. The right coverage saves money and paint.",
    "PPF is about impact zones, not guesswork. Cars do not get damaged evenly. The front bumper alone takes the majority of road abuse. Smart PPF focuses on high-impact rather than low-risk areas.",
    "Partial front PPF, the budget shield. Covers the front bumper, partial bonnet and side mirrors. Protects against the most common stone chips. Best for city driving and cost-conscious owners — daily drivers who want protection where it matters most.",
    "Full front end PPF, the most popular choice. Covers bumper, full bonnet, fenders, headlights and mirrors. No visible cut lines on the bonnet. A clean look with serious long-term protection. This setup balances aesthetics, protection and resale value.",
    "Full body PPF. Covers every painted panel. Ideal for matte paint, exotic cars or track use. Maximum protection, maximum investment. For collectors, enthusiasts, or owners where cost is not a factor.",
    "The professional's choice: PPF plus ceramic. PPF on high-impact front areas, ceramic coating on every other inch. Ceramic fills the gaps where PPF is not installed. You stop physical damage and protect against UV, dirt and chemicals without overspending.",
    "This is how smart coverage looks. Red marks the PPF impact zones, blue the ceramic low-impact zones. Zero wasted coverage, zero compromises. Front bumper, bonnet and fenders glow red; roof, doors and rear glow blue.",
    "There is no one-size-fits-all PPF. Every car, driver and budget is different. Smart coverage always beats full coverage done blindly. The right setup protects your paint and your wallet.",
  ],
};

/** Where PPF is really made, and what the label does not tell you — 9 slides. */
export const PPF_ORIGIN: Carousel = {
  dir: "ppf-origin",
  caption: "Where PPF actually comes from, slide by slide.",
  slides: [
    "The truth behind Made in USA paint protection films — P91 Car Care.",
    "Is your paint protection really made in the USA? Flags and labels do not tell the full story. Most PPF is not made where you think it is. Quality lives in chemistry, not geography.",
    "Where PPF actually comes from. Premium PPF starts with TPU chemistry. The best TPU comes from a few global chemical producers. Think raw material grade, not random factories. Most brands do not make TPU — they source it.",
    "Why US films set the benchmark: extensive UV and environmental testing, advanced adhesive systems that do not fail early, and warranties that are actually honoured.",
    "European products are built to last, sometimes overbuilt. Strong chemical engineering foundations. A focus on long-term durability and stability. Higher environmental and compliance standards. Often fewer flash features, more long-term consistency.",
    "Asia: innovation or gamble? It depends on the brand. Premium Korean films are genuinely impressive, with rapid innovation, excellent clarity and self-healing. Unbranded factory films can discolour early. The critical distinction is not imported versus local — it is branded versus unbranded.",
    "How cheap films expose themselves: no real brand identity or traceable origin, prices that seem too good to be true, no local warranty or installer backing. If the manufacturer will not stand behind it, neither should you.",
    "Origin matters, but installation matters more. The best film fails with poor installation. A good film installed properly outperforms hype brands. Experienced installers choose products they trust long-term. Chemistry plus testing plus installer skill equals results.",
    "So does brand really matter to you? Some brands earn trust through testing. Others rely on marketing and low prices. Smart owners ask the right questions.",
  ],
};

/** What a Bangalore monsoon leaves behind — 7 slides. */
export const MONSOON_DAMAGE: Carousel = {
  dir: "monsoon-damage",
  caption: "Five things the monsoon leaves behind.",
  slides: [
    "5 things the monsoon did to your car. You cannot see them yet — P91 Car Care.",
    "One: paint damage. Water spots and paint etching. Rainwater leaves minerals and pollutants behind. Over time they can etch into your clear coat.",
    "Two: hidden rust. Rust starts where you do not look. Moisture trapped in seams, edges and underbody areas can quietly trigger corrosion.",
    "Three: interior damage. Your interior is holding moisture. Wet mats, damp carpets and humidity can lead to unpleasant odours and hidden mould growth.",
    "Four: the real damage. Wipers, seals and trim take a hit. Constant moisture and grime can accelerate wear on rubber seals, wipers and exterior trims.",
    "Five: visible damage. Your paint loses its protection. Repeated exposure to rain, dirt and contaminants can weaken your car's surface protection.",
    "The most sophisticated way to handle this situation is to call P91 Car Care on 7406619191.",
  ],
};
