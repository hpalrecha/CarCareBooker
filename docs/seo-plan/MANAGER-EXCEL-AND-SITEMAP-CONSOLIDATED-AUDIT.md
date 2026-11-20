# Manager Excel audit and sitemap audit: consolidated findings and fixes

Date: 20 November 2026. Branch `seo/manager-audit-fixes` (worktree `D:\p91-fixes`, head `5f5f886`, built on the Phase 0 branch `seo/phase0-links-claims`). **Not pushed, not deployed. No production DNS, database, sitemap, redirect or Cloudflare setting was changed.** Findings are verified against the live site; fixes are verified on a local staging build.

Sources: `p91carcare.com_mega_export_20261120.xlsx` (50 crawled URLs, 102 issue columns, exported 20 Nov 16:05), the sitemap audit (`SITEMAP-AUDIT-AND-FINAL-URL-LIST.md`), a fresh crawl of 58 URLs, Search Console (URL Inspection and sitemap report), the schema.org vocabulary file, `git` history of origin/main, and headless-browser renders.

## 0. What I could not see

- The Excel file only holds a 0/1 flag per URL and issue. It does **not** contain the text of the structured-data error, the word-count threshold, or the crawl date. Where a finding depends on that text, I say so.
- One check was declined by the tool permission layer: testing Facebook and Instagram with a spoofed Semrush user-agent. I did not retry it. The Facebook result below rests on a normal browser render and plain requests.

## 1. Reconciling the two reports

| Topic | Sitemap audit (earlier today) | Manager Excel | Reconciled |
|---|---|---|---|
| Pages wrongly in the sitemap | none | "Incorrect pages found in sitemap.xml": 0 | **Agree.** Both clean |
| Duplicate title, description, content | none | 0 | Agree |
| Structured data | "JSON-LD parses, valid types" (I checked JSON validity and type names only) | 8 blog posts flagged | **My earlier statement was too weak.** Now checked property by property (section 4.3) |
| Low word count | I listed 16 thin pages | 10 flagged | Excel's counting method is unknown: it flags annual-maintenance (125 words in main) but not headlight (168) or car wash (158), so it is not a simple threshold on my numbers. Both lists agree on the pages that matter (section 4.5) |
| Headlight, one internal link | 1 body-linking page | flagged | **Agree.** Fixed now |
| Contact page | 82 raw words, 1 body link | broken internal and external link | **New**: my link-graph run saw a `/cdn-cgi/l/email-protection` link vanish but I did not test it. Now explained (section 4.6) |
| Cloudflare email-protection 4xx | not examined | flagged | **New**, verified 404 |
| www HSTS | I confirmed www 301s to the apex but did not read headers | flagged | **New**, verified (section 4.8) |
| `lastmod` | 17 of 32 present, mostly stale | not covered | My earlier proposal said "omit" for `/services` and `/products`; the git evidence supports a real date, so I corrected it (section 4.4) |
| `/faq` | in sitemap, crawled 19 Nov | **not in the crawl** (50 URLs, published 19 Nov, probably after the crawl started) | Not an error. Re-crawl after deploy |
| Pages the Excel found outside the sitemap | not enumerated against the Excel | `/service/ppf-*` (6), `/service/1-year-*` (2), legal (3), category (3), `llms.txt`, `robots.txt`, `sitemap.xml`, the email URL, the www host | All explained in section 4.2 |

## 2. Confirmed errors, warnings and recommendations

### Confirmed errors (reproduced, with a cause)
1. **`/cdn-cgi/l/email-protection` answers 404** and `/contact` links to it. Cause: Cloudflare rewrites the studio email in the server HTML into that URL. *Fixed in code (staging-verified for the markup; the Cloudflare effect can only be confirmed after deploy).*
2. **`/contact` broken external link:** the Facebook profile link (`profile.php?id=61563060751882`) answers 301 and then **400** to browser-like clients, so crawlers report it broken. The page exists (a browser render shows "P91 Car Care | Facebook"). *Fixed: link now points at the canonical people URL, which answers 200 directly.*
3. **`/service/headlight-restoration-both` had one body link.** *Fixed: 4 pages link to it.*
4. **Blog structured data flagged on 8 posts.** I could not reproduce an invalid property (section 4.3). I did find two genuine gaps and fixed them.
5. **www host has no HSTS header** (the www redirect is served by nginx on the origin, not Cloudflare). Verified. *Not changed (needs a server or DNS change).*

### Warnings (real, no action required or action needs input)
- 10 low-word-count URLs: 2 are noindex categories, 3 are noindex legal pages, `/services` and `/products` are fixed by Phase 0, `/contact`, `/gallery` and the annual-maintenance page need studio facts (section 4.5).

### Recommendations (not errors)
- Legal pages should ship their text in the first HTML; ship the Phase 0 branch; re-crawl; keep `changefreq` and `priority` out of the sitemap (ignored by Google).

## 3. URL-by-URL findings (all 50 crawled URLs)

HTTP, canonical and robots are from a fresh live crawl on 20 Nov, not from the Excel.

| # | URL | HTTP (live) | In sitemap | Canonical / robots | Excel flag | Verdict |
|---|---|---|---|---|---|---|
| 1 | `/` | 200 | yes | self / index,follow | none | Pass |
| 2 | `/blog` | 200 | yes | self / index,follow | none | Pass |
| 3 | `/blog/best-car-detailing-in-bangalore` | 200 | yes | self / index,follow | structured data | CONFIRMED FLAG, not a vocabulary error. JSON-LD valid; added image and real dateModified (fixed on branch) |
| 4 | `/blog/category/glass-film` | 200 | no | self / noindex,follow | low word count | Warning only: noindex page, no action |
| 5 | `/blog/category/paint-care` | 200 | no | self / noindex,follow | low word count | Warning only: noindex page, no action |
| 6 | `/blog/category/protection` | 200 | no | self / noindex,follow | none | Pass (noindex by design) |
| 7 | `/blog/hard-water-spot-removal-bangalore` | 200 | yes | self / index,follow | structured data | same as above (fixed) |
| 8 | `/blog/how-much-ppf-does-your-car-need` | 200 | yes | self / index,follow | structured data | same as above (fixed) |
| 9 | `/blog/is-your-ppf-really-made-in-usa` | 200 | yes | self / index,follow | structured data | same as above (fixed) |
| 10 | `/blog/monsoon-damage-car-bangalore` | 200 | yes | self / index,follow | structured data | same as above (fixed) |
| 11 | `/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi` | 200 | yes | self / index,follow | structured data | same as above (fixed) |
| 12 | `/blog/ppf-vs-ceramic-coating-bangalore` | 200 | yes | self / index,follow | structured data | same as above (fixed) |
| 13 | `/blog/windshield-heat-rejection-film-summer` | 200 | yes | self / index,follow | structured data | same as above (fixed) |
| 14 | `/cdn-cgi/l/email-protection` | - | no | - | 4xx | CONFIRMED 404. Cause: Cloudflare rewrites the email on /contact. Fixed at source with an email_off fence; verify after deploy |
| 15 | `/ceramic-coating/bike` | 200 | yes | self / index,follow | none | Pass |
| 16 | `/ceramic-coating/car` | 200 | yes | self / index,follow | none | Pass |
| 17 | `/contact` | 200 | yes | self / index,follow | broken internal link, broken external link, low word count | CONFIRMED: internal = Cloudflare email link (404); external = Facebook link (400 to bots). Fixed. Low word count: recommendation, needs studio facts |
| 18 | `/gallery` | 200 | yes | self / index,follow | low word count | Warning: low text. Recommendation needs studio facts (captions) |
| 19 | `/llms.txt` | 200 | no | - / text/plain | none | Pass (200 text, not a page) |
| 20 | `/ppf` | 200 | yes | self / index,follow | none | Pass |
| 21 | `/privacy-policy` | 200 | no | self / noindex,follow | low word count | Warning: noindex; the legal text is not in the first HTML. Recommendation |
| 22 | `/products` | 200 | yes | self / index,follow | low word count | Warning: raw HTML has 14 words. Fixed by Phase 0 (first HTML now carries the page text) |
| 23 | `/products/nasiol` | 200 | yes | self / index,follow | none | Pass |
| 24 | `/products/p91-premium-ppf` | 200 | yes | self / index,follow | none | Pass |
| 25 | `/products/stek` | 200 | yes | self / index,follow | none | Pass |
| 26 | `/refund-policy` | 200 | no | self / noindex,follow | low word count | Warning: noindex; same |
| 27 | `/robots.txt` | 200 | no | - / text/plain | none | Pass |
| 28 | `/service/1-year-bike-ceramic-coating` | 200 | no | -> /ceramic-coating/bike / index,follow | none | Pass: booking record, canonical to /ceramic-coating/bike |
| 29 | `/service/1-year-ceramic-coating` | 200 | no | -> /ceramic-coating/car / index,follow | none | Pass: booking record, canonical to /ceramic-coating/car |
| 30 | `/service/annual-maintenance-package` | 200 | yes | self / index,follow | low word count | Warning: 125 words raw. Needs studio facts (schedule, price status) |
| 31 | `/service/exterior-detailing-hard-water-new` | 200 | yes | self / index,follow | none | Pass |
| 32 | `/service/headlight-restoration-both` | 200 | yes | self / index,follow | one incoming link | CONFIRMED: 1 incoming body link. Fixed (now 4 pages link to it) |
| 33 | `/service/interior-detailing-service` | 200 | yes | self / index,follow | none | Pass |
| 34 | `/service/ppf-hatchback` | 200 | no | -> /ppf / index,follow | none | Pass: booking record, canonical to /ppf, outside sitemap by design |
| 35 | `/service/ppf-premium-hatchback` | 200 | no | -> /ppf / index,follow | none | same |
| 36 | `/service/ppf-premium-sedan` | 200 | no | -> /ppf / index,follow | none | same |
| 37 | `/service/ppf-premium-suv` | 200 | no | -> /ppf / index,follow | none | same |
| 38 | `/service/ppf-sedan` | 200 | no | -> /ppf / index,follow | none | same |
| 39 | `/service/ppf-suv` | 200 | no | -> /ppf / index,follow | none | same |
| 40 | `/service/premium-car-wash-special` | 200 | yes | self / index,follow | none | Pass |
| 41 | `/service/windshield-glass-coating-new` | 200 | yes | self / index,follow | none | Pass |
| 42 | `/service/windshield-glass-polishing` | 200 | yes | self / index,follow | none | Pass |
| 43 | `/services` | 200 | yes | self / index,follow | low word count | Warning: raw HTML 217 words, 765 on screen. Fixed by Phase 0 |
| 44 | `/services/ceramic-coating-bangalore` | 200 | yes | self / index,follow | none | Pass |
| 45 | `/services/glass-sun-control-film-bangalore` | 200 | yes | self / index,follow | none | Pass |
| 46 | `/services/interior-detailing-bangalore` | 200 | yes | self / index,follow | none | Pass |
| 47 | `/services/paint-protection-film-bangalore` | 200 | yes | self / index,follow | none | Pass |
| 48 | `/sitemap.xml` | 200 | no | - / application/xml | none | Pass (noindex header by design) |
| 49 | `/terms-conditions` | 200 | no | self / noindex,follow | low word count | Warning: noindex; same |
| 50 | `https://www.p91carcare.com/` | 301 (nginx) | n/a | redirect to apex | no HSTS | CONFIRMED: no HSTS header on the www redirect (nginx origin, not Cloudflare). Not changed; fix is a server setting, see section 5 |


## 4. The ten requested checks

### 4.1 All 32 sitemap URLs: HTTP, canonical, robots, indexability

Live (20 Nov) and staging (this branch): **32 of 32 return 200, self-canonical, `index,follow`, no `X-Robots-Tag`.** Search Console reports the sitemap as read on 20 Nov 05:40 UTC: 32 submitted, 0 errors, 0 warnings. Google's index status for these 32 (URL Inspection, 20 Nov): 1 indexed (`/`), 19 crawled but not indexed, 12 unknown (never crawled). The full per-URL list is in section 7.

### 4.2 URLs found outside the sitemap

| URL | Status | Canonical / robots | Decision | Reason |
|---|---|---|---|---|
| `/service/ppf-hatchback`, `-sedan`, `-suv`, `-premium-hatchback`, `-premium-sedan`, `-premium-suv` | 200 | canonical `/ppf` | **exclude** | booking records; duplicates by design; redirecting would break the chatbot and booking links |
| `/service/1-year-ceramic-coating`, `/service/1-year-bike-ceramic-coating` | 200 | canonical to the two ceramic price pages | **exclude** | same |
| `/blog/category/glass-film`, `/paint-care`, `/protection` | 200 | `noindex,follow` | **exclude** | thin listings, deliberate |
| `/privacy-policy`, `/terms-conditions`, `/refund-policy` | 200 | `noindex,follow` | **exclude** | legal pages are not meant to rank |
| `/llms.txt`, `/robots.txt`, `/sitemap.xml` | 200 | not HTML pages (the sitemap carries `X-Robots-Tag: noindex`) | **exclude** | files, not pages |
| `/cdn-cgi/l/email-protection` | 404 | none | **exclude; remove the link to it** | Cloudflare placeholder, never a page |
| `https://www.p91carcare.com/` | 301 to the apex (nginx) | n/a | **exclude** | a redirect host |

### 4.3 The eight blog structured-data flags, one by one

Method: parsed every JSON-LD block of each post (2 blocks: `BlogPosting`, `BreadcrumbList`) and checked each property against the **schema.org vocabulary** (property exists, is defined for the type, value type is in range, dates are valid) and against Google's Article guidance.

| Post | Invalid schema.org properties | Missing for Google Article guidance (before) | `dateModified` before | After the fix |
|---|---|---|---|---|
| best-car-detailing-in-bangalore | **none** | `image` | 2026-10-07 (= published) | image added; dateModified 2026-11-17 |
| hard-water-spot-removal-bangalore | none | `image` | 2026-08-12 | image added; 2026-11-17 |
| how-much-ppf-does-your-car-need | none | `image` | 2026-09-05 | image added; 2026-11-17 |
| is-your-ppf-really-made-in-usa | none | `image` | 2026-09-08 | image added; 2026-11-17 |
| monsoon-damage-car-bangalore | none | `image` | 2026-09-02 | image added; 2026-11-17 |
| ppf-koramangala-hsr-layout-shanti-nagar-adugodi | none | `image` | 2026-10-05 | image added; 2026-11-17 |
| ppf-vs-ceramic-coating-bangalore | none | `image` | 2026-09-10 | image added; 2026-11-17 |
| windshield-heat-rejection-film-summer | none | `image` | 2026-07-30 | image added; 2026-11-17 |

Findings:
- **No post contains an invalid schema.org property.** The earlier fixes (publisher as `Organization` with a logo, separate `@id` for page and article, encoded logo URL, commit `b8d30f5`, 11 Nov) are live and correct.
- **Genuine gap:** the JSON-LD in the **first HTML** had no `image`, while the rendered page sets one after JavaScript loads (verified in a browser render: `https://p91carcare.com/attached_assets/blog/<slug>.jpg`). Google lists `image` as recommended for articles, and a validator that reads the raw HTML sees it missing. **Fixed:** the prerenderer now emits the same absolute image (all 8 image files return 200 and `image/jpeg`).
- **Genuine inaccuracy:** `dateModified` equalled the publish date on 7 posts although all 8 were edited on 17 Nov (copy pass; `git` shows self-healing and warranty sentences removed or reworded, 4 to 11 lines per post). **Fixed** by setting `updated: "2026-11-17"`, the same date as the sitemap (the field is used only in the schema).
- **Not provable:** that these two changes clear Semrush's flag. The Excel does not say which property it objects to. If the flag remains after deploy and a re-crawl, ask the manager for the issue detail (Semrush, Site Audit, Issues, "Structured data that contains markup errors", the details link shows the property). I did not invent changes beyond the two genuine gaps.

### 4.4 `lastmod` corrected from material change dates

Rule: a date is the last material change to the text a reader sees, with the commit; trivial edits get no date; no date is "today" unless the change was today (two are: the homepage and `/faq`, both genuinely changed on 20 Nov). The dates now live in `client/src/lib/sitemap-dates.ts` with the evidence in its header comment, and a test blocks a shared or future date.

| URL | Before | After | Evidence |
|---|---|---|---|
| `/` | none | 2026-11-20 | `57b00d7`, `6aa74de`: homepage H1, title, description, FAQ |
| `/services`, `/products` | none | 2026-11-18 | `af30871`: How it works and Visit sections added |
| four guides `/services/*` | none | 2026-11-18 | `af30871`, `3e105af` |
| `/products/nasiol` | none | 2026-09-24 | 30 lines, last material change |
| `/products/stek`, `/products/p91-premium-ppf`, `/gallery`, `/contact` | none | **none** | only 2 to 3 lines changed on 17 Nov; not material |
| `/blog` and the 8 posts | 2026-07-30 to 2026-10-07 | 2026-11-17 | `42e8fe9` plain-English copy pass touched every post |
| `/ceramic-coating/car` | none | 2026-11-17 | `42e8fe9` |
| `/ceramic-coating/bike`, `/ppf` | none | 2026-11-18 | `e9593af`: own FAQ, package-neutral FAQs |
| `/faq` | 2026-11-19 | 2026-11-20 | `6aa74de` added six FAQs |
| 7 `/service/*` items | database `updatedAt` (18 Sep to 7 Oct) | later of that and 2026-11-18 | the page is the row plus the template, and `af30871` changed the template |

**Caveat:** the Phase 0 branch and this branch will themselves change page text (claims hidden, sections in the first HTML, links). When they deploy, the pages they touch need the deploy date added to `sitemap-dates.ts` (the header comment says how). I did not guess a deploy date.

### 4.5 The ten low-word-count URLs

Words are in the main content of the first HTML, versus the finished page on screen.

| URL | First HTML | On screen | Indexable | Cause | Recommendation (no filler) |
|---|---|---|---|---|---|
| `/blog/category/glass-film` | 42 | 130 | noindex | thin listing | none. A noindex listing does not need words |
| `/blog/category/paint-care` | 73 | 166 | noindex | same | none |
| `/privacy-policy` | 2 | 515 | noindex | legal text is added by JavaScript | put the existing legal text in the first HTML (move it to a shared data module, as done for the studio sections). Low priority, but crawlers and payment reviewers read raw HTML |
| `/terms-conditions` | 3 | 420 | noindex | same | same |
| `/refund-policy` | 4 | 491 | noindex | same | same |
| `/products` | 14 | 211 | yes | brand rows added by JavaScript | **fixed by Phase 0** (first HTML now has the brand rows, the "Which one do you need?" list and the help line) |
| `/services` | 217 | 765 | yes | service descriptions and sections added by JavaScript | **fixed by Phase 0** |
| `/contact` | 82 | 132 | yes | a utility page: address, phone, hours | reuse the approved "How it works" block (about 65 real words, no new copy); add directions from a landmark, parking and nearest road once the studio gives them |
| `/gallery` | 160 | 284 | yes | image page | captions are in the first HTML after Phase 0; per-photo vehicle, service and date need the studio |
| `/service/annual-maintenance-package` | 125 | 256 | yes | thin record text | the schedule of the 6 + 2 + 1 visits, whether pickup is included, and whether the price is permanent: **needs studio answers; the DB meta also still says ₹18,000** |

None of these pages should be removed or merged because of its word count.

### 4.6 Contact page broken links

Cause and fix, both verified:
- **Broken internal link:** `href="/cdn-cgi/l/email-protection#…"`. Cloudflare's email obfuscation replaced `info@p91carcare.com` on `/contact`. The path answers 404 to a crawler. Fix: the address is fenced with Cloudflare's `<!--email_off-->` markers in the server HTML (`crawlable-content.ts`). The studio's React page text is unaffected. `/contact` is the only page in the sitemap with this marker (checked 17 pages).
- **Broken external link:** the Facebook link. Fix: `FACEBOOK_PROFILE_URL` now uses `https://www.facebook.com/people/P91-Car-Care/61563060751882/` (200 direct; the old URL 301s). It feeds the footer and the business `sameAs` list, so both are consistent. The other contact-page links (WhatsApp, two Google Maps links, Instagram) all return 200.

### 4.7 Headlight restoration internal links

`/service/headlight-restoration-both` is now linked from the body of 4 pages: `/services`, `/service/exterior-detailing-hard-water-new`, `/service/windshield-glass-coating-new` and `/service/windshield-glass-polishing`, using the existing "Related services" block and the label "Headlight restoration". (Before: 1.) The menu and footer link it everywhere as well.

### 4.8 Cloudflare email-protection 4xx and HSTS, verified before any change

- **Email protection:** `GET /cdn-cgi/l/email-protection` returns **404** (with and without a hash). Only `/contact` carries a link to it. The code fix is staged. **To confirm after deploy:** `curl -s https://p91carcare.com/contact | grep -c email-protection` should print 0. If Cloudflare still rewrites, the alternatives need approval because they change a Cloudflare setting: switch off Email Address Obfuscation for the zone, or add `Disallow: /cdn-cgi/` to robots.txt. I changed neither.
- **HSTS:** the apex sends `strict-transport-security: max-age=15552000` (180 days, from Cloudflare). `https://www.p91carcare.com/` and `http://www.p91carcare.com/` are answered **by nginx 1.24 on the origin host** (`Server: nginx/1.24.0 (Ubuntu)`), a 301 to the apex with **no HSTS header**. So the www name is not proxied by Cloudflare. Options, both outside the repository: (1) add `add_header Strict-Transport-Security "max-age=15552000" always;` to the www server block (no SSH access from here); (2) proxy the www record through Cloudflare (a DNS change). Severity is low: the response is only a redirect, and I would not add `includeSubDomains` or `preload` without checking the `booking.` and mail hostnames. **No change made.**

### 4.9 What was preserved (staging, 40 URLs plus behaviour probes)

- **Booking:** no booking, payment, slot or catalogue file changed. The 471 integration tests give the same 427 pass and 44 fail as the earlier baseline, and the failing test names are identical. The 8 booking-record pages answer 200 with their canonicals unchanged.
- **Canonicals:** all 32 self-canonical; the 8 duplicates still point to `/ppf`, `/ceramic-coating/car` and `/ceramic-coating/bike`.
- **410s:** `/le48`, `/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/`, `/Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884439` and `/offer/de-dhana-dhan` all still return 410 with `noindex`; the 16-URL test is unchanged.
- **Redirects:** `/ppf-ceramic-coating` 301 to `/services`, `/service/glass-polishing` 301, `/index.html` 301, `/ppf/` 301; unknown paths 404 with `noindex`.
- **Prices, warranties, claims, approved wording, designs:** untouched. (The Phase 0 claim filter from the earlier branch is included in this branch's base and still passes.)

### 4.10 Sitemap rechecked after implementation (staging build)

32 URLs, identical to the recommended final list, 0 unexpected, 0 missing, 0 failing the status, canonical and robots check. 28 carry a `lastmod`, 4 carry none by design. Exact list in section 7.

## 5. What changed on the branch

| Commit | Change |
|---|---|
| `5f5f886` | `client/src/lib/sitemap-dates.ts` (new, evidence in comments) and `server/routes.ts` reading from it; blog `updated` dates (`blog-posts.ts`); blog JSON-LD image in the first HTML (`scripts/prerender.mjs`); `email_off` fence (`crawlable-content.ts`); Facebook URL (`instagram-reels.ts`); headlight link on the exterior-detailing page (`service-related-links.ts`); `tests/manager-audit-fixes.test.mjs` (8 tests); one assertion updated in `tests/blog-schema.test.mjs` |

Validation on staging: unit tests 661 run, 659 pass, 0 fail, 2 skipped (they need a build output; they pass when it exists); integration 471 / 427 pass / 44 fail, identical failing names to the baseline; TypeScript 34 diagnostics, same as the baseline; production build and prerender succeed; app log has no errors. Rollback: `git revert 5f5f886`.

## 6. Not done, and why

- www HSTS (server or DNS change), Cloudflare setting changes, `robots.txt` changes: need your approval.
- Legal text in the first HTML, `/contact` and annual-maintenance content: recommendations only, as asked.
- No price, warranty or claim touched. The ceramic meta price conflict and the `guaranteeText` question from the Phase 0 report are still open.
- P91 India content was not used.

## 7. Exact final sitemap URL list (32), staging build

| # | URL | Google status (20 Nov) | lastmod |
|---|---|---|---|
| 1 | `/` | indexed | 2026-11-20 |
| 2 | `/services` | unknown | 2026-11-18 |
| 3 | `/products` | crawled, not indexed | 2026-11-18 |
| 4 | `/products/stek` | crawled, not indexed | none |
| 5 | `/products/nasiol` | crawled, not indexed | 2026-09-24 |
| 6 | `/products/p91-premium-ppf` | crawled, not indexed | none |
| 7 | `/services/ceramic-coating-bangalore` | unknown | 2026-11-18 |
| 8 | `/services/paint-protection-film-bangalore` | unknown | 2026-11-18 |
| 9 | `/services/interior-detailing-bangalore` | unknown | 2026-11-18 |
| 10 | `/services/glass-sun-control-film-bangalore` | unknown | 2026-11-18 |
| 11 | `/blog` | crawled, not indexed | 2026-11-17 |
| 12 | `/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi` | crawled, not indexed | 2026-11-17 |
| 13 | `/blog/ppf-vs-ceramic-coating-bangalore` | crawled, not indexed | 2026-11-17 |
| 14 | `/blog/hard-water-spot-removal-bangalore` | crawled, not indexed | 2026-11-17 |
| 15 | `/blog/windshield-heat-rejection-film-summer` | crawled, not indexed | 2026-11-17 |
| 16 | `/blog/is-your-ppf-really-made-in-usa` | crawled, not indexed | 2026-11-17 |
| 17 | `/blog/how-much-ppf-does-your-car-need` | crawled, not indexed | 2026-11-17 |
| 18 | `/blog/monsoon-damage-car-bangalore` | crawled, not indexed | 2026-11-17 |
| 19 | `/blog/best-car-detailing-in-bangalore` | crawled, not indexed | 2026-11-17 |
| 20 | `/ceramic-coating/car` | crawled, not indexed | 2026-11-17 |
| 21 | `/ceramic-coating/bike` | crawled, not indexed | 2026-11-18 |
| 22 | `/ppf` | crawled, not indexed | 2026-11-18 |
| 23 | `/gallery` | crawled, not indexed | none |
| 24 | `/faq` | crawled, not indexed | 2026-11-20 |
| 25 | `/contact` | crawled, not indexed | none |
| 26 | `/service/annual-maintenance-package` | unknown | 2026-11-18 |
| 27 | `/service/exterior-detailing-hard-water-new` | unknown | 2026-11-18 |
| 28 | `/service/headlight-restoration-both` | unknown | 2026-11-18 |
| 29 | `/service/interior-detailing-service` | unknown | 2026-11-18 |
| 30 | `/service/premium-car-wash-special` | unknown | 2026-11-18 |
| 31 | `/service/windshield-glass-coating-new` | unknown | 2026-11-18 |
| 32 | `/service/windshield-glass-polishing` | unknown | 2026-11-18 |

No URL is added or removed compared with the live sitemap. Reasons for each are in `SITEMAP-AUDIT-AND-FINAL-URL-LIST.md` and `05-final-sitemap-urls.csv`. (That CSV's recommended `lastmod` column for `/services`, `/products`, the guides and the booking items is superseded by the table above, which has the commit evidence.)

## 8. Decisions I need

1. Approve this branch for production, together with Phase 0 (the branch is stacked on it).
2. The www HSTS fix: nginx header, proxy www through Cloudflare, or accept.
3. If the email 404 persists after deploy: disable Email Address Obfuscation or add `Disallow: /cdn-cgi/`.
4. Ask the manager for the text of the structured-data error if the flag persists.
5. Legal text in the first HTML and the `/contact` additions (studio facts for directions and parking).
6. Annual-maintenance facts and the open price and warranty questions from the Phase 0 report.
