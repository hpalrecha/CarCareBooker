import Link from "next/link";
import { FAQ_PAGE as F } from "@p91/content/site/faq";
import { metadataFor } from "@web/lib/metadata";
import { faqSchema } from "@web/lib/schema";
import { SITE } from "@web/lib/site";
import { JsonLd } from "@web/components/json-ld";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { Section } from "@web/components/section";
import { FaqList } from "@web/components/faq-list";
import { CtaBand } from "@web/components/cta-band";
import { RichText } from "@web/components/rich-text";

const PATH = "/faq";
export const metadata = metadataFor(PATH);

/** /faq: the hub questions grouped by topic, one FAQPage JSON-LD for every question on the page. */
export default function FaqPage() {
  return (
    <main>
      <section aria-labelledby="faq-h1" className="pb-10 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "FAQ", path: PATH }]} />
          <h1 id="faq-h1" className="m-0 max-w-[900px] text-[clamp(32px,4.2vw,54px)] font-extrabold">{F.h1}</h1>
          <p className="mb-0 mt-3 text-sm text-muted">Last updated {F.updated}</p>
          {F.intro.map((p) => <p key={p} className="mb-0 mt-3 max-w-[760px] text-text-2"><RichText text={p} /></p>)}
          <nav aria-labelledby="topics-h2" className="mt-8 rounded-[14px] border border-line p-6">
            <h2 id="topics-h2" className="m-0 mb-3 text-lg font-bold">Topics</h2>
            <ol className="m-0 flex flex-col gap-1.5 pl-5">{F.groups.map((g) => <li key={g.id}><a href={`#${g.id}`}>{g.heading}</a></li>)}</ol>
          </nav>
        </div>
      </section>

      <Section labelledBy="cards-h2" tone="ground">
        <h2 id="cards-h2" className="mb-7 mt-0 text-[clamp(28px,3.6vw,44px)] font-extrabold">Services these answers cover</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
          {F.cards.map((c) => (
            <Link key={c.href} href={c.href} className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-6 text-ink no-underline hover:border-action">
              <h3 className="m-0 text-xl font-bold">{c.title}</h3>
              <p className="m-0 text-[15px] text-text-2">{c.body}</p>
              <p className="m-0 mt-auto pt-2 font-bold text-action">{c.cta}</p>
            </Link>
          ))}
        </div>
      </Section>

      {F.groups.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h2`} className="scroll-mt-6 py-14">
          <div className="wrap">
            <div className="flex flex-wrap gap-10">
              <h2 id={`${g.id}-h2`} className="m-0 flex-[1_1_300px] text-[clamp(26px,3.2vw,40px)] font-extrabold">{g.heading}</h2>
              <div className="min-w-0 flex-[999_1_520px]"><FaqList items={g.items} withSchema={false} /></div>
            </div>
            {g.id === F.comparisonAfter && (
              <div className="mt-12">
                <h3 className="mb-5 mt-0 text-2xl font-extrabold">{F.comparison.heading}</h3>
                <div className="overflow-x-auto rounded-[16px] border border-line">
                  <table className="w-full min-w-[480px] border-collapse">
                    <thead><tr>{F.comparison.columns.map((c) => <th key={c} scope="col" className="bg-ground px-5 py-3 text-left text-[15px] font-semibold text-muted">{c}</th>)}</tr></thead>
                    <tbody>{F.comparison.rows.map(([f, a, b]) => <tr key={f} className="border-t border-line"><th scope="row" className="px-5 py-3.5 text-left font-semibold">{f}</th><td className="px-5 py-3.5 text-text-2">{a}</td><td className="px-5 py-3.5 text-text-2">{b}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      ))}

      <CtaBand title="Ask about your car" body="Send a photo on WhatsApp and we will tell you what it needs." primary={{ href: SITE.whatsapp, label: "WhatsApp us" }} secondary={{ href: SITE.phoneHref, label: SITE.phone }} />
      <JsonLd data={faqSchema(F.groups.flatMap((g) => g.items))} />
    </main>
  );
}
