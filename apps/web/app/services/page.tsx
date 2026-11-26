import Link from "next/link";
import { SERVICES_HUB as H } from "@p91/content/site/services-hub";
import { rangesFor, formatRange, type Family } from "@p91/domain/price-ranges";
import { getServices } from "@web/lib/api";
import { metadataFor } from "@web/lib/metadata";
import { SITE } from "@web/lib/site";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { CtaBand } from "@web/components/cta-band";

export const revalidate = 300;
const PATH = "/services";
export const metadata = metadataFor(PATH, "/photos/ppf-install-rear-quarter.webp");

const H2 = "m-0 text-[clamp(30px,4vw,48px)] font-extrabold";

export default async function ServicesHub() {
  const rows = await getServices().catch(() => []);
  const range = (f: string | null) => {
    if (!f) return null;
    const r = rangesFor(f as Family, rows);
    return r ? formatRange(r.overall) : null;
  };

  return (
    <main>
      <section aria-labelledby="hub-h1" className="pb-10 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Services", path: PATH }]} />
          <h1 id="hub-h1" className="m-0 text-[clamp(36px,4.6vw,60px)] font-extrabold">{H.h1}</h1>
          <p className="mb-0 mt-4 max-w-[720px] text-xl text-text-2">{H.lede}</p>
          {H.about.map((p) => <p key={p} className="mb-0 mt-3 max-w-[720px] text-text-2">{p}</p>)}
        </div>
      </section>

      {H.groups.map((g, gi) => (
        <Section key={g.h2} labelledBy={`grp-${gi}-h2`} tone={gi % 2 === 0 ? "ground" : "white"}>
          <h2 id={`grp-${gi}-h2`} className={H2}>{g.h2}</h2>
          <p className="mb-7 mt-2 max-w-[680px] text-text-2">{g.intro}</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-4">
            {g.cards.map((s) => (
              <Link key={s.href} href={s.href} className={`grid min-h-[170px] overflow-hidden rounded-[16px] border border-line bg-white text-ink no-underline hover:border-action ${s.photo ? "grid-cols-[130px_1fr]" : ""}`}>
                {s.photo && <Photo src={s.photo.src} alt={s.photo.alt} width={s.photo.width} height={s.photo.height} />}
                <div className="flex flex-col gap-1.5 p-5">
                  <h3 className="m-0 text-[21px] font-bold">{s.name}</h3>
                  <p className="m-0 text-[15px] text-text-2">{s.line}</p>
                  {range(s.family) && <p className="m-0 mt-auto text-lg font-extrabold tabular-nums">{range(s.family)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      ))}

      <Section labelledBy="choose-h2">
        <h2 id="choose-h2" className={H2}>{H.choose.h2}</h2>
        <p className="mb-7 mt-2 max-w-[680px] text-text-2">{H.choose.intro}</p>
        <div className="overflow-x-auto rounded-[16px] border border-line">
          <table className="w-full min-w-[480px] border-collapse">
            <thead><tr>{H.choose.head.map((h) => <th key={h} scope="col" className="bg-ground px-5 py-3 text-left text-[15px] font-semibold text-muted">{h}</th>)}</tr></thead>
            <tbody>{H.choose.rows.map(([want, look]) => <tr key={want} className="border-t border-line"><th scope="row" className="px-5 py-3.5 text-left font-semibold">{want}</th><td className="px-5 py-3.5 text-text-2">{look}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>

      <Section labelledBy="cmp-h2" tone="ground">
        <h2 id="cmp-h2" className={`${H2} mb-7`}>{H.comparison.heading}</h2>
        <div className="overflow-x-auto rounded-[16px] border border-line bg-white">
          <table className="w-full min-w-[480px] border-collapse">
            <thead><tr>{H.comparison.columns.map((c) => <th key={c} scope="col" className="px-5 py-3 text-left text-[15px] font-semibold text-muted">{c}</th>)}</tr></thead>
            <tbody>{H.comparison.rows.map(([f, a, b]) => <tr key={f} className="border-t border-line"><th scope="row" className="px-5 py-3.5 text-left font-semibold">{f}</th><td className="px-5 py-3.5 text-text-2">{a}</td><td className="px-5 py-3.5 text-text-2">{b}</td></tr>)}</tbody>
          </table>
        </div>
        <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
          {H.links.map((l) => <li key={l.href}><Link href={l.href} className="font-bold">{l.label}</Link></li>)}
        </ul>
      </Section>

      <div className="pt-16" />
      <CtaBand title={H.end.title} body={H.end.body} primary={{ href: SITE.whatsapp, label: "WhatsApp us" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
    </main>
  );
}
