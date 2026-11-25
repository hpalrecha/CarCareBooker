# P91 Car Care: site restructure and redesign (design spec)

Date: 25 November 2026. Status: approved in brainstorming (sections 1 and 2 approved one by one; sections 3 to 6 approved with "do it all"; updated 25 Nov with owner feedback: price ranges, extra services, page waves, image policy, full monorepo restructure). Copy is drafted per page and approved by the owner before it ships.

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

**Added 25 Nov (owner confirmed bike PPF, matte PPF, bike ceramic coating and washing are offered):**

| New URL | Role | 301 from |
|---|---|---|
| `/services/paint-protection-film/matte` | Matte PPF | |
| `/services/paint-protection-film/front` | Front-only PPF (bonnet, bumper, mirrors) | |
| `/services/paint-protection-film/bike` | Bike PPF | |
| `/services/paint-correction` | Machine polishing and paint correction | |
| `/services/exterior-detailing/headlight-restoration` | Headlight restoration | (replaces the line above for this slug) |
| `/services/exterior-detailing/hard-water-spot-removal` | Hard-water spot removal | (replaces the line above for this slug) |
| `/services/sun-control-film/windshield-glass-coating` | Windshield glass coating | (replaces the line above for this slug) |
| `/services/car-wash` | Washing (premium wash) | `/service/premium-car-wash-special` |
| `/cars/<make-model>` | Car-model pages (wave 2) | |

The 18 Oct "keep the car-wash URL" decision is superseded: washing is now a full service with its own page, and the old URL 301s to it.

Rules:

- The 16 spam URLs and the spam pattern keep answering 410.
- Old blog category pages (`/blog/category/*`) 301 to `/guides`.
- Redirects are single-hop. Existing host and protocol redirects stay.
- Sitemap: grows by wave (below), `lastmod` only from a real content-change date.

**Price rule (owner, 25 Nov):** marketing pages never show an exact price or "from ₹X". Each service shows a range (lowest to highest package for that body type) and a "what moves the price" list. The exact figure comes by WhatsApp or at checkout. Where the catalogue has one price only, the top end is `[NEEDS]` until the studio gives it. Booking and checkout show the exact amount charged.

**Pickup and drop:** offered on request and confirmed on a call. Pages say exactly that; no promise of free pickup or fixed timings.

**Page waves ("safe job first", owner 25 Nov).** A page ships only when every section has real, page-specific content; nothing ships with `[NEEDS]` left in it.

| Wave | Pages | Count |
|---|---|---|
| 1 | Home; `/services`; PPF, ceramic car, ceramic bike, sun control film, interior, exterior, maintenance plan, car wash; matte, front and bike PPF; paint correction, headlight, hard water, windshield glass coating; areas Koramangala, HSR Layout, Indiranagar; `/brands` + 3 brands; `/guides` + 7 existing guides; gallery, faq, contact, about | about 40 |
| 2 | 8 car-model pages with real photos (Creta, XUV700, Vellfire, Innova Hycross, Swift, BMW 3 Series, Evoque, GLE); 5 new guides | 13 |
| 3 | More areas (Jayanagar, BTM, Wilson Garden, JP Nagar, Bellandur, then others) once real jobs and pickup facts exist for each; 3 more guides | 5 to 10 |

Target after wave 3: 55 to 60 indexable pages.

**Images (owner, 25 Nov):** licensed images from the internet are allowed where P91 has no photo (Unsplash or Pexels licence, brand press kits with permission, or bought stock), with the source recorded per image in `packages/content/image-credits.ts`. They explain concepts only and are never captioned as P91 work. Proof sections (our work, before/after, reviews, area jobs) use real P91 photos only, chosen from `docs/superpowers/specs/photo-catalogue.md`. Images with other businesses' watermarks or of other installers' work are removed from the site. Icons: lucide, one stroke weight.

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

1. Hero: studio photo beside the ink panel; H1 "<Service> in Bangalore"; price range (from the catalogue); Book and WhatsApp.
2. Short answer block, 40 to 60 words: what, for whom, price range, time in studio. Written to be quoted by answer engines.
3. Price range by body type (hatchback, sedan, SUV) with "what moves the price" per row. Ranges computed from the booking database.
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

**Copy process:** drafted from approved existing copy, the catalogue and manufacturer facts. Price ranges are never typed into copy; they are computed from the booking database. Owner approves each page before it ships.

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

- New app `apps/web` in this repo (Next.js App Router, TypeScript strict, Tailwind v4), built and deployed as its own Docker image next to the existing one.
- Pages are generated at build time (SSG) and refreshed with ISR (`revalidate` 300 s for pages that show prices). Prices, packages, hours and gallery come from the existing Express `/api/*` at build or revalidate time; page copy lives in typed data files in `packages/content` (one file per page), so every page, its schema, `llms.txt` and the sitemap come from one source.
- Booking UI is rebuilt in Next.js (`/book/<package>`, confirmation page). It calls the existing Express endpoints for slots, prices, payment and WhatsApp. Payment and booking logic stay in Express unchanged.
- The Vite client shrinks to `/admin` only.
- Redirects live in `apps/web/next.config.ts` (`redirects()`), generated from one table (`packages/content/redirects.ts`) that mirrors section 1. 410 handling for spam paths moves to Next middleware, reusing the regex from `server/lib/spam-paths.ts` (moved to `packages/domain`).
- Images: `next/image` with AVIF/WebP, from the existing `attached_assets/gallery` set.
- Security headers (HSTS, CSP) as Explaino `next.config.mjs` does.
- Robots safety: `robots.ts` fails open to the production rules only when `NEXT_PUBLIC_SITE_URL === "https://p91carcare.com"`, and a build check fails the deploy if production robots would disallow `/`.

**Whole-codebase restructure (owner, 25 Nov: "do the most recommended").** The repo becomes a pnpm monorepo. Phase 1 builds `apps/web` and moves everything else with no behaviour change; phase 2 refactors API and admin internals behind tests. Bookings and payments stay live throughout.

```
apps/
  web/            Next.js public site + booking UI (new)
  api/            Express, by feature (moved from server/)
    src/
      app.ts, server.ts
      features/
        bookings/    routes.ts service.ts repo.ts schema.ts *.test.ts
        payments/    (Razorpay order, confirm, webhook)
        services/    (catalogue, slots, business hours, blackout dates)
        campaigns/   (campaigns, offers, booking-offer)
        leads/       (ppf-leads, contact)
        whatsapp/
        chatbot/
        admin-auth/
        integrations/ (n8n/ERPNext webhook, lead sheet, email)
        scheduler/
      middleware/    (canonical-host, gone-paths, trailing-slash, security-headers, rate-limit)
  admin/          Vite admin panel (admin pages and components moved from client/)
packages/
  db/             Drizzle schema, zod schemas, types (from shared/schema.ts); migrations in one folder
  content/        page copy, SEO data, FAQs, blog posts, llms.txt, sitemap data (from client/src/lib/*)
  domain/         pure logic used by more than one app: IST time, offer pricing, campaign state, attribution
  ui/             design tokens and shared primitives
```

Findings from the codebase map (25 Nov) that drive this:

- The server imports at least 14 modules from `client/src/lib` (crawlable content, landing pages, SEO data, nav menu, local business). These move to `packages/content`, so no app imports another app.
- `server/routes.ts` is 2,866 lines with 66 endpoints; it splits into one `routes.ts` per feature. `server/storage.ts` (650) splits into one `repo.ts` per feature.
- Other giant files: `admin-dashboard.tsx` 2,247, `redesign.css` 2,220, `service-landing.tsx` 1,385, `booking-modal.tsx` 1,035, `blog-posts.ts` 1,147. Target: no source file over about 400 lines.
- Logic duplicated on both sides (IST time math, attribution) moves to `packages/domain`.
- Dead code is deleted: unrouted pages (`ppf-ceramic-landing`, `service-detail`, `cancellation-policy`, `terms-of-service`), unused components and hooks (`ObjectUploader`, `use-upload`, `transformation-cta`, `festival-offer-popup`), about 30 unused shadcn `ui/*` files, the Replit object-storage integration, Replit Vite plugins and env, and unused dependencies (Stripe, passport, openid-client, memorystore, memoizee), each confirmed unused by grep and a build before removal.
- Naming: kebab-case files everywhere (`ObjectUploader.tsx`, `objectStorage.ts`, `replit_integrations/` go).
- Migrations: one folder (`packages/db/migrations`) instead of `migrations/manual` plus `scripts/migrations`; `db:push` stays for local work only.
- One-off scripts (about 40 DB and content fix-ups in `scripts/`) move to `scripts/archive/` or are deleted once confirmed done; build and deploy scripts stay.
- Root clutter (`REPORT.md`, `replit.md`, `cookies.txt`, the catalogue PDF, `.replit`) moves to `docs/` or is deleted.
- The runtime Docker image stops needing devDependencies once `vite.ts` dev middleware is no longer imported in production.
- Existing tests (44 unit, 24 integration, 6 server) move with their feature and must pass before and after each move.

Deploy: two images, `web` and `api` (admin is static files served by `api` or nginx). The existing candidate-port health-check and swap in `scripts/deploy-manual.sh` and `auto-deploy.sh` is kept and extended to both images.

**Third-party building blocks (approved 25 Nov):**

| Package | Repo | Use |
|---|---|---|
| `schema-dts` | google/schema-dts | Types for every JSON-LD builder in `apps/web/lib/schema.ts`; schema errors fail the type check |
| `img-comparison-slider` (`@img-comparison-slider/react`) | sneas/img-comparison-slider | Before/after slider on service pages and the gallery; keyboard accessible |
| `@qwik.dev/partytown` | QwikDev/partytown | Runs GTM, Meta Pixel and Clarity in a web worker (`next/script` `strategy="worker"`) to protect mobile INP and LCP |

Later, owner-installed: `avansaber/seo-monster` MCP server (Search Console, GA4, PageSpeed) for post-launch monitoring.

**Design system in code:** tokens from the canvas (`Main.dc.html`) as CSS variables in `packages/ui/tokens.css`: brand green `#4DB848`, action green `#2E7D32`, green dark `#1B5E20`, tint `#EAF7EA`, ink `#12211B`, text-2 `#33443C`, muted `#5E6E66`, line `#E4E9E6`, ground `#F5F7F6`, white. Plus Jakarta Sans via `next/font`. Radii 12/14/16, spacing 4 to 28, 44 px minimum targets, 52 px main buttons. Motion (framer-motion, Explaino-style): one scroll-story hero on Home, section reveals, card tilt; all off under `prefers-reduced-motion`; all text in the DOM.

## 4. SEO and GEO

- Schema builders in one file (`apps/web/lib/schema.ts`): `AutoRepair` (LocalBusiness) with `@id`, address, geo, hours from the API, `areaServed` (3 areas); `Service` with an `AggregateOffer` (`lowPrice`/`highPrice` from the catalogue range) on each service page; `FAQPage`; `BreadcrumbList`; `Article` on guides; `VideoObject` where the studio reel plays; `ItemList` on hubs.
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

1. On a branch: create the monorepo, move server/client/shared into apps/api, apps/admin and packages with no behaviour change (all existing tests green), then build `apps/web`; run it on staging behind nginx path routing.
2. Content: draft per page, owner approves; area pages ship only when their `[NEEDS]` facts are filled.
3. Checks before switch: every old URL returns one 301 hop to the right target (script over `docs/seo-plan/04-redirect-and-url-map.csv` plus section 1); every sitemap URL 200, self-canonical, `index,follow`; booking end to end on staging with a test payment; Lighthouse mobile LCP under 2.5 s on Home and the PPF page; JSON-LD validates; no page under 80% unique body text (shingle check script from the 20 Nov audit).
4. Switch nginx routing in production; keep the old Vite build ready for a one-command rollback.
5. After launch: resubmit sitemap, IndexNow, URL Inspection for main pages; watch Search Console indexing weekly for 6 weeks.

Success measure: 30 or more of the wave 1 URLs indexed within 8 weeks of launch, 45 or more of all waves within 16 weeks; non-brand impressions up; booking conversion not lower than before.

Out of scope for this spec: Pulse91 and ERPNext lead flow.
