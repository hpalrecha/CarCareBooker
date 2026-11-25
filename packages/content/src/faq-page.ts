/**
 * /faq — the FAQ hub. ONE list, three consumers: faq.tsx renders it, lib/crawlable-content.ts
 * bakes it into the prerendered HTML, and scripts/prerender.mjs emits its FAQPage schema from
 * it, so the visible page, the raw HTML and the schema cannot disagree.
 *
 * Source: the manager's FAQ document (Faqs.docx, 19 Nov 2026), edited to the site's rules.
 *
 * NO PRICE, NO DURATION IN DAYS OR HOURS, NO WARRANTY LENGTH IN YEARS appears here, on purpose.
 * Prices, durations and warranty terms live in the service catalogue and change there (see the
 * price rule at the top of lib/landing-pages.ts and lib/home-faq.ts). A number typed into this
 * file would go stale and contradict the page the visitor lands on next. Answers point to the
 * live service page instead (FAQ_PPF_PATH and friends below).
 *
 * Wording rule: P91 is never described as "best" or "most trusted". Where a question asks for
 * one, the answer gives the criteria and then states what P91 offers.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqGroup {
  /** Anchor id and schema-free key. */
  id: string;
  heading: string;
  items: FaqItem[];
}

/** Live service pages the answers point to. Prices and warranty terms are read there. */
export const FAQ_PPF_PATH = "/ppf";
export const FAQ_CERAMIC_PATH = "/ceramic-coating/car";
export const FAQ_GLASS_PATH = "/services/glass-sun-control-film-bangalore";
export const FAQ_DETAILING_PATH = "/service/exterior-detailing-hard-water-new";

/** Shown under the page heading. Bump when the answers are edited. */
export const FAQ_LAST_UPDATED = "2026-11-19";
export const FAQ_LAST_UPDATED_LABEL = "19 November 2026";

export const FAQ_INTRO: string[] = [
  "Owning a car in Bangalore comes with its own set of challenges. Daily traffic, road debris, dust, hard water, monsoon conditions, outdoor parking and frequent washing can gradually affect your vehicle's appearance and paintwork.",
  "P91 Car Care is an automotive detailing and paint protection studio in Adugodi, Bengaluru, offering professional vehicle protection, restoration and maintenance. Our services include Paint Protection Film (PPF), ceramic coating, interior rejuvenation, exterior detailing, windshield treatments, headlight restoration and automotive sun-control films.",
  "With products from STEK, Nasiol and P91 Premium PPF, you can compare protection options by vehicle, usage, budget and how long you plan to keep the car. Prices and warranty terms are on each service page, so they are always current.",
];

/** The four service cards above the questions. */
export const FAQ_SERVICE_CARDS: { title: string; body: string; href: string; cta: string }[] = [
  {
    title: "Paint Protection Film (PPF)",
    body: "Physical paint protection against minor scratches, stone chips and road debris. Full-body and partial coverage options are available.",
    href: FAQ_PPF_PATH,
    cta: "Explore PPF",
  },
  {
    title: "Ceramic coating",
    body: "Designed to enhance gloss, improve water repellency and simplify routine vehicle maintenance.",
    href: FAQ_CERAMIC_PATH,
    cta: "Explore ceramic coating",
  },
  {
    title: "Professional car detailing",
    body: "Interior and exterior treatments designed to clean, restore and maintain your vehicle's appearance.",
    href: FAQ_DETAILING_PATH,
    cta: "Explore detailing",
  },
  {
    title: "Glass and sun-control film",
    body: "Glass treatments and heat-rejection solutions, subject to applicable vehicle glazing regulations.",
    href: FAQ_GLASS_PATH,
    cta: "Explore glass protection",
  },
];

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "finding-a-studio",
    heading: "Finding the right car care studio in Bangalore",
    items: [
      {
        question: "What should I look for in a car detailing studio in Bangalore?",
        answer:
          "Consider product authenticity, installation procedure, previous work, customer feedback, workshop facilities, pricing transparency and warranty support. " +
          "P91 Car Care is an automotive detailing studio in Adugodi, Bangalore, offering STEK PPF, P91 Premium PPF, Nasiol ceramic coatings, interior detailing and exterior paint care. " +
          "You can read its service pages, see previous installations in the gallery and ask for the warranty terms before you decide. " +
          "The right studio for you depends on your vehicle, your location, your budget and the workmanship you expect.",
      },
      {
        question: "Where can I get professional PPF installation in Bangalore?",
        answer:
          "P91 Car Care installs Paint Protection Film at its Adugodi studio in Bangalore. You can choose STEK or P91 PPF, with protection packages for hatchbacks, sedans and SUVs. " +
          "The process covers paint assessment, surface preparation, film application and a finishing inspection before handover.",
      },
      {
        question: "Where can I get STEK PPF installed in Bangalore?",
        answer:
          "STEK Paint Protection Film is available at P91 Car Care in Adugodi, Bengaluru. The studio offers gloss and matte films, with partial and full-body coverage. " +
          "You can discuss film specifications, batch details, vehicle compatibility and the manufacturer's warranty before installation.",
      },
      {
        question: "Where can I get ceramic coating near Koramangala?",
        answer:
          "Owners in Koramangala can visit P91 Car Care in neighbouring Adugodi. The studio offers Nasiol ceramic coating for cars and motorcycles. " +
          "Depending on the package, the work can include decontamination, paint correction, polishing, coating application and curing.",
      },
      {
        question: "How do I choose a car detailing studio I can trust?",
        answer:
          "A reliable studio is clear about its products, installation methods, what each package includes, its pricing and its warranty conditions. " +
          "Before you book, ask for photographs of previous installations, check that the product is genuine, and find out exactly what the warranty covers. " +
          "P91 Car Care publishes its services and packages online and issues the manufacturer's written warranty at handover.",
      },
      {
        question: "Does P91 Car Care serve customers outside Adugodi?",
        answer:
          "Yes. P91 Car Care works from its Adugodi studio and serves owners from Koramangala, HSR Layout, Shanti Nagar and other parts of Bengaluru. " +
          "Pickup and drop is available across Bangalore at cost, subject to booking confirmation.",
      },
      {
        question: "Where can I find the best car detailing studio near Koramangala?",
        answer:
          "P91 Car Care is a premium car detailing studio in Adugodi, near Koramangala, Bengaluru. We offer professional PPF installation, ceramic coating, paint correction, polishing and interior and exterior detailing. " +
          "Pickup and drop is available across Bengaluru at an additional cost, subject to booking confirmation.",
      },
      {
        question: "Does P91 Car Care offer pickup and drop in Koramangala?",
        answer:
          "Yes. P91 Car Care offers pickup and drop in Koramangala and other parts of Bengaluru at an additional cost, subject to availability and booking confirmation.",
      },
    ],
  },
  {
    id: "paint-protection-film",
    heading: "Paint Protection Film: cost, installation and protection",
    items: [
      {
        question: "How much does PPF installation cost in Bangalore?",
        answer:
          "The cost depends on the vehicle size, the film you choose, the coverage and the complexity of the installation. " +
          "P91 Car Care shows the current price for each package, by vehicle type, on its PPF page. STEK film prices can differ from P91 PPF prices.",
      },
      {
        question: "What is the difference between P91 Basic and Premium PPF?",
        answer:
          "Both packages give full-body paint protection with hydrophobic and UV-protective properties. The Premium package uses a higher-grade film and carries a longer warranty than Basic. " +
          "The right package depends on your budget, driving conditions and how long you plan to keep the car. The PPF page lists the current warranty for each.",
      },
      {
        question: "Which PPF brand is best for my car?",
        answer:
          "No single PPF brand suits every vehicle. Compare film construction, optical clarity, finish, self-healing where applicable, warranty conditions and installation quality. " +
          "P91 Car Care offers STEK and P91 PPF, so you can compare products against your own requirements.",
      },
      {
        question: "Should I install PPF straight after buying a new car?",
        answer:
          "Fitting PPF soon after delivery helps preserve the factory finish before road damage and washing marks develop. " +
          "Even a new car should be inspected and prepared before installation.",
      },
      {
        question: "Can PPF be installed on an old car?",
        answer:
          "Yes, provided the paint is in suitable condition. Existing scratches, oxidation, repainting or clear-coat damage should be assessed first. " +
          "PPF does not repair underlying paint defects, so paint correction or other preparation may be needed.",
      },
      {
        question: "Is PPF scratch-proof?",
        answer:
          "No. PPF helps reduce damage from everyday abrasion, minor scratches and road debris, but it cannot prevent all damage. " +
          "Some films are self-healing, which helps light marks fade under suitable conditions. Deep cuts, major impacts and accidents can still damage the film and the paint below it.",
      },
      {
        question: "Can PPF be removed without damaging the original paint?",
        answer:
          "Quality PPF can generally be removed professionally from sound factory paint. The outcome depends on the age of the film, the condition of the adhesive, the quality of the installation and the state of the paint. " +
          "Repainted or damaged panels carry a greater risk during removal.",
      },
      {
        question: "Does PPF change the colour of my car?",
        answer:
          "Clear gloss PPF is designed to keep the car's existing colour and appearance. Matte PPF gives a satin or matte look without repainting. The finish depends on the film you select.",
      },
      {
        question: "How long does full-body PPF installation take?",
        answer:
          "The approximate studio time for each package is on its service page. Extra preparation, vehicle complexity or specific film requirements can affect the time, so confirm it when you book.",
      },
      {
        question: "Is partial PPF enough for Bangalore driving conditions?",
        answer:
          "Partial PPF is a practical choice if you mainly want to protect high-impact areas such as the front bumper, bonnet and mirrors. " +
          "Full-body PPF covers most exterior painted panels.",
      },
      {
        question: "Will PPF increase my car's resale value?",
        answer:
          "PPF can help preserve the appearance of the original paint, which helps when you sell. Resale value also depends on age, mileage, mechanical condition, accident history and market demand. PPF does not guarantee a higher price.",
      },
      {
        question: "Can ceramic coating be applied over PPF?",
        answer:
          "Yes, compatible ceramic coatings can be applied over certain paint protection films to improve slickness, water repellency and ease of cleaning. " +
          "Confirm compatibility with the film and coating manufacturers before application.",
      },
      {
        question: "Which is the best place for PPF installation near Koramangala?",
        answer:
          "P91 Car Care in Adugodi offers professional Paint Protection Film installation with STEK and P91 Premium PPF options. " +
          "You can choose full-body or partial PPF packages based on your vehicle, your protection needs and your budget. Manufacturer warranty documentation is provided as applicable to the selected film.",
      },
      {
        question: "Can I get STEK PPF installed for my new car in Bengaluru?",
        answer:
          "Yes. P91 Car Care offers STEK PPF installation at its Adugodi studio in Bengaluru. " +
          "You can ask about the available gloss and matte films, coverage options, the installation procedure and the applicable manufacturer warranty.",
      },
    ],
  },
  {
    id: "ceramic-coating",
    heading: "Ceramic coating",
    items: [
      {
        question: "Is ceramic coating worth it in Bangalore?",
        answer:
          "It is worth considering if your car regularly meets dust, rain, hard water and outdoor parking. It can make cleaning easier and help keep the gloss. " +
          "It does not eliminate water spots, prevent every scratch or remove the need for regular washing.",
      },
      {
        question: "Where can I get Nasiol ceramic coating in Bangalore?",
        answer:
          "P91 Car Care applies Nasiol ceramic coating at its Adugodi studio, for cars and motorcycles. " +
          "You can discuss durability, paint preparation, maintenance and warranty before choosing a package.",
      },
      {
        question: "What is the difference between car polishing and ceramic coating?",
        answer:
          "Polishing is paint correction: it reduces light scratches, swirl marks and dullness. " +
          "Ceramic coating is applied after suitable preparation to add gloss and surface protection. Polishing improves the surface you have, and the coating helps you keep it.",
      },
      {
        question: "Does 9H ceramic coating make a car scratch-proof?",
        answer:
          "No. A 9H rating usually refers to pencil hardness under a specified test. It does not mean the coating stops all scratches or impacts. " +
          "PPF is generally the better choice when stone chips and physical damage are your main concern.",
      },
      {
        question: "Can ceramic coating prevent hard water stains?",
        answer:
          "It can make some mineral deposits easier to clean, but it cannot fully prevent hard water spotting. " +
          "Drying promptly, washing properly and regular maintenance still matter, especially if your car meets mineral-rich water.",
      },
      {
        question: "Can I get ceramic coating for my motorcycle?",
        answer:
          "Yes. P91 Car Care offers ceramic coating for motorcycles. Depending on the bike and the package, painted surfaces such as the fuel tank, fairings and body panels can be treated.",
      },
      {
        question: "What is the starting price of ceramic coating at P91 Car Care?",
        answer:
          "The final price depends on the vehicle size, the paint condition, the preparation needed and the coating you choose. " +
          "The current starting price for each ceramic coating package is shown on the ceramic coating page, so it is always up to date.",
      },
    ],
  },
  {
    id: "car-detailing",
    heading: "Professional car detailing",
    items: [
      {
        question: "What is the difference between car washing and car detailing?",
        answer:
          "Washing removes visible dirt and surface contamination. Professional detailing cleans and restores interior and exterior surfaces more thoroughly. " +
          "Depending on the package it can include polishing, decontamination, upholstery cleaning and trim care.",
      },
      {
        question: "Can detailing restore faded car paint?",
        answer:
          "Paint correction can improve some surface dullness, oxidation and swirl marks. " +
          "Heavily damaged paint, peeling clear coat or deep scratches may need repainting instead. An inspection before you choose a treatment is recommended.",
      },
      {
        question: "Can I get my car detailed before selling it?",
        answer:
          "Yes. Detailing can improve how the car looks: a clean interior, fewer paint imperfections and a restored surface. " +
          "It makes the car more presentable to buyers without guaranteeing a particular selling price.",
      },
      {
        question: "Where can I get professional paint correction in Bengaluru?",
        answer:
          "P91 Car Care provides professional paint correction and polishing at its Adugodi detailing studio. " +
          "The treatment is chosen according to the paint condition and can help reduce swirl marks, light scratches and surface imperfections.",
      },
    ],
  },
  {
    id: "sun-control-film",
    heading: "Sun-control film and windshield",
    items: [
      {
        question: "What is the difference between IR rejection and TSER?",
        answer:
          "Infrared (IR) rejection measures how much infrared radiation a film rejects under specified test conditions. " +
          "Total Solar Energy Rejected (TSER) covers the wider solar spectrum and is generally the more useful number for comparing overall heat rejection. Check the technical data sheet for the exact film.",
      },
      {
        question: "Does darker sun film give better heat rejection?",
        answer:
          "Not necessarily. Darkness and heat rejection are different properties. Some high-performance films reject a lot of heat while keeping relatively high visible light transmission.",
      },
      {
        question: "Is automotive sun film legal in Bangalore?",
        answer:
          "Automotive glazing and aftermarket film are subject to Indian motor vehicle regulations and court directions. " +
          "A film's visible light transmission rating alone does not prove that installation is legally permitted, so confirm the current rules before you install.",
      },
      {
        question: "What is windshield glass coating?",
        answer:
          "It is a surface treatment that improves water repellency and makes glass easier to maintain. It is different from sun-control film, and it does not replace properly working wipers.",
      },
    ],
  },
  {
    id: "warranty-and-maintenance",
    heading: "Warranty and maintenance",
    items: [
      {
        question: "Does P91 Car Care provide a written warranty?",
        answer:
          "Yes. Coating and PPF jobs are backed by the film or coating manufacturer's written warranty, issued at handover. " +
          "Coverage, duration, exclusions and maintenance requirements depend on the product you choose, so ask to see them before work starts.",
      },
      {
        question: "How can I verify the authenticity of my PPF?",
        answer:
          "Ask for the film brand, the exact variant, the batch details, the product documentation and the warranty information. " +
          "If the manufacturer offers digital warranty registration or product verification, follow that manufacturer's procedure.",
      },
      {
        question: "Can I pressure wash a car with PPF?",
        answer:
          "Yes, if you do it carefully and follow the manufacturer's instructions. Keep high-pressure water away from film edges, damaged sections and any lifted areas.",
      },
      {
        question: "How should I maintain my car after ceramic coating?",
        answer:
          "Use a compatible car shampoo, clean microfibre wash materials and suitable drying towels. Avoid abrasive products and rough automatic-wash brushes. " +
          "Follow the curing and maintenance instructions supplied with your coating.",
      },
    ],
  },
];

/** PPF vs ceramic coating, shown after the ceramic coating group. */
export const FAQ_COMPARISON = {
  heading: "PPF vs ceramic coating",
  columns: ["Feature", "PPF", "Ceramic coating"],
  rows: [
    ["Protection type", "Physical film", "Surface coating"],
    ["Stone chip resistance", "Yes, within limits", "Minimal"],
    ["Gloss enhancement", "Depends on film", "Yes"],
    ["Hydrophobic properties", "Variant dependent", "Product dependent"],
    ["Minor abrasion protection", "Higher", "Limited"],
    ["Self-healing", "Selected variants", "Generally no"],
    ["Ideal for", "Physical paint protection", "Gloss and maintenance"],
  ],
};

/** Group after which the comparison table is shown. */
export const FAQ_COMPARISON_AFTER = "ceramic-coating";

/** Every question, flat, for the schema and the tests. */
export const FAQ_ALL: FaqItem[] = FAQ_GROUPS.flatMap((g) => g.items);

/** FAQPage JSON-LD. Every question and answer here is on the visible page. */
export function faqHubSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ALL.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
