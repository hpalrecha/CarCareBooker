import type { GuideBlock } from "./types.ts";

/**
 * Two guides rewritten (owner decision 26 Nov 2026) so they no longer repeat their service pages, which took the blog
 * sections word for word in batch B:
 * - how-much-ppf-does-your-car-need vs /services/paint-protection-film/front (coverage levels, cut line, PPF + ceramic,
 *   what moves the price, what to ask). The guide now answers the decision: how to choose coverage from how the car is
 *   driven, where it is parked, how long it is kept, and the budget trade-offs.
 * - hard-water-spot-removal-bangalore vs /services/exterior-detailing/hard-water-spot-removal (where spots collect,
 *   the drying habit, surface vs etched, home remedies, glass, coatings). The guide now explains why it happens in
 *   Bangalore, how to prevent it at home, and when to call a studio.
 * Each links once to its service page and stays self-canonical. Slugs, titles, descriptions, images and onward links are
 * unchanged (guides.ts GUIDE_META). New copy: general, well-established car-care knowledge; no figures, no prices.
 */
export type Rewrite = { lede: string; updated: string; readMinutes: number; blocks: GuideBlock[] };

const HOW_MUCH_PPF: GuideBlock[] = [
  { t: "h2", text: "Four questions decide it" },
  { t: "p", text: "Coverage is easiest to choose in order: how the car is driven, where it is parked, how long you will keep it, and what you want to spend. The first two tell you where damage will land. The last two tell you how much of that damage is worth paying to prevent." },
  { t: "p", text: "One shortcut before you start: look at the car you drive now, or the one you are replacing. Wherever it has chips, scuffs and swirl marks after a few years is where the new car will collect them too." },

  { t: "h2", text: "1. How the car is driven" },
  { t: "p", text: "Speed and traffic decide what hits the front. On ring roads, flyovers and highways, the vehicle in front throws grit and small stones at the nose of the car: the bumper, the leading edge of the bonnet, the mirrors and the headlights. The faster and the closer behind buses and trucks, the more of it there is." },
  { t: "p", text: "Slow city driving chips less and scuffs more. Stop-start traffic, tight lanes and two-wheelers passing close mark the sides and the corners of the bumpers, and short trips mean more parking, which means more door edges." },
  { t: "ul", items: [
    "**Mostly ring roads or highways most weeks:** the front is where film earns its keep.",
    "**Regular long road trips:** the front, plus the lower panels behind the wheels, where tyres kick up stones.",
    "**Mostly short city trips:** chips are fewer; think about the sides and the corners that get brushed.",
    "**A car that is loaded often** (luggage, prams, pets, sports kit): the top of the rear bumper and the boot edge take scuffs.",
  ] },

  { t: "h2", text: "2. Where it is parked" },
  { t: "p", text: "Parking decides the damage the car takes when nobody is in it. A car in its own covered space meets very little. A car in a shared apartment basement meets neighbours' doors, pillars, and people squeezing past with bags. A car on the street meets all of that plus passing scooters, branches, falling fruit and bird droppings." },
  { t: "p", text: "Film takes physical scuffs and stains. It is not the only answer to outdoor parking: sun, dust and water spots on the panels without film are a job for a coating, which costs far less per panel than film." },
  { t: "ul", items: [
    "**Covered, private parking:** cover the panels that driving damages, and little else.",
    "**Tight shared basement:** the doors, the door edges and the corners are worth a thought.",
    "**Open lot or street:** more panels earn film, and the rest of the car should not be left bare.",
  ] },

  { t: "h2", text: "3. How long you will keep it" },
  { t: "p", text: "Film is protection spread over years, so the length of ownership matters as much as the roads. If you change cars every two or three years, the front is what the next buyer looks at first, and front coverage protects most of what they will notice. If you keep cars for many years, every panel will meet its share of scuffs, and an even finish across the whole car matters more the longer you own it." },
  { t: "p", text: "You do not have to decide everything on day one. Panels can be added at a later visit, so starting with the front and adding the sides once you see how the car is used is a reasonable plan. The earlier film goes on, though, the less damage it has to cover up: a new car's paint is at its best before the first year of washing and parking." },

  { t: "h2", text: "4. The budget trade-offs" },
  { t: "p", text: "With a fixed budget, the question is not how much film you can afford, but where each part of the budget does the most work. Three trade-offs come up again and again:" },
  { t: "ol", items: [
    "**Better film on fewer panels, or cheaper film on more.** Genuine film fitted well on the panels that take damage protects more than unbranded film stretched over the whole car, which can yellow or lift early.",
    "**Paint correction, or more panels.** Film locks in whatever is under it. If the paint already has swirls, spending part of the budget on correcting it first gives a better result than covering marks with more film.",
    "**Film everywhere, or film plus coating.** Film on the panels that get hit and a ceramic coating on the rest covers most owners' worries for a fraction of full-body film.",
  ] },
  { t: "p", text: "What moves a quote is covered in [PPF cost in Bangalore](/guides/ppf-cost-bangalore)." },

  { t: "h2", text: "Three owners, three answers" },
  { t: "h3", text: "The ring-road commuter" },
  { t: "p", text: "Drives every weekday at speed in heavy traffic, parks in an apartment basement, keeps cars four or five years. The front takes almost all the damage, so front coverage with a full bonnet, plus a coating on the rest, fits both the roads and the budget." },
  { t: "h3", text: "The weekend car" },
  { t: "p", text: "Garaged, driven on Sundays, kept for years and looked after. Chips are rare, so the case for film is about keeping a perfect finish rather than stopping damage. Front film for road trips is often enough; a matte or show car is the exception that suits full body." },
  { t: "h3", text: "The family SUV on the street" },
  { t: "p", text: "Parked outside, loaded and unloaded daily, kept until it is worn out. The sides, door edges and rear bumper top take as much as the front, and full body or front plus the most-touched panels makes sense." },

  { t: "h2", text: "Turning the answer into a quote" },
  { t: "p", text: "Once you know which panels matter to you, ask for them by name rather than as \"front\" or \"full\". The panel lists for partial front and full front end, where a partial bonnet ends, and the questions to ask a studio are on the [front PPF](/services/paint-protection-film/front) page. A photo of your car on WhatsApp, or a visit to the studio, gets a view of where your car is already taking damage." },

  { t: "h2", text: "Questions" },
  { t: "faq", items: [
    { q: "Should I wait to see where my car gets chipped before choosing?", a: "Not for long. Chips under film stay visible, so waiting means covering damage instead of preventing it. Use your current car as the guide and start with the panels you are sure about." },
    { q: "Is film worth it on a car I will sell in two or three years?", a: "Often only on the front. That is what buyers look at first, and it is where most chips land." },
    { q: "Does parking in a covered basement mean I need less film?", a: "Usually, yes. The car still meets road grit on the front, but door edges and scuffs from passers-by are the main extra risk to plan for." },
  ] },
];

const HARD_WATER: GuideBlock[] = [
  { t: "h2", text: "Why Bangalore cars get it so badly" },
  { t: "p", text: "Much of Bangalore's water comes from borewells and private tankers rather than the piped supply, and groundwater picks up dissolved minerals from the rock it sits in. That water is what most cars are washed with, every day, in apartment basements and on driveways." },
  { t: "p", text: "Then the sun does the rest. Water left on a warm panel evaporates fast, and the minerals stay behind as a white ring. In the dry months, when more water comes from tankers and the sun is strongest, spots form faster than in the monsoon. Even within one building the water can change from day to day, depending on which source the tank was filled from." },

  { t: "h2", text: "How to tell if your water is the problem" },
  { t: "p", text: "You probably already know. White crust on taps and shower heads, scale in the kettle, and cloudy marks on glasses after they dry are the same minerals that mark the car." },
  { t: "p", text: "For a direct test, put a few drops of the water you wash with on clean, dry glass, such as a mirror or the car's own windscreen, and let them dry in the sun. If clear rings are left behind, the water is hard enough to spot paint. Rainwater and filtered drinking water usually dry far cleaner, which is a useful comparison." },

  { t: "h2", text: "Preventing it at home" },
  { t: "p", text: "Prevention is mostly about the water you use and who washes the car. Drying technique matters too, but most spotting in Bangalore starts with a daily wipe-down nobody is watching." },
  { t: "h3", text: "Talk to whoever cleans the car" },
  { t: "p", text: "In many apartment buildings, the car is wiped every morning with a bucket of borewell water and a cloth, then left to dry. That is a daily dose of minerals. Ask for a dry dusting with a clean microfibre cloth on most days, and a proper wash only when someone can dry the car straight after." },
  { t: "h3", text: "Use softer water for the last rinse" },
  { t: "p", text: "If you wash the car yourself, keep a bucket of filtered or RO water for the final rinse, so the water left on the paint carries few minerals. Collected rainwater does the same job. For people who wash often, a water filter or softener on the hose is worth asking about." },
  { t: "h3", text: "Move the car away from drips" },
  { t: "p", text: "Garden sprinklers, balcony plants, air-conditioner drains and dripping pipes in a basement spot the same panels again and again. Moving the car a few metres is the cheapest fix there is." },

  { t: "h2", text: "When to call a studio" },
  { t: "p", text: "Home care stops new spots. It does not remove old ones that have baked in. Call a studio when:" },
  { t: "ul", items: [
    "the marks are still there after a proper wash and dry;",
    "you can feel the edge of a spot with a fingernail, which means it has started to eat into the clear coat;",
    "the windscreen scatters light from oncoming headlights at night, even when clean;",
    "you are about to fit PPF or a ceramic coating, which would seal the spots in;",
    "you are about to sell the car, and dull, spotted paint is the first thing a buyer will see.",
  ] },
  { t: "p", text: "How the spots are taken off, from a decontamination wash for fresh deposits to machine polishing for etched ones, is explained on the [hard water spot removal](/services/exterior-detailing/hard-water-spot-removal) page." },

  { t: "h2", text: "Questions" },
  { t: "faq", items: [
    { q: "Is RO water safe for washing a car?", a: "Yes. It has had most of its minerals removed, which is why it dries with fewer marks. It is most useful as the final rinse." },
    { q: "Does rain leave water spots?", a: "Rain itself carries few minerals, but it picks up dust on the way down and on the car, so it can leave dirty marks. Those usually wash off; the white rings that stay are more often from washing water." },
    { q: "Will a ceramic coating mean I can stop worrying?", a: "No. A coating makes some deposits easier to clean, but it cannot fully prevent hard water spotting. The water you use and how the car is dried still matter." },
  ] },
];

export const REWRITTEN_GUIDES: Record<string, Rewrite> = {
  "how-much-ppf-does-your-car-need": {
    lede: "More film is not automatically more protection. How much your car needs depends on how it is driven, where it is parked, how long you will keep it and what you want to spend, and those answers are different for every owner.",
    updated: "2026-11-26",
    readMinutes: 6,
    blocks: HOW_MUCH_PPF,
  },
  "hard-water-spot-removal-bangalore": {
    lede: "Why borewell and tanker water marks so many cars in Bangalore, how to stop it at home, and the signs that it is time to call a studio.",
    updated: "2026-11-26",
    readMinutes: 5,
    blocks: HARD_WATER,
  },
};
