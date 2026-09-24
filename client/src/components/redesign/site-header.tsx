import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import logoPath from "@assets/Car Care (4)_1753951564515.png";
import { ImageWithFallback } from "@/components/image-with-fallback";
import type { ServiceRecord } from "@/lib/canonical-services";
import { BLOG_POSTS } from "@/lib/blog-posts";
import {
  SERVICES_COLUMNS,
  PRODUCT_BRANDS,
  PRODUCT_FINE_PRINT,
  resourcesGuideLinks,
  type NavLink,
} from "@/lib/nav-menu";

/**
 * Site header in the approved redesign — restructured to XPEL's nav shape (sticky
 * full-width bar, logo left, Services/Products/Resources mega-dropdowns, phone/directions/
 * search actions right) while keeping every existing P91 destination and the exact
 * `.btn-call`/`.btn-book` markup other tests assert on (design-unification.test.mjs,
 * service-page-layout.test.mjs).
 *
 * Markup and class names for the parts NOT touched by this restructure (logo, .btn-call,
 * .btn-book, .burger, the mobile `.nav-call-mobile` fallback) are the prototype's, styled by
 * styles/redesign.css scoped under `.p91x`.
 *
 * Destinations are the REAL application routes — see lib/nav-menu.ts for why each mega-menu
 * link is there and why the ad-campaign landing pages are deliberately NOT in this nav.
 */
/**
 * `onBookNow`: on a page that has its own booking flow (a service page's booking form, the
 * PPF/ceramic enquiry form), "Book Now" should start it there rather than navigate away to
 * /services. Omitted everywhere else, where the link to /services is the right behaviour.
 *
 * `overHero`: the page renders a full-bleed `.hero-bg` photo/video directly under this
 * header (home.tsx, service-landing.tsx) — XPEL's nav sits transparent on top of that
 * image rather than in its own solid bar. Omitted on every other page (blog, contact,
 * /services, policy pages), which keep the header's normal solid, space-reserving bar
 * because there's no hero photo behind it to blend into.
 */
type MenuKey = "services" | "products" | "resources";

const MENUS: { key: MenuKey; label: string }[] = [
  { key: "services", label: "Services" },
  { key: "products", label: "Products" },
  { key: "resources", label: "Resources" },
];

const DIRECTIONS_HREF =
  "https://www.google.com/maps/dir/?api=1&destination=P91+Car+Care+Adugodi+Bengaluru";

export default function SiteHeader({ onBookNow, overHero }: { onBookNow?: () => void; overHero?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  // Solid again once scrolled past the hero, same as XPEL: transparent only while the
  // hero photo is actually behind it.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);
  const transparent = overHero && !scrolled && !open;

  // Desktop mega-menu: which of Services/Products/Resources is open, opened by hover
  // (mouseenter on the wrapper below, which the panel is a DOM child of, so moving the
  // pointer down into the panel never fires the wrapper's mouseleave) or by clicking the
  // trigger — the click path is what makes this reachable on a touchscreen laptop, where
  // hover events never fire at all.
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  // Mobile accordion: which section is expanded inside the slide-down panel. Independent
  // of `openMenu` — mobile never sees the desktop hover panels at all (see the 860px
  // breakpoint in redesign.css).
  const [mobileSection, setMobileSection] = useState<MenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const headerRef = useRef<HTMLElement | null>(null);

  // Hide on scroll down, return on scroll up (Framer-style). Never hides near the top of
  // the page, and never while a menu, the search panel or the mobile drawer is open — a
  // panel that vanishes under the pointer is worse than a bar that stays put. The ref
  // mirrors those three flags so the scroll handler (bound once) always reads current values.
  const [hidden, setHidden] = useState(false);
  // True while the bar sits over a section marked data-tone="dark" (the homepage's
  // Protection & Care screen): the bar then goes dark-glass with light text, instead of
  // dark text on a half-white blur over near-black, which does not read.
  const [onDark, setOnDark] = useState(false);
  const lastY = useRef(0);
  const menuLock = useRef(false);
  menuLock.current = open || openMenu !== null || searchOpen;
  useEffect(() => {
    let ticking = false;
    lastY.current = window.scrollY;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const under = document
          .elementsFromPoint(window.innerWidth / 2, 44)
          .find((n) => !headerRef.current?.contains(n));
        setOnDark(!!under?.closest('[data-tone="dark"]'));
        const y = window.scrollY;
        const dy = y - lastY.current;
        if (y < 80 || menuLock.current) {
          setHidden(false);
          lastY.current = y;
        } else if (dy > 6) {
          setHidden(true);
          lastY.current = y;
        } else if (dy < -6) {
          setHidden(false);
          lastY.current = y;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A click anywhere outside the header closes an open mega-menu or search panel opened
  // by clicking (hover-opened panels already close on mouseleave; this covers the
  // click-to-open path, where nothing else would ever close them again).
  useEffect(() => {
    if (!openMenu && !searchOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenu, searchOpen]);

  const closeEverything = () => {
    setOpen(false);
    setOpenMenu(null);
    setMobileSection(null);
    setSearchOpen(false);
    setQuery("");
  };

  // Same /api/services every other page already queries — react-query dedupes it to one
  // request per cache window, so this adds no new network cost on a page that already
  // fetches the catalogue (home, /services, a service page) and only a small cached JSON
  // fetch on the pages that didn't (blog, contact, policy pages).
  const { data: services } = useQuery<ServiceRecord[]>({ queryKey: ["/api/services"] });

  const resourcesGuides = useMemo(() => resourcesGuideLinks(), []);

  /**
   * Client-side search over real catalogue and guide titles — no backend endpoint, no new
   * API. Matches the service list this page already has cached and the static BLOG_POSTS
   * module every blog page already imports, so a result can never point at content that
   * does not exist.
   */
  const searchResults: NavLink[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const serviceMatches = (services ?? [])
      .filter((s) => s.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((s) => ({ label: s.title.trim(), href: `/service/${s.slug}` }));
    const postMatches = BLOG_POSTS
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((p) => ({ label: p.title, href: `/blog/${p.slug}` }));
    return [...serviceMatches, ...postMatches].slice(0, 6);
  }, [query, services]);

  return (
    <header
      ref={headerRef}
      className={"site" + (overHero ? " over-hero" : "") + (transparent ? " is-transparent" : "") + (hidden ? " is-hidden" : "") + (onDark ? " on-dark" : "")}
      // Keyboard focus landing in the bar always brings it back.
      onFocus={() => setHidden(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") closeEverything();
      }}
    >
      <div className="wrap">
        <div className="nav">
          <Link href="/" onClick={closeEverything} data-testid="link-nav-logo">
            {/* Was a plain <img> serving the 1492x1129 source PNG (52 KB) into a 140x34
                box, on EVERY page, in both the header and the footer. The responsive
                component picks the 200w variant instead — same pixels on screen, ~6 KB. */}
            <ImageWithFallback
              src={logoPath}
              alt="P91 Car Care — car detailing studio in Bangalore"
              width={140}
              height={34}
              sizes="140px"
              priority
            />
          </Link>

          {/* ---------- desktop mega-nav ---------- */}
          <nav className="megabar" aria-label="Main">
            {MENUS.map((menu) => (
              <div
                key={menu.key}
                className={"nav-item" + (menu.key === "services" ? " is-wide" : "")}
                onMouseEnter={() => setOpenMenu(menu.key)}
                onMouseLeave={() => setOpenMenu((cur) => (cur === menu.key ? null : cur))}
              >
                <button
                  type="button"
                  className="nav-trigger"
                  aria-expanded={openMenu === menu.key}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu((cur) => (cur === menu.key ? null : menu.key))}
                  data-testid={`button-nav-${menu.key}`}
                >
                  {menu.label}
                  <svg className="i chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {openMenu === menu.key && (
                  <div
                    className={"mega-panel " + (menu.key === "resources" ? "align-right" : "align-left") + (menu.key === "services" ? " mega-wide" : "")}
                    data-testid={`panel-nav-${menu.key}`}
                  >
                    {menu.key === "services" && (
                      <div className="mega-cols">
                        {SERVICES_COLUMNS.map((col) => (
                          <div className="mega-col" key={col.heading}>
                            <h5>{col.heading}</h5>
                            <ul>
                              {col.links.map((l) => (
                                <li key={l.href}>
                                  <Link href={l.href} onClick={closeEverything}>{l.label}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        <div className="mega-promo">
                          <ImageWithFallback
                            src="/attached_assets/services/exterior-detailing-hard-water-spot-removal.webp"
                            alt="Exterior detailing at the P91 Car Care studio"
                            sizes="220px"
                            loading="lazy"
                          />
                          <p>Full protection, done properly</p>
                          <Link href="/services" className="mega-promo-cta" onClick={closeEverything}>
                            View all services →
                          </Link>
                        </div>
                      </div>
                    )}

                    {menu.key === "products" && (
                      <div className="mega-products">
                        {/* All three brands, one clean list: name, one line, then the points as
                            a single quiet line. STEK/Nasiol are external: true (nav-menu.ts) — the
                            manufacturer's own real site in a new tab, not a wouter Link, which
                            can only navigate to an internal path. P91 Premium PPF is back in this
                            list (2026-09-24, by request) after being left out on 2026-09-23. */}
                        {PRODUCT_BRANDS.map((b) => {
                          const body = (
                            <>
                              <span className="mp-name">{b.name}</span>
                              <span className="mp-line">{b.line}</span>
                              <span className="mp-points">{b.points.join(" · ")}</span>
                            </>
                          );
                          return b.external ? (
                            <a key={b.name} href={b.href} target="_blank" rel="noopener noreferrer" className="mp-row" onClick={closeEverything}>
                              {body}
                            </a>
                          ) : (
                            <Link key={b.name} href={b.href} className="mp-row" onClick={closeEverything}>
                              {body}
                            </Link>
                          );
                        })}
                        <p className="mega-fineprint">{PRODUCT_FINE_PRINT}</p>
                        <Link href="/products" className="mega-promo-cta" onClick={closeEverything}>
                          View all products →
                        </Link>
                      </div>
                    )}

                    {menu.key === "resources" && (
                      <div className="mega-cols">
                        <div className="mega-col">
                          <h5>Guides</h5>
                          <ul>
                            <li><Link href="/blog" onClick={closeEverything}>All guides</Link></li>
                            {resourcesGuides.map((l) => (
                              <li key={l.href}>
                                <Link href={l.href} onClick={closeEverything}>{l.label}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mega-col">
                          <h5>Get in touch</h5>
                          <ul>
                            <li><Link href="/contact" onClick={closeEverything}>Contact us</Link></li>
                            <li><a href="tel:+917406619191" onClick={closeEverything}>Call 74066 19191</a></li>
                            <li><a href="https://wa.me/917406619191" target="_blank" rel="noopener noreferrer" onClick={closeEverything}>WhatsApp</a></li>
                            <li><a href={DIRECTIONS_HREF} target="_blank" rel="noopener noreferrer" onClick={closeEverything}>Get directions</a></li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <Link href="/contact" className="nav-plain" onClick={closeEverything} data-testid="link-nav-contact">
              Contact
            </Link>
          </nav>

          {/* ---------- mobile accordion ---------- */}
          <nav className={"links" + (open ? " open" : "")} id="navlinks" aria-label="Main mobile">
            {MENUS.map((menu) => (
              <div className="m-section" key={menu.key}>
                <button
                  type="button"
                  className="m-trigger"
                  aria-expanded={mobileSection === menu.key}
                  onClick={() => setMobileSection((cur) => (cur === menu.key ? null : menu.key))}
                  data-testid={`button-mobile-nav-${menu.key}`}
                >
                  {menu.label}
                  <svg className={"i chev" + (mobileSection === menu.key ? " is-open" : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {mobileSection === menu.key && (
                  <div className="m-panel">
                    {menu.key === "services" &&
                      SERVICES_COLUMNS.map((col) => (
                        <div className="m-group" key={col.heading}>
                          <span>{col.heading}</span>
                          {col.links.map((l) => (
                            <Link key={l.href} href={l.href} onClick={closeEverything}>{l.label}</Link>
                          ))}
                        </div>
                      ))}
                    {menu.key === "products" && (
                      <div className="m-group">
                        {PRODUCT_BRANDS.map((b) =>
                          b.external ? (
                            <a key={b.name} href={b.href} target="_blank" rel="noopener noreferrer" onClick={closeEverything}>{b.name}</a>
                          ) : (
                            <Link key={b.name} href={b.href} onClick={closeEverything}>{b.name}</Link>
                          ),
                        )}
                        <Link href="/products" onClick={closeEverything}>View all products</Link>
                      </div>
                    )}
                    {menu.key === "resources" && (
                      <div className="m-group">
                        <Link href="/blog" onClick={closeEverything}>All guides</Link>
                        {resourcesGuides.map((l) => (
                          <Link key={l.href} href={l.href} onClick={closeEverything}>{l.label}</Link>
                        ))}
                        <Link href="/contact" onClick={closeEverything}>Contact us</Link>
                        <a href={DIRECTIONS_HREF} target="_blank" rel="noopener noreferrer" onClick={closeEverything}>Get directions</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <Link href="/contact" onClick={closeEverything} data-testid="link-nav-contact-mobile">Contact</Link>
            {/* Under 860px the header hides `.right`, taking the call button with it. The
                floating action is WhatsApp-only in this design, so without this the phone
                number would be reachable on a phone only from the footer. */}
            <a
              className="nav-call-mobile"
              href="tel:+917406619191"
              onClick={closeEverything}
              data-testid="link-nav-call-mobile"
            >
              Call 74066 19191
            </a>
          </nav>

          <button
            className="burger"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            data-testid="button-mobile-menu-toggle"
          >
            ☰
          </button>

          <div className="right">
            <div className="nav-search">
              <button
                type="button"
                className="icon-btn"
                aria-label="Search services and guides"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((v) => !v)}
                data-testid="button-nav-search"
              >
                <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                </svg>
              </button>
              {searchOpen && (
                <div className="search-panel" data-testid="panel-nav-search">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search services, guides…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    data-testid="input-nav-search"
                  />
                  {query.trim().length >= 2 && (
                    <div className="search-results">
                      {searchResults.length > 0 ? (
                        searchResults.map((r) => (
                          <Link key={r.href} href={r.href} onClick={closeEverything}>{r.label}</Link>
                        ))
                      ) : (
                        <Link href="/services" onClick={closeEverything}>No matches — browse all services →</Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <a
              className="icon-btn"
              href={DIRECTIONS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get directions to the studio"
              data-testid="link-nav-directions"
            >
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
              </svg>
            </a>

            <a className="btn-call" href="tel:+917406619191" data-testid="link-header-call">
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1z" />
              </svg>
              74066 19191
            </a>
            {onBookNow ? (
              <button type="button" className="btn-book" onClick={onBookNow} data-testid="button-nav-book-now">
                Book Now
              </button>
            ) : (
              <Link href="/services" className="btn-book" data-testid="button-nav-book-now">Book Now</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
