import Link from "next/link";
import type { GuideBlock, GuideContent } from "@p91/content/site/types";
import { articleSchema } from "@web/lib/schema";
import { SITE } from "@web/lib/site";
import { JsonLd } from "@web/components/json-ld";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { Photo } from "@web/components/photo";
import { FaqList } from "@web/components/faq-list";
import { CtaBand } from "@web/components/cta-band";
import { RichText } from "@web/components/rich-text";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function Block({ b }: { b: GuideBlock }) {
  switch (b.t) {
    case "h2":
      return <h2 id={b.id ?? slug(b.text)} className="mb-4 mt-12 scroll-mt-6 text-[clamp(26px,3vw,36px)] font-extrabold">{b.text}</h2>;
    case "h3":
      return <h3 id={b.id} className="mb-3 mt-8 text-xl font-bold">{b.text}</h3>;
    case "p":
      return (
        <p className={b.variant === "lede" ? "mb-5 mt-0 text-xl" : b.variant === "note" ? "mb-5 mt-0 rounded-[12px] bg-ground px-5 py-4 text-[15px] text-text-2" : "mb-5 mt-0 text-text-2"}>
          <RichText text={b.text} />
        </p>
      );
    case "ul":
      return <ul className="mb-5 mt-0 flex flex-col gap-2 pl-5 text-text-2">{b.items.map((i) => <li key={i}><RichText text={i} /></li>)}</ul>;
    case "ol":
      return <ol className="mb-5 mt-0 flex flex-col gap-2 pl-5 text-text-2">{b.items.map((i) => <li key={i}><RichText text={i} /></li>)}</ol>;
    case "table":
      return (
        <div className="mb-6 overflow-x-auto rounded-[14px] border border-line">
          <table className="w-full min-w-[480px] border-collapse text-[15px]">
            <thead><tr>{b.head.map((h) => <th key={h} scope="col" className="bg-ground px-4 py-3 text-left font-bold">{h}</th>)}</tr></thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.join("|")} className="border-t border-line">
                  {r.map((cell, i) => (i === 0 ? <th key={i} scope="row" className="px-4 py-3 text-left font-semibold">{cell}</th> : <td key={i} className="px-4 py-3 text-text-2">{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "faq":
      return <div className="mb-6"><FaqList items={b.items} /></div>;
  }
}

/** Guide (spec section 2): contents, author and reviewer line, updated date, the image, the body, then the onward links. Article JSON-LD. */
export function GuidePage({ content: c, path, description }: { content: GuideContent; path: string; description: string }) {
  const toc = c.blocks.filter((b): b is Extract<GuideBlock, { t: "h2" | "h3" }> => b.t === "h2");
  return (
    <main>
      <article aria-labelledby="guide-h1" className="pb-10 pt-8">
        <div className="wrap max-w-[860px]">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: c.h1, path }]} />
          <h1 id="guide-h1" className="m-0 text-[clamp(32px,4vw,52px)] font-extrabold">{c.h1}</h1>
          <p className="mb-4 mt-4 text-xl text-text-2"><RichText text={c.lede} /></p>
          <p className="m-0 text-sm text-muted">
            By {c.author} · Reviewed by {c.reviewedBy} ·{" "}
            {c.updated ? <>Updated <time dateTime={c.updated}>{day(c.updated)}</time></> : <time dateTime={c.date}>{day(c.date)}</time>} · {c.readMinutes} min read
          </p>
          <div className="my-8 h-[360px] overflow-hidden rounded-[16px]"><Photo src={c.image.src} alt={c.image.alt} width={c.image.width} height={c.image.height} priority /></div>
          {toc.length > 1 && (
            <nav aria-labelledby="toc-h2" className="mb-8 rounded-[14px] border border-line p-6">
              <h2 id="toc-h2" className="m-0 mb-3 text-lg font-bold">In this guide</h2>
              <ol className="m-0 flex flex-col gap-1.5 pl-5">{toc.map((h) => <li key={h.text}><a href={`#${h.id ?? slug(h.text)}`}>{h.text}</a></li>)}</ol>
            </nav>
          )}
          {c.blocks.map((b, i) => <Block key={i} b={b} />)}
          <nav aria-label="Keep reading" className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {[{ k: "The service", l: c.mainService }, { k: "Next", l: c.sibling }, { k: "Near the studio", l: c.area }].map(({ k, l }) => (
              <Link key={l.href} href={l.href} className="flex min-h-[72px] flex-col justify-center rounded-[14px] border border-line px-5 py-3 text-ink no-underline hover:border-action">
                <span className="text-sm text-muted">{k}</span>
                <strong>{l.label}</strong>
              </Link>
            ))}
          </nav>
        </div>
      </article>
      <CtaBand title="Questions about your car?" body="Send a photo on WhatsApp and we will tell you what it needs." primary={{ href: SITE.whatsapp, label: "WhatsApp us" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
      <JsonLd data={articleSchema({ path, headline: c.h1, description, date: c.date, updated: c.updated, author: c.author, image: c.image.src })} />
    </main>
  );
}
