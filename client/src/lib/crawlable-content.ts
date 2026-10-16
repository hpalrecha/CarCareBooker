import type { StaticSeoPage } from "./static-seo";
import type { SeoPage } from "./seo-pages";
import type { BlogPost } from "./blog-posts";
import type { LandingPage } from "./landing-pages";
import type { BrandPage } from "./brand-pages";
import { formatINR } from "./canonical-services";
import { ADDRESS_CONFIRMED, STREET_ADDRESS, POSTAL_CODE, PHONE } from "./local-business";
import { PRODUCT_BRANDS, SERVICES_COLUMNS, resourcesGuideLinks } from "./nav-menu";
import { BLOG_POSTS } from "./blog-posts";
import { HOME_FAQS, HOME_FAQ_HEADING, HOME_ABOUT_H2 } from "./home-faq";

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
 * The snapshot is for crawlers and other readers of the raw HTML, not for people, so it is taken
 * OUT OF THE LAYOUT and off screen (the standard visually-hidden pattern: still in the document,
 * still readable by anything that reads HTML, never painted).
 *
 * It used to be painted: pale grey text (#e5e7eb) on the site's white background, i.e. nearly
 * unreadable for the second or so before the app started, and then replaced by the real page. That
 * swap moved every element on the page and scored 0.17-0.27 Cumulative Layout Shift on /ppf, the
 * page the ads land on (Google rates above 0.1 as needing improvement). Hidden this way nothing
 * moves when the app takes over. The text is the same content the page renders, so it is not a
 * different page for crawlers; it is the same page without the wait for JavaScript.
 */
const WRAP_STYLE =
  "position:absolute;left:0;top:0;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;" +
  "clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0";

const PHONE_DISPLAY = "+91 74066 19191";

/**
 * Site-wide link block for the snapshot's footer. The live header's mega-menus and footer are
 * client-rendered, so a crawler that reads only the raw HTML saw 4 links per page and found most
 * service, guide and legal pages only through the sitemap (Search Console: 31 of 42 URLs "unknown to
 * Google"). Built from the SAME data the menus and footer render from (nav-menu.ts, blog-posts.ts),
 * so it cannot list a page the site does not have. The two car price pages (/ppf, /ceramic-coating/car)
 * are added by hand (2026-10-16): Search Console showed them "crawled, not indexed" with no raw-HTML
 * link from the home page, and they are the main conversion pages. The live menus are unchanged.
 */
function siteLinkBlock(): string {
  const group = (title: string, links: { label: string; href: string }[]) => {
    const seen = new Set<string>();
    const items = links
      .filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true)))
      .map((l) => `<li><a href="${e(l.href)}" style="color:#e5e7eb">${e(l.label)}</a></li>`)
      .join("");
    return `<h2>${e(title)}</h2><ul>${items}</ul>`;
  };
  return (
    `<nav aria-label="Site links">` +
    group("Services", [
      ...SERVICES_COLUMNS.flatMap((c) => c.links),
      { label: "All services", href: "/services" },
      { label: "Car PPF price in Bangalore", href: "/ppf" },
      { label: "Car ceramic coating price in Bangalore", href: "/ceramic-coating/car" },
    ]) +
    group("Products", [
      ...PRODUCT_BRANDS.map((b) => ({ label: b.name, href: b.href })),
      { label: "All products", href: "/products" },
    ]) +
    group("Guides", [
      { label: "All guides", href: "/blog" },
      ...resourcesGuideLinks(),
      ...BLOG_POSTS.map((post) => ({ label: post.title, href: `/blog/${post.slug}` })),
    ]) +
    group("Company", [
      { label: "Gallery", href: "/gallery" },
      { label: "Contact", href: "/contact" },
      { label: "Terms", href: "/terms-conditions" },
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Refunds", href: "/refund-policy" },
    ]) +
    `</nav>`
  );
}

const SITE_LINK_BLOCK = siteLinkBlock();

function shell(main: string): string {
  const address = ADDRESS_CONFIRMED
    ? `${e(STREET_ADDRESS)}, Bengaluru ${e(POSTAL_CODE)}`
    : "Bengaluru";
  return (
    `<div ${PRERENDER_ATTR} style="${WRAP_STYLE}">` +
    `<header><a href="/" style="color:#4ade80">P91 Car Care</a>` +
    `<nav aria-label="Main"> · <a href="/services" style="color:#e5e7eb">Services</a>` +
    ` · <a href="/blog" style="color:#e5e7eb">Blog</a>` +
    ` · <a href="/contact" style="color:#e5e7eb">Contact</a></nav></header>` +
    `<main>${main}</main>` +
    `<footer>${SITE_LINK_BLOCK}<p>P91 Car Care — ${address} — <a href="tel:${e(PHONE)}" style="color:#4ade80">${e(PHONE_DISPLAY)}</a></p></footer>` +
    `</div>`
  );
}

const h1 = (t: string) => `<h1>${e(t)}</h1>`;
const h2 = (t: string) => `<h2>${e(t)}</h2>`;
const p = (t: string) => `<p>${e(t)}</p>`;
const ul = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${e(i)}</li>`).join("")}</ul>` : "");

/**
 * Renders the tiny inline vocabulary blog copy uses on the live page
 * (components/redesign/rich-text.tsx: `**bold**` and `[label](/path)`) into real HTML here
 * too. Without this, an inline link like "[STEK](/products/stek)" was a real, clickable
 * internal link on the live page but showed up as literal bracket text — "[STEK](/products/stek)"
 * — to a crawler that does not run JavaScript, in the exact snapshot meant to carry internal
 * links to crawlers that do not. Same token regex as RichText, kept in sync deliberately
 * rather than imported: this module has no React dependency and stays that way.
 */
const RICH_TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)]*\))/g;
function richText(text: string): string {
  return text
    .split(RICH_TOKEN)
    .filter((part) => part !== "")
    .map((part) => {
      const bold = part.match(/^\*\*([^*]+)\*\*$/);
      if (bold) return `<strong>${e(bold[1])}</strong>`;
      const link = part.match(/^\[([^\]]+)\]\((\/[^)]*)\)$/);
      if (link) return `<a href="${e(link[2])}" style="color:#4ade80">${e(link[1])}</a>`;
      return e(part);
    })
    .join("");
}
const pRich = (t: string) => `<p>${richText(t)}</p>`;
const ulRich = (items: string[]) =>
  items.length ? `<ul>${items.map((i) => `<li>${richText(i)}</li>`).join("")}</ul>` : "";

function faqList(faqs: { question?: string | null; answer?: string | null }[]): string {
  const real = faqs.filter((f) => f?.question?.trim() && f?.answer?.trim());
  if (!real.length) return "";
  return real.map((f) => `<h3>${e(String(f.question).trim())}</h3><p>${e(String(f.answer).trim())}</p>`).join("");
}

/** Hand-written pages: their h1 and lede, as the page renders them. */
export function staticPageContent(page: StaticSeoPage): string {
  return shell(h1(page.h1) + (page.lede ? p(page.lede) : ""));
}

/**
 * /contact — what contact.tsx shows without a database read: studio address, phone, WhatsApp, email,
 * GSTIN and directions. Opening hours are read live on the page, so they are not baked here.
 */
export function contactPageContent(page: StaticSeoPage): string {
  const link = (href: string, label: string, extra = "") =>
    `<a href="${e(href)}" style="color:#4ade80"${extra}>${e(label)}</a>`;
  return shell(
    h1(page.h1) +
      (page.lede ? p(page.lede) : "") +
      h2("Studio") +
      `<address><p>P91 Car Care<br>49, 13th Cross, Ayappa Garden<br>Adugodi<br>Bengaluru, Karnataka 560030<br>India</p>` +
      `<p>${link("tel:+917406619191", "+91 74066 19191")}</p></address>` +
      p("Trading as Plus Nine One Inc · GSTIN 29AMIPP3288M1Z6") +
      h2("Get in touch") +
      `<ul><li>${link("https://wa.me/917406619191", "WhatsApp us")}</li>` +
      `<li>${link("tel:+917406619191", "Call 74066 19191")}</li>` +
      `<li>${link("mailto:info@p91carcare.com", "info@p91carcare.com")}</li></ul>` +
      h2("Find us") +
      `<ul><li>${link("https://www.google.com/maps/dir/?api=1&destination=P91+Car+Care+Adugodi+Bengaluru", "Get directions", ' rel="noopener noreferrer"')}</li>` +
      `<li>${link("https://www.google.com/maps/search/?api=1&query=P91+Car+Care+Adugodi+Bengaluru", "Open in Google Maps", ' rel="noopener noreferrer"')}</li></ul>`,
  );
}

/**
 * "/" — the real homepage, not the generic h1+lede treatment every other simple page gets.
 *
 * SEO audit finding: the homepage's non-JS snapshot was the generic staticPageContent()
 * (h1 + one paragraph, ~47 words, 3 nav links) even though home.tsx is a long landing page
 * with several real sections and dozens of internal links — all invisible to a crawler
 * that does not execute JavaScript. Every sentence and link below is copied verbatim from
 * home.tsx (the "About", "What we do", "Why P91" and brand-grid sections) — nothing here
 * is new copy, a new claim, or a link the page does not already have.
 */
export function homePageContent(page: StaticSeoPage): string {
  // Exact hrefs and labels from the "02 / What we do" section of home.tsx.
  const whatWeDo = [
    { href: "/services/paint-protection-film-bangalore", name: "PPF" },
    { href: "/services/ceramic-coating-bangalore", name: "Ceramic" },
    { href: "/service/exterior-detailing-hard-water-new", name: "Detailing" },
  ];
  // Exact captions and hrefs from the "03 / Real work" gallery grid — every card links to
  // /gallery, same as the page.
  const realWork = [
    "PPF fitting",
    "Toyota Vellfire · STEK PPF",
    "Nissan GT-R · STEK PPF",
    "Innova Hycross · STEK PPF",
  ];
  // Same PRODUCT_BRANDS data home.tsx's brand grid renders from, so the two can never
  // disagree (nav-menu.ts is also what the header's Products menu and the /products page use).
  const brands = PRODUCT_BRANDS.map(
    (b) =>
      `<h3>${e(b.name)}</h3>${p(b.line)}${ul(b.points)}` +
      `<p><a href="${e(b.href)}" style="color:#4ade80">Explore ${e(b.name)} →</a></p>`,
  ).join("");

  return shell(
    h1(page.h1) +
      (page.lede ? p(page.lede) : "") +
      h2(HOME_ABOUT_H2) +
      p(
        "P91 Car Care is a car detailing, ceramic coating and paint protection film studio " +
          "in Adugodi, Bangalore. Every coating and PPF job is backed by a written warranty " +
          "from the film or coating manufacturer, issued at handover.",
      ) +
      `<p><a href="/contact" style="color:#4ade80">Find the studio →</a></p>` +
      h2("Protection. Finish. Care.") +
      `<ul>${whatWeDo.map((s) => `<li><a href="${e(s.href)}" style="color:#4ade80">${e(s.name)}</a></li>`).join("")}</ul>` +
      `<p><a href="/services" style="color:#4ade80">Explore services →</a></p>` +
      h2("Real work, from our studio.") +
      `<ul>${realWork.map((caption) => `<li><a href="/gallery" style="color:#4ade80">${e(caption)}</a></li>`).join("")}</ul>` +
      `<p><a href="/gallery" style="color:#4ade80">See all our work →</a></p>` +
      h2("Why P91") +
      ul([
        "Warranty-backed: written warranty on every coating and PPF job",
        "Same-day service: most detailing finished the day you book",
        "Pickup & drop: available across Bangalore at cost",
      ]) +
      h2("The brands behind our work") +
      brands +
      p(
        "Warranty on any job is the film or coating manufacturer's, issued in writing at " +
          "handover. Ask to see the batch details before work starts.",
      ) +
      h2(HOME_FAQ_HEADING) +
      faqList(HOME_FAQS.map((f) => ({ question: f.question, answer: f.answer }))),
  );
}

/**
 * Titles of the catalogue rows the guide pages list, for the "all options" links below. The
 * guide pages are baked at build time with no database, so the names are listed here; a slug
 * missing from this map is simply not linked in the snapshot (the live page links every row
 * that exists). Keep in step with the service titles in the admin panel.
 */
const GUIDE_OPTION_TITLES: Record<string, string> = {
  "1-year-ceramic-coating": "1 Year Ceramic Coating",
  "1-year-bike-ceramic-coating": "1 Year Bike Ceramic Coating",
  "windshield-glass-coating-new": "Windshield Glass Coating",
  "windshield-glass-polishing": "Windshield Glass Polishing",
  "ppf-hatchback": "P91 PPF Basic - Hatchback",
  "ppf-sedan": "P91 PPF Basic - Sedan",
  "ppf-suv": "P91 PPF Basic - SUV",
  "ppf-premium-hatchback": "P91 PPF Premium - Hatchback",
  "ppf-premium-sedan": "P91 PPF Premium - Sedan",
  "ppf-premium-suv": "P91 PPF Premium - SUV",
  "interior-detailing-service": "Interior Rejuvenation Service",
};

/** /services/:slug — the local guide pages (lib/seo-pages.ts). */
export function seoGuideContent(page: SeoPage): string {
  const ctx = page.context;
  const options = (page.priceServiceSlugs || [])
    .filter((slug) => GUIDE_OPTION_TITLES[slug])
    .map((slug) => `<li><a href="/service/${e(slug)}" style="color:#4ade80">${e(GUIDE_OPTION_TITLES[slug])}</a></li>`)
    .join("");
  return shell(
    h1(page.h1) +
      p(page.lede) +
      h2("What the service includes") +
      ul(page.includes || []) +
      h2(ctx.heading) +
      (ctx.paragraphs || []).map(p).join("") +
      ul(ctx.bullets || []) +
      (options ? h2(`All ${page.crumb} options`) + `<ul>${options}</ul>` : "") +
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
        case "p": return pRich(b.text);
        case "ul": return ulRich(b.items);
        case "faq": return b.items.map((f) => `<h3>${e(f.q)}</h3>${p(f.a)}`).join("");
        case "ol": return `<ol>${b.items.map((i) => `<li>${richText(i)}</li>`).join("")}</ol>`;
        case "table":
          return (
            `<table><caption>${e(b.caption)}</caption><thead><tr>${b.head.map((h) => `<th scope="col">${e(h)}</th>`).join("")}</tr></thead><tbody>` +
            b.rows
              .map((r) => `<tr>${r.map((c, j) => (j === 0 ? `<th scope="row">${richText(c)}</th>` : `<td>${richText(c)}</td>`)).join("")}</tr>`)
              .join("") +
            "</tbody></table>"
          );
        case "contact":
          return `<address><p>${e(b.address)}</p><p><a href="${e(b.phoneHref)}" style="color:#4ade80">${e(b.phone)}</a></p><p><a href="${e(b.bookHref)}" style="color:#4ade80">${e(b.bookLabel)}</a></p></address>`;
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

/**
 * /products/:brand — the three brand pages. Same fields brand-page.tsx renders, from the same module.
 * These routes have no database record, so the content is baked at build time like the guides.
 */
export function brandPageContent(page: BrandPage): string {
  const fits = page.fits.length
    ? h2("What we fit") +
      `<ul>${page.fits.map((f) => `<li><a href="${e(f.href)}" style="color:#4ade80">${e(f.name)}</a> — ${e(f.note)}</li>`).join("")}</ul>`
    : "";
  const benefits = (page.benefits || []).map((b) => `<h3>${e(b.title)}</h3>${p(b.body)}`).join("");
  const official = page.official
    ? `<p><a href="${e(page.official.href)}" style="color:#4ade80" rel="noopener noreferrer">${e(page.official.label)}</a></p>`
    : "";
  return shell(
    h1(page.name) +
      p(page.line) +
      (page.about || []).map(p).join("") +
      fits +
      (benefits ? h2("Why it matters") + benefits : "") +
      `<p><a href="${e(page.book.href)}" style="color:#4ade80">${e(page.book.label)}</a></p>` +
      official,
  );
}

/** The subset of a service record the crawlable content needs. */
export interface CrawlableService {
  title?: string | null;
  slug: string;
  description?: string | null;
  price?: string | number | null;
  originalPrice?: string | number | null;
  whatIncluded?: string[] | null;
  whyChoose?: string | null;
  process?: { title?: string | null; description?: string | null }[] | null;
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
  const why = String(service.whyChoose || "").trim();
  const steps = (service.process || []).filter((s) => s?.title?.trim());
  return shell(
    h1(title) +
      (service.description ? p(String(service.description).trim()) : "") +
      priceLine +
      (included.length ? h2("What's Included") + ul(included) : "") +
      (why ? h2(`Why ${title}`) + p(why) : "") +
      (steps.length
        ? h2("How we do it") +
          ul(steps.map((s) => (s.description?.trim() ? `${s.title!.trim()}: ${s.description.trim()}` : s.title!.trim())))
        : "") +
      (faqs ? h2(`${title} in Adugodi, Bangalore: FAQs`) + faqs : ""),
  );
}

/**
 * Extra sections for the campaign pages (/ppf, /ceramic-coating/*), from the live catalogue row the
 * page itself shows by default. The build has no database, so landingPageContent() cannot carry these;
 * the server adds them per request. Same record, same text as the rendered page — nothing invented,
 * and no price (it loads live). Returns "" when the record has nothing to add.
 */
export function landingServiceExtras(service: CrawlableService): string {
  const title = String(service.title || "").trim();
  const included = Array.from(new Set((service.whatIncluded || []).map(cleanItem).filter(Boolean)));
  const why = String(service.whyChoose || "").trim();
  const steps = (service.process || []).filter((s) => s?.title?.trim());
  const faqs = faqList(service.faq || []);
  return (
    (why ? h2(`Why ${title}`) + p(why) : "") +
    (included.length ? h2("What's included") + ul(included) : "") +
    (steps.length
      ? h2("How the job works") +
        ul(steps.map((s) => (s.description?.trim() ? `${s.title!.trim()}: ${s.description.trim()}` : s.title!.trim())))
      : "") +
    (faqs ? h2("Frequently asked questions") + faqs : "")
  );
}

/** FAQPage JSON-LD for a catalogue row, or null when it has no complete question and answer. */
export function faqPageSchema(faq: CrawlableService["faq"]): Record<string, unknown> | null {
  const real = (faq || []).filter((f) => f?.question?.trim() && f?.answer?.trim());
  if (!real.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: real.map((f) => ({
      "@type": "Question",
      name: String(f.question).trim(),
      acceptedAnswer: { "@type": "Answer", text: String(f.answer).trim() },
    })),
  };
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
