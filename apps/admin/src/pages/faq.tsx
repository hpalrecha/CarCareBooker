import { Link } from "wouter";
import SiteHeader from "@/components/redesign/site-header";
import SiteFooter from "@/components/redesign/site-footer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { FAQ_SEO } from "@p91/content/static-seo";
import {
  FAQ_GROUPS,
  FAQ_INTRO,
  FAQ_SERVICE_CARDS,
  FAQ_COMPARISON,
  FAQ_COMPARISON_AFTER,
  FAQ_LAST_UPDATED_LABEL,
  FAQ_LAST_UPDATED,
  faqHubSchema,
} from "@p91/content/faq-page";

/**
 * /faq — the FAQ hub. Copy and schema come from lib/faq-page.ts, which also feeds the
 * prerendered HTML, so the visible page, the raw HTML and the FAQPage schema cannot disagree.
 * Answers are plain visible text (no accordion that unmounts them), matching the schema.
 * No price, duration or warranty length is shown here; see the note in lib/faq-page.ts.
 */
export default function FaqPage() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  useSeoMeta({
    title: FAQ_SEO.title,
    description: FAQ_SEO.description,
    canonicalPath: FAQ_SEO.path,
    structuredData: [
      faqHubSchema(),
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: "FAQs", item: `${origin}${FAQ_SEO.path}` },
        ],
      },
    ],
  });

  return (
    <div className="p91x faq-page min-h-screen">
      <SiteHeader />
      <main id="main">
        <section className="faq-hero" data-testid="section-faq-hero">
          <div className="wrap">
            <p className="ed-label">FAQs</p>
            <h1 className="faq-h1" data-testid="text-faq-h1">{FAQ_SEO.h1}</h1>
            <p className="faq-updated">
              Last updated <time dateTime={FAQ_LAST_UPDATED}>{FAQ_LAST_UPDATED_LABEL}</time>
            </p>
            <div className="faq-intro">
              {FAQ_INTRO.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="faq-cards-section" data-testid="section-faq-cards">
          <div className="wrap">
            <h2 className="faq-h2">Automotive protection solutions at P91 Car Care</h2>
            <ul className="faq-cards">
              {FAQ_SERVICE_CARDS.map((c) => (
                <li key={c.href} className="faq-card">
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                  <Link href={c.href} className="ed-link">{c.cta} →</Link>
                </li>
              ))}
            </ul>
            <nav className="faq-jump" aria-label="FAQ sections">
              {FAQ_GROUPS.map((g) => (
                <a key={g.id} href={`#${g.id}`}>{g.heading}</a>
              ))}
            </nav>
          </div>
        </section>

        {FAQ_GROUPS.map((g) => (
          <section key={g.id} id={g.id} className="faq-group" data-testid={`section-faq-${g.id}`}>
            <div className="wrap">
              <h2 className="faq-h2">{g.heading}</h2>
              <dl className="faq-list">
                {g.items.map((f) => (
                  <div key={f.question}>
                    <dt>{f.question}</dt>
                    <dd>{f.answer}</dd>
                  </div>
                ))}
              </dl>
              {g.id === FAQ_COMPARISON_AFTER && (
                <div className="faq-table-wrap">
                  <h3 className="faq-h3">{FAQ_COMPARISON.heading}</h3>
                  <table className="faq-table">
                    <thead>
                      <tr>{FAQ_COMPARISON.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {FAQ_COMPARISON.rows.map((r) => (
                        <tr key={r[0]}>
                          {r.map((c, i) => (i === 0 ? <th key={c} scope="row">{c}</th> : <td key={c}>{c}</td>))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
