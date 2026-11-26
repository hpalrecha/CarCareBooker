import type { FaqItem, ProofPhoto } from "./types.ts";
import { VERIFIED_REVIEWS, HOME_REVIEW_COUNT, GOOGLE_REVIEWS_URL } from "../reviews.ts";

export const HOME = {
  hero: {
    h1: "PPF and ceramic coating in Bangalore",
    lead: "STEK film and Nasiol coating, fitted in our studio in Adugodi, next to Koramangala. Every service page explains what the job involves and what makes it cost more or less.",
    photo: { src: "/photos/creta-stek-ppf-studio.webp", alt: "Black Hyundai Creta in the P91 studio after STEK paint protection film, STEK wall behind", width: 3420, height: 1925, caption: "Hyundai Creta at handover, photographed in our studio" } satisfies ProofPhoto,
    primary: { href: "/services/paint-protection-film", label: "How paint protection film works" },
  },
  trust: [
    { strong: "Google reviews", sub: "Read what owners wrote", href: GOOGLE_REVIEWS_URL },
    // "{warrantyYears}" is filled from the catalogue (warrantyYearsOf) by the page, e.g. "5 or 7-year".
    { strong: "{warrantyYears} PPF warranty", sub: "Written terms at handover" },
    { strong: "STEK and Nasiol", sub: "You see the sealed roll first" },
    { strong: "Open daily", sub: "Adugodi studio" },
  ],
  services: [
    { family: "ppf", href: "/services/paint-protection-film", name: "Paint protection film", line: "STEK and P91 Premium film, full body.", photo: { src: "/photos/ppf-install-rear-quarter.webp", alt: "P91 installer positioning PPF on the rear quarter of a black SUV", width: 720, height: 1280 } },
    { family: "ceramic-car", href: "/services/ceramic-coating", name: "Ceramic coating", line: "Nasiol coating for gloss and easy washing.", photo: { src: "/photos/ceramic-wipe-bonnet.webp", alt: "Applicator block wiping ceramic coating onto a bonnet", width: 720, height: 1280 } },
    { family: "exterior-detailing", href: "/services/exterior-detailing", name: "Exterior detailing", line: "Polishing, hard-water spots, headlights.", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 800, height: 1422 } },
    { family: "interior-detailing", href: "/services/interior-detailing", name: "Interior detailing", line: "Vacuum, steam, fabric and leather.", photo: { src: "/photos/interior-vacuum-footwell.webp", alt: "Vacuuming debris from a rear footwell carpet", width: 800, height: 1422 } },
    { family: "ceramic-bike", href: "/services/ceramic-coating/bike", name: "Bike ceramic coating", line: "Tank, fairings and painted panels.", photo: null },
    { family: "car-wash", href: "/services/car-wash", name: "Car wash", line: "Hand wash and foam, done as detailing prep.", photo: null },
  ],
  beforeAfter: [
    {
      before: { src: "/photos/i20-before-bird-droppings.webp", alt: "Before: orange Hyundai i20 with bird droppings on the bonnet", width: 1400, height: 1867 },
      after: { src: "/photos/i20-after-studio.webp", alt: "After: the same orange Hyundai i20, glossy, in the P91 studio", width: 1400, height: 2488 },
      caption: "Hyundai i20 · bird-dropping marks removed and paint polished",
      href: "/services/exterior-detailing",
    },
  ],
  work: [
    { src: "/photos/evoque-studio.webp", alt: "White Range Rover Evoque with copper roof under the P91 wall logo", width: 1038, height: 1418, car: "Range Rover Evoque", job: "[NEEDS: service]" },
    { src: "/photos/vellfire-stek-wall.webp", alt: "White Toyota Vellfire beside the STEK wall", width: 958, height: 732, car: "Toyota Vellfire", job: "STEK PPF" },
    { src: "/photos/xuv700-stek-wall.webp", alt: "Dark blue Mahindra XUV700 in front of the STEK wall", width: 1120, height: 1316, car: "Mahindra XUV700", job: "[NEEDS: service]" },
    { src: "/photos/gle-nasiol-wall.webp", alt: "White Mercedes-Benz GLE in front of the Nasiol wall", width: 1084, height: 911, car: "Mercedes-Benz GLE", job: "[NEEDS: service]" },
  ],
  genuine: {
    h2: "How you know the film is genuine",
    lead: "Fake and relabelled PPF is common. Before we cut a single panel, you see:",
    steps: ["The sealed roll, with the brand label and batch number.", "The exact panels the quote covers, marked on your car.", "A written warranty card with that batch number, at handover."],
    photo: { src: "/photos/ppf-install-door-edge.webp", alt: "P91 installer fitting clear PPF around the rear door of a black SUV", width: 720, height: 1280 },
  },
  startHere: [
    { href: "/guides/what-is-ppf", label: "What is PPF?" },
    { href: "/guides/ppf-vs-ceramic-coating-bangalore", label: "PPF vs ceramic coating" },
    { href: "/guides/ppf-cost-bangalore", label: "PPF cost and why quotes differ" },
    { href: "/guides/how-much-ppf-does-your-car-need", label: "Full body or front only?" },
    { href: "/guides/is-your-ppf-really-made-in-usa", label: "Is your PPF genuine?" },
  ],
  // Owner decision 26 Nov: quote the first HOME_REVIEW_COUNT Google reviews, word for word, in order. No rating, no count.
  reviewNames: VERIFIED_REVIEWS.slice(0, HOME_REVIEW_COUNT).map((r) => r.name),
  faq: [
    { q: "PPF or ceramic coating?", a: "PPF is a clear film that takes stone chips and scratches. Ceramic coating is a hard, slick layer that sheds water and dirt. Many owners do both: film on the panels that take hits, coating over everything." },
    { q: "How long is my car with you?", a: "About 3 days for full-body PPF and about 1 day for car ceramic coating, from the studio's job times." },
    { q: "Why do PPF quotes differ so much?", a: "Film brand and line, how many panels are covered, the size of the car, and whether the paint is corrected first. Our PPF page explains each of these, and a photo on WhatsApp gets you a quote for your car." },
    { q: "Do you offer pickup and drop?", a: "On request. Call or WhatsApp us and we confirm pickup and drop for your area on the call." },
  ] satisfies FaqItem[],
  end: { title: "Send a photo of your car, we tell you what it needs", primary: { href: "https://wa.me/917406619191", label: "WhatsApp us" } },
};
