# Search Console indexing remediation: p91carcare.com

Date: 2026-11-05. Scope: verification of the four "Why pages aren't indexed" groups. No code changed, nothing deployed, no indexing requested.

## 1. Source data

Files used (all in `D:\Downloads`):

| Export | Issue | URLs | Chart range |
|---|---|---|---|
| `p91carcare.com-Coverage-Drilldown-2026-11-05.zip` (same as loose `Chart.csv`, `Metadata.csv`, `Table.csv`) | Crawled - currently not indexed | 14 | 2026-09-21 to 2026-10-23 |
| `... (1).zip` | Soft 404 | 22 | same |
| `... (2).zip` | Discovered - currently not indexed | 22 | same |
| `p91carcare.com-Coverage-Drilldown-2026-11-05.xlsx` | Page with redirect | 1 | same |
| `WhatsApp Image 2026-11-05 at 10.52.33.jpeg` | Summary screenshot | n/a | n/a |
| `P91 Car Care – Technical SEO & Google Indexing Fix Requirements.pdf` | Requirements | n/a | n/a |

Only these three distinct CSV sets exist. The "Chart(2)/(3)", "Metadata(2)/(3)", "Table(2)/(3)" files from the request are the CSVs inside the `(1)` and `(2)` ZIPs (also extracted into the `(1)` and `(2)` folders). The loose `Chart/Metadata/Table.csv` are byte-identical in content to the base ZIP.

Deduplication: 59 URLs listed in total (14+22+22+1), 59 unique. No URL appears in two groups. The three exports are all dated 2026-11-05 but the data ends 2026-10-23 (Search Console lag), so there are no differences between export dates and no conflicting records.

Screenshot status on 2026-11-05: Page with redirect 1 (validation Failed), Crawled 14 (Failed), Soft 404 22 (Started), Discovered 22 (Started). The document's "59 URLs" is the sum 1+14+22+22 = 59; the redirect URL (`http://p91carcare.com/`) came from a fourth export, the `.xlsx`, so all 59 are now identified.

Chart notes:
- Soft 404: 43 on 2026-09-21, 22 from 09-22 onward, flat. Last-crawled dates are 2026-02-11 to 2026-04-05, so Google has not recrawled them since.
- Discovered: 0 until 10-04, 33 on 10-05, falling to 22 on 10-20. Every "Last crawled" is 1970-01-01, meaning never crawled.
- Crawled: 6 on 09-22, rising to 15 on 10-17, 14 from 10-20.

## 2. Page with redirect (1 URL)

Source: `D:/Downloads/p91carcare.com-Coverage-Drilldown-2026-11-05.xlsx` (sheets Chart, Table, Metadata; Issue = "Page with redirect"). This replaces the earlier guess. I have no Search Console API access, so this comes from the export only.

**Affected URL: `http://p91carcare.com/`** (the plain-HTTP homepage). Last crawled 2026-10-21 (Excel serial 46316). The Chart sheet shows 0 on 2026-09-21 and 1 every day from 2026-09-22 to 2026-10-23.

The earlier candidates `/ppf-ceramic-coating` and `/service/glass-polishing` are **ruled out**: the reported URL is neither.

Live checks, 2026-11-05:
- `http://p91carcare.com/` returns **301**, `Location: https://p91carcare.com/`, one hop, final 200. Same result with a Googlebot user agent.
- The 301 is sent by Cloudflare (`Server: cloudflare`, `CF-RAY` header), not by the app. It is the HTTP to HTTPS redirect. The app also sets the canonical origin to `https://p91carcare.com` (`server/middleware/canonical-host.ts`).
- Sitemap: 0 `http://` entries; the homepage is listed as `https://p91carcare.com/`.
- `robots.txt`: 0 `http://` URLs. Homepage HTML: no `http://p91carcare` attributes. No `http://p91carcare` string in `client/src` or `server`.
- Internal links: none found in the served HTML or bundles pointing to the HTTP version (see the Google-reported referrers below).

URL Inspection screenshot (user-supplied, 2026-11-05) confirms: "URL is not on Google", "Page is not indexed: Page with redirect", Sitemaps "No referring sitemaps detected", last crawl 21 Oct 2026 16:38:24, crawled as Googlebot smartphone.

Referring pages shown by Google: `https://p91carcare.com/` and `https://linktr.ee/P91carcare`.
- The Linktree page (`linktr.ee/P91carcare`, fetched live) links to **`http://p91carcare.com`**. That is the external source of the HTTP URL, and it is outside the repo. Fix: edit the link in the Linktree profile to `https://p91carcare.com/`. Optional, since the 301 already handles it, but it removes the redirect hop for visitors.
- For `https://p91carcare.com/` as a referrer: the raw homepage HTML and all JS bundles linked from it contain no `http://p91carcare` string, and the source tree has none either. I could not reproduce this reference. It may be a stale record from an earlier crawl, or it comes from the rendered DOM, which I cannot inspect without a browser. Re-check with URL Inspection → View crawled page on the HTTPS homepage if you want to confirm.

Conclusion: intentional, permanent, correct. Google found the HTTP homepage (probably via an old backlink or its own HTTP probe) and followed the 301 to the indexed HTTPS page. "Page with redirect" is the expected label for such a URL. It is not an error and not a spam or duplicate problem.

Recommended action: **none in code.** Do not remove the redirect. Validation "Failed" is expected: Google rechecks the URL and it still redirects, which is the correct behaviour. Ignore this row, or stop validating it. Optionally confirm in Search Console that `https://p91carcare.com/` is indexed (URL Inspection).


## 3. Soft 404 (22 URLs)

All 22 tested live with `curl` on 2026-11-05 (GET, no redirect following). **All 22 return `410`, no redirect.** The response also carries `X-Robots-Tag: noindex` and a `text/plain` body of `Gone`.

```
410 /Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884439/
410 /Pared-Paneles-Laterales-Para-Cenador-Outsunny-2-Piezas-3x3m-3x6m-125889/
410 /PABLOSKY-Baby-022820-K-Navy-Mau-Feitio-767381/
410 /2015H-Touring-Windscreen-Smoke-F-650Gs-G650Gs-480098/
410 /Magnu00e9tico-De-77-Mm-Convierta-El-Filtro-De-Rosca-De-77-Mm-En-965275/
410 /PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/
410 /16-Colores-30-50cm-Cubo-LED-Resistente-A-La-Intemperie-Y-851666/
410 /Metales-Profesional-Para-Adultos-Bobina-De-Bu00fasqueda-416517/
410 /Lavabo-Mu00e1rmol-Mobiliario-Para-Cuarto-De-Bau00f1o-Grifos-555431/
410 /3500-W-Rcef-16Eb-Ceny-I-Opinie-Ceneo-pl-720762/
410 /CBR650R-CBR650-2019-2020-Preto-Moto-Bicicleta-Windshield-303943/
410 /Double-Din-11-Bluetooth-Negro-Talla-U00fanica-Negro-613689/
410 /Skecten-Set-De-2-Sillas-De-Comedor-Tapizada-En-Polipiel-Para-960752/
410 /De-Corte-De-Diamante-300-Mm-Disco-De-Diamante-Hu00famedo-O-Seco-884110/
410 /Estructuras-Hinchables-MXTXW-086-20-quot-Diu00e1metro-899830/
410 /6-Mois-2-en-1-Tapis-De-Jeux-Bebe-Activitu00e9s-96cm-Tapis-349429/
410 /Fotogru00e1fico-Mate-Tarjeta-De-Papel-Para-Impresiu00f3n-De-708155/
410 /De-Escalada-De-U00c1rboles-De-Acero-Inoxidable-Con-2-Engranajes-536551/
410 /M12-Lens-Mount-Arduino-Raspberry-Pi-NodeMCU-IoT-967449/
410 /Fajas-Lumbares-Ortopu00e9dicas-Farmacia-980412/
410 /Regletas-Enchufes-Regleta-Vertical-4000W-16A-Torre-Enchufes-144574/
410 /Rubi-Peine-Acero-28-Cm-8-X-8-75957-12-ESPATULA-PEINE-ACERO-322916/
```

Other invalid paths: `/this-does-not-exist` 404, `/blog/category/nope` 404, `/le48` 410 (legacy leftover path), `/home` 404.

Handling in code (already deployed, commit `7a3f5c9`): `server/middleware/gone-paths.ts` and `server/lib/spam-paths.ts`. Pattern: one path segment, at least four hyphen-separated parts, ending in a 5-7 digit id. Tests assert that no real route, sitemap entry or live service slug matches it (`tests/spam-paths.test.mjs`, `tests/gone-paths.itest.mjs`).

Why Search Console still shows them: the "Last crawled" dates (Feb 11 to Apr 5, 2026) predate the 410 handling. Google has not recrawled them. The count dropped from 43 to 22 on 2026-09-22 and has been flat since. They should clear once Google recrawls. Validation is "Started".

### Source investigation

Evidence examined:
- Repo search (all source, excluding `node_modules`, `dist`, `.git`): the product names (`PIZARRA`, `KOOME`, `Outsunny`, `Tirador`) appear only in the test fixtures and the spam-path comment. No routes, scripts, seed data, templates or CMS code generate such URLs. The app has no route that builds pages from a slug in the root path.
- Sitemap (31 URLs) and the 36 real pages' rendered HTML: no spam URL linked.
- Prior investigation recorded in commit `7a3f5c9`: the repo and its history do not reference these paths. Search Console crawl stats had about 144 foreign slugs.
- The last-crawled dates and the pattern (Spanish, French, Polish and Portuguese store listings with trailing numeric ids) match scraped listing URLs from a prior owner of the domain, or external backlinks. This is an inference, not a proof.

Not available to me, so not checked:
- **Production database**: not queried. No DB credentials were used. The code has no route that could serve DB rows at these paths, which makes DB-origin unlikely.
- **Server access logs**: not reviewed. Per project notes, they are on the Lightsail host `p91-apps` (`/var/log/nginx/access.log`, about 14 days retained, shared by all vhosts, Cloudflare IPs only). Requests from Feb to Apr 2026 are beyond retention anyway. There is no SSH key on this machine.
- **Search Console Security Issues and Manual Actions**: no access. Someone with property access needs to open both and confirm "No issues detected".
- **Cloudflare firewall events** for the zone: not checked.

Conclusion: no code path, file or integration in the repo produces these URLs. External origin (prior owner or backlinks) is the best-supported explanation, but it cannot be fully confirmed without the logs, DB and the Security/Manual Actions screens.

## 4. Crawled - currently not indexed (14 URLs)

Live status for all: 200. Sitemap column: in the live sitemap. All are self-canonical with absolute https and no trailing slash, with correct robots meta. All have exactly one `<h1>` and content in the initial HTML.

| URL | Last crawled | Sitemap | Robots meta | Canonical | Words (approx) |
|---|---|---|---|---|---|
| `/ceramic-coating/bike` | 2026-10-18 | yes | index,follow | self | 1500 |
| `/ceramic-coating/car` | 2026-10-18 | yes | index,follow | self | 1485 |
| `/blog/category/glass-film` | 2026-10-16 | no | noindex,follow | self | 549 |
| `/contact` | 2026-10-16 | yes | index,follow | self | 588 |
| `/products/stek` | 2026-10-14 | yes | index,follow | self | 679 |
| `/blog/best-car-detailing-in-bangalore` | 2026-10-13 | yes | index,follow | self | n/a |
| `/sitemap.xml` | 2026-10-13 | n/a | `X-Robots-Tag: noindex` | n/a | n/a |
| `/blog` | 2026-10-13 | yes | index,follow | self | n/a |
| `/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi` | 2026-10-09 | yes | index,follow | self | n/a |
| `/blog/ppf-vs-ceramic-coating-bangalore` | 2026-10-06 | yes | index,follow | self | n/a |
| `/blog/is-your-ppf-really-made-in-usa` | 2026-10-05 | yes | index,follow | self | n/a |
| `/blog/windshield-heat-rejection-film-summer` | 2026-10-05 | yes | index,follow | self | n/a |
| `/blog/monsoon-damage-car-bangalore` | 2026-10-05 | yes | index,follow | self | n/a |
| `/blog/how-much-ppf-does-your-car-need` | 2026-10-05 | yes | index,follow | self | n/a |

Word counts are rough (HTML tag strip with inline scripts included) and only meaningful for comparing pages.


### Validation export (Coverage-Validation-2026-11-05, Crawled group)

Source: `D:/Downloads/p91carcare.com-Coverage-Validation-2026-11-05/Table.csv` and `Metadata.csv`. Validation is running; no URLs have passed yet.

- **Pending (12):** `/blog/category/glass-film`, `/contact`, `/products/stek`, `/blog/best-car-detailing-in-bangalore`, `/sitemap.xml`, `/blog`, and the six other blog articles.
- **Failed (2):** `/ceramic-coating/bike` and `/ceramic-coating/car`, both last crawled 2026-10-18. Google rechecked them and they are still not indexed. A "Failed" item does not mean an error: the pages are 200, self-canonical and `index,follow`. It means Google still chose not to index them.
- Note: the earlier "Failed" status on the whole group came before this validation run, which now shows per-URL results.
- Nothing was changed on the site between the first crawl and this validation, so the outcome is expected. The two failures fit the overlap noted below (`/ceramic-coating/car` vs `/services/ceramic-coating-bangalore`, same service records and FAQ schema). `/ceramic-coating/bike` has a distinct audience, so its failure points to thin or non-unique content rather than overlap. That second reading is a hypothesis; Google gives no reason.
- `/sitemap.xml` is in the list and will keep failing: it is a noindex resource by design. Ignore it.
- `/blog/category/glass-film` is noindex by design. If validation fails for it, that is also expected.

Findings:
- `/sitemap.xml`: correct as is. It is a resource, served 200 with `X-Robots-Tag: noindex` (commit `641d129`) and is not listed as an entry inside itself. Nothing to fix. Google will keep listing it here; ignore.
- `/blog/category/glass-film`: already `noindex,follow` and not in the sitemap, which is what the requirements allow for a thin category. Search Console shows it because the crawl predates the noindex or because Google still lists noindexed pages here for a while. No change.
- `/contact`: indexable. Rendered HTML contains the Adugodi address, phone links (`tel:`), opening hours text, a Maps link and directions text. It has no studio photographs and no LocalBusiness JSON-LD in the initial HTML (a text count of `LocalBusiness` in the served HTML was 0; JSON-LD in the head was not inspected separately). Original studio photos must come from the business, so I did not add any.
- `/products/stek`: indexable. Rendered HTML mentions warranty and finishes and links to `/services/paint-protection-film-bangalore`. It has no FAQ, no images in the initial HTML, and no explicit specification section. Verified specifications, warranty terms and installation photos must come from the business or the manufacturer. Not invented.
- Ceramic overlap: `/services/ceramic-coating-bangalore` (about 800 words, a guide) and `/ceramic-coating/car` (about 1485 words, a campaign landing page with pricing and booking) are separate URLs, both indexable, both self-canonical. The guide already links to `/ceramic-coating/car`. They have different roles (guide vs pricing/booking page) but overlapping intent ("ceramic coating Bangalore"). A merge or 301 is a business decision. I recommend keeping both for now and revisiting after Google recrawls `/services/ceramic-coating-bangalore`, which is still in "Discovered" and has never been crawled. `/ceramic-coating/bike` has a distinct audience and is kept separate, as the requirements ask.
- Blog articles: all seven are indexable, self-canonical, with article content in the initial HTML. Improvements the requirements ask for (original photographs, project examples) need real material from the studio.
- `/blog`: 43 internal `<a href="/...">` links in the initial HTML, so article links are crawlable.

### Ceramic differentiation (code changed, NOT deployed, uncommitted)

Chosen option: keep all three URLs and reduce duplicated copy. Only text already on the site was reused; no new facts.

Files changed:
- `client/src/lib/seo-pages.ts`: the lede of `/services/ceramic-coating-bangalore` no longer repeats the car page sentence. It now describes the guide (borewell damage, what the job involves, what a coating does and does not do).
- `client/src/lib/landing-pages.ts`: the first benefit on `/ceramic-coating/car` no longer repeats the guide's borewell paragraph. It is shorter and points to the guide.

Test result: `npm test` 467 of 467 pass. Not checked in a browser or on a built bundle. Served pages change only after a build and deploy.

Overlap found that code cannot fix (it lives in the production service catalogue):
- `/ceramic-coating/bike` and `/ceramic-coating/car` share the same catalogue text: the 6-step process, most FAQ answers ("How is this different from regular wax?", "What happens after 1 year?" and others) and the feature list. Only two FAQ questions are bike-specific. The bike benefits section is already bike-specific. This shared text is the most probable reason both pages fail validation, but Google gives no reason.
- Contradiction: the car and bike catalogue text claims "9H hardness", "permanent bond", "100% safe" and "certified technicians". The guide says 9H is not a meaningful number. These are business claims; I did not change or verify them. Someone must decide which statement is right.
- Fixing this needs a catalogue update (the repo has `scripts/*.mjs` for that) with bike-specific answers from the studio. It needs your approval and real facts.

## 5. Discovered - currently not indexed (22 URLs)

All 22 return 200 live with a self-canonical and a valid robots meta. All have a single `<h1>`.

Indexable and in sitemap (17): `/services`, `/products`, `/products/nasiol`, `/products/p91-premium-ppf`, `/gallery`, `/blog/hard-water-spot-removal-bangalore`, `/services/ceramic-coating-bangalore`, `/services/paint-protection-film-bangalore`, `/services/glass-sun-control-film-bangalore`, `/services/interior-detailing-bangalore`, `/service/annual-maintenance-package`, `/service/exterior-detailing-hard-water-new`, `/service/headlight-restoration-both`, `/service/interior-detailing-service`, `/service/premium-car-wash-special`, `/service/windshield-glass-coating-new`, `/service/windshield-glass-polishing`.

Intentionally `noindex,follow` and not in sitemap (5): `/blog/category/paint-care`, `/blog/category/protection`, `/privacy-policy`, `/terms-conditions`, `/refund-policy`. This matches the requirements (categories and legal pages may be noindex,follow and must be out of the sitemap).

Discovery:
- `/services` contains 57 internal links in the initial HTML. The live `/services/ceramic-coating-bangalore` page contains links to `/services`, `/products*`, all four `/services/*-bangalore` guides, all `/service/*` pages named above, `/gallery`, `/contact`, `/blog` and every article. Every important page is reachable through plain HTML links.
- Nothing was added to the sitemap. No low-value or duplicate pages exist in it.
- Cause of "Discovered" state: Google knows the URLs but has not crawled them. The sitemap shows `lastmod`, the pages are 200, and robots.txt allows them. Googlebot's crawl budget for a new small site is the likely reason. There is no technical blocker.

## 6. Technical checks

- `robots.txt`: matches the required architecture (`Allow: /`, disallow `/admin/`, `/api/admin/`, `/booking-confirmation/`, sitemap line). Public API is not blocked.
- `/api/services`: 200, `application/json`, `x-robots-tag: noindex`.
- Sitemap: 31 URLs, all 200, none redirecting. No 404/410, API, admin or noindex URLs. The PPF size variants (`/service/ppf-*`) and `/service/1-year-*ceramic-coating` pages are excluded because they canonicalise to `/ppf` and `/ceramic-coating/*`.
- Canonicals: absolute https, no trailing slash, all 200.
- Marketing HTML has no `X-Robots-Tag`. Only `/sitemap.xml` and API responses carry noindex.
- Server rendering: initial HTML for all 36 pages already contains the title, meta description, canonical, one H1 and 35-57 internal links.

## 7. Changes made

Only the two copy edits in "Ceramic differentiation" above (uncommitted, not deployed). Otherwise **none.** The existing state already meets the requirements for HTTP status, canonicals, sitemap and robots. Content changes the document asks for (photos, verified STEK specifications, project examples, FAQs) need facts I do not have, so I did not invent them.

Unrelated uncommitted work exists on branch `seo/guide-landing-links` (`client/src/lib/seo-pages.ts`, `client/src/pages/seo-service-page.tsx`, `tests/seo-foundation.test.mjs`). It adds descriptive-anchor links from the PPF and ceramic guides to `/ppf` and `/ceramic-coating/car`. It was not started in this session. I left it as is.

## 8. Tests performed

- `npm test` (Node 24.18.0), with the uncommitted work present: 467 tests, 467 pass, 0 fail.
- Live `curl` of 58 reported URLs plus `/`, `/ppf`, `http://`, `www.`, trailing-slash variants and unknown paths: results above.
- Live header checks: `/api/services`, `/sitemap.xml`, `/robots.txt`.

The `*.itest.mjs` integration suites need a running server and database and were not run. Live behaviour above covers the same ground.

## 9. Remaining manual actions

1. ~~Page with redirect export~~ Resolved: the URL is `http://p91carcare.com/` (section 2). No action needed.
2. Check Search Console Security Issues and Manual Actions.
3. Supply real material for the content items: studio photographs, verified STEK specifications and warranty, project examples, FAQ answers. Then I can add them.
4. Decide on the ceramic car guide vs landing page overlap (keep both, or consolidate with a 301).
5. After approval, use Start Validation for Soft 404 and Discovered, and Request Indexing for the main pages. I have not done this.
6. Optional: review access logs on `p91-apps` (about 14 days retained) and Cloudflare firewall events to see who still requests the spam URLs.
7. The admin hint text at `client/src/pages/admin-dashboard.tsx:767` suggests sharing `/ppf-ceramic-coating`, a redirecting URL. Changing it to `/ppf` is a small optional fix.

## 10. Hack assessment and monitoring (2026-11-06)

Question asked: were the foreign URLs injected by an attacker, and is the site clean now?

Evidence that the site itself is clean today (live checks by `scripts/seo-monitor.mjs`, 31 pages):
- No page differs between a browser, Googlebot and a Google-Spain-referred visitor (no cloaking). One apparent difference on `/contact` was Cloudflare re-encoding the contact email on each request, not content.
- No iframes, obfuscated script loaders, hidden links or spam keywords in any page's HTML.
- The only external hosts linked or loaded: `stek-india.in`, `wa.me`, `www.google.com`, `www.nasiol.in`. All expected.
- Sitemap: 31 URLs, all 200, self-canonical, none noindex. No unknown URLs.
- Common attack paths (`/wp-login.php`, `/xmlrpc.php`, `/.env`, `/.git/config`, `/shell.php`, extra sitemaps) all return 404. The SPA returns its 404 page, not a file.
- Other hostnames: `booking.` and `www.` 301 to the main domain; `admin.`, `mail.`, `blog.` and `shop.` do not resolve.
- Source tree and git history contain none of the spam product names or any code that could create such pages.

Evidence about origin (inference, not proof):
- The 22 URLs were last crawled by Google between 2026-02-11 and 2026-04-05. All are foreign-language store-listing slugs ending in a numeric id.
- The app has no route that builds pages from a root slug, so these URLs never produced content here. Google reported them as Soft 404 because the old server answered 200 or a generic page.
- This pattern fits legacy URLs from a previous owner of the domain, or links pointing at the domain from scraped product pages. It also matches the "URL injection" spam class, where attackers get URLs crawled on a site without adding real pages. I cannot tell the two apart from outside. Server logs from Feb to Apr 2026 (before this repo's 410 handling, commit `bcc6575`) would settle it and are probably gone (about 14 days retained).
- The web search tool found no public record for these specific URLs. The Wayback Machine did not respond, so domain ownership history is unchecked.

Why the site dropped out of Google "long back" cannot be proven from here. Search Console shows no Security Issues or Manual Action data to me; someone with access must check both (Security & Manual Actions menu). If either lists a problem, send it to me.

Monitoring added:
- `scripts/seo-monitor.mjs`: read-only, no credentials. Checks the 23 spam URLs, invented URLs, sitemap health, cloaking, injection markers, link allowlist, redirects, robots.txt and the API noindex header. Exit code 1 on any alert.
- `scripts/seo-monitor-baseline.json`: the reviewed known-good state (31 sitemap URLs, 5 hosts). Re-run with `--write-baseline` only after reviewing a change on purpose (new page, new partner link).
- Run: `node scripts/seo-monitor.mjs`. First run on 2026-11-06: no alerts.

Search Console side (manual, nobody can automate without API access): weekly look at Pages, Security & Manual Actions, Crawl stats, and Sitemaps ("Success", 31 discovered).

## 11. Search Console API snapshot (2026-11-10)

Source: URL Inspection API and Sitemaps API, read-only scope, using the `gsc-reader` service account (full user on both properties below). Scripts ran from a scratch folder outside the repo; no credential was printed or stored.

Properties the account can see: `sc-domain:p91carcare.com` and `https://p91carcare.blogspot.com/` (a separate Blogger site, see below).

### Main site (`sc-domain:p91carcare.com`)

- Sitemap `https://p91carcare.com/sitemap.xml`: last downloaded 2026-11-05, 31 URLs submitted, 0 errors, 0 warnings. The "indexed" count the API reports for sitemaps (0) is a legacy field and not reliable.
- **Homepage `https://p91carcare.com/`: "Submitted and indexed" (PASS), last crawl 2026-11-07, user and Google canonical match.** The site is in Google's index again.
- `http://p91carcare.com/`: "Page with redirect", last crawl 2026-10-21, canonical `https://p91carcare.com/`. Confirms section 2.
- Crawled - currently not indexed, canonicals correct, robots allowed (22 URLs): `/products`, `/products/stek`, `/products/nasiol`, `/products/p91-premium-ppf`, `/blog`, all 8 blog articles, `/ceramic-coating/car`, `/ceramic-coating/bike`, `/ppf`, `/gallery`, `/contact`, `/blog/category/glass-film`. Several were recrawled on 2026-11-04 and 2026-11-05, so Google is revisiting them. Google gives no reason for not indexing.
- "URL is unknown to Google" per the API (not yet crawled): `/services`, the four `/services/*-bangalore` guides, all seven `/service/*` pages, and the noindex pages (`/blog/category/paint-care`, `/blog/category/protection`, the three policy pages). The Search Console UI lists most of these as "Discovered - currently not indexed". The API does not expose that state, so the two views are consistent.
- `/ppf-ceramic-coating` and `/service/glass-polishing` (the 301 candidates): unknown to Google, so they are not the "Page with redirect" URL. Confirmed.

### Blogspot property (`https://p91carcare.blogspot.com/`)

This is a separate Blogger blog titled "P91 CarCare", not part of the main site's code. It has 4 posts (published 2026-10-05, 10-07, 10-26, 11-05) and a sitemap with 4 URLs. The 2026-11-09 Search Console email ("Redirect error" and "Alternate page with proper canonical tag") is about this property.

- "Alternate page with proper canonical tag" is the `?m=1` mobile variant of the homepage. The canonical points to the clean URL. This is normal Blogger behaviour and needs no fix.
- "Redirect error": two posts show it in Google's last crawl: `/2026/11/car-detailing-in-bangalore-complete.html` (crawled 2026-11-05) and `/2026/10/best-ppf-studio-near-koramangala-how-to.html` (crawled 2026-11-04). Both were published or edited around then.
- Live check from India with Googlebot user agents: both return 200 with no redirect, and the canonical points to themselves. I could not reproduce the error. It may be transient or geographic (Blogger can redirect by visitor country). Next step: run Test Live URL on both in Search Console. If it fails again, report the exact redirect chain.
- The other two posts and the homepage are "Discovered - currently not indexed".
- One post (`best-car-detailing-in-bangalore-buyers`) has a title matching the main site's `/blog/best-car-detailing-in-bangalore` article. I did not compare the text. If it is a copy, point its canonical at the main-site article or rewrite it, so the two do not compete.
