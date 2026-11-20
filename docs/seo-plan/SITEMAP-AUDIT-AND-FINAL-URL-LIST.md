# Sitemap audit: P91 Car Care (32 URLs) vs P91 India (14 URLs)

Date: 20 November 2026. **Read-only.** No code, XML, production, DNS, redirect or database was changed. The only calls made were GET and HEAD requests, Search Console read-only API calls (URL Inspection, Search Analytics, sitemap report), a git history read, and headless-browser renders. Waiting for your approval.

Companion file: `05-final-sitemap-urls.csv` (the exact final list, one row per URL, with the reason).

## 1. Short answer

1. **Your suspicion is half right.** The URL groups you named do overlap in **keyword and intent**, but not in **text**, and none of them is a duplicate page that should be redirected or removed. The measured text overlap between the suspect pairs is 0 to 4 percent. The only true duplicates on the site are the eight booking-record pages (`/service/ppf-*`, `/service/1-year-*`), and those are already canonicalised to their price pages and already kept out of the sitemap.
2. **Recommended final sitemap: the same 32 URLs. No removals and no additions.** Reasons per URL are below and in the CSV. What needs fixing is not the list but its **metadata**: 17 of 32 `lastmod` values are present and almost all of them are stale or not tied to real content changes (section 6), and `changefreq` and `priority` are values Google ignores.
3. **No redirects.** Redirecting any `/service/*` URL or any landing path would break booking, the chatbot's booking links, or ad and booking attribution (section 5).
4. **The two keyword overlaps worth fixing** are (a) the glass guide's H1 against the windshield coating item and (b) the interior guide against the interior service item. Both are content decisions, not sitemap decisions.
5. **P91 India's sitemap is not a clean model** (section 7): every page returns an empty shell to a crawler, there are no `lastmod` values, its menu links to a page that is a client-side 404 served with HTTP 200, and unknown URLs also return 200.

## 2. How the live sitemap was checked

- Fetched `https://p91carcare.com/sitemap.xml` on 20 Nov: **32 URLs, identical to the XML you pasted** (same URLs, same 17 `lastmod` values). Search Console reports it as processed on 20 Nov 05:40 UTC: 32 submitted, 0 errors, 0 warnings.
- Every one of the 32 URLs returns **200**, is **`index,follow`**, has no `X-Robots-Tag`, and has a **self-referencing absolute canonical**.
- **Indexable, self-canonical pages that are missing from the sitemap: none.** Pages in the sitemap that should not be there: none.
- Pages deliberately outside the sitemap (all correct): three blog category pages and three legal pages (`noindex,follow`), and eight booking-record pages (200, canonical to another URL).
- The sitemap is generated at request time in `server/routes.ts`; the service-item rows come from the database and skip any slug in `canonical-overrides.ts`.

## 3. The four groups, URL by URL

Columns: HTTP, canonical, robots, in sitemap, Google status on 20 Nov (URL Inspection), words in `<main>` (first HTML), pages that link to it from body text (menu and footer excluded), Search Console impressions 19 Aug to 17 Nov (apex plus the old booking host).

### 3.1 PPF: `/ppf` and `/services/paint-protection-film-bangalore`

| | `/ppf` | `/services/paint-protection-film-bangalore` |
|---|---|---|
| Role | price and booking (ad destination) | explainer |
| Title | Car PPF Price in Bangalore — Hatchback, Sedan, SUV | Paint Protection Film in Bangalore |
| H1 | Paint Protection Film for Your Car | Paint Protection Film (PPF) in Adugodi, Bangalore |
| HTTP / canonical / robots | 200 / self / index,follow | 200 / self / index,follow |
| In sitemap | yes (no lastmod) | yes (no lastmod) |
| Google | crawled, not indexed (last crawl 19 Nov) | unknown to Google (never crawled) |
| Words, body-link pages | 437 raw (699 rendered), 8 pages | 289 raw (393 rendered), 11 pages |
| Impressions | 6 (position 63) | **320**, nearly all on `booking.p91carcare.com/services/paint-protection-film-bangalore`, which the Google Business Profile booking link points to |

Text overlap: **1 percent each way, 0 identical blocks.** Intent is split correctly (price and book vs learn). **Verdict: keep both, separate, both in the sitemap.** The guide already links to `/ppf` as its booking destination. The 320 impressions on the old booking host are the evidence that Google found the guide through the Business Profile; once the profile link is moved to the main domain and the 301 is followed, that signal should move to the apex guide.

### 3.2 Ceramic coating: `/ceramic-coating/car`, `/ceramic-coating/bike`, `/services/ceramic-coating-bangalore`

| | `/ceramic-coating/car` | `/ceramic-coating/bike` | `/services/ceramic-coating-bangalore` |
|---|---|---|---|
| Role | price and book, cars | price and book, bikes | explainer |
| Title | Car Ceramic Coating Price in Bangalore | Bike Ceramic Coating in Bangalore | Ceramic Coating in Bangalore |
| HTTP / canonical / robots / sitemap | 200 / self / index,follow / yes | same | same |
| Google | crawled, not indexed (16 Nov) | crawled, not indexed (11 Nov) | unknown (never crawled) |
| Words, body-link pages | 955 raw, 9 | 622, 5 | 303, 12 |
| Impressions | 0 | 0 | 0 |

Text overlap: car vs guide 3 to 10 percent (1 identical block, a process step); bike vs guide 1 to 2 percent; **car vs bike 6 to 9 percent (6 identical blocks, all catalogue text).** **Verdict: keep all three, separate, all in the sitemap.** The car and bike pages are different products with different audiences; the shared catalogue lines are the only duplication and they were already cut back on 18 Nov (the bike page has its own FAQ).

### 3.3 Interior: `/services/interior-detailing-bangalore` and `/service/interior-detailing-service`

| | guide | service item (booking record) |
|---|---|---|
| Title | Car Interior Detailing in Bangalore | Interior Rejuvenation Service in Bangalore |
| H1 | Car Interior Detailing in Adugodi, Bangalore | Interior Rejuvenation Service |
| HTTP / canonical / robots / sitemap | 200 / self / index,follow / yes (no lastmod) | 200 / self / index,follow / yes (lastmod 2026-10-07) |
| Google | unknown (never crawled) | unknown (never crawled) |
| Words, body-link pages | 245 raw, 7 | 171 raw, 2 |
| Schema | BreadcrumbList, FAQPage | AutoRepair, Service, Offer |

Text overlap **2 to 4 percent**, 0 identical blocks. Both are thin (under 250 words). The item is the **only page that sells and books** interior work; the guide is the only page that explains it. Their primary keywords are close ("car interior detailing Bangalore" vs "car interior cleaning Bangalore"). **Verdict: keep both for now, both in the sitemap, and improve both** (the guide needs a table of contents and the "what to ask" content; the item needs the stage-by-stage content, which waits on the studio's answers). **Trigger for revisiting:** if, after both have been crawled and improved, Search Console shows the two competing for the same queries with neither indexed, the cleaner fix is to merge the guide's text into the item page and then 301 the guide, because the item cannot be redirected (section 5). That needs data, so it is not recommended today.

### 3.4 Glass and film: `/services/glass-sun-control-film-bangalore`, `/service/windshield-glass-coating-new`, `/service/windshield-glass-polishing` (and headlight)

| | glass guide | windshield coating | windshield polishing | headlight (context) |
|---|---|---|---|---|
| Title | Sun Control Film & Glass Coating Bangalore | Windshield Glass Coating in Bangalore | Windshield Glass Polishing in Bangalore | Headlight Restoration - Both Lights |
| H1 | Windshield Glass Coating & Sun Control Film in Bangalore | Windshield Glass Coating | Windshield Glass Polishing | same as title |
| HTTP / canonical / robots / sitemap | 200 / self / index,follow / yes | same, lastmod 2026-09-26 | same, lastmod 2026-09-26 | same, lastmod 2026-09-18 |
| Google | unknown | unknown | unknown | unknown |
| Words, body-link pages | 303 raw, 8 | 334, 4 | 285, 2 | 168, 1 |

Text overlap: guide vs coating **0 percent**, guide vs polishing **0 percent**, coating vs polishing **17 to 21 percent, caused only by the shared "related links" block** (4 identical blocks: the guide link, the products hub link, two article links). **Verdict: keep all three separate and in the sitemap.** Coating (protect) and polishing (repair scratches and wiper marks) are different jobs, and a duplicate "glass-polishing" record was already consolidated by an earlier 301 (`/service/glass-polishing`).

**The one real overlap here is the keyword in the H1:** the guide's H1 starts "Windshield Glass Coating", which is the primary keyword of the coating item page. Keep the URLs; if you approve changing the wording later, the guide's H1 and title should lead with "sun control film" and treat windshield coating as one section that links to the item.

### 3.5 Canonical duplicates (the booking records), for completeness

| URL | HTTP | Canonical | Sitemap | Google | Text overlap with its target |
|---|---|---|---|---|---|
| `/service/ppf-hatchback`, `-sedan`, `-suv`, `-premium-hatchback`, `-premium-sedan`, `-premium-suv` | 200 | `/ppf` | no | unknown (all 6 inspected) | `/ppf` vs sedan: 27 to 32 percent (booking text and FAQ) |
| `/service/1-year-ceramic-coating` | 200 | `/ceramic-coating/car` | no | unknown | **68 to 86 percent**, 25 identical blocks |
| `/service/1-year-bike-ceramic-coating` | 200 | `/ceramic-coating/bike` | no | unknown | not measured (same catalogue text as the car record) |

Google has not discovered any of them. The canonical already tells Google to consolidate on the price page, so the overlap costs nothing. **Verdict: leave exactly as is.**

## 4. Which URLs are separate, improved, canonicalised or removed

| Group | Decision |
|---|---|
| `/ppf` + PPF guide | separate, both stay |
| three ceramic pages | separate, all stay |
| interior guide + interior item | separate for now; both improved; merge only on later evidence |
| glass guide + coating + polishing | separate; guide wording to reconsider |
| `/service/ppf-*` (6), `/service/1-year-*` (2) | already canonicalised; keep out of the sitemap; no redirect |
| anything removed from the sitemap | **nothing** |
| anything added to the sitemap | **nothing** |

## 5. Booking-record dependencies (checked before any redirect advice)

| Where the URL is used | What depends on it | Consequence of redirecting or removing it |
|---|---|---|
| `bookings.service_id` and `leads` (shared/schema.ts) | a UUID foreign key to the catalogue row, not a URL | stored bookings survive any URL change |
| `bookings.landing_page`, `leads.landing_page`, `campaigns.landing_page` plus `campaigns.service_slug` | the **path first seen** (for example `/ceramic-coating/car`) and the campaign-to-page mapping | renaming or redirecting `/ppf`, `/ceramic-coating/car` or `/ceramic-coating/bike` breaks attribution and campaign windows |
| Chatbot (`server/services/chatbot.ts`) | proposes `bookingUrl = /service/<slug>?date=..&time=..` for **any** catalogue slug, including `ppf-*` and `1-year-*` | redirecting those URLs would drop the pre-filled date and time |
| Service cards, nav, footer, gallery, `/services` list | link to `/service/<slug>` for every active record; the booking panel lives on those pages (the mobile estimate bar is switched off there) | broken Book buttons |
| Guide template "Explore" variant blocks (`seo-service-page.tsx`) | link "₹X · Learn More" to `/service/<variant>`, which for the PPF records means `/service/ppf-*` | these are internal links to canonicalised pages; harmless, but they should point at `/ppf` (a later code fix, not a redirect) |
| Google Business Profile | booking link to `booking.p91carcare.com/services/paint-protection-film-bangalore` | keep the booking-host 301; move the profile link (prepared separately) |
| Meta ads, Linktree, Instagram | `/ppf`, `/ceramic-coating/*`, the apex | unchanged |
| n8n workflows and WhatsApp templates in the project folders | searched: **no references** to `/service/*` URLs found | none |

**Conclusion: do not redirect any `/service/*` URL or any landing path.** If an overlap ever has to be resolved, canonical tags and content merging inside the surviving page are the safe tools. There is also one inactive slug that code still mentions, `/service/car-polishing`: it returns 404, which is correct for a retired record.

## 6. `lastmod` accuracy

How the dates are produced (`server/routes.ts`): blog dates are hard-coded; `/faq` is hard-coded `2026-11-19`; every `/service/*` date is the database `updatedAt`; the other 15 URLs carry no `lastmod` (deliberate, to avoid invented dates).

| URLs | Current | Evidence | Accurate? |
|---|---|---|---|
| 7 `/service/*` items | DB `updatedAt` (18 Sep to 7 Oct) | exactly equals the database value for all 7 (verified) | **Faithful to the database, not to the page.** The record's `updatedAt` also changes on admin saves that do not alter text, and it ignores later changes in code (17 Nov redesign, 20 Nov Phase 0 once deployed) |
| 8 blog posts | publish or `updated` field (30 Jul to 10 Sep, Oct) | `git blame`: every post was edited on **2026-11-17** (4 to 11 lines each, the plain-English copy pass); the longest, "best car detailing", also on 13 Oct | **Stale by 1 to 3.5 months** |
| `/blog` | 2026-10-07 | posts changed 17 Nov | stale |
| `/faq` | 2026-11-19 | `faq-page.ts` changed **2026-11-20** (6 FAQs added, title changed) | **stale by one day** |
| 15 URLs with none | omitted | guides, landing pages and two brand pages were rewritten on 17 Nov; home changed 20 Nov | omitting is allowed and safer than a wrong date; a real date would help the pages that changed most |

Recommended policy (the dates in the CSV follow it): publish `lastmod` only when text a reader sees changed materially; take it from a real signal, never from the deploy time of unrelated work; leave it out when the last edit was 3 lines or fewer. Proposed values for review: blog posts and the three landing pages and four guides `2026-11-17`, `/faq` and `/` `2026-11-20`, Nasiol `2026-09-24`, the seven service items keep the database date until Phase 0 ships, then use the later of that date and the deploy date of that page's content change. Omit for `/services`, `/products`, STEK, Premium PPF, `/gallery`, `/contact` (2 to 4 line edits). **A `lastmod` is only trusted by Google if it is accurate across the site, so setting every page to "today" is explicitly not recommended.** The Phase 0 branch will itself change page content, so its deploy date becomes the correct `lastmod` for the pages it touches.

Also: **`changefreq` and `priority` are ignored by Google.** The current values are not accurate (all landing pages "weekly", contact "yearly"). They are harmless; the cleaner file carries only `<loc>` and an accurate `<lastmod>`.

## 7. P91 India sitemap (not assumed to be perfect)

| Check | P91 India (14 URLs) | P91 Car Care (32 URLs) |
|---|---|---|
| URLs reachable, status | all 200 | all 200 |
| First HTML a crawler receives | **identical 4 KB shell, 8 words, no H1, no links, same title on all 14** | full text, unique title and H1 |
| Canonical | set by JavaScript only (absent in the raw HTML) | in the raw HTML |
| `lastmod` | **none** | 17 of 32 (mostly stale) |
| Unknown URL | **200 with the same shell** (`/zzz-nope`, `/privacy`, `/terms`, `/verify`) | 404 or 410 with `noindex` |
| Menu link to a missing page | **`/products/automotive-coating` is linked from all 14 pages and renders "404 Page Not Found" while the server answers 200** (a soft 404); not in the sitemap | none |
| Page types | product, programme, partner, store, warranty, FAQ, one guide, about, contact | service, guide, brand, article, hub |
| Thin pages included | `/warranty` (38 words), `/about` (107) | `/products` (14 raw words), `/contact` (82), `/gallery` (160) |
| `priority` / `changefreq` | present, ignored | present, ignored |

What this means: India's sitemap is short and every URL is a distinct purpose, which helps; but it hides real defects (empty first HTML, no `lastmod`, a menu link to a soft 404, thin pages), so a high indexed count there does not make its sitemap a template. Its one useful lesson for Car Care is purpose: one URL per question. Car Care already meets that apart from the interior and glass overlaps above. **Not verified:** which two URLs are India's 2 Soft 404s (no India Search Console access); the `/products/automotive-coating` menu link and the 200-for-unknown-URL behaviour are the likely causes, as a hypothesis.

## 8. Exact recommended final sitemap (32 URLs)

All 32 stay. Full table with the reason, status and recommended `lastmod` for each: `05-final-sitemap-urls.csv`.

| # | URL | Why it stays |
|---|---|---|
| 1 | `/` | brand and local entry; the only indexed page |
| 2 | `/services` | crawl hub to every service and guide |
| 3 | `/products` | brand hub |
| 4 | `/products/stek` | STEK product intent |
| 5 | `/products/nasiol` | Nasiol product intent |
| 6 | `/products/p91-premium-ppf` | own film line |
| 7 | `/services/ceramic-coating-bangalore` | ceramic explainer, 3 to 10 percent text overlap with the price page |
| 8 | `/services/paint-protection-film-bangalore` | PPF explainer, 1 percent overlap with `/ppf` |
| 9 | `/services/interior-detailing-bangalore` | interior explainer; review after crawl |
| 10 | `/services/glass-sun-control-film-bangalore` | film overview; 0 percent text overlap with the glass items |
| 11 | `/blog` | guides index |
| 12 to 19 | the eight `/blog/*` articles | each answers a different question; none shares text with another page |
| 20 | `/ceramic-coating/car` | price and booking, car |
| 21 | `/ceramic-coating/bike` | price and booking, bike |
| 22 | `/ppf` | price and booking, PPF |
| 23 | `/gallery` | the only photo and reel page |
| 24 | `/faq` | support hub |
| 25 | `/contact` | local entity page |
| 26 | `/service/annual-maintenance-package` | the only page that sells the package |
| 27 | `/service/exterior-detailing-hard-water-new` | bookable service |
| 28 | `/service/headlight-restoration-both` | bookable service |
| 29 | `/service/interior-detailing-service` | bookable interior service |
| 30 | `/service/premium-car-wash-special` | bookable wash; matches the largest real demand |
| 31 | `/service/windshield-glass-coating-new` | protect intent |
| 32 | `/service/windshield-glass-polishing` | repair intent |

**Reasons for no removals:** nothing in the sitemap is noindex, redirected, canonicalised elsewhere or duplicated in text; removing any page would drop a URL that is the only page for its intent. **Reasons for no additions:** every indexable, self-canonical page is already listed; the eight booking-record pages are canonicalised and must not be submitted; the noindex pages must stay out. **Possible future additions, each with its trigger:** `/about` when the studio supplies real facts; a paint-polishing page only if the studio confirms the service (queries for it exist, no page does); an image or video sitemap only if you want the 16 photos and 5 reel clips discoverable as media (optional, separate decision).

## 9. Not checked

- Backlinks and rankings of any URL (no data source connected).
- Whether Google's index differs from the URL Inspection API on the day (the API shows the stored state).
- India's Search Console and server logs.
- Page speed of each URL (covered in earlier reports).

## 10. Decisions for you

1. Approve **keep all 32 URLs, no redirects, no additions** as the sitemap decision.
2. Approve the `lastmod` policy and the proposed dates (or give different dates), and whether to drop `changefreq` and `priority`.
3. Interior: keep the guide and the item separate (recommended), or merge later if the data says so.
4. Glass guide: approve a future H1 and title that lead with "sun control film", or keep the current wording.
5. Change the "Learn More" links on the guides from `/service/ppf-*` to `/ppf` (a later code change).
6. Move the Google Business Profile booking link to the main domain (instructions already prepared).
