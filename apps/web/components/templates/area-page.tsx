import Link from "next/link";
import type { AreaContent } from "@p91/content/site/types";
import { SITE } from "@web/lib/site";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { ButtonLink } from "@web/components/button-link";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { FaqList } from "@web/components/faq-list";
import { CtaBand } from "@web/components/cta-band";
import { RichText } from "@web/components/rich-text";

const H2 = "m-0 text-[clamp(30px,4vw,48px)] font-extrabold";
const DIRECTIONS = "https://www.google.com/maps/dir/?api=1&destination=P91+Car+Care+Adugodi+Bengaluru";

/** Area page (spec section 2): how far the studio is, pickup, real jobs, every service in the area's words, FAQ, nearby. */
export function AreaPage({ content: c, path }: { content: AreaContent; path: string }) {
  return (
    <main>
      <section aria-labelledby="area-h1" className="pb-14 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: c.area, path }]} />
          <div className="flex flex-wrap items-stretch gap-4">
            <div className="flex min-w-0 flex-[1_1_480px] flex-col justify-center gap-4 rounded-[16px] bg-ink p-8 text-white md:p-10">
              <p className="m-0 text-[15px] font-semibold text-on-ink">Studio in Adugodi · owners from {c.area}</p>
              <h1 id="area-h1" className="m-0 text-[clamp(34px,4.2vw,56px)] font-extrabold">{c.h1}</h1>
              <p className="m-0 text-lg text-white/85"><RichText text={c.intro} /></p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={DIRECTIONS} variant="on-ink">Directions to the studio</ButtonLink>
                <ButtonLink href={SITE.whatsapp} variant="outline-on-ink">WhatsApp us</ButtonLink>
              </div>
            </div>
            <dl className="m-0 grid min-w-0 flex-[1_1_340px] grid-cols-1 gap-3 rounded-[16px] bg-ground p-6">
              {c.facts.map((f) => <div key={f.k}><dt className="text-sm font-semibold text-muted">{f.k}</dt><dd className="m-0 text-lg font-bold">{f.v}</dd></div>)}
            </dl>
          </div>
          <p className="mb-0 mt-6 max-w-[760px] text-text-2"><RichText text={c.routeNote} /></p>
        </div>
      </section>

      <Section labelledBy="svc-h2" tone="ground">
        <h2 id="svc-h2" className={`${H2} mb-7`}>Services for {c.area} owners</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {c.services.map((s) => (
            <article key={s.href} className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-6">
              <h3 className="m-0 text-xl font-bold">{s.h3}</h3>
              <p className="m-0 text-[15px] text-text-2"><RichText text={s.text} /></p>
              <Link href={s.href} className="mt-auto pt-2 font-bold">{s.link}</Link>
            </article>
          ))}
        </div>
      </Section>

      {c.jobs.length > 0 && (
        <Section labelledBy="jobs-h2">
          <h2 id="jobs-h2" className={`${H2} mb-7`}>Cars from {c.area} at the studio</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {c.jobs.map((j) => <figure key={j.src} className="m-0 flex flex-col gap-2"><div className="h-[220px] overflow-hidden rounded-[14px]"><Photo src={j.src} alt={j.alt} width={j.width} height={j.height} /></div><figcaption className="text-sm text-text-2">{j.caption}</figcaption></figure>)}
          </div>
        </Section>
      )}

      <Section labelledBy="faq-h2">
        <div className="flex flex-wrap gap-10">
          <h2 id="faq-h2" className="m-0 flex-[1_1_300px] text-[clamp(30px,3.6vw,46px)] font-extrabold">Questions from {c.area}</h2>
          <div className="min-w-0 flex-[999_1_520px]"><FaqList items={c.faq} /></div>
        </div>
      </Section>

      <section aria-labelledby="near-h2" className="pb-20">
        <div className="wrap">
          <h2 id="near-h2" className="mb-5 mt-0 text-2xl font-extrabold">Nearby areas</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 p-0">
            {[...c.nearby, { href: "/contact", label: "Contact and opening hours" }].map((r) => <li key={r.href}><Link href={r.href} className="flex min-h-[64px] items-center rounded-[14px] border border-line px-5 font-bold text-ink no-underline hover:border-action">{r.label}</Link></li>)}
          </ul>
        </div>
      </section>

      <CtaBand title={`From ${c.area} to Adugodi`} body={`${SITE.address.street}, ${SITE.address.city} ${SITE.address.postalCode}.`} primary={{ href: DIRECTIONS, label: "Get directions" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
    </main>
  );
}
