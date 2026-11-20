# P91 Car Care: content, SEO and structure audit, and implementation plan

Date: 20 November 2026. Branch `seo/content-structure-plan` (worktree `D:\p91-content`, from origin/main `95a2ead`). This branch holds documents only. No site code, database, DNS, sitemap, redirect or page text was changed. Nothing pushed or deployed. **No page copy is rewritten in this deliverable**: you asked for the audit and maps first, and to keep your approved wording unless you approve changes.

Supporting files (same folder):

| File | What it is |
|---|---|
| `01-url-content-audit.csv` | One row per URL, 41 columns (status, indexing, words, uniqueness, keyword placement, links, schema, mobile, issues, action, priority) |
| `02-keyword-map.csv` | Primary and secondary keyword, intent and cannibalisation risk per URL |
| `03a-internal-links-current.csv` | Every contextual (body) link on the live site today |
| `03b-internal-links-proposed.csv` | 196 proposed links (87 already exist, 109 to add) with anchor text and reason |
| `04-redirect-and-url-map.csv` | Every redirect, canonical duplicate and 410, with evidence |

## 0. Method and limits

Verified today (20 Nov 2026), read-only:
- Crawled 58 URLs (sitemap, noindex pages, canonical duplicates, redirects, 410s, probes): status, canonical, robots, title, description, headings, body words, JSON-LD, links, images.
- Search Console API: URL Inspection (73 URLs) and Search Analytics, 19 Aug to 17 Nov (1,194 impressions, 321 queries, 116 page URLs).
- Mobile rendering: 46 live pages at 390 and 360 px in real Chrome with device emulation.
- Competitors: 5 pages from the Bangalore search results (word counts, headings). P91 India: all 14 sitemap URLs, rendered.

Not available, so not claimed: backlink or ranking-position data for competitors (no paid SEO tool connected), P91 India Search Console, competitor traffic. Keyword volumes are not measured; priorities come from your own Search Console queries and the search results, and are labelled as such. "Body words" counts text inside `<main>` only, with header, menu and footer excluded.

## 1. What the data says (read this first)

**1.1 The site's real search demand is local service intent, not PPF terms.**
Of 1,194 impressions in 90 days, 438 are the brand ("p91 car care"). The non-brand 738 are mostly:

| Theme | Queries | Impressions | Clicks | Where Google showed us |
|---|---|---|---|---|
| "near me" (any service) | 118 | 388 | 2 | homepage and the booking subdomain |
| car wash / washing | 79 | 277 | 0 | **the booking-subdomain PPF guide**, which is the wrong page for a car wash query |
| detailing | 36 | 81 | 0 | homepage |
| PPF | 35 | 81 | 1 | homepage, `/ppf` (6 impressions at position 63) |
| polish, rubbing, scratch | 27 | 52 | 1 | homepage |
| interior cleaning | 16 | 54 | 1 | homepage |
| ceramic coating | 16 | 16 | 0 | n/a |
| wrap / wrapping | 12 | 42 | 0 | n/a (not a P91 service on the site) |
| window film | 7 | 20 | 0 | n/a |

Consequences: (a) the pages that match demand (`/service/premium-car-wash-special`, `/service/interior-detailing-service`, polishing, window film) are the thinnest on the site and have no impressions of their own; (b) 207 impressions went to `booking.p91carcare.com/services/paint-protection-film-bangalore` (plus about 50 tracking-parameter variants), so the signal for the PPF guide is on a host that now 301s to the apex; (c) the money pages `/ppf`, `/ceramic-coating/car` and `/ceramic-coating/bike` have almost no impressions yet because Google has either not crawled them or has not indexed them.

**1.2 Indexing state, 20 Nov (URL Inspection):** 1 indexed (`/`), 21 crawled but not indexed, 27 unknown to Google (includes noindex pages), 16 Soft 404 (spam, stale), 1 page with redirect. No technical blocker on any page. Details and the 16 URLs are in the earlier root-cause report.

**1.3 First-response HTML carries less text than the finished page.** Body words in the raw HTML versus after JavaScript: home 459 vs 1,180; `/services` 217 vs 765; `/products` 14 vs 211; `/ppf` 437 vs 699; `/gallery` 160 vs 284; `/contact` 82 vs 132; all seven `/service/*` pages gain 40 to 100% after rendering. Google renders JavaScript, so this is not a blocker, but hubs and money pages should ship their main text in the first response so crawling does not depend on a render queue. Hypothesis that this affects indexing speed: plausible, not proven.

**1.4 Competitor and P91 India benchmark (word counts of body text):**

| Page | Words | Observation |
|---|---|---|
| CarzSpa "PPF and ceramic coating in Bangalore" | 1,821 | table of contents, weather/Bangalore context, why PPF, maintenance, cost, why choose us, 6+ FAQ |
| CarzSpa "Ceramic coating price in India 2026" | 3,713 | 22 sections: price by city, factors, vs graphene, DIY vs professional, what to ask a studio |
| The Detailing Mafia, Koramangala outlet | 1,008 | one page per locality, every service as an H2 with the locality in the heading |
| Garware "PPF in Bangalore" | 4,277 | product-line page |
| Bike ceramic coating guide (bikeleague.in) | 576 | FAQ schema |
| **P91 `/ppf`** | 437 raw, 699 rendered | package table, no cost-factor or "what to ask" content |
| **P91 `/ceramic-coating/car`** | 955 | strongest P91 money page |
| **P91 India** (14 pages) | median ~410, range 38 to 2,087 | thin pages exist (warranty 38 words, about 107) and are still indexed; the 2,087-word `/ppfprogram` and 1,440-word buyer's guide are its content anchors |

What competitors cover that P91 does not: cost factors (why prices differ), what to ask a studio before booking, PPF coverage choices (front vs full), DIY vs professional, locality-specific service pages, and a table of contents on long pages. What P91 India shows: indexing there is not tied to word count; it holds many short, distinct-purpose pages (product, warranty, store, partners, FAQ) plus two long anchors. It does not guide car owners in Bangalore, so there is no content to reuse; it is a business reference only (products, programme, warranty terms), and nothing in this plan copies its text.

## 2. URL-by-URL content audit

Full data: `01-url-content-audit.csv`. Columns below: GSC status (20 Nov), body words, unique text (share of 5-word sequences found on no other page), whether the primary keyword is in the title and H1, how many different pages link to it from body text (menu and footer excluded), issues, action, priority. P1 = fix first. Priority follows your instruction: Search Console indexing problems first, then demand evidence from section 1.1.


### Home and hubs

| URL | GSC 20 Nov | Words in body | Unique | Primary keyword in title / H1 | Pages linking from body | Issues found | Action | Pri |
|---|---|---|---|---|---|---|---|---|
| `/` | indexed | 459 | 80% | T:no H1:yes | 1 | meta description long; fewer than 3 pages link to it from body text | keep | P1 |
| `/services` | unknown (discovered) | 217 | 55% | T:yes H1:no | 10 | thin body text (217 words in main) | expand with unique useful content (needs approved facts) | P1 |
| `/products` | crawled, not indexed | 14 | 100% | T:no H1:no | 7 | hub or utility with very little text (14 words in main); primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P3 |
| `/blog` | crawled, not indexed | 288 | 17% | T:no H1:no | 0 | thin body text (288 words in main); low unique text (17%); fewer than 3 pages link to it from body text; primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P3 |
| `/gallery` | crawled, not indexed | 160 | 45% | T:no H1:no | 3 | hub or utility with very little text (160 words in main); low unique text (45%); primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P2 |
| `/faq` | crawled, not indexed | 2183 | 98% | T:yes H1:no | 0 | fewer than 3 pages link to it from body text | keep | P2 |
| `/contact` | crawled, not indexed | 82 | 96% | T:no H1:no | 1 | hub or utility with very little text (82 words in main); fewer than 3 pages link to it from body text; primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P2 |

### Money pages (price and booking intent)

| URL | GSC 20 Nov | Words in body | Unique | Primary keyword in title / H1 | Pages linking from body | Issues found | Action | Pri |
|---|---|---|---|---|---|---|---|---|
| `/ceramic-coating/car` | crawled, not indexed | 955 | 26% | T:yes H1:no | 9 | low unique text (26%) | expand with unique useful content (needs approved facts); differentiate guide vs price page | P1 |
| `/ceramic-coating/bike` | crawled, not indexed | 622 | 83% | T:yes H1:no | 5 | none | keep | P1 |
| `/ppf` | crawled, not indexed | 437 | 64% | T:yes H1:no | 8 | none | expand with unique useful content (needs approved facts) | P1 |

### Guides (service explainers)

| URL | GSC 20 Nov | Words in body | Unique | Primary keyword in title / H1 | Pages linking from body | Issues found | Action | Pri |
|---|---|---|---|---|---|---|---|---|
| `/services/ceramic-coating-bangalore` | unknown (discovered) | 303 | 87% | T:yes H1:yes | 12 | none | expand with unique useful content (needs approved facts); differentiate guide vs price page | P1 |
| `/services/paint-protection-film-bangalore` | unknown (discovered) | 289 | 96% | T:yes H1:yes | 11 | thin body text (289 words in main) | expand with unique useful content (needs approved facts) | P1 |
| `/services/interior-detailing-bangalore` | unknown (discovered) | 245 | 95% | T:yes H1:yes | 7 | thin body text (245 words in main) | expand with unique useful content (needs approved facts) | P2 |
| `/services/glass-sun-control-film-bangalore` | unknown (discovered) | 303 | 92% | T:no H1:no | 8 | meta description short (105); primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P2 |

### Service items (catalogue pages)

| URL | GSC 20 Nov | Words in body | Unique | Primary keyword in title / H1 | Pages linking from body | Issues found | Action | Pri |
|---|---|---|---|---|---|---|---|---|
| `/service/annual-maintenance-package` | unknown (discovered) | 125 | 46% | T:no H1:no | 1 | meta description short (82); thin body text (125 words in main); low unique text (46%); fewer than 3 pages link to it from body text; primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P3 |
| `/service/exterior-detailing-hard-water-new` | unknown (discovered) | 177 | 65% | T:no H1:no | 5 | thin body text (177 words in main); primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P3 |
| `/service/headlight-restoration-both` | unknown (discovered) | 168 | 70% | T:no H1:no | 1 | meta description short (93); thin body text (168 words in main); fewer than 3 pages link to it from body text; primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P3 |
| `/service/interior-detailing-service` | unknown (discovered) | 171 | 58% | T:no H1:no | 2 | thin body text (171 words in main); fewer than 3 pages link to it from body text; primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P2 |
| `/service/premium-car-wash-special` | unknown (discovered) | 158 | 71% | T:yes H1:no | 1 | thin body text (158 words in main); fewer than 3 pages link to it from body text | expand with unique useful content (needs approved facts) | P2 |
| `/service/windshield-glass-coating-new` | unknown (discovered) | 334 | 77% | T:yes H1:no | 4 | none | expand with unique useful content (needs approved facts) | P3 |
| `/service/windshield-glass-polishing` | unknown (discovered) | 285 | 74% | T:yes H1:no | 2 | meta description short (91); thin body text (285 words in main); fewer than 3 pages link to it from body text | expand with unique useful content (needs approved facts) | P3 |

### Brand pages

| URL | GSC 20 Nov | Words in body | Unique | Primary keyword in title / H1 | Pages linking from body | Issues found | Action | Pri |
|---|---|---|---|---|---|---|---|---|
| `/products/stek` | crawled, not indexed | 172 | 81% | T:yes H1:no | 7 | thin body text (172 words in main) | expand with unique useful content (needs approved facts) | P2 |
| `/products/nasiol` | crawled, not indexed | 147 | 87% | T:yes H1:no | 7 | thin body text (147 words in main) | expand with unique useful content (needs approved facts) | P3 |
| `/products/p91-premium-ppf` | crawled, not indexed | 161 | 78% | T:yes H1:yes | 6 | meta description long; thin body text (161 words in main) | expand with unique useful content (needs approved facts) | P2 |

### Articles

| URL | GSC 20 Nov | Words in body | Unique | Primary keyword in title / H1 | Pages linking from body | Issues found | Action | Pri |
|---|---|---|---|---|---|---|---|---|
| `/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi` | crawled, not indexed | 585 | 92% | T:no H1:no | 2 | meta description long; fewer than 3 pages link to it from body text; primary keyword not in title or H1 | keep | P3 |
| `/blog/ppf-vs-ceramic-coating-bangalore` | crawled, not indexed | 563 | 95% | T:yes H1:yes | 5 | meta description short (98) | keep | P2 |
| `/blog/hard-water-spot-removal-bangalore` | crawled, not indexed | 346 | 89% | T:no H1:no | 5 | meta description short (93); primary keyword not in title or H1 | expand with unique useful content (needs approved facts) | P3 |
| `/blog/windshield-heat-rejection-film-summer` | crawled, not indexed | 339 | 90% | T:yes H1:yes | 4 | meta description short (99) | expand with unique useful content (needs approved facts) | P3 |
| `/blog/is-your-ppf-really-made-in-usa` | crawled, not indexed | 496 | 96% | T:no H1:no | 2 | fewer than 3 pages link to it from body text; primary keyword not in title or H1 | keep | P3 |
| `/blog/how-much-ppf-does-your-car-need` | crawled, not indexed | 496 | 94% | T:yes H1:no | 4 | title short (38); meta description short (99) | keep | P3 |
| `/blog/monsoon-damage-car-bangalore` | crawled, not indexed | 590 | 98% | T:no H1:no | 5 | title short (37); primary keyword not in title or H1 | keep | P3 |
| `/blog/best-car-detailing-in-bangalore` | crawled, not indexed | 1286 | 93% | T:yes H1:yes | 8 | none | keep | P2 |

### Canonical duplicates, noindex and legal pages

| URL | GSC 20 Nov | Words in body | Unique | Primary keyword in title / H1 | Pages linking from body | Issues found | Action | Pri |
|---|---|---|---|---|---|---|---|---|
| `/blog/category/glass-film` | crawled, not indexed | 42 | 31% | - | 0 | title short (34) | keep noindex, keep out of sitemap | - |
| `/blog/category/paint-care` | unknown (discovered) | 73 | 22% | - | 0 | title short (32) | keep noindex, keep out of sitemap | - |
| `/blog/category/protection` | unknown (discovered) | 193 | 13% | - | 0 | title short (32) | keep noindex, keep out of sitemap | - |
| `/privacy-policy` | unknown (discovered) | 2 | n/a | - | 0 | title short (29) | keep noindex, keep out of sitemap | - |
| `/terms-conditions` | unknown (discovered) | 3 | n/a | - | 0 | title short (33) | keep noindex, keep out of sitemap | - |
| `/refund-policy` | unknown (discovered) | 4 | n/a | - | 0 | title short (28) | keep noindex, keep out of sitemap | - |
| `/service/ppf-hatchback` | (not inspected) | 444 | 7% | - | 1 | none | keep as canonical duplicate (no redirect, no sitemap) | - |
| `/service/ppf-sedan` | unknown (discovered) | 444 | 7% | - | 1 | none | keep as canonical duplicate (no redirect, no sitemap) | - |
| `/service/ppf-suv` | (not inspected) | 446 | 8% | - | 1 | none | keep as canonical duplicate (no redirect, no sitemap) | - |
| `/service/ppf-premium-hatchback` | (not inspected) | 382 | 8% | - | 1 | none | keep as canonical duplicate (no redirect, no sitemap) | - |
| `/service/ppf-premium-sedan` | (not inspected) | 382 | 8% | - | 1 | none | keep as canonical duplicate (no redirect, no sitemap) | - |
| `/service/ppf-premium-suv` | (not inspected) | 382 | 8% | - | 1 | none | keep as canonical duplicate (no redirect, no sitemap) | - |
| `/service/1-year-ceramic-coating` | unknown (discovered) | 746 | 9% | - | 1 | none | keep as canonical duplicate (no redirect, no sitemap) | - |
| `/service/1-year-bike-ceramic-coating` | (not inspected) | 767 | 25% | - | 1 | none | keep as canonical duplicate (no redirect, no sitemap) | - |


**Site-wide findings from the same crawl**
- Titles: all unique, 28 to 62 characters. Only 2 indexable pages are under 40 characters (`/blog/how-much-ppf-does-your-car-need` 38, `/blog/monsoon-damage-car-bangalore` 37); the other 6 short ones are noindex category and legal pages.
- Meta descriptions: all unique. 8 indexable pages are under 110 characters: `/service/annual-maintenance-package` (82), `/service/windshield-glass-polishing` (91), `/service/headlight-restoration-both` (93), `/blog/hard-water-spot-removal-bangalore` (93), `/blog/ppf-vs-ceramic-coating-bangalore` (98), `/blog/windshield-heat-rejection-film-summer` (99), `/blog/how-much-ppf-does-your-car-need` (99), `/services/glass-sun-control-film-bangalore` (105). 3 are over 165 and will be truncated: `/` (178), `/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi` (177), `/products/p91-premium-ppf` (166).
- `og:title` and `og:image` present on every page. `<main>` landmark present on every page (the legal pages' `<main>` holds only the title in the first HTML).
- Sitemap: 32 URLs, all 200, all self-canonical, none noindex. Only 17 of 32 carry `lastmod`, and the dates are static (30 Jul to 19 Nov). This follows the existing rule not to invent dates; recommendation in section 6.
- Images: no image without alt text found in `<main>` on any page.
- Overlap: `/ceramic-coating/car` shares 67 to 85% of its text with the canonical duplicate `/service/1-year-ceramic-coating` (handled by canonical, not a problem to fix); `/blog` is 17% unique because its cards repeat article excerpts (expected for an index).
- Duplicate content between money pages and guides is now low (PPF guide vs `/ppf` 0%, ceramic guide vs car page 8%).

## 3. Keyword map

Full map: `02-keyword-map.csv` (32 URLs). Principles used: one primary keyword per URL; guides own informational queries and point to the money page that owns the price query; no two pages share a primary keyword.

| Cluster | Money page (price and booking) | Guide (explains and educates) | Supporting |
|---|---|---|---|
| PPF | `/ppf`: "PPF price Bangalore" | `/services/paint-protection-film-bangalore`: "paint protection film Bangalore" | brand `/products/stek`, `/products/p91-premium-ppf`; articles on sizing, origin, local area |
| Ceramic, car | `/ceramic-coating/car`: "car ceramic coating price Bangalore" | `/services/ceramic-coating-bangalore`: "ceramic coating Bangalore" | `/products/nasiol`; hard-water and monsoon articles |
| Ceramic, bike | `/ceramic-coating/bike`: "bike ceramic coating Bangalore" | the ceramic guide | `/products/nasiol` |
| Interior and wash | `/service/interior-detailing-service`: "car interior cleaning Bangalore"; `/service/premium-car-wash-special`: "premium car wash Bangalore" | `/services/interior-detailing-bangalore` | `/service/annual-maintenance-package` |
| Exterior | `/service/exterior-detailing-hard-water-new`: "hard water spot removal car Bangalore" | `/blog/hard-water-spot-removal-bangalore` | ceramic pages |
| Glass and film | `/service/windshield-glass-coating-new`, `/service/windshield-glass-polishing`, `/service/headlight-restoration-both` | `/services/glass-sun-control-film-bangalore`: "car window film Bangalore" | `/products/stek`, heat-rejection article |
| Local and brand | `/` : "car detailing Bangalore"; `/contact`: "car detailing Adugodi" | `/blog/best-car-detailing-in-bangalore` | local article for Koramangala, HSR Layout, Shanti Nagar |

**Primary keyword not in the title or the H1 today (needs your approval to change):** `/` (title), `/products` and its brand pages, `/blog`, `/gallery`, `/contact`. These need wording decisions, so none is changed here.

**Cannibalisation risks (same intent, two pages):** `/ppf` vs the PPF guide; `/ceramic-coating/car` vs the ceramic guide; interior guide vs `/service/interior-detailing-service`; glass guide vs `/service/windshield-glass-coating-new`; the pillar article vs the homepage for "car detailing Bangalore". Mitigation: keep the roles above, link guide to money page near the top, never repeat the same paragraph on both.

**Demand with no matching page (from Search Console):** car polishing and rubbing (27 queries, 52 impressions), car wash (277), window film (20), car wrapping (42), bike wash (6). Polishing appears in your gallery and old service data, but no active polishing service is listed on the site today. Wrapping is not on the site. **Do not create pages for services the studio has not confirmed.** Ask the studio (section 8, decision 5).

## 4. Internal linking map

Full detail: `03a` (today) and `03b` (proposed). Current state:
- 32 indexable pages. Every page is within 2 clicks of the homepage and none is orphaned for crawlers, because the menu and footer link to all of them.
- Contextual (body) links are weak. 11 indexable pages are linked from fewer than 3 other pages' body text: `/` (1), `/blog` (0), `/faq` (0), `/contact` (1), `/service/annual-maintenance-package` (1), `/service/headlight-restoration-both` (1), `/service/premium-car-wash-special` (1), `/service/interior-detailing-service` (2), `/service/windshield-glass-polishing` (2), the local PPF article (2), the "made in USA" article (2).
- Menu and footer carry every link, so no single page is marked as more important than another. The 3 money pages get no more internal weight than a category page.

**Proposed structure (cluster model).**
- Homepage links to the hubs and the three revenue pages in the first screens.
- `/services` is the crawl hub for every service and guide.
- Each guide links first to its money page, then to siblings, then to two articles.
- Each money and service page links up to its guide, across to siblings, and down to proof (`/gallery`) and `/contact`.
- Each article links to one money page, one guide and one sibling article.
- `/gallery` and `/contact` link back to every service group.

Counts: 196 links in 34 source pages; 87 already exist; **109 to add**. Anchor rules: descriptive text from the destination's own subject (for example "car PPF price in Bangalore"), never "click here" or "read more" alone, one link per destination per page, body text only, no more than 8 contextual links per page. The proposed anchors are new wording, so they need your approval; they are in column 3 of `03b`.

Existing generic anchors to improve: card links "Read more" on `/`, `/ppf`, `/ceramic-coating/car`; "Explore brand →", "Explore services →".

## 5. Redirect and URL plan

Full detail: `04-redirect-and-url-map.csv`. **Result: zero new 301 redirects recommended.**
- Keep all existing 301s: http to https, www and booking host to apex, trailing slash, `/index.html`, `/ppf-ceramic-coating` to `/services`, `/service/glass-polishing` to its consolidated page.
- Do not redirect the nine `/service/ppf-*` and `/service/1-year-*` pages. They are live booking records that already canonicalise to `/ppf` and the ceramic pages; a redirect would break package booking links.
- Keep 410 for the 16 spam URLs, the spam pattern, `/le48` and the ended offer page.
- Do not create `/detailing` or `/guides`. They would duplicate `/services/*` and `/blog`. Create `/about` only when the studio supplies real facts.
- Owner action: change the Google Business Profile booking link to `https://p91carcare.com/...`; the booking subdomain currently holds the PPF guide's impressions.

## 6. Technical SEO checks, every page

| Check | Result (20 Nov) | Action |
|---|---|---|
| Canonical | Self-referencing and absolute on all 32 indexable pages; 9 duplicates point to the right target; query-string variants resolve to the apex | none |
| Robots meta and headers | `index,follow` on all sitemap pages; `noindex,follow` on categories and legal pages; `X-Robots-Tag: noindex` on `/sitemap.xml`, API and 410s | none |
| Sitemap | 32 URLs, 0 errors in Search Console, all 200. 17 of 32 have `lastmod`; dates static | Add real `lastmod` when a page's content changes (in `server/routes.ts`); do not guess dates |
| robots.txt | Allows all but admin and booking confirmation; API crawlable on purpose; sitemap declared | none |
| Titles and descriptions | Unique everywhere. 2 indexable titles under 40 chars; 8 descriptions under 110 chars; 3 over 165 chars (list in section 2) | Rewrites need your approval |
| Headings | One H1 on every page; H2s present on all indexable pages | none |
| Structured data | Valid JSON-LD on all pages (0 parse errors). Types: AutoRepair on home, contact and service pages; BlogPosting on articles; BreadcrumbList; FAQPage on guides, money pages, FAQ and home | Money pages have no `Service` or `Product` type; add `Service` with the live price only if you approve. Note: Google shows FAQ rich results for very few sites, so FAQPage mostly helps understanding, not display |
| JS-dependent text | See 1.3: hub and money pages gain 40 to 200% words after rendering | Ship main copy in the first HTML (`lib/crawlable-content.ts`, `server/vite.ts`) |
| Legal pages | Raw HTML main text is 2 to 4 words (privacy, terms, refunds) | Ship the legal text in the first HTML; low priority (noindex) |
| Mobile rendering | 46 pages at 390 and 360 px: no horizontal overflow, no broken images, no console errors, viewport meta everywhere, 16 px base font. Up to 15 small tap targets on a page, average 2 | Review small targets in the redesign |
| Speed | Server response 325 to 970 ms (average 420), HTML never edge-cached | Cloudflare HTML caching is the biggest LCP lever; needs your approval |
| Image SEO | No missing alt text | Several photos on `/ppf` carry a package name as alt text for every image, including other cars: correct captions need the studio's facts |

## 7. Content plan (briefs, not copy)

Rule for every page: keep approved wording; add only sections that answer real questions; each new fact must come from the catalogue, the studio, or the manufacturer. "Facts needed" means I cannot write it without the studio. Draft copy is produced page by page after you approve the brief.

| Page | Add (section, with the real question it answers) | Facts source |
|---|---|---|
| `/ppf` (P1) | "Why prices differ" (film grade, body size, coverage); "Which coverage do I need" linking to the sizing article; "What to ask any studio before booking"; local "PPF near Koramangala, HSR Layout, Shanti Nagar" paragraph | Catalogue (done), manufacturer film data for Basic and Premium (**facts needed**), existing articles |
| `/ceramic-coating/car` (P1) | "Ceramic coating vs PPF in one table"; "What paint correction includes and why it adds time"; aftercare | Existing process and FAQ text; time at studio (**conflict: 24 h vs 36 to 48+ h, needs decision**) |
| `/ceramic-coating/bike` (P1) | Bike-specific process, tank and fairing notes, which bikes, price | **Facts needed**: bike service confirmation (open question from earlier) |
| Guides `/services/*` (P1, never crawled) | Move the "money page" link above the fold; add a short table of contents; add "what to ask before booking" | Existing guide copy plus verified general knowledge, labelled as such |
| `/service/premium-car-wash-special`, `/interior-detailing-service` (P2, match 277 and 54 impressions) | Stages in order, what is and is not covered, duration, who it suits, one real photo | **Facts needed** (questions already in `STUDIO-INFORMATION-REQUEST.md`; price conflicts must be settled first) |
| `/service/exterior-detailing-hard-water-new`, `headlight`, `windshield-*`, `annual-maintenance` (P2/P3) | Same stage-by-stage structure | **Facts needed** |
| `/gallery` (P2) | Caption per photo: car, service, product; link each group to its service page | Approved existing captions cover 16 photos; the rest **need facts** |
| `/contact` (P2) | Directions and landmarks, parking, nearby areas, what to bring | Address and hours exist; landmarks **facts needed** |
| `/products*` (P2/P3) | Specification table and warranty wording per brand; link to packages using it | Manufacturer facts (**facts needed**) |
| Articles (P3) | Add a table of contents, FAQs and links per section 4; titles under 40 chars: widen with the keyword | Existing text |
| New: "How much does X cost in Bangalore" cost-factors explainer (P3) | One article covering cost factors for PPF and ceramic, with live prices pulled from the catalogue, no invented ranges | Catalogue + your approval |
| `/about`, team, equipment (P3) | Studio story, equipment, team | **Entirely studio-supplied** |

**Using P91 India as a reference.** Allowed: product names, the written-warranty positioning P91 already uses, and structure ideas (a buyer's guide and a FAQ). Not allowed: copying paragraphs. P91 India's PPF specification text (self-healing and similar claims) must not be reused on Car Care until the film fitted is confirmed, per the existing withheld-claims rule.

## 8. Implementation plan

Each phase is its own branch from origin/main, gets unit tests and a staging run (`D:\p91-staging`), and waits for your approval before any push or deploy.

| Phase | Branch | Scope | Likely files | Needs approval |
|---|---|---|---|---|
| 0, technical, no copy change | `seo/p0-technical` | Main copy in first HTML for `/`, `/services`, `/products`, `/ppf`, `/gallery`, `/contact`; legal text in first HTML; real `lastmod` mechanism; small tap targets | `client/src/lib/crawlable-content.ts`, `server/vite.ts`, `scripts/prerender.mjs`, `server/routes.ts` | Low (no wording change) |
| 1, internal links | `seo/p1-internal-links` | 109 contextual links with approved anchors, replace generic "Read more" anchors | `client/src/lib/service-related-links.ts`, `seo-pages.ts`, `landing-pages.ts`, `blog-posts.ts`, `pages/*.tsx` | Anchor wording |
| 2, P1 page content | `seo/p2-money-and-guides` | Briefs for `/ppf`, ceramic car and bike, four guides, approved sections only | `landing-pages.ts`, `seo-pages.ts`, catalogue scripts for DB text | Every new paragraph, and DB text changes |
| 3, service pages | `seo/p3-service-pages` | Stage-by-stage content for `/service/*` | same plus catalogue | Studio answers |
| 4, metadata | with phases 1 to 3 | Titles under 40 chars and descriptions under 110 or over 165 rewritten | `seo-pages.ts`, `landing-pages.ts`, `blog-posts.ts`, catalogue meta fields | Each new title or description |
| 5, design rollout | `design/premium-redesign` | Approved templates on all pages, one shared header and footer | `client/src/components/*`, `styles/*` | Visual approval |
| 6, monitoring | n/a | After deploy: Search Console URL Inspection weekly (script exists), request indexing for 3 to 5 URLs at a time, watch genuine Googlebot hits in Cloudflare | `scripts/seo-monitor.mjs` | none |

**Order of work (Search Console first):** P1 set = `/`, `/ppf`, `/ceramic-coating/car`, `/ceramic-coating/bike`, the PPF and ceramic guides, `/services`. P2 set = `/gallery`, `/contact`, interior, car-wash and glass pages, `/faq`, `/blog/best-car-detailing-in-bangalore`, `/blog/ppf-vs-ceramic-coating-bangalore`, `/products/stek`, `/products/p91-premium-ppf`. P3 and P4 follow. Rule from the earlier investigations still applies: do not resubmit the sitemap repeatedly and do not request indexing for everything at once.

**Success measures** (check weekly in Search Console): number of indexed pages (1 today), impressions for non-brand queries (738 in 90 days), impressions and position for the three money pages, impressions landing on the apex instead of the booking host.

## 9. Decisions I need from you

1. Approve the keyword map (`02`), or tell me which primary keywords to change.
2. Approve the link plan (`03b`) and its anchor wording, in whole or by cluster.
3. Approve "zero new redirects" and the three "do not create" decisions (`04`).
4. Ceramic claims ("9H", "100% safe", "permanent bond", "certified technicians") and the time at studio (24 h vs 36 to 48+ h): keep, change or withhold.
5. Which services does the studio actually offer today: polishing, car wash, wrapping, bike wash? Matching pages are created only for confirmed services.
6. Answers to `STUDIO-INFORMATION-REQUEST.md`, and the price conflicts (wash, glass coating, glass polishing).
7. Approve phase 0 (technical, no wording change) to start first.
8. Change the Google Business Profile booking link to the apex domain.
