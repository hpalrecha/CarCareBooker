import Link from "next/link";
import { SITE } from "@web/lib/site";

// Hubs and legal pages only (spec: the footer stops linking every page equally).
const LINKS = [
  ["/services", "Services"], ["/areas/koramangala", "Areas"], ["/brands", "Brands"], ["/guides", "Guides"],
  ["/gallery", "Gallery"], ["/about", "About"], ["/contact", "Contact"], ["/privacy-policy", "Privacy"], ["/terms-conditions", "Terms"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="wrap flex flex-col gap-4 py-8 text-[15px] text-muted">
        <p className="m-0"><strong className="text-ink">{SITE.name}</strong> · {SITE.address.street}, {SITE.address.city} {SITE.address.postalCode} · <a href={SITE.phoneHref}>{SITE.phone}</a></p>
        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
          {LINKS.map(([href, label]) => <li key={href}><Link href={href} className="inline-flex min-h-11 items-center">{label}</Link></li>)}
        </ul>
      </div>
    </footer>
  );
}
