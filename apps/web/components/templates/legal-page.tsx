import type { Metadata } from "next";
import type { GuideBlock } from "@p91/content/site/types";
import type { LegalPage as LegalContent } from "@p91/content/site/legal";
import { COMPANY_NAME } from "@p91/content/site/legal";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { RichText } from "@web/components/rich-text";

/** Legal pages are noindex, not in the registry and not in the sitemap (Plan 2b). */
export function legalMetadata(c: LegalContent): Metadata {
  return {
    title: { absolute: c.title },
    description: `${c.h1} of ${COMPANY_NAME}, trading as P91 Car Care, Adugodi, Bangalore.`,
    alternates: { canonical: c.path },
    robots: { index: false, follow: true },
  };
}

function Block({ b }: { b: GuideBlock }) {
  switch (b.t) {
    case "h2": return <h2 className="mb-3 mt-10 text-2xl font-extrabold">{b.text}</h2>;
    case "h3": return <h3 className="mb-2 mt-6 text-lg font-bold">{b.text}</h3>;
    case "p": return <p className="mb-4 mt-0 text-text-2"><RichText text={b.text} /></p>;
    case "ul": return <ul className="mb-4 mt-0 flex flex-col gap-1.5 pl-5 text-text-2">{b.items.map((i) => <li key={i}><RichText text={i} /></li>)}</ul>;
    case "ol": return <ol className="mb-4 mt-0 flex flex-col gap-1.5 pl-5 text-text-2">{b.items.map((i) => <li key={i}><RichText text={i} /></li>)}</ol>;
    default: return null;
  }
}

export function LegalPage({ content: c }: { content: LegalContent }) {
  return (
    <main>
      <article aria-labelledby="legal-h1" className="pb-20 pt-8">
        <div className="wrap max-w-[860px]">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: c.h1, path: c.path }]} />
          <h1 id="legal-h1" className="m-0 text-[clamp(32px,4vw,52px)] font-extrabold">{c.h1}</h1>
          <p className="mb-6 mt-3 text-sm text-muted">Last updated {c.updated}</p>
          {c.blocks.map((b, i) => <Block key={i} b={b} />)}
        </div>
      </article>
    </main>
  );
}
