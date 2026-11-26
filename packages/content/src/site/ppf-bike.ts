import type { ServiceContent } from "./types.ts";

/**
 * /services/paint-protection-film/bike. New copy (Plan 2b batch B): general PPF and motorcycle-care knowledge,
 * written plainly. P91-specific facts not on record are [NEEDS]. The one P91 fact on record is a Google review
 * (Dhanush Dhanush, reviews.ts) for PPF on a Kawasaki Z900, quoted word for word.
 * No price line and no photo: no bike PPF catalogue row and no real bike photo exist.
 */
export const PPF_BIKE: ServiceContent = {
  family: null,
  breadcrumb: [
    { href: "/services", label: "Services" },
    { href: "/services/paint-protection-film", label: "Paint protection film" },
    { href: "/services/paint-protection-film/bike", label: "Bike PPF" },
  ],
  eyebrow: "Tank · Fairings · Painted panels · Adugodi",
  h1: "Bike PPF in Bangalore",
  shortAnswer:
    "Bike PPF is clear paint protection film cut for a motorcycle: the tank, where knees, jackets and bags rub, and the fairings and fenders, where stones and grit hit. It takes the scuffs and chips instead of the paint, and peels off later without touching it. [NEEDS: studio time for a bike PPF job]",
  hero: null,
  sections: [
    {
      h2: "Where a motorcycle's paint gets damaged",
      paras: ["A bike's paint wears in different places from a car's, and most of the damage comes from the rider and the road:"],
      bullets: [
        "**The tank top and sides.** Jacket zips, belt buckles, tank bags and knees rub the same spots on every ride. On a dark tank the scuffs show within months.",
        "**The front fairing, fender and headlamp.** They sit right behind the front wheel and in the path of grit thrown up by the vehicle ahead.",
        "**The side panels and frame covers.** Boots, luggage straps and the side stand area collect scrapes.",
        "**The rear panels and tail.** Grit and spray from the rear wheel, and scratches from luggage and passengers.",
      ],
    },
    {
      h2: "What the film does, and what it does not",
      paras: [
        "PPF is a tough, clear urethane film. Rubbing, light scratches and stone chips land on the film instead of the paint, and when the film is eventually removed, the paint underneath is in the condition it was in when the film went on.",
        "It is not crash protection. A fall, a slide or a deep gouge can cut through film and paint together. Frame sliders and crash guards do that job; film looks after the finish.",
      ],
    },
    {
      h2: "Which parts to cover",
      paras: [
        "A sensible starting point is the tank, because that is where the visible wear builds up fastest, adding the front fairing or front fender for stone chips. Fully faired bikes have more painted surface to protect than naked bikes, and the choice of panels changes the price more than anything else.",
        "Covering every painted panel is possible, but small, complex parts take a lot of cutting and fitting for little added protection. [NEEDS: which bike panels P91 covers, and whether kits are pre-cut or hand-cut]",
      ],
    },
    {
      h2: "Gloss, matte and new bikes",
      paras: [
        "Gloss film keeps a gloss tank looking as it is. Many bikes now leave the factory in matte or satin paint, and that finish cannot be polished if it is scratched, so matte film is the better match there. See [matte PPF](/services/paint-protection-film/matte) for how matte film behaves.",
        "The best time to fit film is soon after delivery, before the first scuffs. A used bike can be filmed too, but marks already in the paint stay visible under the film unless they are polished out first.",
      ],
    },
    {
      h2: "Bangalore riding and the paint",
      paras: [
        "City riding is hard on a bike's paint in ways that have nothing to do with speed. Gravel collects at the edges of the road and in construction zones and is flicked up by the vehicles ahead. Potholes throw muddy water at the fender and fairing in the monsoon. In packed two-wheeler parking, mirrors, helmets and handlebars of the bikes next to yours rub along the tank and side panels.",
        "Bikes also live outdoors more than cars do, so the sun and dew work on the paint every day. Film takes the knocks; a gentle wash routine and shade where you can find it look after the rest."
      ],
    },
    {
      h2: "Film or ceramic coating for a bike?",
      paras: [
        "They do different jobs. Film takes rubbing, scuffs and chips. A [ceramic coating for bikes](/services/ceramic-coating/bike) is a gloss and easy-cleaning layer: fuel splashes, chain fling and road grime wipe off it, but it will not stop a scratch.",
        "The two combine well: film on the tank and the front, where the contact is, and coating over everything else.",
      ],
    },
    {
      h2: "What moves the price",
      bullets: [
        "**How many panels.** The tank alone, or tank plus fairings, fenders and side panels.",
        "**The bike's shape.** Deeply curved tanks and vented fairings take longer to fit cleanly.",
        "**Paint condition.** Scratches on a used bike are polished out before film goes on.",
        "**Gloss or matte film.** Two different products, priced separately.",
      ],
      paras: ["Bike film is priced on the work, which varies a lot from bike to bike:"],
    },
    {
      h2: "Riding and washing with film on",
      bullets: [
        "Let the film settle before the first wash. [NEEDS: days before the first wash after bike PPF]",
        "Wash with a pH-neutral bike shampoo and a soft mitt; dry with a microfibre towel.",
        "Keep a pressure washer away from film edges, as well as from bearings, the chain and electrical connectors.",
        "Wipe petrol splashes off the tank promptly.",
        "If a corner lifts, do not pull it; bring the bike back so it can be checked.",
      ],
      paras: [],
    },
    {
      h2: "What to ask before you book",
      bullets: [
        "Which panels are covered, named one by one.",
        "Which film, by brand and line, and whether it is gloss or matte.",
        "How the edges are finished around the tank cap, badges and knee pads.",
        "How long the bike stays in the studio.",
        "The warranty terms, in writing at handover.",
      ],
      paras: [],
    },
  ],
  reviewNames: ["Dhanush Dhanush"],
  faq: [
    { q: "Will PPF change how my tank looks?", a: "Gloss film is close to invisible on gloss paint. Matte film turns gloss paint satin, so choose the film that matches the finish you want." },
    { q: "Can I fit tank pads over the film?", a: "Ask before you book, so the pad position is planned before the film goes on. A pad stuck on later and then moved can lift the film with it." },
    { q: "Does film protect in a fall?", a: "No. Film handles rubbing, scuffs and stone chips. A fall can damage film and paint together; crash guards and sliders are for that." },
    { q: "Can the film be removed later?", a: "Yes. Genuine film is made to come off sound factory paint without lifting it when a studio removes it." },
    { q: "Is it worth it on an older bike?", a: "If the paint is in decent shape, yes: it stops further wear. Scratches already there are polished out first, or they stay visible under the film." },
    { q: "When should film go on a new bike?", a: "As soon as practical after delivery, before the first rides put scuffs on the tank. Film over a scuffed tank keeps the scuffs under it unless they are polished out first." },
    { q: "Can more panels be added later?", a: "Yes. Film can be added to other panels at a later visit, so starting with the tank and adding the fairing later is fine." },
    { q: "How do I get bugs and tar off the film?", a: "Soak them with water and a pH-neutral shampoo and wipe gently. Do not scrape them, and keep strong solvent tar removers away from the film edges." },
  ],
  related: [
    { href: "/services/ceramic-coating/bike", label: "Bike ceramic coating" },
    { href: "/services/paint-protection-film/matte", label: "Matte PPF" },
    { href: "/services/paint-protection-film", label: "Car PPF" },
    { href: "/brands/stek", label: "STEK paint protection film" },
  ],
  labels: {
    faqH2: "Bike PPF questions",
    cta: { title: "Bring the bike to the studio", body: "Visit the studio in Adugodi, near Koramangala. Open daily." },
  },
};
