# P91 Car Care: site restructure and redesign (design spec)

Date: 25 November 2026. Status: approved in brainstorming (sections 1 and 2 approved one by one; sections 3 to 6 approved with "do it all"). Copy is drafted per page and approved by the owner before it ships.

Design boards: canvas "P91 Car Care Website Redesign", page "v2: hub structure" (https://claude.ai/artifact/6egv6Rjxp3LgSk3xmHN6Ey).

## 0. Why

Search Console, 25 Nov 2026 (`sc-domain:p91carcare.com`): **2 indexed, 48 not indexed**.

| Reason | Pages |
|---|---|
| Crawled - currently not indexed | 19 |
| Soft 404 (previous-owner spam) | 16 |
| Discovered - currently not indexed | 12 |
| Page with redirect | 1 |

No technical block: all 32 sitemap URLs return 200, `index,follow`, self-canonical, server-rendered text (checked as Googlebot, 25 Nov). The cause is quality and structure:

- One topic is split across up to three URLs (`/ppf` price page, `/services/paint-protection-film-bangalore` guide, `/service/ppf-*` booking pages).
- Inner pages repeat shared sections; `/service/*` pages carry about 140 to 240 unique words.
- Thin hubs: `/products` 14 body words, `/contact` 82.
- Flat menu and footer links: no page is marked as more important.
- No area pages, 8 articles, weak domain trust (spam history, few backlinks).

A visual redesign alone will not change indexing. The fix is fewer, stronger, distinct pages, a clear link hierarchy, and then the redesign on top.

Earlier work this builds on: `docs/seo-plan/CONTENT-SEO-STRUCTURE-AUDIT-AND-IMPLEMENTATION-PLAN.md` (20 Nov audit, keyword map, proposed links). That plan kept all URLs; this spec replaces its URL decision (section 5 there) with the hub structure below.

## 1. URL map and internal links (approved)

| New URL | Role | 301 from |
|---|---|---|
| `/` | Home | |
| `/services` | Hub for every service | `/ppf-ceramic-coating` (existing) |
| `/services/paint-protection-film` | One PPF page: guide, prices by body type, booking | `/ppf`, `/services/paint-protection-film-bangalore` |
| `/services/ceramic-coating` | Car ceramic coating | `/ceramic-coating/car`, `/services/ceramic-coating-bangalore` |
| `/services/ceramic-coating/bike` | Bike ceramic coating | `/ceramic-coating/bike` |
| `/services/sun-control-film` | Sun control film and windshield glass coating | `/services/glass-sun-control-film-bangalore`, `/service/windshield-glass-coating-new` |
| `/services/interior-detailing` | Interior detailing | `/services/interior-detailing-bangalore`, `/service/interior-detailing-service` |
| `/services/exterior-detailing` | Hard-water removal, polishing, headlight restoration | `/service/exterior-detailing-hard-water-new`, `/service/windshield-glass-polishing`, `/service/headlight-restoration-both` |
| `/services/maintenance-plan` | Annual maintenance package | `/service/annual-maintenance-package` |
| `/areas/koramangala` | Area page | `/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi` |
| `/areas/hsr-layout` | Area page | |
| `/areas/indiranagar` | Area page | |
| `/brands` | Brand hub | `/products` |
| `/brands/stek`, `/brands/nasiol`, `/brands/p91-premium-ppf` | Brand pages | `/products/stek`, `/products/nasiol`, `/products/p91-premium-ppf` |
| `/guides` | Article hub | `/blog` |
| `/guides/<slug>` | Articles (same slugs) | `/blog/<slug>` |
| `/gallery`, `/faq`, `/contact` | Supporting pages | |
| `/about` | New: studio, team, warranty, own film brand | |
| `/book/<package-slug>` | Booking flow, `noindex`, not in sitemap | `/service/ppf-*`, `/service/1-year-*` (9 package pages) |

Rules:

- `/service/premium-car-wash-special` keeps its URL, nav entry and sitemap entry, with no redirect (owner decision, 18 Oct). It is restyled only. No new car-wash content anywhere.
- The 16 spam URLs and the spam pattern keep answering 410.
- Old blog category pages (`/blog/category/*`) 301 to `/guides`.
- Redirects are single-hop. Existing host and protocol redirects stay.
- Sitemap: about 26 URLs, `lastmod` only from a real content-change date.

Internal links (a pyramid, not a flat menu):

- Home body links to the 6 main service pages, 3 area pages and `/guides`.
- Each service page links to its booking flow, 2 to 3 sibling services, its brand page, 2 guides and the gallery filtered to that service.
- Each area page links to every service page with the area in the anchor, plus `/contact` and directions.
- Each guide links to exactly one main service page, one sibling guide and one area page.
- Footer holds hubs and legal pages only.
- Breadcrumbs on every page, with `BreadcrumbList`.
- Anchor text describes the destination; no bare "Read more"; at most 8 body links per page; one link per destination per page.

## 2. Page templates and content (approved)

Every section must carry information that only that page has. Target 80% or more unique body text per indexable page.

**Main service page** (1,200 to 1,800 words), in order:

1. Hero: studio photo beside the ink panel; H1 "<Service> in Bangalore"; "from ₹X" (live); Book and WhatsApp.
2. Short answer block, 40 to 60 words: what, for whom, price range, time in studio. Written to be quoted by answer engines.
3. Prices by body type (hatchback, sedan, SUV), package tabs. Live from the booking database.
4. What is included and the process, with real studio photos.
5. Cost factors: why prices differ.
6. Coverage choices and maintenance (front vs full body for PPF; wash routine for ceramic).
7. Warranty terms in writing.
8. Before and after gallery for this service only.
9. Reviews that mention this service (real Google reviews, word for word).
10. FAQ, 6 to 8 questions specific to the service.
11. Related services and guides.
12. Visit the studio band.

**Area page** (`/areas/<area>`):

- Distance and drive time to the Adugodi studio, and the route.
- Pickup and drop: whether it covers the area, timings.
- Cars done for owners from the area (real jobs, real photos).
- A review from the area, if one exists.
- Every service as an H2 with the area name, each with a short area-specific paragraph (not shared between area pages).
- Map, parking.
- Facts not yet supplied are marked `[NEEDS: ...]`; the page does not ship until they are filled.

**Brand page:** manufacturer specs and warranty, why P91 uses it, comparison with alternatives, which P91 services use it, how to spot fakes.

**Guide:** table of contents, author and "reviewed by" line, updated date, one main service link, `Article` schema.

**Hubs** (`/services`, `/brands`, `/guides`, `/gallery`): at least 300 words of real introduction, cards to children.

**Home:** scroll-story hero (bare paint, film going on, ceramic gloss), 6 services, why P91 (warranty, own film, studio), areas, featured work, reviews, FAQ, visit band.

**Copy process:** drafted from approved existing copy, the catalogue and manufacturer facts. Prices are never typed into copy; they render from the booking database. Owner approves each page before it ships.

**First 5 new guides:** PPF cost explained; what to ask a studio before booking; graphene vs ceramic; DIY vs professional coating; PPF care in the monsoon.

## 3. Technical architecture

**Decision: the public site moves to Next.js; the Express API stays.**

```
Cloudflare
   |
nginx (Lightsail)
   |-- /api/*, /admin*, /uploads/*, /sitemap.xml?* -> Express (existing, :5000)
   |-- everything else                             -> Next.js (new, :3000)
```

- New app `web/` in this repo (Next.js App Router, TypeScript strict, Tailwind v4), built and deployed as its own Docker image next to the existing one.
- Pages are generated at build time (SSG) and refreshed with ISR (`revalidate` 300 s for pages that show prices). Prices, packages, hours and gallery come from the existing Express `/api/*` at build or revalidate time; page copy lives in typed data files under `web/content/` (one file per page), so every page, its schema, `llms.txt` and the sitemap come from one source.
- Booking UI is rebuilt in Next.js (`/book/<package>`, confirmation page). It calls the existing Express endpoints for slots, prices, payment and WhatsApp. Payment and booking logic stay in Express unchanged.
- The Vite client shrinks to `/admin` only.
- Redirects live in `web/next.config` (`redirects()`), generated from one table (`web/content/redirects.ts`) that mirrors section 1. 410 handling for spam paths moves to Next middleware, reusing the regex in `server/lib/spam-paths.ts`.
- Images: `next/image` with AVIF/WebP, from the existing `attached_assets/gallery` set.
- Security headers (HSTS, CSP) as Explaino `next.config.mjs` does.
- Robots safety: `robots.ts` fails open to the production rules only when `NEXT_PUBLIC_SITE_URL === "https://p91carcare.com"`, and a build check fails the deploy if production robots would disallow `/`.

**Design system in code:** tokens from the canvas (`Main.dc.html`) as CSS variables in `web/app/tokens.css`: brand green `#4DB848`, action green `#2E7D32`, green dark `#1B5E20`, tint `#EAF7EA`, ink `#12211B`, text-2 `#33443C`, muted `#5E6E66`, line `#E4E9E6`, ground `#F5F7F6`, white. Plus Jakarta Sans via `next/font`. Radii 12/14/16, spacing 4 to 28, 44 px minimum targets, 52 px main buttons. Motion (framer-motion, Explaino-style): one scroll-story hero on Home, section reveals, card tilt; all off under `prefers-reduced-motion`; all text in the DOM.

## 4. SEO and GEO

- Schema builders in one file (`web/lib/schema.ts`): `AutoRepair` (LocalBusiness) with `@id`, address, geo, hours from the API, `areaServed` (3 areas); `Service` with `offers` from live prices on each service page; `FAQPage`; `BreadcrumbList`; `Article` on guides; `VideoObject` where the studio reel plays; `ItemList` on hubs.
- Per-page metadata: unique title and description, absolute self-canonical, OG and Twitter, generated OG image per service and area page.
- `llms.txt` and `llms-full.txt` routes built from the content files.
- IndexNow ping after each deploy (`scripts/indexnow.mjs`), plus Search Console sitemap resubmit and URL Inspection requests for the 10 main pages.
- Answer-engine readiness: short answer block near the top of each service page, question-shaped H2s, tables for prices and comparisons, author and updated date on guides.
- Off-site (owner actions, tracked in the plan): Google Business Profile links point to the new URLs; review requests after each job; citations in Bangalore directories; brand-partner links from STEK and Nasiol India pages.

## 5. Analytics

- One GTM container loads everything; Consent Mode v2 with a minimal banner.
- GA4: P91 property only (`G-D3QRLWNCY5`). The Just Signs stream `G-QXEEJ4EK4J` is removed from this site.
- Google Ads tag `AW-11467752288` conversions: booking purchase, WhatsApp click, call click.
- Meta Pixel on, with Conversions API from Express for booking and purchase (server events deduplicated by `event_id`).
- Microsoft Clarity kept, off on `/admin`.
- Events: `click_call`, `click_whatsapp`, `view_price_table`, `begin_booking`, `select_slot`, `begin_checkout`, `purchase`, `generate_lead`. Parameters: service, package, body type, page type, area.
- First-touch attribution (Explaino `StudioLinkAttribution` pattern): store landing page, referrer and UTMs on first visit; attach them to the booking record through the Express API so every booking shows its source page.

## 6. Rollout and testing

1. Build `web/` on a branch; run it on staging behind nginx path routing.
2. Content: draft per page, owner approves; area pages ship only when their `[NEEDS]` facts are filled.
3. Checks before switch: every old URL returns one 301 hop to the right target (script over `docs/seo-plan/04-redirect-and-url-map.csv` plus section 1); every sitemap URL 200, self-canonical, `index,follow`; booking end to end on staging with a test payment; Lighthouse mobile LCP under 2.5 s on Home and the PPF page; JSON-LD validates; no page under 80% unique body text (shingle check script from the 20 Nov audit).
4. Switch nginx routing in production; keep the old Vite build ready for a one-command rollback.
5. After launch: resubmit sitemap, IndexNow, URL Inspection for main pages; watch Search Console indexing weekly for 6 weeks.

Success measure: 20 or more of the ~26 sitemap URLs indexed within 8 weeks of launch; non-brand impressions up; booking conversion not lower than before.

Out of scope for this spec: one page per car model (later, once the hub pages are indexed), Pulse91 and ERPNext lead flow.
