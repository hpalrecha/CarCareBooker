# Plan 2b: Wave 1 pages on `apps/web` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build every remaining wave 1 page of the new site from shared templates, reusing the copy the owner already approved, so `npm run web:check` reports zero pending links.

**Architecture:** Four content-driven templates (service, area, brand, guide) plus a few one-off pages. Each page = one typed content file in `packages/content/src/site/` + one thin route file in `apps/web/app/`. Copy is lifted from the existing approved modules in `packages/content/src/*` (located below) and only reshaped, never rewritten in substance, except where this plan says "new copy". The PPF page from Plan 2a is refactored onto the service template first, so every service page shares one structure.

**Tech Stack:** as Plan 2a (Next.js 16.4, React 19.3, Tailwind 4.3, schema-dts, node:test).

Prerequisite: Plan 2a merged (PR #3, 26 Nov). Branch for this plan: `feat/web-wave1`.

## Global Constraints

Everything in Plan 2a's Global Constraints and its "Import rule for shared and tested modules", plus these owner decisions (26 Nov 2026):

- **Warranty:** PPF pages may state "5-year (standard) or 7-year (premium) written warranty, terms at handover". The years are read from the catalogue with `warrantyYearsOf` (`packages/content/src/ppf-packages.ts:105`), never typed into copy. Every other service: "Written warranty terms provided at handover." (`packages/content/src/warranty-wording.ts:21`). Never write "manufacturer's warranty".
- **Self-healing is allowed** for PPF (owner lifted the old rule). Still withheld everywhere: "100% safe", "permanent bond", "certified technicians", "9H" as a promise (`packages/content/src/withheld-claims.ts:52`). A "what does 9H mean" educational FAQ is allowed.
- **No star rating or review count anywhere, and no AggregateRating markup.** Reviews come only from `VERIFIED_REVIEWS` (`packages/content/src/reviews.ts:30`), word for word, with the reviewer's name, and link to `GOOGLE_REVIEWS_URL` (`reviews.ts:94`). The Fazil Ahmed review (`reviews.ts:89`) quotes an exact price: never show it on a marketing page.
- **Prices:** ranges only (Plan 2a rule). Source copy contains no service prices; legal pages are the exception (below).
- **Indiranagar:** the studio has never been there (`packages/content/src/local-business.ts:35`). The area page talks about driving from Indiranagar to Adugodi; it must not imply a branch there.
- **Legal pages** (`/privacy-policy`, `/terms-conditions`, `/refund-policy`): move the current text unchanged, `noindex`, not in the sitemap, not in the registry's indexable list. Do not correct the fee contradictions; list them in the handover note for the owner.
- **Links:** every internal link in migrated copy is remapped through `packages/content/src/site/link-map.ts` (Task 1). No link may point at an old URL.
- **Copy approval:** each batch ends at a review checkpoint. The owner previews the pages locally and approves or comments before the next batch starts. Pages with `[NEEDS ...]` are allowed in the build; the ship gate blocks them only at cutover (Plan 3).

## Templates and content types (Task 1 produces these; every later task consumes them)

```ts
// packages/content/src/site/types.ts  (added to the existing file)
export type Photo = { src: string; alt: string; width: number; height: number };
export type Step = { title: string; text: string; photo: Photo | null };
export type Section = { h2: string; paras: string[]; bullets?: string[] };
export type LinkItem = { href: string; label: string };

export type ServiceContent = {
  family: string | null;                 // key in FAMILIES (price-ranges.ts); null = no range shown
  breadcrumb: LinkItem[];                // excluding Home, including this page last
  eyebrow: string;
  h1: string;
  shortAnswer: string;                   // 40-60 words; "{range}" is replaced with the live range or removed
  hero: Photo | null;                    // null = ink panel only, full width
  rangeRows?: { body: "hatchback" | "sedan" | "suv"; label: string; examples: string; moves: string }[];
  rangeNote?: string;                    // shown under the overall range when there are no body rows
  showWarrantyYears?: boolean;           // PPF family only
  sections: Section[];                   // the page's unique body: benefits, how it works, cost factors, coverage
  steps?: Step[];
  work?: (Photo & { caption: string })[];// real P91 photos only
  reviewNames?: string[];                // names from VERIFIED_REVIEWS to quote
  faq: FaqItem[];
  related: LinkItem[];
};

export type AreaContent = {
  area: string; h1: string; intro: string;
  facts: { k: string; v: string }[];     // drive time, pickup ("On request, confirmed on a call"), hours, phone
  routeNote: string;
  services: { h3: string; text: string; href: string; link: string }[]; // area-specific text per service
  jobs: (Photo & { caption: string })[]; // real jobs for owners from this area; [] until supplied
  faq: FaqItem[];
  nearby: LinkItem[];
};

export type BrandContent = {
  name: string; h1: string; line: string; hero: Photo;
  about: string[]; fits: string[]; benefits: string[];
  genuine?: string[];                    // how to check the product is genuine
  usedIn: LinkItem[]; official: { href: string; label: string } | null;
};

export type GuideContent = {
  slug: string; h1: string; lede: string; date: string; updated?: string; readMinutes: number;
  author: string; reviewedBy: string;    // "[NEEDS: ...]" until the owner names them
  image: Photo;
  blocks: GuideBlock[];                  // migrated BlogBlock[] with links remapped
  mainService: LinkItem; sibling: LinkItem; area: LinkItem;
};
export type GuideBlock =
  | { t: "h2" | "h3"; text: string; id?: string }
  | { t: "p"; text: string; variant?: "lede" | "note" }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "faq"; items: FaqItem[] };
```

Route files are thin: `export default async function Page() { return <ServicePage content={X} path="..." /> }` plus `generateMetadata` from the registry entry.

---

### Task 1: Templates, link map, and PPF on the service template

**Files:**
- Modify: `packages/content/src/site/types.ts` (types above)
- Create: `packages/content/src/site/link-map.ts`, `tests/web-link-map.test.mjs`
- Create: `apps/web/components/templates/service-page.tsx`, `area-page.tsx`, `brand-page.tsx`, `guide-page.tsx`, `apps/web/components/rich-text.tsx`, `apps/web/components/review-quotes.tsx`
- Modify: `packages/content/src/site/paint-protection-film.ts` (to `ServiceContent`), `apps/web/app/services/paint-protection-film/page.tsx` (thin), `packages/content/src/site/home.ts` (trust strip + reviews per owner decisions)
- Modify: `tests/web-registry.test.mjs` (new rules below)

**Interfaces:**
- `link-map.ts`: `export const LINK_MAP: Record<string, string>` (old path → new path) and `export function remapLinks(text: string): string` that rewrites `[label](/old)` markdown links and bare old paths. Map (from spec section 1):

| Old | New |
|---|---|
| `/ppf`, `/services/paint-protection-film-bangalore`, `/service/ppf-*` | `/services/paint-protection-film` |
| `/ceramic-coating/car`, `/services/ceramic-coating-bangalore`, `/service/1-year-ceramic-coating` | `/services/ceramic-coating` |
| `/ceramic-coating/bike`, `/service/1-year-bike-ceramic-coating` | `/services/ceramic-coating/bike` |
| `/services/glass-sun-control-film-bangalore` | `/services/sun-control-film` |
| `/service/windshield-glass-coating-new` | `/services/sun-control-film/windshield-glass-coating` |
| `/services/interior-detailing-bangalore`, `/service/interior-detailing-service` | `/services/interior-detailing` |
| `/service/exterior-detailing-hard-water-new` | `/services/exterior-detailing/hard-water-spot-removal` |
| `/service/headlight-restoration-both` | `/services/exterior-detailing/headlight-restoration` |
| `/service/windshield-glass-polishing` | `/services/exterior-detailing` |
| `/service/annual-maintenance-package` | `/services/maintenance-plan` |
| `/service/premium-car-wash-special` | `/services/car-wash` |
| `/products` | `/brands` |
| `/products/<brand>` | `/brands/<brand>` |
| `/blog` | `/guides` |
| `/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi` | `/areas/koramangala` |
| `/blog/<slug>` (other) | `/guides/<slug>` |
| `/blog/category/*` | `/guides` |

- `ServicePage({ content: ServiceContent, path: string })`: renders, in order: breadcrumbs, hero (photo + ink panel with h1, overall range via `rangesFor(content.family)`, Book/WhatsApp), short answer, range table (rows if `rangeRows`, else overall range + `rangeNote`), `sections` (alternating white/ground), steps, warranty line (years if `showWarrantyYears`), work, review quotes, FAQ (+ FAQPage JSON-LD), related links, CTA band, Service JSON-LD with AggregateOffer.
- `RichText({ text })`: renders `**bold**` and `[label](/path)` (links through `next/link`), nothing else. No `dangerouslySetInnerHTML`.
- `ReviewQuotes({ names })`: quotes the named `VERIFIED_REVIEWS` entries word for word, each with name and "Google review", plus a "Read all our Google reviews" link to `GOOGLE_REVIEWS_URL`. Throws at build time if a name is not found.

- [ ] **Step 1:** Branch: `git checkout main && git pull --ff-only && git checkout -b feat/web-wave1`.
- [ ] **Step 2:** Write `tests/web-link-map.test.mjs` with one assertion per table row above plus: `remapLinks("see [PPF](/ppf) and [blog](/blog/monsoon-damage-car-bangalore)")` → `"see [PPF](/services/paint-protection-film) and [blog](/guides/monsoon-damage-car-bangalore)"`, and an unknown path is left unchanged. Run it, see it fail, implement `link-map.ts` (exact-match table first, then the `/service/ppf-*`, `/products/*`, `/blog/*` prefix rules in that order), see it pass.
- [ ] **Step 3:** Extend `tests/web-registry.test.mjs`: (a) no registry content contains any LINK_MAP key as a link target (`](/old)` or `href: "/old"`); (b) no content contains "manufacturer's warranty", "100% safe", "permanent bond", "certified technician", or "AggregateRating"; (c) every `reviewNames` entry exists in `VERIFIED_REVIEWS` and is not "Fazil Ahmed"; (d) remove the old "no self-heal" style checks if any. Run: fails until Task 1 content changes land.
- [ ] **Step 4:** Implement the four templates, `RichText`, `ReviewQuotes`. Area/brand/guide templates follow the v2 canvas boards (`V2-Area-Koramangala`, `V2-Brand-STEK`, `V2-Guide`) section for section; guide template renders a table of contents from `h2` blocks, author line, updated date, the image, the blocks, then "Next" (sibling) and "Near the studio" (area) links, and Article + BreadcrumbList JSON-LD.
- [ ] **Step 5:** Convert `paint-protection-film.ts` to `ServiceContent` (same copy; `showWarrantyYears: true`; warranty `[NEEDS]` markers removed because years now come from the catalogue; aftercare `[NEEDS: days before the first wash]` stays). Make the PPF route a thin `ServicePage` call. `npm run web:check` must still pass for it.
- [ ] **Step 6:** Home per owner decisions: trust strip item 1 becomes `{ strong: "Google reviews", sub: "Read what owners wrote" }` linking to `GOOGLE_REVIEWS_URL`; item 2 becomes "5 or 7-year PPF warranty" (years from the catalogue); add a reviews section quoting the first six `VERIFIED_REVIEWS` names in `HOME_REVIEW_COUNT` order (`reviews.ts:28`).
- [ ] **Step 7:** `node --test tests/web-*.test.mjs`, `npm test`, `npm run web:build`, `npm run web:check` all pass (pending links allowed). `npm run web:ship-gate` no longer lists warranty or rating gaps for `/`.
- [ ] **Step 8:** Commit `feat(web): service, area, brand and guide templates; PPF and Home on the new decisions`.

---

### Task 2 (batch A): main service pages

Create content + thin route for each; copy sources are fixed (reshape only):

| Path | Content file | Copy source | Family | Notes |
|---|---|---|---|---|
| `/services/ceramic-coating` | `ceramic-coating.ts` | `SEO_PAGES[0]` (`seo-pages.ts:83`) h1/lede/includes/borewell section/3 FAQs + `LANDING_PAGES[0]` (`landing-pages.ts:158`) 5 benefits, 6 steps | `ceramic-car` | Hero `/photos/gle-nasiol-wall.webp`; steps use `ceramic-wipe-bonnet.webp`, `polish-porsche-bonnet.webp` |
| `/services/ceramic-coating/bike` | `ceramic-coating-bike.ts` | `LANDING_PAGES[1]` (`landing-pages.ts:235`) + `bikeLandingFaq()` (`bike-landing-copy.ts:28`, 7 FAQs) | `ceramic-bike` | No real bike photo: `hero: null`; drop "100% safe" and "permanent bond" |
| `/services/sun-control-film` | `sun-control-film.ts` | `SEO_PAGES[3]` (`seo-pages.ts:236`) VLT/IR/TSER section, 3 FAQs + FAQ group `sun-control-film` (`faq-page.ts:296`) | none until a film catalogue row exists | `hero: null`; add the legal-tint section: front and rear glass min 70% VLT, side windows min 50% (CMVR Rule 100) |
| `/services/interior-detailing` | `interior-detailing.ts` | `SEO_PAGES[2]` (`seo-pages.ts:191`) | `interior-detailing` | Hero `interior-vacuum-footwell.webp` |
| `/services/exterior-detailing` | `exterior-detailing.ts` | FAQ group `car-detailing` (`faq-page.ts:266`) + blog `hard-water-spot-removal-bangalore` sections (`blog-posts.ts:383`) for the hard-water part; links to its two children | `exterior-detailing` | Before/after: the i20 pair; polishing photos |
| `/services` (hub) | `services-hub.ts` + `apps/web/app/services/page.tsx` | `SERVICES_SEO` (`static-seo.ts:55`), lede in `apps/admin/src/pages/services.tsx:76-80` (drop "prices are live", say "price ranges"), `SERVICE_GUIDE_LINKS`/`SERVICE_PRICE_LINKS` | per card | "Which one do you need?" table from the v2 board; 300+ words |

- [ ] **Step 1:** For each row: write the content file, the route, the registry entry (title 30-60 chars, description 110-160 chars, lastmod today), then `node --test tests/web-registry.test.mjs`.
- [ ] **Step 2:** `npm run web:build && npm run web:check` (batch pages pass; pending list shrinks).
- [ ] **Step 3:** Commit `feat(web): ceramic, bike ceramic, sun control film, interior, exterior and services hub`.
- [ ] **Step 4: Review checkpoint A.** Write `docs/superpowers/plans/2b-review-A.md`: list each page, its local URL, its source module, every place copy was changed from the source and why, and the ship-gate gaps. Stop and ask the owner to preview (`npm run web:start`) and approve or comment. Apply their comments before Task 3.

---

### Task 3 (batch B): sub-services (mostly new copy)

| Path | Content file | Source | Family |
|---|---|---|---|
| `/services/paint-protection-film/matte` | `ppf-matte.ts` | scraps: `faq-page.ts:178`, `seo-pages.ts:179`, `brand-pages.ts:66`; new copy for the rest | `ppf` (overall only) |
| `/services/paint-protection-film/front` | `ppf-front.ts` | carousel "Partial front"/"Full front end" (`carousels.ts:53-54`) + blog `how-much-ppf-does-your-car-need` (`blog-posts.ts:551`) | `ppf` |
| `/services/paint-protection-film/bike` | `ppf-bike.ts` | new copy; no bike photo | none until a bike PPF catalogue row exists |
| `/services/paint-correction` | `paint-correction.ts` | `faq-page.ts:288` + new copy; polishing photos | `exterior-detailing` |
| `/services/exterior-detailing/headlight-restoration` | `headlight-restoration.ts` | new copy; photos `p91-headlight-polish-detail`, `p91-headlight-restored` (copy into `apps/web/public/photos/` with kebab names) | `headlight-restoration` |
| `/services/exterior-detailing/hard-water-spot-removal` | `hard-water.ts` | blog `hard-water-spot-removal-bangalore` (`blog-posts.ts:383`) reshaped; no hard-water photo exists | `exterior-detailing` |
| `/services/sun-control-film/windshield-glass-coating` | `windshield-glass-coating.ts` | FAQ `faq-page.ts:277`, `:317` + new copy | `windshield-glass-coating` |
| `/services/maintenance-plan` | `maintenance-plan.ts` | new copy from the catalogue row's `whatIncluded` (read via `/api/services`, not typed) | `maintenance-plan` |
| `/services/car-wash` | `car-wash.ts` | new copy; photos `gallery/p91-wash-foam-*` (real, P91) framed as hand wash and detailing prep | `car-wash` |

New copy rules: plain, specific, no superlatives, no invented numbers; every fact either from the catalogue, an approved module, or a `[NEEDS: ...]` marker. Each page has at least 2 unique sections, 4-6 FAQs and the related-links block.

- [ ] **Step 1-3:** as Task 2 (content, route, registry; build and check; commit `feat(web): PPF variants, correction, headlight, hard water, glass coating, maintenance plan, car wash`).
- [ ] **Step 4: Review checkpoint B** (`2b-review-B.md`, same format). Stop for owner approval.

---

### Task 4 (batch C): areas and brands

| Path | Source | Notes |
|---|---|---|
| `/areas/koramangala` | blog `ppf-koramangala-hsr-layout-shanti-nagar-adugodi` (`blog-posts.ts:111-259`) | Drive time and pickup stay `[NEEDS]` ("On request, confirmed on a call" for pickup is allowed now). Replace "written manufacturer warranty" (`:167`, `:212`) with the approved wording |
| `/areas/hsr-layout` | mentions `blog-posts.ts:189`, `:234`, `faq-page.ts:115` + new area-specific lines | jobs `[]` until supplied |
| `/areas/indiranagar` | new | Must not imply a location in Indiranagar |
| `/brands` (hub) | `PRODUCTS_HERO`, `PRODUCT_KIND`, `PRODUCT_CHOOSE` (`products-page-data.ts:7-26`) | |
| `/brands/stek`, `/brands/nasiol`, `/brands/p91-premium-ppf` | `BRAND_PAGES` (`brand-pages.ts:49`, `:80`, `:110`) | Replace "the manufacturer's" warranty lines (`:55`, `:58`, `:86`, `:89`) with the approved wording; STEK hero is the Creta photo (never `p91-stek-*`) |

- [ ] **Steps:** content, routes, registry, build, check, commit `feat(web): area pages and brand pages`; **review checkpoint C** (`2b-review-C.md`).

---

### Task 5 (batch D): guides, gallery, FAQ, contact, about, legal

- **Guides:** `packages/content/src/site/guides.ts` converts each `BLOG_POSTS` entry (except the Koramangala one, which became the area page) to `GuideContent` with `remapLinks` applied to every text field and carousel blocks turned into `ul` blocks with the slide headings. Route `apps/web/app/guides/[slug]/page.tsx` with `generateStaticParams` and `dynamicParams = false`; hub `apps/web/app/guides/page.tsx` from `BLOG_INDEX_TITLE`/`DESCRIPTION` (`blog-posts.ts:1130-1132`) with cards. Images: copy `attached_assets/blog/<slug>.jpg` only where the photo catalogue says it matches the topic; otherwise use a matching verified P91 photo or none (the catalogue flags hard-water, monsoon, windshield and Koramangala images as mismatched). `author`/`reviewedBy` stay `[NEEDS]`.
- **New guides from the spec** (`/guides/ppf-cost-bangalore`, `/guides/what-is-ppf`) are linked from Home and PPF: write them as new copy under the same rules, using the Plan 2a guide board's outline for PPF cost.
- **Gallery:** `/gallery` from `STUDIO_PHOTOS`, `REEL_CAPTIONS` (`gallery-photos.ts:6,27`), `GALLERY_SEO`; filter out any photo the catalogue marks third-party or watermarked; 300+ words of intro.
- **FAQ:** `/faq` from `FAQ_INTRO`, `FAQ_SERVICE_CARDS`, `FAQ_GROUPS`, `FAQ_COMPARISON` (`faq-page.ts`), links remapped, "manufacturer" warranty lines (`:97`, `:110`, `:214`, `:330`) replaced with approved wording; FAQPage JSON-LD.
- **Contact:** `/contact` from `CONTACT_SEO`, `VISIT_STUDIO` (`studio-sections-data.ts:26`), `apps/admin/src/pages/contact.tsx:113-221` including the GSTIN line; map embed; hours from the API.
- **About:** `/about` new copy from `HOME_ABOUT_H2` (`home-faq.ts:19`), the home about paragraph (`apps/admin/src/pages/home.tsx:434-446`), `FAQ_INTRO[1]`; team/founding facts `[NEEDS]`.
- **Legal:** `/privacy-policy`, `/terms-conditions`, `/refund-policy` copied from `apps/admin/src/pages/*.tsx` verbatim into `packages/content/src/site/legal.ts` as `GuideBlock[]`, with `metadata.robots = { index: false }`, not in the registry, dates from `apps/admin/src/lib/legal-metadata.ts`. The terms page's live price list (`terms-conditions.tsx:41-46`) is replaced by "Current prices are shown at booking" because the new site has no exact-price component; record this as the only change.

- [ ] **Steps:** content, routes, registry (legal excluded), build, `web:check` must report **zero pending links**, commit `feat(web): guides, gallery, FAQ, contact, about and legal pages`; **review checkpoint D** (`2b-review-D.md`, plus the full legal-contradiction list for the owner: ₹299/₹499 vs ₹499/₹99 booking fee, "service at your designated location", old exact prices in the refund page).

---

### Task 6: Wave 1 completeness and handover

- [ ] `npm test`, `npm run web:build`, `npm run web:check` (0 failures, 0 pending), Lighthouse mobile on `/`, one service page, one area page, one guide (SEO 100, accessibility ≥ 95, LCP < 2.5 s).
- [ ] `npm run web:ship-gate` output saved into `docs/superpowers/plans/2b-ship-gate.md`: the complete list of facts the studio must supply before cutover.
- [ ] Registry count printed (target about 40 indexable pages, legal excluded).
- [ ] Open a PR `feat/web-wave1` → `main` and ask the owner to merge (safe: web is still not routed in production).
