import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import ServiceCard from "@/components/service-card";
import ServiceFilter from "@/components/service-filter";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { type ServiceRecord } from "@/lib/canonical-services";
import { SERVICES_SEO } from "@/lib/static-seo";
import { groupPpf } from "@/lib/ppf-groups";

/**
 * The service catalogue as its own page.
 *
 * Audit finding UX-1, second half: the nav's "Services" link was only an anchor to a grid
 * on the homepage (`#services`), so there was no real page to bookmark, share, or rank in
 * Google for "car detailing services bangalore" — the homepage had to compete for every
 * service query at once.
 *
 * This is ADDITIVE and deliberately so. `/service/:slug` — the 17 indexed per-service
 * pages — is untouched, and this route does not replace or redirect any of them. The
 * redesign prototype used `/services/<marketing-slug>` for four hand-written pages;
 * adopting that scheme would have orphaned the existing indexed URLs, so it was not
 * adopted. This page links to the real `/service/:slug` records.
 *
 * Everything on it comes from GET /api/services — the same query the homepage uses, so
 * react-query serves it from cache when arriving from the homepage.
 */
/**
 * Records left out of the /services LIST (their pages, prices and booking are untouched).
 * premium-wash-detail carries the same title as Exterior Detailing with Hard Water Spot Removal
 * (₹5,999), so the catalogue showed two cards with one name and different prices. The list keeps
 * the ₹5,999 one; the other stays reachable at /service/premium-wash-detail.
 */
const HIDDEN_FROM_LIST = new Set(["premium-wash-detail"]);
/**
 * Where a catalogue entry opens. The ceramic services open the ceramic guide page (the same one the
 * homepage and menus link to) instead of the older /service/:slug template; every other
 * service opens its own /service/:slug page. The records themselves are untouched.
 */
const OPENS_AT: Record<string, string> = {
  "1-year-ceramic-coating": "/services/ceramic-coating-bangalore",
  "1-year-bike-ceramic-coating": "/services/ceramic-coating-bangalore",
};
const listable = (services: unknown): any[] =>
  Array.isArray(services)
    ? (services as any[])
        .filter((s) => !HIDDEN_FROM_LIST.has(s?.slug))
        .map((s) => (OPENS_AT[s?.slug] ? { ...s, href: OPENS_AT[s.slug] } : s))
    : [];

export default function Services() {
  const { data: services, isLoading } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/services"],
  });

  useSeoMeta({
    // Shared with scripts/prerender.mjs. The description here was 228 characters and
    // different from the one crawlers received.
    title: SERVICES_SEO.title,
    description: SERVICES_SEO.description,
    image: "/Car Care (4)_1753951564515.png",
  });

  return (
    <div className="p91x min-h-screen">
      <SiteHeader />

      <section className="sv-page">
        <div className="wrap">
          <header className="sv-head">
            <p className="ed-label">Services</p>
            <h1 className="sv-title">All Services</h1>
            <p className="sv-lede">
              Filter by what your vehicle is and what it needs. Prices, offers and availability are
              live — the same ones you will see at checkout.
            </p>
          </header>

          {/* The "Book by service" row that used to sit here is gone (2026-09-24): it duplicated the PPF
              and ceramic entries in the list below and pointed at the same pages. */}

          {isLoading ? (
            <div className="sv-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-skel" data-testid="skeleton-service">
                  <div className="img" />
                  <div style={{ padding: 20 }}>
                    <div className="bar" style={{ height: 16, width: "70%", marginBottom: 12 }} />
                    <div className="bar" style={{ height: 12, width: "50%", marginBottom: 22 }} />
                    <div className="bar" style={{ height: 22, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ServiceFilter services={groupPpf(listable(services))}>
              {(filtered) => (
                <div className="sv-grid">
                  {filtered.map((service: any) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </ServiceFilter>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
