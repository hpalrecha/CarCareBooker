import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import logoPath from "@assets/Car Care (4)_1753951564515.png";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Contact Us", href: "/contact" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const MENU_ID = "site-nav-mobile-menu";

/**
 * Scroll to the services grid when we are already on the homepage; otherwise let the
 * browser follow `/#services`, which lands on the homepage and anchors there. Looking up
 * `#services` unconditionally would fail on every inner page, where it does not exist.
 */
function useServicesLink() {
  const [location] = useLocation();
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (location === "/") {
      event.preventDefault();
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
    }
  };
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const onServicesClick = useServicesLink();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on route change, so the panel never survives a navigation.
  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const bookNow = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    onServicesClick(event);
  };

  return (
    // `sticky` rather than `fixed`: the header takes part in normal flow, so no page
    // content can end up hidden underneath it.
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="shrink-0" data-testid="link-nav-logo">
            <div className="cursor-pointer">
              <img src={logoPath} alt="P91 Car Care" className="h-10 w-auto" />
            </div>
          </Link>

          <nav aria-label="Main" className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-300 hover:text-green-400 transition-colors whitespace-nowrap"
                data-testid={`link-nav-${link.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#services"
              onClick={bookNow}
              className="bg-green-400 hover:bg-green-500 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
              data-testid="button-nav-book-now"
            >
              Book Now
            </a>
          </nav>

          <button
            ref={toggleRef}
            type="button"
            className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-lg text-green-400 hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            data-testid="button-mobile-menu-toggle"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Rendered in flow (not overlaid) so it pushes content down instead of covering it. */}
        <div
          id={MENU_ID}
          hidden={!open}
          className="lg:hidden border-t border-gray-800 py-2"
          data-testid="nav-mobile-menu"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-base text-gray-200 hover:text-green-400 transition-colors"
                data-testid={`link-mobile-${link.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#services"
              onClick={bookNow}
              className="mt-2 mb-1 text-center bg-green-400 hover:bg-green-500 text-black font-semibold px-5 py-3 rounded-lg transition-colors"
              data-testid="button-mobile-book-now"
            >
              Book Now
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
