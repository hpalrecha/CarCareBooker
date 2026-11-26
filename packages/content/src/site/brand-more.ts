import type { BrandContent } from "./types.ts";

/**
 * Longer brand pages (owner, 26 Nov 2026: about 800 words each: what the product is, how P91 uses it, what it suits,
 * care, how to check it is genuine, 5+ FAQs). Sources, cited per block below:
 * - brand-pages.ts: what P91 fits (fits), the benefits, "STEK India describes itself as...", "Nasiol is a nano-coating
 *   manufacturer from Turkey...", "P91 Premium PPF is P91 Car Care's own paint protection film line", "Basic, Premium
 *   and Partial, each [quoted] for hatchbacks, sedans and SUVs".
 * - faq-page.ts hub answers (FAQ_GROUPS), with the fixes already applied on /faq (no manufacturer's warranty, no prices).
 * - products-page-data.ts: which brand answers which need.
 * - The approved care and "what it does not do" lines on the PPF, ceramic, sun control film and matte PPF pages.
 * - General, well-established knowledge of PPF, window film and ceramic coatings, written plainly.
 * No figures, no specifications, no prices, no warranty issuer. Anything P91-specific that is not on record is a
 * [NEEDS] gap: the template hides it (gaps.ts) and `npm run web:ship-gate` lists it for the studio.
 */
type BrandMore = Required<Pick<BrandContent, "sections" | "genuineIntro" | "faq">>;

// PPF care: the PPF page's "Living with PPF" and the hub FAQ "Can I pressure wash a car with PPF?" (faq-page.ts:340).
const FILM_CARE = [
  "Wait before the first wash for the time the studio gives at handover.",
  "Wash with a pH-neutral shampoo and a soft mitt, and dry with a clean microfibre towel.",
  "A pressure washer is fine if the jet stays away from film edges, damaged sections and any lifted area.",
  "Lift bird droppings, sap and insects soon, with water and a soft cloth.",
  "If an edge lifts or a section is damaged, bring the car back to the studio rather than trimming or pressing it yourself.",
];

export const BRAND_MORE: Record<string, BrandMore> = {
  stek: {
    sections: [
      {
        // brand-pages.ts STEK about/fits/benefits (gloss and matte, sun-control film); hub FAQs "Does PPF change the colour
        // of my car?", "Can PPF be removed...?", "Is PPF scratch-proof?" (self-healing "some films"), "IR rejection and TSER".
        h2: "What STEK makes",
        paras: [
          "STEK makes two kinds of film that P91 fits: paint protection film for the body, and window film for the glass. They are different products for different jobs, and a quote should say which one, and which line, it is for.",
          "Paint protection film is a clear urethane film fitted over the paint. Stone chips, light scratches and washing marks land on the film instead of the clear coat, and when the film is removed from sound factory paint, the paint underneath is as it was. STEK film comes in gloss, which keeps the car's colour and appearance, and in matte, which gives a satin look without repainting. Some films also have a self-healing top layer, so light swirls fade with heat. [NEEDS: which STEK PPF lines P91 stocks, and which of them are self-healing]",
          "Window film, which P91 calls sun-control film, goes on the inside of the glass to cut heat and glare in the cabin. How much heat a film rejects is not the same as how dark it looks, so the figure to compare is the film's total solar energy rejected (TSER), from its spec sheet.",
        ],
      },
      {
        // Hub FAQ "Where can I get professional PPF installation in Bangalore?" (process); PPF page steps; brand-pages.ts fits.
        h2: "How P91 fits STEK film",
        paras: [
          "Paint protection film is fitted in the studio in Adugodi, not on the roadside. The paint is inspected first and the panels the quote covers are agreed on the car. The car is washed and decontaminated so nothing is trapped under the film, and swirls and light scratches are polished out, because film locks in whatever is under it. The film is then fitted panel by panel, with edges wrapped where the panel allows, and the car is checked before handover.",
          "Coverage is your choice: full body, or the front panels that take most stone chips. See [front PPF](/services/paint-protection-film/front) and [full-body PPF](/services/paint-protection-film).",
          "Sun-control film is fitted to clean glass from inside the car, either on the full car (front, side and rear glass) or on the windshield only. The windows stay up for a short time afterwards while the film settles; the studio tells you how long at handover.",
        ],
      },
      {
        // Hub FAQs "Should I install PPF straight after buying a new car?", "Is partial PPF enough...?", matte PPF page,
        // "Will PPF increase my car's resale value?"; products-page-data.ts ("A cooler cabin and less glare").
        h2: "What STEK film suits",
        paras: ["Paint protection film is worth it where physical damage is the worry. It suits:"],
        bullets: [
          "**A new car** whose factory finish you want to keep before road damage and washing marks build up.",
          "**Daily driving in Bangalore traffic**, where grit thrown up by the vehicle in front chips the bumper, bonnet and mirrors.",
          "**Matte paint**, which cannot be polished, or a gloss car you want to make satin with matte film.",
          "**A car you plan to keep for years**, where the original paint is worth looking after.",
          "**A hot cabin and glare** (sun-control film), within the legal limits for each window.",
        ],
      },
      {
        // Hub FAQs "Is PPF scratch-proof?", "Can PPF be installed on an old car?", "Is automotive sun film legal in Bangalore?".
        h2: "What it does not do",
        paras: [
          "Film is not armour. A hard impact or a deep gouge can cut through film and paint together, and a collision is a body-shop job. It does not repair damage that is already there: chips and scratches under the film stay visible unless they are corrected first. On an older car the paint is assessed before anything goes on, and repainted panels carry more risk if the film is ever removed.",
          "Window film is subject to Indian motor vehicle rules on how much light the glass must let through. A film's light transmission rating alone does not prove it is legal to fit, so check the current rules for each window first. See [sun control film](/services/sun-control-film).",
        ],
      },
      {
        // FILM_CARE above; sun control film page "The first days after fitting" (glass cleaning).
        h2: "Caring for STEK film",
        paras: ["Film needs gentle washing, not special products:"],
        bullets: [
          ...FILM_CARE,
          "Clean filmed glass with a soft microfibre cloth and a mild, ammonia-free glass cleaner; never scrape the film or use anything abrasive.",
        ],
      },
    ],
    // Hub FAQ "How can I verify the authenticity of my PPF?" (faq-page.ts:333); Home "Fake and relabelled PPF is common".
    genuineIntro: [
      "Relabelled and unbranded film is common, and it looks the same as genuine film on the day it goes on. Ask for the film brand, the exact line, the batch details and the product documentation, and get the warranty terms in writing. If the maker offers warranty registration or product verification, follow its procedure. [NEEDS: whether STEK offers warranty registration or product verification for P91 jobs, and how the owner does it]",
      "At P91 you see:",
    ],
    faq: [
      // Hub FAQ "Where can I get STEK PPF installed in Bangalore?" with the /faq fix (written warranty terms).
      { q: "Where can I get STEK PPF fitted in Bangalore?", a: "At P91 Car Care in Adugodi, next to Koramangala. The studio offers gloss and matte STEK film, with partial and full-body coverage, and you can discuss the film, the batch details and the written warranty terms before installation." },
      // brand-pages.ts fits: sun-control film, full car and windshield.
      { q: "Does P91 fit STEK sun-control film as well as PPF?", a: "Yes. STEK sun-control film is fitted on the full car (front, side and rear glass) or on the windshield only. See [sun control film](/services/sun-control-film)." },
      // Hub FAQ "Can PPF be removed without damaging the original paint?".
      { q: "Can STEK PPF be removed later?", a: "Yes. Quality film can generally be removed professionally from sound factory paint. The result depends on the age of the film, the adhesive and the state of the paint; repainted or damaged panels carry more risk." },
      // Hub FAQ "Is PPF scratch-proof?".
      { q: "Will STEK PPF stop every scratch?", a: "No. It reduces damage from everyday abrasion, minor scratches and road debris, but deep cuts, major impacts and accidents can still damage the film and the paint below it." },
      // Hub FAQ "Can ceramic coating be applied over PPF?"; PPF page FAQ (same visit).
      { q: "Can ceramic coating go over STEK film?", a: "Yes, a compatible coating can go over the film to make it slicker and easier to wash. Booked together, it is done in the same visit." },
      // Hub FAQ "Which PPF brand is best for my car?".
      { q: "Should I choose STEK or P91 Premium PPF?", a: "No single film suits every car. Compare the film line, its finish and its written warranty terms against how long you will keep the car; you see the sealed roll of either before work starts. See [P91 Premium PPF](/brands/p91-premium-ppf)." },
      // Hub FAQ "Does darker sun film give better heat rejection?".
      { q: "Does darker sun film keep the cabin cooler?", a: "Not necessarily. Darkness and heat rejection are different properties, and some films reject a lot of heat while letting through a fair amount of light. Compare the TSER figure on the spec sheet." },
    ],
  },
  nasiol: {
    sections: [
      {
        // General ceramic-coating knowledge; brand-pages.ts Nasiol about.
        h2: "What a nano-ceramic coating is",
        paras: [
          "A ceramic coating is a liquid applied to prepared paint that cures into a thin, hard, slick layer bonded to the surface. It is far thinner than paint protection film. What it changes is how the surface behaves: water beads and rolls off, dirt has less to hold on to, and washing is quicker.",
          "Nasiol is a nano-coating manufacturer from Turkey. Its coatings are made to repel water, oil and stains, and to protect a surface from scratches, UV and chemicals. [NEEDS: which Nasiol coating product or products P91 applies on cars and on bikes]",
        ],
      },
      {
        // Hub FAQs "Where can I get ceramic coating near Koramangala?" (the work), "What is the difference between car
        // polishing and ceramic coating?", "Can I get ceramic coating for my motorcycle?".
        h2: "How P91 applies Nasiol",
        paras: [
          "A coating seals in the surface under it, so preparation comes first. Depending on the package, the work includes decontamination, paint correction and polishing, then the coating, then curing time in the studio before the car goes home.",
          "Polishing and coating do different jobs: polishing improves the surface you have by reducing swirl marks, light scratches and dullness; the coating helps you keep it. How long the car stays, and how long the coating lasts, are on the [ceramic coating](/services/ceramic-coating) page.",
          "On motorcycles the coating goes on the painted surfaces: the fuel tank, the fairings and the body panels, depending on the bike and the package. See [bike ceramic coating](/services/ceramic-coating/bike).",
        ],
      },
      {
        // Hub FAQs "Is ceramic coating worth it in Bangalore?", "Can ceramic coating be applied over PPF?"; bike ceramic page.
        h2: "What Nasiol coating suits",
        paras: ["A coating is worth considering where dust, rain and outdoor parking are the daily problem:"],
        bullets: [
          "**Cars parked outside** that collect dust, bird droppings and rain marks.",
          "**Owners who want easier washing** and a gloss that lasts between washes.",
          "**A car just corrected or polished**, where the coating helps keep the result.",
          "**Paint protection film**, where a compatible coating over the film makes it slicker and easier to clean.",
          "**Motorcycles**, where fuel splashes, road grime and chain fling wipe off a coated tank and fairings more easily.",
        ],
      },
      {
        // Hub FAQs "Is ceramic coating worth it...?", "Does 9H ceramic coating make a car scratch-proof?" (no 9H wording),
        // "Can ceramic coating prevent hard water stains?".
        h2: "What it does not do",
        paras: [
          "A coating does not make paint scratch-proof and it does not stop stone chips; when physical damage is the main worry, paint protection film is the better choice. It cannot fully prevent hard water spotting either: it makes some mineral deposits easier to clean, but drying promptly and washing properly still matter. And it does not remove the need for regular washing.",
        ],
      },
      {
        // Hub FAQ "How should I maintain my car after ceramic coating?"; hard water page (drying in the shade).
        h2: "Caring for a coated car",
        paras: ["Coated paint needs the right washing, not more of it:"],
        bullets: [
          "Follow the curing and aftercare instructions given at handover.",
          "Use a compatible car shampoo and clean microfibre wash mitts and drying towels.",
          "Avoid abrasive products and rough automatic-wash brushes.",
          "Dry the car in the shade, so mineral-heavy water does not dry on the coating.",
          "Lift bird droppings soon, with water and a soft cloth.",
        ],
      },
    ],
    // brand-pages.ts batch line; warranty-wording.ts handover line.
    genuineIntro: [
      "A coating looks like any other once it is on the car, so the time to check it is before work starts. Ask which Nasiol product is being applied, see the product and its batch details, and get the written warranty terms at handover. [NEEDS: how an owner can check a Nasiol coating is genuine: label, batch number, or any Nasiol registration]",
    ],
    faq: [
      // Hub FAQ "Where can I get Nasiol ceramic coating in Bangalore?".
      { q: "Where can I get Nasiol ceramic coating in Bangalore?", a: "At P91 Car Care in Adugodi, next to Koramangala, for cars and motorcycles. You can discuss durability, paint preparation, maintenance and the written warranty terms before choosing a package." },
      // Hub FAQ "Does 9H ceramic coating make a car scratch-proof?" (reworded without the rating).
      { q: "Does Nasiol coating make my car scratch-proof?", a: "No. A coating adds a hard, slick layer that takes some daily wear, but it does not stop all scratches or stone chips. Paint protection film is the better choice for physical damage." },
      // Hub FAQ "Can ceramic coating prevent hard water stains?".
      { q: "Will Nasiol stop hard water spots?", a: "It makes some mineral deposits easier to clean, but it cannot fully prevent hard water spotting. Drying the car promptly in the shade still matters. See [hard water spot removal](/services/exterior-detailing/hard-water-spot-removal)." },
      // Hub FAQ "What is the difference between car polishing and ceramic coating?"; brand-pages.ts fits ("Paint correction, then a ceramic layer").
      { q: "Is the paint polished before the coating goes on?", a: "Yes, as the paint needs it. The coating seals in the surface under it, so swirl marks and light scratches are reduced first." },
      // Hub FAQ "Can I get ceramic coating for my motorcycle?".
      { q: "Can Nasiol go on a bike?", a: "Yes. P91 coats motorcycles too: the fuel tank, fairings and painted body panels, depending on the bike and the package." },
      // Hub FAQ "How should I maintain my car after ceramic coating?".
      { q: "How do I wash a car after ceramic coating?", a: "With a compatible car shampoo, clean microfibre mitts and drying towels. Avoid abrasive products and rough automatic-wash brushes, and follow the curing instructions given at handover." },
    ],
  },
  "p91-premium-ppf": {
    sections: [
      {
        // brand-pages.ts P91 Premium PPF about; hub FAQ "What is the difference between P91 Basic and Premium PPF?".
        h2: "What P91 Premium PPF is",
        paras: [
          "P91 Premium PPF is a clear paint protection film sold under P91 Car Care's own name and fitted at the studio in Adugodi. Like any PPF, it is a urethane film fitted over the paint, so stone chips, light scratches and washing marks land on the film instead of the clear coat.",
          "Both full-body packages give paint protection with hydrophobic and UV-protective properties. [NEEDS: where P91 Premium PPF is made, and who supplies it] [NEEDS: the finishes P91 Premium PPF comes in, and whether it is self-healing]",
        ],
      },
      {
        // brand-pages.ts ("Basic, Premium and Partial ... hatchbacks, sedans and SUVs", fits); hub FAQ Basic vs Premium.
        h2: "The packages",
        paras: ["The film is fitted in three packages, each quoted for hatchbacks, sedans and SUVs:"],
        bullets: [
          "**Basic:** full-body film, the standard line.",
          "**Premium:** full body, in a higher-grade film, with a longer written warranty than Basic.",
          "**Partial:** the panels that take the most impacts, such as the front bumper, bonnet and mirrors. See [front PPF](/services/paint-protection-film/front).",
        ],
      },
      {
        // PPF page steps and hub FAQ "Where can I get professional PPF installation in Bangalore?" (process).
        h2: "How P91 fits it",
        paras: [
          "The studio fits its own film the same way it fits any film. The paint is inspected and the panels are agreed on the car. The car is washed and decontaminated, and swirls and light scratches are polished out, because the film locks in whatever is under it. The film is then fitted panel by panel, edges wrapped where the panel allows, and the car is checked under studio light before handover with the written warranty terms.",
          "How long the car stays, and the warranty for each line, are on the [paint protection film](/services/paint-protection-film) page.",
        ],
      },
      {
        // Hub FAQ Basic vs Premium ("depends on your budget, driving conditions and how long you plan to keep the car");
        // "Is partial PPF enough for Bangalore driving conditions?"; PPF page "Front only or full body?".
        h2: "Which package suits your car",
        paras: ["The right package depends on your budget, your driving conditions and how long you plan to keep the car. As a rough guide:"],
        bullets: [
          "**Partial** suits a daily-driven car where the worry is stone chips on the front, and the budget goes to the panels that need it most.",
          "**Basic** suits owners who want every painted panel covered, including doors and quarters against parking-lot scrapes.",
          "**Premium** suits owners keeping the car for years, who want the higher-grade film and the longer warranty.",
        ],
      },
      {
        // Hub FAQs "Is PPF scratch-proof?", "Can PPF be installed on an old car?".
        h2: "What it does not do",
        paras: [
          "No film is scratch-proof. It reduces damage from everyday abrasion, minor scratches and road debris, but deep cuts, major impacts and accidents can still damage the film and the paint below it. It does not repair damage already in the paint, and on an older car the paint is assessed before anything goes on.",
        ],
      },
      {
        h2: "Caring for P91 Premium PPF",
        paras: ["Care is the same as for any quality film:"],
        bullets: FILM_CARE,
      },
    ],
    genuineIntro: [
      "Because P91 Premium PPF is the studio's own line, the studio is the one to answer for it. Before work starts you see the roll it comes from, and the panels it will cover are agreed on your car. [NEEDS: how a P91 Premium PPF roll is labelled, and what the owner can check on it]",
    ],
    faq: [
      // brand-pages.ts (own line; STEK a separate brand); hub FAQ "Which PPF brand is best for my car?".
      { q: "Is P91 Premium PPF the same as STEK?", a: "No. P91 Premium PPF is P91 Car Care's own film line; STEK is a separate brand the studio also fits. You can compare the two at the studio before choosing. See [STEK](/brands/stek)." },
      // Hub FAQ "What is the difference between P91 Basic and Premium PPF?".
      { q: "What is the difference between Basic and Premium?", a: "Both are full-body packages with hydrophobic and UV-protective properties. Premium uses a higher-grade film and carries a longer written warranty than Basic. The PPF page lists the current warranty for each." },
      // brand-pages.ts fits ("Partial PPF packages: The panels that take the most impacts").
      { q: "Is there a partial package?", a: "Yes. The Partial package covers the panels that take the most impacts. See [front PPF](/services/paint-protection-film/front) for what partial coverage includes and where the film ends." },
      // Hub FAQ "Can PPF be installed on an old car?".
      { q: "Can it be fitted on an older car?", a: "Yes, if the paint is sound. Scratches, oxidation, repainting or clear-coat damage are assessed first, and the paint is corrected before the film goes on, because the film does not repair defects under it." },
      // Hub FAQ "Can ceramic coating be applied over PPF?"; PPF page FAQ.
      { q: "Can ceramic coating go over P91 Premium PPF?", a: "Yes, a compatible coating can go over the film to make it slicker and easier to wash. Booked together, it is done in the same visit." },
      // Hub FAQ "How much does PPF installation cost in Bangalore?" with the /faq fix (no prices).
      { q: "How is it priced?", a: "By package and by body type: hatchback, sedan or SUV. The [paint protection film](/services/paint-protection-film) page explains what moves the quote; send a photo of your car on WhatsApp for a quote for your car." },
    ],
  },
};
