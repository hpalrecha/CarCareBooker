import Image from "next/image";
import Link from "next/link";
import { NAV, SITE } from "@web/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="wrap flex flex-wrap items-center gap-x-7 gap-y-3 py-3">
        <Link href="/" aria-label="P91 Car Care, home" className="flex items-center">
          <Image src="/brand/p91-logo.png" alt="P91 Car Care" width={58} height={44} priority className="h-11 w-auto" />
        </Link>
        <nav aria-label="Main" className="min-w-0 flex-[1_1_420px]">
          <ul className="flex flex-wrap gap-x-5 text-[15px] font-semibold">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="inline-flex min-h-11 items-center text-ink no-underline hover:text-action">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <a href={SITE.phoneHref} className="inline-flex min-h-11 items-center font-bold tabular-nums text-ink no-underline">{SITE.phone}</a>
        <a href={SITE.whatsapp} className="inline-flex min-h-11 items-center rounded-[12px] bg-action px-[18px] font-bold text-white no-underline hover:bg-action-dark hover:text-white">WhatsApp</a>
      </div>
    </header>
  );
}
