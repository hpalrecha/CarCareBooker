/**
 * "Popular packages" links on the home page (pages/home.tsx) and in its crawlable snapshot
 * (lib/crawlable-content.ts). One list so the two cannot drift: the snapshot may only contain what
 * the page shows. These are the pages that carry the live prices and the booking flow.
 */
export const HOME_PACKAGE_LINKS: { id: string; href: string; label: string }[] = [
  { id: "car-ppf", href: "/ppf", label: "Car PPF price" },
  { id: "car-ceramic", href: "/ceramic-coating/car", label: "Car ceramic coating" },
  { id: "bike-ceramic", href: "/ceramic-coating/bike", label: "Bike ceramic coating" },
  { id: "interior", href: "/services/interior-detailing-bangalore", label: "Interior detailing" },
  { id: "glass-film", href: "/services/glass-sun-control-film-bangalore", label: "Sun film & glass" },
];
