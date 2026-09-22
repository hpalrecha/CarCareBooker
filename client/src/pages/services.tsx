import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import ServiceCard from "@/components/service-card";
import ServiceFilter from "@/components/service-filter";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { type ServiceRecord } from "@/lib/canonical-services";
import { SERVICES_SEO } from "@/lib/static-seo";

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

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h1>All Services</h1>
            <p>
              Filter by what your vehicle is and what it needs. Prices, offers and availability are
              live — the same ones you will see at checkout.
            </p>
          </div>

          {/*
            Direct routes to the three focused service pages.

            Without this the campaign landing pages were unreachable from anywhere on the
            site — a browser trace found ZERO internal links to them from the homepage,
            this page, the SEO guides or the service pages. They existed only for someone
            arriving from an advertisement or typing the URL.

            The problem it solves for a visitor is concrete: this grid lists all 17
            catalogue rows, including SIX separate PPF cards (three body types x full and
            partial). Someone who simply wants PPF has to know which body type maps to
            their car before they can see a price. /ppf asks that question properly.

            Deliberately a small row above the grid, not a replacement for it: the 17 cards
            and their /service/:slug pages are indexed and stay exactly as they are.
          */}
          <nav style={{ marginBottom: 40 }} aria-label="Popular services">
            <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--txt-3)", marginBottom: 14 }}>
              Book by service
            </h2>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {[
                { href: "/ceramic-coating/car", label: "Ceramic Coating", sub: "For your car" },
                { href: "/ceramic-coating/bike", label: "Ceramic Coating", sub: "For your motorcycle" },
                { href: "/ppf", label: "Paint Protection Film", sub: "Hatchback, sedan or SUV" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="card"
                  data-testid={`link-fork-${item.href.replace(/\//g, "-").replace(/^-/, "")}`}
                >
                  <div className="card-body">
                    <h3>{item.label}</h3>
                    <p className="card-note">{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {isLoading ? (
            <div className="grid">
              {Array.from({ length: 9 }).map((_, i) => (
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
            <ServiceFilter services={Array.isArray(services) ? services : []}>
              {(filtered) => (
                <div className="grid">
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
