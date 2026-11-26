import Link from "next/link";
import type { BrandContent } from "@p91/content/site/types";
import { SITE } from "@web/lib/site";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { ButtonLink } from "@web/components/button-link";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { CtaBand } from "@web/components/cta-band";
import { RichText } from "@web/components/rich-text";

const H2 = "m-0 text-[clamp(30px,4vw,48px)] font-extrabold";

/** Brand page (spec section 2): what the product is, where P91 fits it, what it does, how to check it is genuine, the services that use it. */
export function BrandPage({ content: c, path }: { content: BrandContent; path: string }) {
  return (
    <main>
      <section aria-labelledby="brand-h1" className="pb-14 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }, { name: c.name, path }]} />
          <div className="flex flex-wrap items-stretch gap-4">
            <div className="max-h-[540px] min-h-[380px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[16px]">
              <Photo src={c.hero.src} alt={c.hero.alt} width={c.hero.width} height={c.hero.height} priority />
            </div>
            <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-4 rounded-[16px] bg-ink p-8 text-white md:p-10">
              <p className="m-0 text-[15px] font-semibold text-on-ink">Fitted at the Adugodi studio</p>
              <h1 id="brand-h1" className="m-0 text-[clamp(34px,4.2vw,56px)] font-extrabold">{c.h1}</h1>
              <p className="m-0 text-lg text-white/85"><RichText text={c.line} /></p>
              <div className="flex flex-wrap gap-3"><ButtonLink href={SITE.whatsapp} variant="on-ink">Ask about {c.name}</ButtonLink></div>
            </div>
          </div>
        </div>
      </section>

      <Section labelledBy="about-h2">
        <h2 id="about-h2" className={`${H2} mb-5`}>About {c.name}</h2>
        {c.about.map((p) => <p key={p} className="mb-3.5 mt-0 max-w-[760px] text-text-2"><RichText text={p} /></p>)}
      </Section>

      <Section labelledBy="fits-h2" tone="ground">
        <div className="flex flex-wrap gap-10">
          <div className="min-w-0 flex-[1_1_380px]">
            <h2 id="fits-h2" className={`${H2} mb-5`}>Where we use it</h2>
            <ul className="m-0 flex flex-col gap-2.5 pl-5 text-text-2">{c.fits.map((f) => <li key={f}><RichText text={f} /></li>)}</ul>
          </div>
          <div className="min-w-0 flex-[1_1_380px]">
            <h2 className={`${H2} mb-5`}>What it does</h2>
            <ul className="m-0 flex flex-col gap-2.5 pl-5 text-text-2">{c.benefits.map((b) => <li key={b}><RichText text={b} /></li>)}</ul>
          </div>
        </div>
      </Section>

      {c.genuine && c.genuine.length > 0 && (
        <Section labelledBy="genuine-h2" tone="ink">
          <h2 id="genuine-h2" className={`${H2} mb-6`}>How to check it is genuine</h2>
          <ol className="m-0 flex max-w-[760px] list-none flex-col gap-3.5 p-0">
            {c.genuine.map((g, i) => <li key={g} className="flex items-center gap-3.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand font-extrabold text-ink">{i + 1}</span><span><RichText text={g} /></span></li>)}
          </ol>
        </Section>
      )}

      <section aria-labelledby="used-h2" className="py-16">
        <div className="wrap">
          <h2 id="used-h2" className="mb-5 mt-0 text-2xl font-extrabold">Services that use {c.name}</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 p-0">
            {c.usedIn.map((r) => <li key={r.href}><Link href={r.href} className="flex min-h-[64px] items-center rounded-[14px] border border-line px-5 font-bold text-ink no-underline hover:border-action">{r.label}</Link></li>)}
          </ul>
          {c.official && <p className="mb-0 mt-6"><a href={c.official.href} rel="noopener" className="font-bold">{c.official.label}</a></p>}
        </div>
      </section>

      <CtaBand title={`See ${c.name} before you book`} body="Visit the studio in Adugodi, near Koramangala." primary={{ href: SITE.whatsapp, label: "WhatsApp us" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
    </main>
  );
}
