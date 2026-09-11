import { useState } from "react";
import { Link } from "wouter";
import logoPath from "@assets/Car Care (4)_1753951564515.png";
import { ImageWithFallback } from "@/components/image-with-fallback";

/**
 * Site header in the approved redesign.
 *
 * Markup and class names are the prototype's; the styles live in styles/redesign.css
 * scoped under `.p91x`, so this only renders correctly inside a page that opts in.
 *
 * Destinations are the REAL application routes, not the prototype's paths:
 *   prototype ./book/  -> /services   (the live catalogue page)
 *   prototype ./blog/  -> /blog
 *   prototype ./contact/ -> /contact
 * The phone number and WhatsApp number are the ones already used across the live site.
 */
export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site">
      <div className="wrap">
        <div className="nav">
          <Link href="/" onClick={() => setOpen(false)} data-testid="link-nav-logo">
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

          <nav className={"links" + (open ? " open" : "")} id="navlinks" aria-label="Main">
            <Link href="/services" onClick={() => setOpen(false)} data-testid="link-nav-services">Services</Link>
            <Link href="/ceramic-coating/car" onClick={() => setOpen(false)} data-testid="link-nav-ceramic-car">Car Ceramic</Link>
            <Link href="/ceramic-coating/bike" onClick={() => setOpen(false)} data-testid="link-nav-ceramic-bike">Bike Ceramic</Link>
            <Link href="/ppf" onClick={() => setOpen(false)} data-testid="link-nav-ppf">PPF</Link>
            <Link href="/blog" onClick={() => setOpen(false)} data-testid="link-nav-blog">Blog</Link>
            <Link href="/contact" onClick={() => setOpen(false)} data-testid="link-nav-contact">Contact</Link>
            {/* Under 860px the header hides `.right`, taking the call button with it. The
                floating action is WhatsApp-only in this design, so without this the phone
                number would be reachable on a phone only from the footer. */}
            <a
              className="nav-call-mobile"
              href="tel:+917406619191"
              onClick={() => setOpen(false)}
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
            <a className="btn-call" href="tel:+917406619191" data-testid="link-header-call">
              <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1z" />
              </svg>
              74066 19191
            </a>
            <Link href="/services" className="btn-book" data-testid="button-nav-book-now">Book Now</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
