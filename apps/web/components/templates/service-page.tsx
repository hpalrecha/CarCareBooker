import Link from "next/link";
import type { ServiceContent } from "@p91/content/site/types";
import { WARRANTY_HANDOVER_LINE } from "@p91/content/warranty-wording";
import { rangesFor, formatRange, type Family } from "@p91/domain/price-ranges";
import { getServices } from "@web/lib/api";
import { ppfWarrantyLine } from "@web/lib/warranty";
import { serviceSchema } from "@web/lib/schema";
import { pageFor } from "@p91/content/site/registry";
import { SITE } from "@web/lib/site";
import { JsonLd } from "@web/components/json-ld";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { ButtonLink } from "@web/components/button-link";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { PriceRangeTable } from "@web/components/price-range-table";
import { FaqList } from "@web/components/faq-list";
import { CtaBand } from "@web/components/cta-band";
import { BeforeAfter } from "@web/components/before-after";
import { RichText } from "@web/components/rich-text";
import { ReviewQuotes } from "@web/components/review-quotes";

const H2 = "m-0 text-[clamp(30px,4vw,48px)] font-extrabold";

/** "{range}" replaced with the live range; with no range, the sentence that carried it is dropped. */
function fillRange(text: string, range: string | null): string {
  if (range) return text.replaceAll("{range}", range);
  return text.split(/(?<=[.!?])\s+/).filter((s) => !s.includes("{range}")).join(" ");
}

export async function ServicePage({ content: c, path }: { content: ServiceContent; path: string }) {
  const rows = await getServices().catch(() => []);
  const ranges = c.family ? rangesFor(c.family as Family, rows) : null;
  const overall = ranges ? formatRange(ranges.overall) : null;
  const name = c.breadcrumb[c.breadcrumb.length - 1].label;
  const warranty = (c.showWarrantyYears ? ppfWarrantyLine(rows) : null) ?? WARRANTY_HANDOVER_LINE;
  const L = c.labels ?? {};
  const bodyRows = (c.rangeRows ?? []).map((r) => ({ label: r.label, examples: r.examples, moves: r.moves, range: ranges?.byBody[r.body] ?? null }));
  const hasRows = bodyRows.some((r) => r.range);
  const crumbs = [{ name: "Home", path: "/" }, ...c.breadcrumb.map((b) => ({ name: b.label, path: b.href }))];
  // Sections alternate white / ground, starting after the (ground) price block.
  let tone = 0;
  const nextTone = () => (tone++ % 2 === 0 ? "white" : "ground") as "white" | "ground";

  return (
    <main>
      <section aria-labelledby="svc-h1" className="pb-14 pt-8">
        <div className="wrap">
          <Breadcrumbs items={crumbs} />
          <div className="flex flex-wrap items-stretch gap-4">
            {c.hero && (
              <div className="max-h-[540px] min-h-[380px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[16px]">
                <Photo src={c.hero.src} alt={c.hero.alt} width={c.hero.width} height={c.hero.height} priority />
              </div>
            )}
            <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-4 rounded-[16px] bg-ink p-8 text-white md:p-10">
              <p className="m-0 text-[15px] font-semibold text-on-ink">{c.eyebrow}</p>
              <h1 id="svc-h1" className="m-0 text-[clamp(34px,4.2vw,56px)] font-extrabold">{c.h1}</h1>
              {overall && <p className="m-0 text-[34px] font-extrabold tabular-nums">{overall}{L.rangeLabel && <span className="text-[15px] font-medium text-white/70"> · {L.rangeLabel}</span>}</p>}
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="#prices" variant="on-ink">{overall ? "See the range for your car" : "How pricing works"}</ButtonLink>
                <ButtonLink href={SITE.whatsapp} variant="outline-on-ink">WhatsApp a photo for the exact price</ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ans-h2" className="pb-16">
        <div className="wrap">
          <div className="flex flex-wrap gap-x-10 gap-y-4 rounded-[16px] border-[1.5px] border-[#D8F0D6] bg-tint px-8 py-7">
            <h2 id="ans-h2" className="m-0 flex-[1_1_220px] text-[22px] font-extrabold">{name} in one paragraph</h2>
            <p className="m-0 flex-[999_1_520px] text-lg"><RichText text={fillRange(c.shortAnswer, overall)} /></p>
          </div>
        </div>
      </section>

      <Section id="prices" labelledBy="price-h2" tone="ground">
        <h2 id="price-h2" className={H2}>{L.pricesH2 ?? `${name} price range${hasRows ? " by body type" : ""}`}</h2>
        <p className="mb-7 mt-3 max-w-[680px] text-text-2">
          {L.pricesIntro ?? "Where your car lands in the range depends on its size and condition. Send a photo on WhatsApp for the exact figure."}
        </p>
        {hasRows ? (
          <PriceRangeTable caption={`${name} price range by body type`} rows={bodyRows} />
        ) : (
          <div className="flex flex-col gap-2 rounded-[16px] border border-line bg-white px-6 py-5">
            {overall && <p className="m-0 text-[28px] font-extrabold tabular-nums">{overall}</p>}
            {c.rangeNote && <p className="m-0 text-[15px] text-text-2"><RichText text={c.rangeNote} /></p>}
          </div>
        )}
      </Section>

      {c.sections.map((s, i) => (
        <Section key={s.h2} labelledBy={`sec-${i}-h2`} tone={nextTone()}>
          <div className="flex flex-wrap items-center gap-10">
            <div className="min-w-0 flex-[1_1_420px]">
              <h2 id={`sec-${i}-h2`} className={`${H2} mb-5`}>{s.h2}</h2>
              {s.paras.map((p) => <p key={p} className="mb-3.5 mt-0 max-w-[760px] text-text-2"><RichText text={p} /></p>)}
              {s.bullets && (
                <ul className="m-0 mt-2 flex max-w-[760px] flex-col gap-2.5 pl-5 text-text-2">
                  {s.bullets.map((b) => <li key={b}><RichText text={b} /></li>)}
                </ul>
              )}
            </div>
            {s.photo && <div className="h-[440px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[16px]"><Photo src={s.photo.src} alt={s.photo.alt} width={s.photo.width} height={s.photo.height} /></div>}
          </div>
        </Section>
      ))}

      {c.steps && c.steps.length > 0 && (
        <Section labelledBy="proc-h2" tone={nextTone()}>
          <h2 id="proc-h2" className={`${H2} mb-8`}>{L.stepsH2 ?? "How the job is done"}</h2>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4 p-0">
            {c.steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2.5">
                {s.photo ? <div className="h-[180px] overflow-hidden rounded-[14px]"><Photo src={s.photo.src} alt={s.photo.alt} width={s.photo.width} height={s.photo.height} /></div> : <div aria-hidden="true" className="h-[180px] rounded-[14px] bg-ground" />}
                <span className="text-sm font-bold text-action">Step {i + 1}</span>
                <h3 className="m-0 text-xl font-bold">{s.title}</h3>
                <p className="m-0 text-[15px] text-text-2"><RichText text={s.text} /></p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <section aria-label="Warranty" className="pb-4 pt-2">
        <div className="wrap">
          <p className="m-0 rounded-[12px] bg-ground px-5 py-4 text-[15px] text-text-2"><strong className="text-ink">Warranty:</strong> {warranty}</p>
        </div>
      </section>

      {((c.work && c.work.length > 0) || (c.beforeAfter && c.beforeAfter.length > 0)) && (
        <Section labelledBy="work-h2" tone="ground">
          <h2 id="work-h2" className={`${H2} mb-7`}>{L.workH2 ?? `${name} jobs from the studio`}</h2>
          {c.beforeAfter && c.beforeAfter.length > 0 && (
            <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] gap-5">
              {c.beforeAfter.map((b) => <BeforeAfter key={b.caption} before={b.before} after={b.after} caption={b.caption} />)}
            </div>
          )}
          {c.work && c.work.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
              {c.work.map((w) => <figure key={w.src} className="m-0 flex flex-col gap-2"><div className="h-[220px] overflow-hidden rounded-[14px]"><Photo src={w.src} alt={w.alt} width={w.width} height={w.height} /></div><figcaption className="text-sm text-text-2">{w.caption}</figcaption></figure>)}
            </div>
          )}
        </Section>
      )}

      {c.reviewNames && c.reviewNames.length > 0 && (
        <Section labelledBy="rev-h2">
          <ReviewQuotes names={c.reviewNames} labelledBy="rev-h2" />
        </Section>
      )}

      <Section labelledBy="faq-h2">
        <div className="flex flex-wrap gap-10">
          <h2 id="faq-h2" className="m-0 flex-[1_1_300px] text-[clamp(30px,3.6vw,46px)] font-extrabold">{L.faqH2 ?? `${name} questions`}</h2>
          <div className="min-w-0 flex-[999_1_520px]"><FaqList items={c.faq.map((f) => ({ q: f.q, a: f.a.replaceAll("{warranty}", warranty) }))} /></div>
        </div>
      </Section>

      <section aria-labelledby="rel-h2" className="pb-20">
        <div className="wrap">
          <h2 id="rel-h2" className="mb-5 mt-0 text-2xl font-extrabold">{L.relatedH2 ?? "Related services and guides"}</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 p-0">
            {c.related.map((r) => <li key={r.href}><Link href={r.href} className="flex min-h-[64px] items-center rounded-[14px] border border-line px-5 font-bold text-ink no-underline hover:border-action">{r.label}</Link></li>)}
          </ul>
        </div>
      </section>

      <CtaBand
        title={L.cta?.title ?? "See the studio before you book"}
        body={L.cta?.body ?? "Visit the studio in Adugodi, near Koramangala. Open daily."}
        primary={{ href: SITE.whatsapp, label: "WhatsApp us" }}
        secondary={{ href: SITE.phoneHref, label: SITE.phone }}
      />

      <JsonLd data={serviceSchema({ name, path, description: pageFor(path).description, range: ranges?.overall ?? null })} />
    </main>
  );
}
