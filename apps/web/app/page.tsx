import type { Metadata } from "next";
import Link from "next/link";
import { HOME } from "@p91/content/site/home";
import { pageFor } from "@p91/content/site/registry";
import { getServices } from "@web/lib/api";
import { ButtonLink } from "@web/components/button-link";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { TrustStrip } from "@web/components/trust-strip";
import { BeforeAfter } from "@web/components/before-after";
import { FaqList } from "@web/components/faq-list";
import { CtaBand } from "@web/components/cta-band";
import { ReviewQuotes } from "@web/components/review-quotes";
import { ppfWarrantyYears } from "@web/lib/warranty";

export const revalidate = 300;
const PAGE = pageFor("/");

export const metadata: Metadata = {
  title: { absolute: PAGE.title },
  description: PAGE.description,
  alternates: { canonical: "/" },
  openGraph: { title: PAGE.title, description: PAGE.description, url: "/", images: [HOME.hero.photo.src] },
};

export default async function HomePage() {
  const rows = await getServices().catch(() => []);
  const years = ppfWarrantyYears(rows).text;
  // Trust item 2 carries the years from the catalogue; with none, it falls back to the plain written-warranty line.
  const trust = HOME.trust.map((t) => (t.strong.includes("{warrantyYears}") ? { ...t, strong: years ? t.strong.replace("{warrantyYears}", years) : "Written PPF warranty" } : t));

  return (
    <main>
      <section aria-labelledby="home-h1" className="bg-ink">
        <div className="relative h-[460px] md:h-[620px]">
          <Photo src={HOME.hero.photo.src} alt={HOME.hero.photo.alt} width={HOME.hero.photo.width} height={HOME.hero.photo.height} priority className="object-[60%_55%]" />
        </div>
        <div className="wrap">
          <div className="relative -mt-40 flex max-w-[640px] flex-col gap-4 rounded-[16px] border-t-4 border-brand bg-ink p-8 text-white md:-mt-60 md:p-10">
            <h1 id="home-h1" className="m-0 text-[clamp(34px,4.6vw,60px)] font-extrabold">{HOME.hero.h1}</h1>
            <p className="m-0 text-lg text-white/85">{HOME.hero.lead}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={HOME.hero.primary.href} variant="on-ink">{HOME.hero.primary.label}</ButtonLink>
              <ButtonLink href="https://wa.me/917406619191" variant="outline-on-ink">WhatsApp a photo of your car</ButtonLink>
            </div>
            <p className="m-0 text-sm text-on-ink">{HOME.hero.photo.caption}</p>
          </div>
        </div>
      </section>

      <TrustStrip items={trust} />

      <Section labelledBy="svc-h2">
        <h2 id="svc-h2" className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold">Services</h2>
        <p className="mb-8 mt-2 max-w-[680px] text-text-2">Each service page explains what the job involves, how long the car stays and what makes it cost more or less.</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {HOME.services.map((s) => (
            <Link key={s.href} href={s.href} className={`grid min-h-[190px] overflow-hidden rounded-[16px] text-ink no-underline ${s.photo ? "grid-cols-[150px_1fr] border border-line" : "bg-ground"}`}>
              {s.photo && <Photo src={s.photo.src} alt={s.photo.alt} width={s.photo.width} height={s.photo.height} />}
              <div className="flex flex-col gap-1.5 p-5">
                <h3 className="m-0 text-[21px] font-bold">{s.name}</h3>
                <p className="m-0 text-[15px] text-text-2">{s.line}</p>
                <p className="m-0 mt-auto text-[15px] font-bold text-action">Learn more</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section labelledBy="ba-h2" tone="ground">
        <h2 id="ba-h2" className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold">Same car, before and after</h2>
        <p className="mb-7 mt-2 max-w-[680px] text-text-2">Real jobs from our studio. Drag the line to compare.</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-5">
          {HOME.beforeAfter.map((b) => <BeforeAfter key={b.caption} before={b.before} after={b.after} caption={<>{b.caption} · <Link href={b.href} className="font-bold">Exterior detailing</Link></>} />)}
        </div>
      </Section>

      <Section labelledBy="work-h2">
        <h2 id="work-h2" className="mb-7 mt-0 text-[clamp(30px,4vw,48px)] font-extrabold">Recent work at the studio</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {HOME.work.map((w) => (
            <figure key={w.src} className="m-0 flex flex-col gap-2.5">
              <div className="h-[230px] overflow-hidden rounded-[14px]"><Photo src={w.src} alt={w.alt} width={w.width} height={w.height} /></div>
              <figcaption className="flex flex-col"><strong className="text-[17px]">{w.car}</strong><span className="text-sm text-muted">{w.job}</span></figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section labelledBy="genuine-h2" tone="ink">
        <div className="flex flex-wrap items-center gap-10">
          <div className="h-[520px] min-w-0 max-w-[420px] flex-[1_1_320px] overflow-hidden rounded-[16px]">
            <Photo src={HOME.genuine.photo.src} alt={HOME.genuine.photo.alt} width={HOME.genuine.photo.width} height={HOME.genuine.photo.height} />
          </div>
          <div className="min-w-0 flex-[1_1_460px]">
            <h2 id="genuine-h2" className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold">{HOME.genuine.h2}</h2>
            <p className="mb-6 mt-4 text-white/85">{HOME.genuine.lead}</p>
            <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
              {HOME.genuine.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand font-extrabold text-ink">{i + 1}</span><span>{s}</span></li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section labelledBy="rev-h2">
        <ReviewQuotes names={HOME.reviewNames} labelledBy="rev-h2" />
      </Section>

      <Section labelledBy="start-h2" tone="ground">
        <h2 id="start-h2" className="mb-6 mt-0 text-[clamp(28px,3.6vw,44px)] font-extrabold">New to PPF? Start here</h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 p-0">
          {HOME.startHere.map((g) => <li key={g.href}><Link href={g.href} className="flex min-h-[64px] items-center rounded-[14px] border border-line bg-white px-5 font-bold text-ink no-underline hover:border-action">{g.label}</Link></li>)}
        </ul>
      </Section>

      <Section labelledBy="faq-h2">
        <div className="flex flex-wrap gap-10">
          <h2 id="faq-h2" className="m-0 flex-[1_1_300px] text-[clamp(28px,3.6vw,44px)] font-extrabold">Quick answers</h2>
          <div className="min-w-0 flex-[999_1_520px]"><FaqList items={HOME.faq} /></div>
        </div>
      </Section>

      <CtaBand title={HOME.end.title} primary={HOME.end.primary} secondary={{ href: "/services", label: "All services" }} />
    </main>
  );
}
