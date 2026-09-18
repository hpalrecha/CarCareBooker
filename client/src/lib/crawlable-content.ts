import type { StaticSeoPage } from "./static-seo";
import type { SeoPage } from "./seo-pages";
import type { BlogPost } from "./blog-posts";
import type { LandingPage } from "./landing-pages";
import { formatINR } from "./canonical-services";
import { ADDRESS_CONFIRMED, STREET_ADDRESS, POSTAL_CODE, PHONE } from "./local-business";

/**
 * The page's real content as plain HTML, baked into the initial response inside
 * <div id="root">.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THE PROBLEM. This is a client-rendered app. Every page used to arrive as
 * `<div id="root"></div>` — zero words, no <h1> — and only became readable after the
 * JavaScript ran. Google executes JavaScript; most AI answer engines' crawlers (and many
 * other bots) do not, so to them every page on the site was blank apart from its <title>.
 *
 * WHY THIS IS SAFE FOR THE APP. client/src/main.tsx mounts with createRoot(), not
 * hydrateRoot(). createRoot() replaces whatever is inside #root, so this markup is simply
 * discarded when React starts: there is no hydration step that could mismatch, and no
 * component, route, price or booking flow reads it.
 *
 * WHAT IT MAY CONTAIN — the same content the page renders, from the same source:
 *   - static pages: the h1/lede constants in lib/static-seo.ts (tested against the pages);
 *   - guides, blog posts, campaign pages: their content modules, the ones the pages render;
 *   - /service/:slug and /services: the service record from the database, per request.
 * Nothing is written here that the page does not show. No invented ratings, prices,
 * offers or claims; campaign pages carry no prices, because those load live from the
 * catalogue and a baked figure could disagree with checkout.
 *
 * Every string is HTML-escaped: service records are edited in the admin panel.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const e = escapeHtml;

/** Marks the snapshot so tests and the SEO hook can recognise it. */
export const PRERENDER_ATTR = 'data-prerender="content"';

/**
 * Minimal inline styling so the brief moment before the app starts reads as a page rather
 * than raw text. Deliberately plain: this is replaced within a moment of load.
 */
const WRAP_STYLE =
  "max-width:760px;margin:0 auto;padding:24px 16px;color:#e5e7eb;" +
  "font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6";

const PHONE_DISPLAY = "+91 74066 19191";

function shell(main: string): string {
  const address = ADDRESS_CONFIRMED
    ? `${e(STREET_ADDRESS)}, Bengaluru ${e(POSTAL_CODE)}`
    : "Indiranagar, Bengaluru";
  return (
    `<div ${PRERENDER_ATTR} style="${WRAP_STYLE}">` +
    `<header><a href="/" style="color:#4ade80">P91 Car Care</a>` +
    `<nav aria-label="Main"> · <a href="/services" style="color:#e5e7eb">Services</a>` +
    ` · <a href="/blog" style="color:#e5e7eb">Blog</a>` +
    ` · <a href="/contact" style="color:#e5e7eb">Contact</a></nav></header>` +
    `<main>${main}</main>` +
    `<footer><p>P91 Car Care — ${address} — <a href="tel:${e(PHONE)}" style="color:#4ade80">${e(PHONE_DISPLAY)}</a></p></footer>` +
    `</div>`
  );
}

const h1 = (t: string) => `<h1>${e(t)}</h1>`;
const h2 = (t: string) => `<h2>${e(t)}</h2>`;
const p = (t: string) => `<p>${e(t)}</p>`;
const ul = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${e(i)}</li>`).join("")}</ul>` : "");

function faqList(faqs: { question?: string | null; answer?: string | null }[]): string {
  const real = faqs.filter((f) => f?.question?.trim() && f?.answer?.trim());
  if (!real.length) return "";
  return real.map((f) => `<h3>${e(String(f.question).trim())}</h3><p>${e(String(f.answer).trim())}</p>`).join("");
}

/** Hand-written pages: their h1 and lede, as the page renders them. */
export function staticPageContent(page: StaticSeoPage): string {
  return shell(h1(page.h1) + (page.lede ? p(page.lede) : ""));
}

/** /services/:slug — the local guide pages (lib/seo-pages.ts). */
export function seoGuideContent(page: SeoPage): string {
  const ctx = page.context;
  return shell(
    h1(page.h1) +
      p(page.lede) +
      h2("What the service includes") +
      ul(page.includes || []) +
      h2(ctx.heading) +
      (ctx.paragraphs || []).map(p).join("") +
      ul(ctx.bullets || []) +
      (page.faqs?.length ? h2("Frequently asked") + faqList(page.faqs) : ""),
  );
}

/** /blog/:slug — the article text. Carousels are images; their prose is in the body. */
export function blogPostContent(post: BlogPost): string {
  const body = post.body
    .map((b) => {
      switch (b.type) {
        case "h2": return h2(b.text);
        case "h3": return `<h3>${e(b.text)}</h3>`;
        case "p": return p(b.text);
        case "ul": return ul(b.items);
        case "cta": return p(b.text);
        default: return "";
      }
    })
    .join("");
  return shell(
    `<article>${h1(post.title)}<p><time datetime="${e(post.date)}">${e(post.date)}</time></p>${p(post.lede)}${body}</article>`,
  );
}

/** /blog and /blog/category/:slug — the listing, as the page words it. */
export function blogListContent(posts: BlogPost[], category?: string): string {
  const heading = category ? `${category} guides` : "Guides from the studio";
  const intro = category
    ? `Everything we have written on ${category.toLowerCase()}, for Bangalore conditions.`
    : "Straight answers to what customers ask us most, written for Bangalore traffic, water and weather.";
  const items = posts
    .map((post) => `<li><a href="/blog/${e(post.slug)}" style="color:#4ade80">${e(post.title)}</a> — ${e(post.excerpt)}</li>`)
    .join("");
  return shell(h1(heading) + p(intro) + `<ul>${items}</ul>`);
}

/** /ppf, /ceramic-coating/car, /ceramic-coating/bike — no prices (they load live). */
export function landingPageContent(page: LandingPage): string {
  const benefits = (page.benefits || []).map((b) => `<h3>${e(b.title)}</h3>${p(b.body)}`).join("");
  // Steps that depend on the live booking offer ("free during the current offer") are left
  // out: the offer switches on and off without a deploy, and HTML baked at build time is
  // cached by search engines — it must not keep advertising an offer that has ended.
  const stableSteps = (page.howItWorks || []).filter((s) => !/\boffer\b/i.test(s));
  const steps = stableSteps.length
    ? h2("How it works") + `<ol>${stableSteps.map((s) => `<li>${e(s)}</li>`).join("")}</ol>`
    : "";
  const related = page.related?.length
    ? `<ul>${page.related.map((r) => `<li><a href="${e(r.href)}" style="color:#4ade80">${e(r.label)}</a></li>`).join("")}</ul>`
    : "";
  return shell(h1(page.h1) + p(page.lede) + (benefits ? h2(page.benefitsHeading) + benefits : "") + steps + related);
}

/** The subset of a service record the crawlable content needs. */
export interface CrawlableService {
  title?: string | null;
  slug: string;
  description?: string | null;
  price?: string | number | null;
  originalPrice?: string | number | null;
  whatIncluded?: string[] | null;
  faq?: { question?: string | null; answer?: string | null }[] | null;
}

const cleanItem = (item: string) => String(item).replace(/^\s*[✓✔]\s*/, "").trim();

/**
 * /service/:slug — from the live record. The price is the record's own price, which is
 * what the page's offer card shows; the booking fee is NOT stated because it depends on
 * the live offer state and could disagree with checkout.
 */
export function servicePageContent(service: CrawlableService): string {
  const title = String(service.title || "").trim();
  const price = formatINR(service.price ?? undefined);
  const original = formatINR(service.originalPrice ?? undefined);
  // Price only — no "paid at the studio": the annual package is paid in full online, so a
  // payment-location sentence would be false for at least one record.
  const priceLine = price
    ? p(`Price: ${price}${original && original !== price ? ` (regular ${original})` : ""}.`)
    : "";
  const included = Array.from(new Set((service.whatIncluded || []).map(cleanItem).filter(Boolean)));
  const faqs = faqList(service.faq || []);
  return shell(
    h1(title) +
      (service.description ? p(String(service.description).trim()) : "") +
      priceLine +
      (included.length ? h2("What's Included") + ul(included) : "") +
      (faqs ? h2(`${title} in Indiranagar, Bangalore: FAQs`) + faqs : ""),
  );
}

/** /services — the heading and intro the page renders, then every active service. */
export function servicesListContent(page: StaticSeoPage, services: CrawlableService[]): string {
  const items = services
    .filter((s) => s.slug && String(s.title || "").trim())
    .map((s) => {
      const price = formatINR(s.price ?? undefined);
      return `<li><a href="/service/${e(s.slug)}" style="color:#4ade80">${e(String(s.title).trim())}</a>${price ? ` — ${e(price)}` : ""}</li>`;
    })
    .join("");
  return shell(h1(page.h1) + (page.lede ? p(page.lede) : "") + (items ? `<ul>${items}</ul>` : ""));
}

/**
 * Put content into the empty root of an HTML shell. Returns the HTML unchanged when the
 * shell has no empty root (so a changed index.html fails loudly in the prerender's own
 * output checks instead of being silently mangled here).
 */
export function injectRootContent(html: string, content: string): string {
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${content}</div>`);
}
