/**
 * Direct links to the pages that carry each service's detail and price, with descriptive anchors.
 * Shown on /services (pages/services.tsx) and baked into that page's crawlable HTML
 * (lib/crawlable-content.ts), so the hub links to every important service page in plain HTML.
 */
export interface HubLink {
  href: string;
  label: string;
  note: string;
}

export const SERVICE_GUIDE_LINKS: HubLink[] = [
  { href: "/services/paint-protection-film-bangalore", label: "Paint protection film in Bangalore", note: "How PPF works, what it covers, and every package." },
  { href: "/services/ceramic-coating-bangalore", label: "Ceramic coating in Bangalore", note: "What the coating does against borewell water and traffic film." },
  { href: "/services/interior-detailing-bangalore", label: "Car interior detailing in Bangalore", note: "Deep interior cleaning and rejuvenation." },
  { href: "/services/glass-sun-control-film-bangalore", label: "Sun control film and glass coating", note: "Heat and glare control, and windshield glass care." },
];

export const SERVICE_PRICE_LINKS: HubLink[] = [
  { href: "/ppf", label: "Car PPF price in Bangalore", note: "Hatchback, sedan and SUV packages with live prices." },
  { href: "/ceramic-coating/car", label: "Car ceramic coating price", note: "The 1-year coating for cars, with live price." },
  { href: "/ceramic-coating/bike", label: "Bike ceramic coating price", note: "The 1-year coating for motorcycles." },
];
