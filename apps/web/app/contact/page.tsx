import Link from "next/link";
import { CONTACT as C } from "@p91/content/site/contact-about";
import { getBusinessHours } from "@web/lib/api";
import { metadataFor } from "@web/lib/metadata";
import { SITE } from "@web/lib/site";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { ButtonLink } from "@web/components/button-link";
import { Section } from "@web/components/section";

export const revalidate = 300;
const PATH = "/contact";
export const metadata = metadataFor(PATH);

/** "09:30" -> "9:30 am". */
function clock(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return t;
  return `${((h + 11) % 12) + 1}:${String(m ?? 0).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** /contact: address, phone, WhatsApp, email, GSTIN, hours read live from the API, and the map. No form: the new site never posts. */
export default async function ContactPage() {
  const hours = await getBusinessHours().catch(() => []);
  return (
    <main>
      <section aria-labelledby="contact-h1" className="pb-14 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Contact", path: PATH }]} />
          <h1 id="contact-h1" className="m-0 text-[clamp(36px,4.6vw,60px)] font-extrabold">{C.h1}</h1>
          <p className="mb-0 mt-4 max-w-[720px] text-xl text-text-2">{C.lede}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={C.whatsapp}>WhatsApp us</ButtonLink>
            <ButtonLink href={C.phoneHref} variant="secondary">Call {C.phone}</ButtonLink>
            <ButtonLink href={C.directionsHref} variant="secondary">Get directions</ButtonLink>
          </div>
        </div>
      </section>

      <Section labelledBy="visit-h2" tone="ground">
        <div className="flex flex-wrap gap-10">
          <div className="min-w-0 flex-[1_1_340px]">
            <h2 id="visit-h2" className="mb-5 mt-0 text-[clamp(28px,3.6vw,44px)] font-extrabold">Visit the studio</h2>
            <address className="not-italic text-lg">
              <strong>{C.name}</strong><br />
              {C.addressLines.map((l) => <span key={l}>{l}<br /></span>)}
            </address>
            <dl className="mt-6 grid gap-3">
              <div><dt className="text-sm font-semibold text-muted">Phone</dt><dd className="m-0 font-bold"><a href={C.phoneHref}>{C.phone}</a></dd></div>
              <div><dt className="text-sm font-semibold text-muted">WhatsApp</dt><dd className="m-0 font-bold"><a href={C.whatsapp}>{C.phone}</a></dd></div>
              <div><dt className="text-sm font-semibold text-muted">Email</dt><dd className="m-0 font-bold"><a href={`mailto:${C.email}`}>{C.email}</a></dd></div>
              <div><dt className="text-sm font-semibold text-muted">Pickup and drop</dt><dd className="m-0">{C.pickup}</dd></div>
            </dl>
            <p className="mb-0 mt-6 text-sm text-muted">{C.gst}</p>
          </div>
          <div className="min-w-0 flex-[1_1_340px]">
            <h2 className="mb-5 mt-0 text-[clamp(28px,3.6vw,44px)] font-extrabold">Opening hours</h2>
            {hours.length > 0 ? (
              <table className="w-full border-collapse text-[15px]">
                <tbody>
                  {hours.map((h) => (
                    <tr key={h.dayName} className="border-t border-line">
                      <th scope="row" className="py-2.5 pr-4 text-left font-semibold">{h.dayName}</th>
                      <td className="py-2.5 text-text-2">{h.isOpen ? `${clock(h.openTime)} to ${clock(h.cutoffTime)}` : "Closed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="m-0 text-text-2">{C.hoursFallback}</p>
            )}
          </div>
        </div>
      </Section>

      <Section labelledBy="map-h2">
        <h2 id="map-h2" className="mb-5 mt-0 text-[clamp(28px,3.6vw,44px)] font-extrabold">Find us in Adugodi</h2>
        <p className="mb-5 mt-0 max-w-[760px] text-text-2">The studio is at {SITE.address.street}, next to Koramangala. Coming from a nearby area:</p>
        <ul className="m-0 mb-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
          {C.areas.map((a) => <li key={a.href}><Link href={a.href} className="font-bold">{a.label}</Link></li>)}
        </ul>
        <div className="overflow-hidden rounded-[16px] border border-line">
          <iframe title="Map: P91 Car Care, Adugodi" src={C.mapEmbed} loading="lazy" className="block h-[420px] w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </Section>
    </main>
  );
}
