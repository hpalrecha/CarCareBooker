import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { BusinessHour } from "@shared/schema";
import logoPath from "@assets/Car Care (4)_1753951564515.png";
import { ImageWithFallback } from "@/components/image-with-fallback";

/**
 * Site footer in the approved redesign.
 *
 * ONE deliberate departure from the prototype: opening hours.
 *
 * The prototype hardcodes "Mon–Sat 10:00 am – 7:00 pm" and "Sunday — Closed". Neither
 * matches production: GET /api/business-hours reports all seven days open, Monday to
 * Saturday 10:30–16:30 and Sunday 10:30–15:00. Publishing "Sunday closed" would turn
 * away customers on a day the studio actually trades, so the hours are rendered from the
 * same table the booking calendar uses. Change them in the admin and the footer follows.
 *
 * Everything else — layout, classes, links, legal line — is the prototype's.
 */

/** "10:30" -> "10:30 am", "16:30" -> "4:30 pm". Matches the prototype's formatting. */
function toDisplayTime(hhmm: string | null | undefined): string {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

/**
 * Collapses consecutive days that share the same hours into ranges, so seven rows become
 * "Mon–Sat" + "Sunday" rather than a wall of identical lines.
 */
function summariseHours(hours: BusinessHour[]): { label: string; value: string; closed: boolean }[] {
  if (!hours.length) return [];
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const rows: { label: string; value: string; closed: boolean }[] = [];

  let runStart: number | null = null;
  let runKey = "";

  const keyFor = (d: number) => {
    const h = byDay.get(d);
    if (!h) return "missing";
    return h.isOpen ? `${h.openTime}-${h.cutoffTime}` : "closed";
  };
  const flush = (endDay: number) => {
    if (runStart === null) return;
    const h = byDay.get(runStart);
    const label =
      runStart === endDay ? DAY_SHORT[runStart] : `${DAY_SHORT[runStart]}–${DAY_SHORT[endDay]}`;
    const closed = !h?.isOpen;
    rows.push({
      label,
      value: closed ? "Closed" : `${toDisplayTime(h?.openTime)} – ${toDisplayTime(h?.cutoffTime)}`,
      closed,
    });
  };

  for (let i = 0; i < DAY_ORDER.length; i++) {
    const day = DAY_ORDER[i];
    const key = keyFor(day);
    if (runStart === null) {
      runStart = day;
      runKey = key;
      continue;
    }
    if (key !== runKey) {
      flush(DAY_ORDER[i - 1]);
      runStart = day;
      runKey = key;
    }
  }
  flush(DAY_ORDER[DAY_ORDER.length - 1]);
  return rows;
}

export default function SiteFooter() {
  const { data: businessHours = [] } = useQuery<BusinessHour[]>({
    queryKey: ["/api/business-hours"],
    retry: 1,
  });

  const hourRows = summariseHours(businessHours);

  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <ImageWithFallback src={logoPath} alt="P91 Car Care" width={140} height={34} sizes="140px" />
            <p>Detailing, ceramic coating and paint protection film, done properly — in Indiranagar, Bangalore.</p>
            <div className="foot-actions">
              <a className="foot-btn" href="tel:+917406619191" data-testid="link-footer-call">☎&nbsp; 74066 19191</a>
              <a className="foot-btn is-wa" href="https://wa.me/917406619191" data-testid="link-footer-whatsapp">WhatsApp</a>
            </div>
          </div>

          <div className="foot-col">
            <h4>Services</h4>
            <ul>
              <li><Link href="/services">All services &amp; booking</Link></li>
              <li><Link href="/ceramic-coating/car">Car Ceramic Coating</Link></li>
              <li><Link href="/ceramic-coating/bike">Bike Ceramic Coating</Link></li>
              <li><Link href="/ppf">Paint Protection Film (PPF)</Link></li>
              <li><Link href="/services/interior-detailing-bangalore">Interior detailing</Link></li>
              <li><Link href="/services/glass-sun-control-film-bangalore">Glass &amp; sun film</Link></li>
            </ul>
          </div>

          <div className="foot-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/services">Book a service</Link></li>
              <li><Link href="/blog">Guides</Link></li>
              <li><Link href="/contact">Contact us</Link></li>
            </ul>
          </div>

          <div className="foot-col">
            <h4>Studio</h4>
            {/* Kept in step with the contact page and lib/local-business.ts. */}
            <address>
              100 Feet Road, HAL 2nd Stage<br />
              Indiranagar<br />
              Bengaluru 560038
            </address>
            {hourRows.length > 0 && (
              <dl className="foot-hours" data-testid="footer-hours">
                {hourRows.map((r) => (
                  <div key={r.label} style={{ display: "contents" }}>
                    <dt>{r.label}</dt>
                    <dd className={r.closed ? "shut" : undefined}>{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <Link href="/contact" className="foot-more">Directions →</Link>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Plus Nine One Inc</span>
          <nav className="foot-legal" aria-label="Legal">
            <Link href="/terms-conditions">Terms</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/refund-policy">Refunds</Link>
          </nav>
          <span className="foot-meta">GST 29AMIPP3288M1Z6 · Payments secured by Razorpay</span>
        </div>
      </div>
    </footer>
  );
}
