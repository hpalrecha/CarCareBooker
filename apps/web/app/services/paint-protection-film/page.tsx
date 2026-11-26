import type { Metadata } from "next";
import Link from "next/link";
import { PPF } from "@p91/content/site/paint-protection-film";
import { pageFor } from "@p91/content/site/registry";
import { rangesFor, formatRange } from "@p91/domain/price-ranges";
import { getServices } from "@web/lib/api";
import { serviceSchema } from "@web/lib/schema";
import { JsonLd } from "@web/components/json-ld";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { ButtonLink } from "@web/components/button-link";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { PriceRangeTable } from "@web/components/price-range-table";
import { FaqList } from "@web/components/faq-list";
import { CtaBand } from "@web/components/cta-band";

export const revalidate = 300;
const PAGE = pageFor("/services/paint-protection-film");

export const metadata: Metadata = {
  title: { absolute: PAGE.title },
  description: PAGE.description,
  alternates: { canonical: PAGE.path },
  openGraph: { title: PAGE.title, description: PAGE.description, url: PAGE.path, images: [PPF.hero.src] },
};

export default async function PpfPage() {
  const ranges = rangesFor("ppf", await getServices().catch(() => []));
  const overall = ranges ? formatRange(ranges.overall) : "a range set by car size and film";

  return (
    <main>
      <section aria-labelledby="ppf-h1" className="pb-14 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: "Paint protection film", path: PAGE.path }]} />
          <div className="flex flex-wrap items-stretch gap-4">
            <div className="max-h-[540px] min-h-[380px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[16px]">
              <Photo src={PPF.hero.src} alt={PPF.hero.alt} width={PPF.hero.width} height={PPF.hero.height} priority />
            </div>
            <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-4 rounded-[16px] bg-ink p-8 text-white md:p-10">
              <p className="m-0 text-[15px] font-semibold text-on-ink">{PPF.eyebrow}</p>
              <h1 id="ppf-h1" className="m-0 text-[clamp(34px,4.2vw,56px)] font-extrabold">{PPF.h1}</h1>
              <p className="m-0 text-[34px] font-extrabold tabular-nums">{overall}<span className="text-[15px] font-medium text-white/70"> · full body, by car size and film</span></p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="#prices" variant="on-ink">See the range for your car</ButtonLink>
                <ButtonLink href="https://wa.me/917406619191" variant="outline-on-ink">WhatsApp a photo for the exact price</ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ans-h2" className="pb-16">
        <div className="wrap">
          <div className="flex flex-wrap gap-x-10 gap-y-4 rounded-[16px] border-[1.5px] border-[#D8F0D6] bg-tint px-8 py-7">
            <h2 id="ans-h2" className="m-0 flex-[1_1_220px] text-[22px] font-extrabold">PPF in one paragraph</h2>
            <p className="m-0 flex-[999_1_520px] text-lg">{PPF.shortAnswer.replace("{range}", overall)}</p>
          </div>
        </div>
      </section>

      <Section id="prices" labelledBy="price-h2" tone="ground">
        <h2 id="price-h2" className="m-0 text-[clamp(30px,4vw,52px)] font-extrabold">PPF price range by body type</h2>
        <p className="mb-7 mt-3 max-w-[680px] text-text-2">Full-body film, fitted in the studio. Where your car lands in its range depends on the film line, coverage and paint condition. Send a photo on WhatsApp for the exact figure.</p>
        <PriceRangeTable caption="PPF price range by body type" rows={PPF.rows.map((r) => ({ label: r.label, examples: r.examples, moves: r.moves, range: ranges?.byBody[r.body] ?? null }))} />
      </Section>

      <Section labelledBy="proc-h2">
        <h2 id="proc-h2" className="mb-8 mt-0 text-[clamp(30px,4vw,52px)] font-extrabold">Three days, five steps</h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4 p-0">
          {PPF.steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2.5">
              {s.photo ? <div className="h-[180px] overflow-hidden rounded-[14px]"><Photo src={s.photo.src} alt={s.photo.alt} width={s.photo.width} height={s.photo.height} /></div> : <div aria-hidden="true" className="h-[180px] rounded-[14px] bg-ground" />}
              <span className="text-sm font-bold text-action">Step {i + 1}</span>
              <h3 className="m-0 text-xl font-bold">{s.title}</h3>
              <p className="m-0 text-[15px] text-text-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="cost-h2" tone="ink">
        <div className="flex flex-wrap gap-10">
          <div className="min-w-0 flex-[1_1_340px]">
            <h2 id="cost-h2" className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold">Why PPF prices in Bangalore vary so much</h2>
            <p className="mt-4 text-white/85">Four things explain most of the gap between quotes. <Link href="/guides/ppf-cost-bangalore" className="font-bold text-on-ink">Read the full PPF cost guide</Link></p>
          </div>
          <dl className="m-0 grid min-w-0 flex-[999_1_520px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
            {PPF.costFactors.map((c) => <div key={c.title} className="rounded-[14px] bg-white/5 p-5"><dt className="text-[19px] font-bold">{c.title}</dt><dd className="m-0 mt-1.5 text-[15px] text-white/80">{c.text}</dd></div>)}
          </dl>
        </div>
      </Section>

      <Section labelledBy="cov-h2">
        <div className="flex flex-wrap items-center gap-10">
          <div className="min-w-0 flex-[1_1_420px]">
            <h2 id="cov-h2" className="mb-5 mt-0 text-[clamp(30px,4vw,48px)] font-extrabold">{PPF.coverage.h2}</h2>
            {PPF.coverage.paras.map((p) => <p key={p} className="mb-3.5 mt-0 text-text-2">{p}</p>)}
            <p className="mb-3.5 mt-0 text-text-2"><strong className="text-ink">Aftercare:</strong> {PPF.coverage.aftercare} <Link href="/guides/how-much-ppf-does-your-car-need" className="font-bold">How much PPF does your car need?</Link></p>
            <p className="m-0 rounded-[12px] bg-ground px-4 py-4 text-[15px] text-text-2"><strong className="text-ink">Warranty:</strong> {PPF.coverage.warranty}</p>
          </div>
          <div className="h-[440px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[16px]"><Photo src={PPF.coverage.photo.src} alt={PPF.coverage.photo.alt} width={PPF.coverage.photo.width} height={PPF.coverage.photo.height} /></div>
        </div>
      </Section>

      <Section labelledBy="work-h2" tone="ground">
        <h2 id="work-h2" className="mb-7 mt-0 text-[clamp(30px,4vw,48px)] font-extrabold">PPF jobs from the studio</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {PPF.work.map((w) => <figure key={w.src} className="m-0 flex flex-col gap-2"><div className="h-[220px] overflow-hidden rounded-[14px]"><Photo src={w.src} alt={w.alt} width={w.width} height={w.height} /></div><figcaption className="text-sm text-text-2">{w.caption}</figcaption></figure>)}
        </div>
      </Section>

      <Section labelledBy="faq-h2">
        <div className="flex flex-wrap gap-10">
          <h2 id="faq-h2" className="m-0 flex-[1_1_300px] text-[clamp(30px,3.6vw,46px)] font-extrabold">PPF questions</h2>
          <div className="min-w-0 flex-[999_1_520px]"><FaqList items={PPF.faq} /></div>
        </div>
      </Section>

      <section aria-labelledby="rel-h2" className="pb-20">
        <div className="wrap">
          <h2 id="rel-h2" className="mb-5 mt-0 text-2xl font-extrabold">Often booked with PPF</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 p-0">
            {PPF.related.map((r) => <li key={r.href}><Link href={r.href} className="flex min-h-[64px] items-center rounded-[14px] border border-line px-5 font-bold text-ink no-underline hover:border-action">{r.label}</Link></li>)}
          </ul>
        </div>
      </section>

      <CtaBand title="See the film before you book" body="Visit the studio in Adugodi, near Koramangala. Open daily." primary={{ href: "https://wa.me/917406619191", label: "WhatsApp us" }} secondary={{ href: "tel:+917406619191", label: "+91 74066 19191" }} />

      <JsonLd data={serviceSchema({ name: "Paint protection film", path: PAGE.path, description: PAGE.description, range: ranges?.overall ?? null })} />
    </main>
  );
}
