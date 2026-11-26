import Link from "next/link";
import { BRANDS_HUB as H } from "@p91/content/site/brands";
import { metadataFor } from "@web/lib/metadata";
import { SITE } from "@web/lib/site";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { CtaBand } from "@web/components/cta-band";

const PATH = "/brands";
export const metadata = metadataFor(PATH, "/photos/creta-stek-ppf-studio.webp");

const H2 = "m-0 text-[clamp(30px,4vw,48px)] font-extrabold";

/** /brands: the three product lines fitted at the studio, and which one answers which job. */
export default function BrandsHub() {
  return (
    <main>
      <section aria-labelledby="brands-h1" className="pb-10 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Brands", path: PATH }]} />
          <h1 id="brands-h1" className="m-0 text-[clamp(36px,4.6vw,60px)] font-extrabold">{H.h1}</h1>
          <p className="mb-0 mt-4 max-w-[720px] text-xl text-text-2">{H.lede}</p>
          {H.intro.map((p) => <p key={p} className="mb-0 mt-3 max-w-[720px] text-text-2">{p}</p>)}
        </div>
      </section>

      <Section labelledBy="cards-h2" tone="ground">
        <h2 id="cards-h2" className={`${H2} mb-7`}>The three lines</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
          {H.cards.map((c) => (
            <Link key={c.href} href={c.href} className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-white text-ink no-underline hover:border-action">
              <div className="h-[220px]"><Photo src={c.photo.src} alt={c.photo.alt} width={c.photo.width} height={c.photo.height} /></div>
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <p className="m-0 text-sm font-semibold text-muted">{c.kind}</p>
                <h3 className="m-0 text-[21px] font-bold">{c.name}</h3>
                <p className="m-0 text-[15px] text-text-2">{c.line}</p>
                <p className="m-0 mt-auto pt-2 text-[15px] font-bold text-action">Learn more</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section labelledBy="choose-h2">
        <h2 id="choose-h2" className={`${H2} mb-7`}>{H.chooseH2}</h2>
        <div className="overflow-x-auto rounded-[16px] border border-line">
          <table className="w-full min-w-[480px] border-collapse">
            <thead><tr>{["You want", "What fits", ""].map((h, i) => <th key={i} scope="col" className="bg-ground px-5 py-3 text-left text-[15px] font-semibold text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {H.choose.map((c) => (
                <tr key={c.need} className="border-t border-line">
                  <th scope="row" className="px-5 py-3.5 text-left font-semibold">{c.need}</th>
                  <td className="px-5 py-3.5 text-text-2">{c.answer}</td>
                  <td className="px-5 py-3.5"><Link href={c.href} className="font-bold">{c.label}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mb-0 mt-6 text-text-2">{H.help}</p>
      </Section>

      <CtaBand title="See the product before you book" body="Visit the studio in Adugodi, near Koramangala." primary={{ href: SITE.whatsapp, label: "WhatsApp us" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
    </main>
  );
}
