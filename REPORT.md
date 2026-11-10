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
- Crawled - currently not indexed, canonicals correct, robots allowed (19 URLs; an earlier version of this line said 22 in error): `/products`, `/products/stek`, `/products/nasiol`, `/products/p91-premium-ppf`, `/blog`, all 8 blog articles, `/ceramic-coating/car`, `/ceramic-coating/bike`, `/ppf`, `/gallery`, `/contact`, `/blog/category/glass-film`. Several were recrawled on 2026-11-04 and 2026-11-05, so Google is revisiting them. Google gives no reason for not indexing.
- "URL is unknown to Google" per the API (not yet crawled): `/services`, the four `/services/*-bangalore` guides, all seven `/service/*` pages, and the noindex pages (`/blog/category/paint-care`, `/blog/category/protection`, the three policy pages). The Search Console UI lists most of these as "Discovered - currently not indexed". The API does not expose that state, so the two views are consistent.
- `/ppf-ceramic-coating` and `/service/glass-polishing` (the 301 candidates): unknown to Google, so they are not the "Page with redirect" URL. Confirmed.

### Blogspot property (`https://p91carcare.blogspot.com/`)

This is a separate Blogger blog titled "P91 CarCare", not part of the main site's code. It has 4 posts (published 2026-10-05, 10-07, 10-26, 11-05) and a sitemap with 4 URLs. The 2026-11-09 Search Console email ("Redirect error" and "Alternate page with proper canonical tag") is about this property.

- "Alternate page with proper canonical tag" is the `?m=1` mobile variant of the homepage. The canonical points to the clean URL. This is normal Blogger behaviour and needs no fix.
- "Redirect error": two posts show it in Google's last crawl: `/2026/11/car-detailing-in-bangalore-complete.html` (crawled 2026-11-05) and `/2026/10/best-ppf-studio-near-koramangala-how-to.html` (crawled 2026-11-04). Both were published or edited around then.
- Live check from India with Googlebot user agents: both return 200 with no redirect, and the canonical points to themselves. I could not reproduce the error. It may be transient or geographic (Blogger can redirect by visitor country). Next step: run Test Live URL on both in Search Console. If it fails again, report the exact redirect chain.
- The other two posts and the homepage are "Discovered - currently not indexed".
- One post (`best-car-detailing-in-bangalore-buyers`) has a title matching the main site's `/blog/best-car-detailing-in-bangalore` article. I did not compare the text. If it is a copy, point its canonical at the main-site article or rewrite it, so the two do not compete.

### Blogspot follow-up (2026-11-10): text comparison and redirect re-check

Text comparison (5-word phrase overlap of each Blogspot post against the 8 main-site blog articles, the homepage and the four service guides; Blogspot text taken from the blog's public feed, main-site text from the served HTML):

| Blogspot post | Most similar main-site page | Overlap | Verdict |
|---|---|---|---|
| `best-car-detailing-in-bangalore-buyers` (2026-10-07) | `/blog/best-car-detailing-in-bangalore` | **96%** | Copy of the main-site article, same title with the "P91 Car Care" suffix |
| `best-ppf-studio-near-koramangala-how-to` (2026-10-26) | `/blog/best-car-detailing-in-bangalore` | 18% | Partial overlap, mostly separate text |
| `car-detailing-in-bangalore-complete` (2026-11-05) | same | 4% | Original |
| `how-to-protect-your-cars-paint-in` (2026-10-05) | `/blog/ppf-koramangala-...` | 6% | Original |

Recommendation: the 96% post competes with the main site's own article, and Google has not indexed it (Discovered). Delete it on Blogger, or rewrite it. The 18% post can stay; add a link from each remaining Blogspot post to the matching main-site service page.

Redirect error re-check (API re-run 2026-11-10 and live probes):
- Google's status for the two posts is unchanged: "Redirect error", last crawled 2026-11-04 and 2026-11-05, crawled as MOBILE. No newer crawl exists.
- Cause found: Blogger sends mobile visitors a `302` from the post URL to the same URL with `?m=1`, which returns 200 with a canonical pointing back to the clean URL. With a Googlebot-smartphone user agent I get exactly one hop: `302` to `...?m=1`, then `200`. No loop and no chain. A desktop user agent gets a straight `200`.
- So the error cannot be reproduced and the redirect itself is correct. Google's smartphone crawl of these two freshly published posts hit it once; the other two posts have not been crawled yet. It is most likely transient.
- Optional fix, in Blogger (needs the blog owner): Theme > gear icon next to Customize > Mobile settings > "No. Show desktop template on mobile devices". That removes the `?m=1` redirect entirely, along with the "Alternate page with proper canonical tag" report for `?m=1` URLs.
- Then in Search Console, run Test Live URL on both posts and request indexing for them if the live test passes.


## 12. Second pass, 2026-11-10 (main site, Blogger, duplicate article)

Nothing in this section was committed, deployed or changed on Blogger or the website. Search Console actions (Test Live URL, Request Indexing, Start Validation) were not performed and cannot be done through the API.

### 12.1 Main site: latest indexing status (verified, URL Inspection API, 2026-11-10 08:56 UTC)

Compared with the section 11 snapshot taken earlier the same day: **no difference. Google has not crawled any additional page since.** The most recent crawl dates are still 2026-11-04 and 2026-11-05 (`/products`, `/products/nasiol`, `/products/p91-premium-ppf`, `/ppf`, `/ceramic-coating/car`, `/gallery`, `/contact`, `/blog/hard-water-spot-removal-bangalore`). The homepage was last crawled 2026-11-07.

Of the 31 sitemap URLs:

| Status | Count | URLs |
|---|---|---|
| Submitted and indexed | 1 | `/` |
| Crawled, currently not indexed | 18 | `/products`, `/products/stek`, `/products/nasiol`, `/products/p91-premium-ppf`, `/blog`, the 8 blog articles, `/ceramic-coating/car`, `/ceramic-coating/bike`, `/ppf`, `/gallery`, `/contact` |
| Unknown to Google (not yet crawled) | 12 | `/services`, the four `/services/*-bangalore` guides, the seven `/service/*` pages |

Outside the sitemap: `/blog/category/glass-film` is also "Crawled, currently not indexed" (19 crawled-not-indexed URLs in total). Correction: section 11 and earlier chat messages said 22; the API list contains 19, and 1 + 18 + 12 = 31 sitemap URLs. `/blog/category/paint-care`, `/blog/category/protection` and the three policy pages are unknown to Google (intentional noindex). `/ppf-ceramic-coating` and `/service/glass-polishing` are unknown to Google. `http://p91carcare.com/` is the single "Page with redirect".

Sitemap API: `/sitemap.xml` last downloaded 2026-11-05, 31 submitted, 0 errors, 0 warnings.

**Genuine technical issues that still need code changes: none found.** Every URL Google has crawled shows a successful fetch, robots allowed, indexing allowed, and user canonical equal to Google canonical. The remaining non-indexing is either Google's quality and crawl-priority decision (19 URLs) or not yet crawled (12 URLs). No code was changed to force indexing.

Not verified: why Google chose not to index the 19 pages. The API gives no reason. Page quality and the shared catalogue text (section 4) remain the working hypothesis.

### 12.2 Blogger redirect investigation

URLs: `/2026/11/car-detailing-in-bangalore-complete.html` and `/2026/10/best-ppf-studio-near-koramangala-how-to.html` on `p91carcare.blogspot.com`.

Verified, Search Console API: both are still "Redirect error" (fetch state `REDIRECT_ERROR`), last crawled 2026-11-05 and 2026-11-04, crawled as MOBILE, robots allowed. There is no newer crawl. The other two posts and the homepage are "Discovered - currently not indexed".

Verified, live requests (curl, up to 10 redirects followed, 2026-11-10):

| User agent | Result for each post |
|---|---|
| Desktop browser | 200, no redirect, canonical is the post URL itself |
| Googlebot desktop | 200, no redirect, canonical is the post URL itself |
| Googlebot smartphone | One `302 Moved Temporarily` to the same URL plus `?m=1`, which returns 200. The canonical on that page points back to the clean URL. |

- Redirect loop: **none**. With `--max-redirs 3` the final status was 200 after 1 redirect. The `?m=1` URL itself returns 200 and does not redirect again.
- No `X-Robots-Tag` header and no robots meta tag on either post.

Not verified: what exactly Google saw on 2026-11-04 and 2026-11-05. I cannot reproduce a redirect error, and the API does not return the redirect chain.

Is changing Blogger's mobile template setting necessary? **No, not on the current evidence.** A one-hop `302` to `?m=1` with a correct canonical is Blogger's standard mobile behaviour and is not an error by itself. The other two posts use the same mechanism and have simply not been crawled yet. Assumption: the error was a one-off failure on the first mobile crawl of freshly published posts. Do not change the setting yet. Run Test Live URL first, and change it only if the live test reproduces a redirect error. The trade-off of turning it off is that phones get the desktop layout, which can look worse for readers.

### 12.3 Duplicate Blogger article

Recheck, same method as section 11 (5-word phrase overlap), 2026-11-10: results unchanged.

| Blogspot post | Overlap with its closest main-site page |
|---|---|
| **`/2026/10/best-car-detailing-in-bangalore-buyers.html`, "Best Car Detailing in Bangalore: A Buyer's Guide \| P91 Car Care"** | **96%** with `/blog/best-car-detailing-in-bangalore`. The section headings are identical to the main-site article. |
| `.../best-ppf-studio-near-koramangala-how-to.html` | 18% with `/blog/best-car-detailing-in-bangalore` |
| `.../car-detailing-in-bangalore-complete.html` | 4% |
| `.../how-to-protect-your-cars-paint-in.html` | 6% |

No specific issue found with the 18%, 4% and 6% posts; they are unchanged.

Replacement draft for the 96% post: `blogger-draft-handover-inspection.md` in the repo root (untracked, not published). Angle: how to prepare for a detailing visit and how to inspect the car at handover. Verified: 0.0% to 0.1% phrase overlap with the 4 Blogspot posts and 7 main-site pages. It contains no P91 business facts. Where such facts would help (studio policy, contact details, process) there are `[P91: ...]` placeholders for the business to fill in or delete.

Assumption: the general car-care advice in the draft (checking paint in daylight, residue in panel gaps, interior drying time, and so on) is standard practice but was written from general knowledge, not from P91's own process. The owner should read it and delete anything that contradicts how the studio works.

### 12.4 Recommended actions

1. Main site: no code change. Wait for Google to crawl the 12 unknown URLs. Do not rerun validation or request indexing in bulk.
2. Blogger: run Test Live URL on both posts. Leave the mobile setting alone unless the live test reproduces an error.
3. Blogger: replace the 96% duplicate (edit it in place with the new draft, or delete it and publish a new post).
4. Keep monitoring with `scripts/seo-monitor.mjs`. The cloud routines still cannot reach the site (section 10), so run it locally.

### 12.5 Remaining manual actions and access limits

- Search Console (you): Test Live URL on the two Blogger posts. Request indexing for them only if the live test passes. Request indexing for a few key main-site URLs when quota allows: `/services`, the other three `/services/*` guides, `/products/p91-premium-ppf`, `/products/nasiol`, `/service/annual-maintenance-package`, `/service/windshield-glass-coating-new`, `/service/exterior-detailing-hard-water-new`, `/gallery`.
- Blogger (you): replace the duplicate post using the draft. Change the mobile setting only if needed.
- Access limits: the API cannot request indexing, start validation, or list issue-group URLs. I have no Blogger editing access. The cloud monitoring routines are blocked by the sandbox network allowlist. The Security Issues and Manual Actions screens are not visible to me.

### 12.6 Update after the user's Test Live URL and Request Indexing (2026-11-10, about 09:10 UTC)

Reported by the user (screenshot): Test Live URL for `/2026/11/car-detailing-in-bangalore-complete.html` shows "URL is available to Google" and "Page can be indexed", live test time 10 Nov 2026 14:36:29 IST. Indexing was requested for both Blogger posts. The Security Issues report shows no issues for both properties (user report, not visible to me).

Verified (API, re-run at 09:10 UTC): the indexed-record status of both posts is **still "Redirect error"** (`REDIRECT_ERROR`), and the crawl time is now 2026-11-10T09:09:45Z and 09:09:44Z, crawled as MOBILE. So Google's real mobile crawl, a few minutes after the passing live test, again recorded a redirect error.

This corrects section 12.2. I called the error likely transient and said the mobile setting should be left alone. The error has now been recorded on a second crawl, so it is reproducible by Google's mobile crawler even though the live test passes and my own requests see only a single `302` to `?m=1` followed by a 200.

Verified (live, 2026-11-10): the `?m=1` page and the clean page return identical 110,902-byte HTML, both with the canonical pointing to the clean URL, and neither contains a meta refresh or a JavaScript redirect. Three repeat requests per post with a Googlebot-smartphone user agent all returned the same `302` to `?m=1`.

Not verified: the exact redirect step that Google's crawler rejects. The API does not return the redirect chain. The `302` from the post URL to `?m=1`, on the smartphone user agent only, is the only redirect in the path, so it is the likely cause. That is an inference.

Revised recommendation: turn off Blogger's mobile redirect (Blogger > Theme > gear icon next to Customize > Mobile settings > "No. Show desktop template on mobile devices"). It is reversible and removes both Search Console reports ("Redirect error" and "Alternate page with proper canonical tag"), because the `?m=1` URLs stop existing. After the change, wait for Google to recrawl (or request indexing again once) and re-check with the API.

### 12.7 Blogger Crawl stats (user-supplied exports, 2026-11-10)

Source: three `.xlsx` exports from Search Console > Settings > Crawl stats for `https://p91carcare.blogspot.com/` (the two crawl-stats files are identical in content; the third is Host status). Data covers 2026-10-28 to 2026-11-08, so it ends before the 2026-11-10 crawl.

Verified (from the exports):
- Host status: no problems in the last 90 days for server connectivity, DNS resolution and robots.txt fetch (all zero failed requests).
- **Googlebot made only 7 crawl requests in 12 days** to the whole blog: 3 on 2026-10-29, 1 on 11-02, 1 on 11-03, 2 on 11-04.
- Response mix: **302 Moved temporarily 71% (5 requests), 200 OK 29% (2 requests).** The two 200s fall on 2026-10-29 (the day with 41,624 bytes downloaded). The days with 302s transferred 0 bytes.
- Googlebot type: smartphone 86% (6 requests), desktop 14% (1 request).
- Crawl purpose: 100% "Refresh". No "Discovery" crawls were recorded.
- No failed requests (the "Unknown (failed requests)" file-type share is 0).

What this supports: Google's smartphone crawler receives the `302` that Blogger sends to the `?m=1` URL, which matches the live tests. After the `302`, the exports show no matching 200 for the `?m=1` URL on those days, so Google appears not to have completed the second step. That is consistent with the "Redirect error" on both posts. It does not show why Google did not follow it.

Not verified: the reason the redirect is rejected; whether the 2026-11-05 and 2026-11-10 crawls behaved the same (outside the export range); anything about URLs (the exports contain no per-URL data).

Other conclusion: crawl demand for this blog is very low (about 0.6 requests a day). That alone can explain "Discovered - currently not indexed" for the other posts, independent of the redirect.

Options that do not need Blogger's mobile setting (none were done): a link from the main site to the Blogger posts would raise crawl demand, but it needs a main-site change, which is out of scope for now. Without such a change, expect slow crawling.


---

## 13. FINAL AUDIT (2026-11-10)

Scope: the manager's URL-correction and technical-SEO task ("P91 Car Care – Technical SEO & Google Indexing Fix Requirements" PDF), the Search Console exports, and the manager's Lighthouse performance brief. This audit was done independently of sections 1–12: every item below was re-tested on 2026-11-10 unless marked otherwise. No code was changed, merged, deployed or published, and nothing on Blogger was touched.

Evidence labels used throughout: **[PROD]** live production test, **[API]** Search Console API, **[LOCAL]** local repo or test run, **[USER]** reported by the user, **[ASSUME]** assumption or inference.

### 13.1 Source files reviewed

| Source | Used for |
|---|---|
| `P91 Car Care – Technical SEO & Google Indexing Fix Requirements.pdf` | all requirements and acceptance criteria |
| `D:\Downloads\Table.csv`, `Chart.csv`, `Metadata.csv` (and the identical base ZIP) | Crawled – currently not indexed (14 URLs, dated 2026-11-05) |
| `...Coverage-Drilldown-2026-11-05 (1).zip` and folder | Soft 404 (22 URLs) |
| `...Coverage-Drilldown-2026-11-05 (2).zip` and folder | Discovered – currently not indexed (22 URLs) |
| `...Coverage-Drilldown-2026-11-05.xlsx` | Page with redirect (1 URL: `http://p91carcare.com/`, last crawled 2026-10-21) |
| `...Coverage-Validation-2026-11-05\Table.csv`, `Metadata.csv` | per-URL validation status of the Crawled group |
| `WhatsApp Image ... 10.52.33.jpeg` | Search Console summary counts |
| Blogger Crawl-stats and Host-status `.xlsx` exports | Blogger property (reported separately, see 13.4) |
| Manager's Lighthouse brief (pasted in chat, not a file) | performance requirements (13.8) |

Notes: 59 URLs in total (14 + 22 + 22 + 1), all unique, no URL in two groups. The "Chart(2)/(3)", "Metadata(2)/(3)", "Table(2)/(3)" files named in the user's request are the CSVs inside the two ZIPs. All export data ends 2026-10-23 (Search Console lag).

### 13.2 URL-by-URL verification (main site, all 59 reported URLs)

Method: each URL fetched with a Googlebot desktop user agent, redirects followed manually up to 8 hops **[PROD]**; "Latest API status" from the URL Inspection API **[API]**.

| # | Original GSC issue (2026-11-05 export) | URL | Live HTTP (Googlebot UA) | Robots (header / meta) | Canonical | In sitemap | Latest API status (2026-11-10) | API last crawl |
|---|---|---|---|---|---|---|---|---|
| 1 | Soft 404 | `/Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884...` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-04-05 |
| 2 | Soft 404 | `/Pared-Paneles-Laterales-Para-Cenador-Outsunny-2-Piezas-3x3m-3x6m-1...` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-31 |
| 3 | Soft 404 | `/PABLOSKY-Baby-022820-K-Navy-Mau-Feitio-767381/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-27 |
| 4 | Soft 404 | `/2015H-Touring-Windscreen-Smoke-F-650Gs-G650Gs-480098/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-27 |
| 5 | Soft 404 | `/Magnu00e9tico-De-77-Mm-Convierta-El-Filtro-De-Rosca-De-77-Mm-En-96...` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-27 |
| 6 | Soft 404 | `/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-24 |
| 7 | Soft 404 | `/16-Colores-30-50cm-Cubo-LED-Resistente-A-La-Intemperie-Y-851666/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-23 |
| 8 | Soft 404 | `/Metales-Profesional-Para-Adultos-Bobina-De-Bu00fasqueda-416517/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-23 |
| 9 | Soft 404 | `/Lavabo-Mu00e1rmol-Mobiliario-Para-Cuarto-De-Bau00f1o-Grifos-555431/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-23 |
| 10 | Soft 404 | `/3500-W-Rcef-16Eb-Ceny-I-Opinie-Ceneo-pl-720762/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-22 |
| 11 | Soft 404 | `/CBR650R-CBR650-2019-2020-Preto-Moto-Bicicleta-Windshield-303943/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-22 |
| 12 | Soft 404 | `/Double-Din-11-Bluetooth-Negro-Talla-U00fanica-Negro-613689/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-22 |
| 13 | Soft 404 | `/Skecten-Set-De-2-Sillas-De-Comedor-Tapizada-En-Polipiel-Para-960752/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-22 |
| 14 | Soft 404 | `/De-Corte-De-Diamante-300-Mm-Disco-De-Diamante-Hu00famedo-O-Seco-88...` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-03-21 |
| 15 | Soft 404 | `/Estructuras-Hinchables-MXTXW-086-20-quot-Diu00e1metro-899830/` | 410 (text/plain) | noindex | - | n | URL is unknown to Google | - |
| 16 | Soft 404 | `/6-Mois-2-en-1-Tapis-De-Jeux-Bebe-Activitu00e9s-96cm-Tapis-349429/` | 410 (text/plain) | noindex | - | n | URL is unknown to Google | - |
| 17 | Soft 404 | `/Fotogru00e1fico-Mate-Tarjeta-De-Papel-Para-Impresiu00f3n-De-708155/` | 410 (text/plain) | noindex | - | n | URL is unknown to Google | - |
| 18 | Soft 404 | `/De-Escalada-De-U00c1rboles-De-Acero-Inoxidable-Con-2-Engranajes-53...` | 410 (text/plain) | noindex | - | n | URL is unknown to Google | - |
| 19 | Soft 404 | `/M12-Lens-Mount-Arduino-Raspberry-Pi-NodeMCU-IoT-967449/` | 410 (text/plain) | noindex | - | n | URL is unknown to Google | - |
| 20 | Soft 404 | `/Fajas-Lumbares-Ortopu00e9dicas-Farmacia-980412/` | 410 (text/plain) | noindex | - | n | URL is unknown to Google | - |
| 21 | Soft 404 | `/Regletas-Enchufes-Regleta-Vertical-4000W-16A-Torre-Enchufes-144574/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-02-11 |
| 22 | Soft 404 | `/Rubi-Peine-Acero-28-Cm-8-X-8-75957-12-ESPATULA-PEINE-ACERO-322916/` | 410 (text/plain) | noindex | - | n | Soft 404 | 2026-02-11 |
| 23 | Discovered, not indexed | `/blog/category/paint-care` | 200 (text/html) | noindex,follow | self | n | URL is unknown to Google | - |
| 24 | Discovered, not indexed | `/blog/category/protection` | 200 (text/html) | noindex,follow | self | n | URL is unknown to Google | - |
| 25 | Discovered, not indexed | `/blog/hard-water-spot-removal-bangalore` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-11-05 |
| 26 | Discovered, not indexed | `/gallery` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-11-04 |
| 27 | Discovered, not indexed | `/privacy-policy` | 200 (text/html) | noindex,follow | self | n | URL is unknown to Google | - |
| 28 | Discovered, not indexed | `/products` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-11-04 |
| 29 | Discovered, not indexed | `/products/nasiol` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-11-04 |
| 30 | Discovered, not indexed | `/products/p91-premium-ppf` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-11-05 |
| 31 | Discovered, not indexed | `/refund-policy` | 200 (text/html) | noindex,follow | self | n | URL is unknown to Google | - |
| 32 | Discovered, not indexed | `/service/annual-maintenance-package` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 33 | Discovered, not indexed | `/service/exterior-detailing-hard-water-new` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 34 | Discovered, not indexed | `/service/headlight-restoration-both` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 35 | Discovered, not indexed | `/service/interior-detailing-service` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 36 | Discovered, not indexed | `/service/premium-car-wash-special` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 37 | Discovered, not indexed | `/service/windshield-glass-coating-new` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 38 | Discovered, not indexed | `/service/windshield-glass-polishing` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 39 | Discovered, not indexed | `/services` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 40 | Discovered, not indexed | `/services/ceramic-coating-bangalore` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 41 | Discovered, not indexed | `/services/glass-sun-control-film-bangalore` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 42 | Discovered, not indexed | `/services/interior-detailing-bangalore` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 43 | Discovered, not indexed | `/services/paint-protection-film-bangalore` | 200 (text/html) | index,follow | self | Y | URL is unknown to Google | - |
| 44 | Discovered, not indexed | `/terms-conditions` | 200 (text/html) | noindex,follow | self | n | URL is unknown to Google | - |
| 45 | Crawled, not indexed | `/ceramic-coating/bike` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-18 |
| 46 | Crawled, not indexed | `/ceramic-coating/car` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-11-05 |
| 47 | Crawled, not indexed | `/blog/category/glass-film` | 200 (text/html) | noindex,follow | self | n | Crawled - currently not indexed | 2026-10-16 |
| 48 | Crawled, not indexed | `/contact` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-11-04 |
| 49 | Crawled, not indexed | `/products/stek` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-14 |
| 50 | Crawled, not indexed | `/blog/best-car-detailing-in-bangalore` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-13 |
| 51 | Crawled, not indexed | `/sitemap.xml` | 200 (application/xml) | noindex | - | n | Crawled - currently not indexed | 2026-10-13 |
| 52 | Crawled, not indexed | `/blog` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-13 |
| 53 | Crawled, not indexed | `/blog/ppf-koramangala-hsr-layout-shanti-nagar-adugodi` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-09 |
| 54 | Crawled, not indexed | `/blog/ppf-vs-ceramic-coating-bangalore` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-06 |
| 55 | Crawled, not indexed | `/blog/is-your-ppf-really-made-in-usa` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-05 |
| 56 | Crawled, not indexed | `/blog/windshield-heat-rejection-film-summer` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-05 |
| 57 | Crawled, not indexed | `/blog/monsoon-damage-car-bangalore` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-05 |
| 58 | Crawled, not indexed | `/blog/how-much-ppf-does-your-car-need` | 200 (text/html) | index,follow | self | Y | Crawled - currently not indexed | 2026-10-05 |
| 59 | Page with redirect | `http://p91carcare.com/` | 301>200 to / (text/html) | index,follow | self | n | Page with redirect | 2026-10-21 |

Reading the table:
- **Spam URLs (rows 1–22): 22 of 22 return 410 Gone** with `X-Robots-Tag: noindex`, no redirect, no canonical, not in the sitemap. None appears in any internal link (see below). **Deviation from the document:** the PDF's example response is `Content-Type: text/html`; production sends `text/plain` ("Gone"). Status code and noindex are what matter to Google, so this is cosmetic, but it is not literally what the document shows. Classified PARTIAL-cosmetic in 13.5.
- `/le48` (extra legacy path): 410 with and without trailing slash **[PROD]**.
- **Page with redirect (row 59)**: `http://p91carcare.com/` returns a single 301 to `https://p91carcare.com/`, which is correct and permanent. It is not an error.
- All 36 non-spam, non-redirect URLs return 200 with a self-canonical and a correct robots meta. The 6 `noindex,follow` pages (3 blog categories, 3 legal pages) are not in the sitemap, as the document allows.

Edge cases tested **[PROD]**:

| Request | Result |
|---|---|
| `/this-does-not-exist`, `/services/does-not-exist`, `/blog/nope`, `/service/not-a-real-service`, `/service/glass-polishing-x`, `/index.php`, `/wp-login.php`, `/sitemap_index.xml` | 404 (HTML 404 page, `noindex, follow`) |
| `/Services` (wrong case) | 404 |
| `/services/`, `/SERVICES/`, `/services//` | 301 to the no-slash form (single hop) |
| `//services` (double slash) | **200** with canonical `https://p91carcare.com/services`. A harmless duplicate-path variant, not a redirect. Minor. |
| `/services?utm_source=x&utm_medium=y`, `/ppf?utm_campaign=z` | 200, canonical stays the clean URL |
| spam path plus `?x=1` | 410 |
| `/ppf-ceramic-coating` | 301 to `/services` (intentional, 2026-09-22) |
| `/service/glass-polishing` | 301 to `/service/windshield-glass-polishing` |
| `/index.html` | 301 to `/` |
| `http://` and `www.` hosts, `booking.p91carcare.com` | 301 to `https://p91carcare.com/` (one hop, sent by Cloudflare or the app) |
| `/admin/nope`, `/booking-confirmation/xyz` | 200 (SPA route) with `noindex, follow`; disallowed in `robots.txt` |

Redirect and generation checks:
- Redirect loops: none. No chain longer than one hop **[PROD]**.
- No invalid URL redirects to the homepage **[PROD]**.
- Invalid URLs in the sitemap: 0 of 31. Spam-pattern URLs in the sitemap, `llms.txt` or `robots.txt`: 0. Links to spam-pattern URLs in the 37 rendered pages: 0. Links to the redirecting URLs (`/ppf-ceramic-coating`, `/service/glass-polishing`, `/index.html`, `http://p91carcare...`): 0. Trailing-slash internal links: 0. All 104 unique internal links across the 37 rendered pages return 200 **[PROD]**.
- Unwanted URL generation: the app has no route that builds pages from a root slug. Unknown paths reach a 404 handler, spam-shaped paths a 410 handler (`server/middleware/gone-paths.ts`, commit `7a3f5c9`, in production) **[LOCAL + PROD]**.

### 13.3 Original exports versus latest Search Console data (main site, `sc-domain:p91carcare.com`)

Compared per URL: the issue group in the 2026-11-05 export versus the URL Inspection API on 2026-11-10 **[API]**.

| Group in the exports (count) | Latest API status | Change |
|---|---|---|
| **Soft 404 (22)** | 16 still "Soft 404" (last crawl 2026-02-11 to 2026-04-05, i.e. not recrawled since the 410 fix); **6 now "URL is unknown to Google"**; `/le48` unknown | 6 resolved (dropped from Google's records). 16 pending recrawl. Validation "Started" **[USER]**. |
| **Crawled – currently not indexed (14)** | all 14 still "Crawled – currently not indexed" | No change in the index. Validation export: 12 Pending, 2 Failed (`/ceramic-coating/car`, `/ceramic-coating/bike`) **[USER export]**. |
| **Discovered – currently not indexed (22)** | **5 now crawled** (`/products`, `/products/nasiol`, `/products/p91-premium-ppf`, `/gallery`, `/blog/hard-water-spot-removal-bangalore`), now "Crawled – currently not indexed"; 17 still unknown to Google (they include the 5 intentional noindex pages) | 5 progressed from discovered to crawled. |
| **Page with redirect (1)** | `http://p91carcare.com/` still "Page with redirect" (last crawl 2026-10-21) | Expected status, correct redirect. No action. |
| **Indexed** | Homepage `/`: **"Submitted and indexed"**, last crawl 2026-11-07 | Site is back in the index. |

Totals for the 31 sitemap URLs: 1 indexed, 18 crawled-not-indexed, 12 not yet crawled **[API]**. Sitemap `/sitemap.xml`: downloaded 2026-11-05, 31 submitted, 0 errors, 0 warnings.

Discrepancies to note:
- Earlier sections quoted "22 crawled-not-indexed"; the correct figure is 19 (18 in the sitemap plus `/blog/category/glass-film`). Corrected in 11 and 12.
- The Sitemaps API "indexed: 0" field is legacy and unreliable. Not used as evidence.
- The API cannot list issue-group URLs or start validation. Group totals in the UI (e.g. "Discovered 22") were not independently re-counted by me.
- Not verified: Search Console **Security Issues** and **Manual Actions**. The user reported "no issues detected" for both properties **[USER]**.

### 13.4 Blogger property (`https://p91carcare.blogspot.com/`), reported separately

This is a separate Blogger site with 4 posts, **not** part of the main website's code. **[API]**:
- Both posts `/2026/11/car-detailing-in-bangalore-complete.html` and `/2026/10/best-ppf-studio-near-koramangala-how-to.html`: still "Redirect error", last recorded crawl 2026-11-10 09:09 UTC (smartphone), after the user's Test Live URL and Request Indexing. The other two posts and the homepage: "Discovered – currently not indexed".
- Live test in Search Console passed ("URL is available to Google") **[USER]**. Google's own crawl record still shows the error. These two facts disagree and are reported separately.
- **[PROD]** Desktop gets 200 with no redirect. Googlebot-smartphone gets one `302` to `?m=1`, then 200, canonical equal to the clean URL, no loop.
- Crawl stats **[USER exports]**: 7 Googlebot requests in 12 days; 71% were 302, 29% were 200; no host, DNS, or robots problems.
- No supported way to disable `?m=1` was found for the Contempo theme; the setting is not in the theme menu **[USER screenshot + ASSUME]**.
- Duplicate content: one post is 96% copied from the main-site article `/blog/best-car-detailing-in-bangalore`. A replacement draft (`blogger-draft-handover-inspection.md`) exists; it is not published.
- Validation "Validate Fix" was clicked by the user on 2026-11-10. Result not yet available.

### 13.5 Technical SEO acceptance checklist

Classes: PASS = verified complete; PARTIAL = some work remains; FAIL = not done or wrong; BLOCKED = needs the manager's information, external access or a manual action.

**A. The document's section 9 acceptance table**

| Requirement | Result | Evidence and what is needed |
|---|---|---|
| Valid marketing pages return HTTP 200 | **PASS** | 36 of 36 sampled pages 200 [PROD] |
| Permanently invalid spam URLs: 410 or genuine 404 | **PASS** (cosmetic note) | 22 of 22 and `/le48`: 410 + noindex. Content-Type is `text/plain`, not `text/html` as the PDF's example shows. |
| Unknown URLs: 404 | **PASS** | 404 on all tested unknown paths [PROD] |
| Permanent URL changes: 301 | **PASS** | `/index.html`, `/ppf-ceramic-coating`, `/service/glass-polishing`, http, www, trailing slash all 301, one hop [PROD] |
| Public API endpoints accessible to Googlebot | **PASS** | `/api/services`, `/api/business-hours`, `/api/services/<slug>` return 200 and valid JSON with a Googlebot user agent; `robots.txt` does not block `/api/` [PROD] |
| Public API responses: `X-Robots-Tag: noindex` | **PASS** | present on all three [PROD] |
| Marketing HTML: no accidental noindex | **PASS** | no marketing page has noindex; only the 6 intended pages (3 categories, 3 legal) plus the 404 and admin pages [PROD] |
| Canonical tags | **PASS** | absolute https, no trailing slash, self-canonical on all 36, 200 targets, UTM parameters keep the clean canonical [PROD] |
| Sitemap: only preferred indexable URLs | **PASS** | 31 URLs, all 200, none noindex, none redirecting, no API/admin/booking URLs [PROD] |
| Internal links correct and consistent | **PARTIAL** | All 104 links return 200 and none point to redirecting URLs. But service pages lack the required links to products and blog articles (see C). |
| Server rendering: meaningful initial HTML | **PARTIAL** | Title, description, canonical, H1 and internal links are in the first HTML of all pages. The `/service/*` pages serve only about 55–270 words, no FAQ and no photos in the first HTML; the full content appears after JavaScript (rendered pages: 164–392 words, up to 9 images) [PROD]. |
| API errors handled and logged | **PASS** | `/service/:slug` answers a database failure with 503 + `Retry-After` and `console.error`, never an empty page or a false 404 (`server/vite.ts`, in production; test `tests/service-page-unavailable.itest.mjs` passes) [LOCAL] |
| Security investigation: spam injection source checked | **PARTIAL** | Repo, git history, served HTML, bundles, sitemap, cloaking and injection markers checked, no sign of injection. Server logs, production DB, Cloudflare firewall events and the Search Console Security/Manual Actions screens were not accessible to me [ASSUME: external origin]. |

**B. Technical requirements (document sections 5–7)**

| Requirement | Result | Evidence |
|---|---|---|
| `robots.txt` as specified, sitemap line present, API not blocked | **PASS** | text matches exactly [PROD] |
| Meta robots `index,follow` on indexable pages; `noindex,follow` on excluded pages | **PASS** | verified on 37 pages [PROD] |
| Sitemap `<lastmod>` accurate | **PARTIAL** | 16 of 31 URLs have `lastmod` (only where a real date exists). Acceptable under the document ("when meaningful"). |
| Sitemap does not list `/sitemap.xml` | **PASS** | |
| `/sitemap.xml` served noindex | **PASS** | `X-Robots-Tag: noindex` [PROD] |
| Titles, descriptions and H1s unique | **PASS** | 0 duplicates across 37 pages; exactly one H1 per page [PROD] |
| Genuine 404 for other routes | **PASS** | |
| Googlebot accessibility | **PASS** | desktop and smartphone user agents get the same HTML as a browser (no cloaking); `scripts/seo-monitor.mjs` full run: no alerts [PROD] |

**C. Content and linking requirements**

| Requirement | Result | What is missing / needed |
|---|---|---|
| Homepage links to Services, PPF, Ceramic, Products, Blog, Contact | **PASS** | all six in the rendered page [PROD] |
| `/services` links to all individual service pages | **PASS** | 11 `/service/*` pages and 4 guides linked in plain HTML [PROD] |
| `/blog` article links in crawlable HTML | **PASS** | 8 links in the served HTML [PROD] |
| Service pages link to related services | **PARTIAL** | the 7 `/service/*` pages show 1–2 related-service links each |
| Service pages link to relevant **products** and **blog articles** | **FAIL** | 0 product links and 0 blog links on all 7 `/service/*` pages. Code-only fix; blog-article choices need confirming. |
| Blog articles link to services, products and Contact/booking | **PASS** | all 8 articles: 1–5 service links, 1–3 product links, contact, WhatsApp and phone links [PROD] |
| Ceramic pages: photos, process, FAQs; Bangalore guide vs car page overlap | **PARTIAL** | car and bike pages have photos (10 and 8), process, 8 FAQs each. Bike and car share most catalogue text; the guide and the car page were differentiated in `5e9bf02` (live). Project examples not confirmed. A 301 or consolidation decision is open. |
| `/blog/category/glass-film`: introduction, article links, or `noindex,follow` | **PASS** | `noindex,follow` is set; 67 words, 1 article link |
| Contact page content | **PARTIAL** | has business name, address, phone, WhatsApp, email, hours, Google Map, directions, form. **Missing: original studio photographs** (0 images) and explicit appointment/booking information beyond "Rather just book?". **BLOCKED on photos from the studio.** |
| STEK product page | **PARTIAL** | has description, finishes, warranty note, 4 photos, PPF links. **Missing:** FAQs, installation process, verified product specifications. **BLOCKED** on manufacturer-verified facts (document: "do not publish unverified manufacturer claims"). |
| Nasiol, P91 Premium PPF, `/products` | **PARTIAL** | pages exist with 4 images each; `/products` is thin (about 50 words, 0 images); no specs or FAQs. **BLOCKED** on verified specifications. |
| Service pages: unique H1/title, descriptions, photos, process, FAQs | **PARTIAL** | H1/title unique (PASS). Photos: 0 images on windshield coating, windshield polishing and the interior guide; some sliders have empty alt text. FAQs: none on 5 of 7 `/service/*` pages. Thin pages: annual maintenance about 164 words, headlight about 187. **BLOCKED** on real FAQ answers and photos. |
| Blog articles: original photographs | **PARTIAL** | 4 of 8 articles have 0 images. **BLOCKED** on photos. |
| Gallery: crawlable `<img>`, alt text, headings, links to services | **PASS** (one nit) | 26 images, all with alt text, 7 service links. 5 filenames are not descriptive (4 × `01.jpg`, 1 × `Car Care (4)_...png`). |
| Legal pages `noindex,follow` and out of the sitemap | **PASS** | |
| Annual maintenance title/price consistency | **PARTIAL** | the page title says ₹18,000 while the on-page offer price is ₹9,999 (₹18,000 is the struck-through original). Needs a business decision. |
| Bike catalogue FAQ "6-8 hours" vs the owner's 36–48 hours | **FAIL** (pending approval) | production still says "6-8 hours" [PROD]. The fix script `scripts/2026-11-05-bike-ceramic-duration-faq.mjs` is on `main` but has **not been run**. |

**D. Search Console validation steps (document section 8)** — all manual and **BLOCKED** on the user: Live Test screenshots for the homepage and each important service page; Request Indexing for important pages (quota-limited); "Start validation" (Soft 404 and Discovered started **[USER]**; Crawled failed for 2 URLs; Page with redirect not applicable). Screenshots (document deliverable 9) were not produced.

**E. The document's 10 final deliverables**

| # | Deliverable | Status |
|---|---|---|
| 1 | List of modified URLs | Section 4 of the Lighthouse report and sections 7 and 11–12 here list the changes; not one consolidated list. PARTIAL |
| 2 | Spam URLs checked and their HTTP codes | Done: 13.2 (22 of 22 are 410) |
| 3 | Confirmation the source was investigated | Done, with limits (13.5 A, security row) |
| 4 | Updated sitemap | Live and verified (31 URLs) |
| 5 | Updated `robots.txt` if needed | No change needed; matches the document |
| 6 | Examples of corrected canonical tags | Done: e.g. `/services/ceramic-coating-bangalore` self-canonical (13.2 table) |
| 7 | Rendered HTML examples for service pages | Not saved as a deliverable. Rendered DOM dumps were taken for 37 pages for this audit only. PARTIAL |
| 8 | API response header verification | Done: `X-Robots-Tag: noindex`, 200, valid JSON |
| 9 | Search Console Live Test screenshots | **BLOCKED** (manual) |
| 10 | Confirmation no important page has accidental noindex | Done: 13.5 A |

### 13.6 Code and deployment verification

**Git state [LOCAL]**
- Current branch: `seo/monitoring`, pushed to origin and level with `origin/seo/monitoring`. It is **5 commits ahead of and 19 behind `origin/main`**.
- Committed on this branch only (not in `main`, so **not in production**): `scripts/seo-monitor.mjs`, `scripts/seo-monitor-baseline.json`, REPORT.md sections 10–12 and `blogger-draft-handover-inspection.md`. None of these affects the website.
- Uncommitted: `REPORT.md` (section 12.7 and this section 13). Untracked: `.claude/settings.json` and two `.mp4.bak` files (63 MB). None should be committed.
- Local `main` is 22 commits behind `origin/main` (stale local copy).
- Branches with commits not in `origin/main`: `add-ppf-leads-table` (2 old commits, protection challenge, unrelated), `replit-agent` (231 old commits, 2026-03), `seo/monitoring` (this work). **All other `seo/*`, `fix/*`, `perf/*` branches, including `seo/manager-requirements`, `seo/audit-fixes`, `seo/sitemap-home-links` and `seo/schema-hours`, are fully merged into `origin/main`.** No reported SEO fix exists only on a local or side branch.
- Pull request #1 (`seo/guide-landing-links`) was merged into `main`; it carried the ceramic copy fix (`5e9bf02`) and the guide-link feature.

**Production versus `main` [PROD]** (checked by behaviour; the deploy history itself was not visible to me [ASSUME that `main` HEAD `c65f0c6` is deployed, since a deploy-only commit cannot be tested by behaviour]):
- Ceramic copy fix `5e9bf02`: present (new guide lede and car-page wording live).
- `a9dbb17` (`/index.html` 301): present. `9c08548` (FAQPage in guide HTML): present. `e54c70a` (`hasMap` schema): present. `74d8315` (Services menu links): present. `7a3f5c9` / `bcc6575` (410 handling): present.
- NOT in production because never run: the bike-FAQ database script, and the monitoring script (not site code).
- Production fixes recorded as live from earlier work: `f8d7241` (technical-brief robots meta and sitemap changes), `684ce49`, `5b92647`, `a173a0a`, `04fc046`, `59c3d32`, `ad7408d`.

**Tests [LOCAL]**
- `npm test` (Node 24.18): **467 tests, 467 pass, 0 fail**.
- Integration tests relevant to this task, run individually with `node --import tsx --experimental-test-module-mocks --test`: `gone-paths`, `trailing-slash`, `canonical-host`, `sitemap-indexable`, `service-page-unavailable`, `security-headers`: **41 tests, 41 pass, 0 fail**. (The 2026-11-05 Lighthouse report said the sitemap integration test could not run; it ran and passed this time.)
- Not run: the other six `*.itest.mjs` suites (booking, payment, campaign, admin campaigns, offers, landing booking). They exercise payments and the database, which are unrelated to this task and unsafe to point at production data. Not needed for the SEO acceptance criteria.
- Monitoring script `node scripts/seo-monitor.mjs` (full run): 31 pages, 23 spam URLs, **no alerts** [PROD].
- Cloud monitoring routines: **not working.** They failed on 2026-11-09 and 2026-11-10 (organization had disabled Claude Code subscription access) and, on the one run after that, because the cloud sandbox cannot reach `p91carcare.com` (network allowlist). No automated daily or weekly check is currently running [USER action needed].

### 13.7 Lighthouse and performance (manager's brief)

Fresh runs on 2026-11-10, Lighthouse 12 CLI, headless Chrome, simulated throttling, 3 runs per form factor, medians reported **[PROD, LOCAL machine]**. Machine on AC power, "Balanced" power plan; CPU benchmarkIndex 790–1359; 3 of 9 runs carried the "slower CPU than expected" warning (run values are noisy, as documented in the 2026-11-05 report). Raw JSON is in the scratch folder, not in the repo.

| Page / form factor | Perf (runs) | A11y | Best Pract. | SEO | LCP | FCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|---|
| Home, **mobile** | **87** (87 / 74 / 90) | 100 | 100 | 100 | 3.1 s | 2.6 s | 237 ms | 0 | 3.6 s |
| Home, **desktop** | **94** (95 / 94 / 89) | 100 | 100 | 100 | 1.1 s | 0.9 s | 0 ms | 0 | 1.9 s |
| `/ppf`, mobile | **72** (72 / 71 / 72) | 100 | 100 | 100 | 4.7 s | 3.3 s | 199 ms | 0.028 | 4.2 s |

Manager's original scores versus now: Performance 42 → 87 (home mobile); Best Practices 73 → 100; Accessibility 100 → 100; SEO 100 → 100. FCP 3.7 s → 2.6 s; LCP 5.7 s → 3.1 s; TBT 1,860 ms → 237 ms; Speed Index 4.6 s → 3.6 s **[PROD]**.

**Targets**

| Target | Result |
|---|---|
| Performance 90+ | **PARTIAL.** Desktop home 94 (met). Mobile home median 87 (one run 90); `/ppf` mobile 72. |
| Accessibility 100 | **PASS** (all runs) |
| Best Practices 95+ | **PASS** (100 on all runs) |
| SEO 100 | **PASS** (all runs) |
| LCP below 2.5 s | **PARTIAL.** Desktop 1.1 s (met). Mobile home 3.1 s (best run 2.7 s) and `/ppf` 4.7 s: not met. |
| TBT below 200 ms | **PARTIAL.** Desktop 0 ms; mobile home median 237 ms (runs 87–285), `/ppf` median 199 ms. Borderline. |
| CLS below 0.1 | **PASS** (0 to 0.028) |

**Brief items A–F [PROD unless noted]**

| Item | Result |
|---|---|
| JS execution and main-thread time | Boot-up 0.6 s and main-thread work 2.6 s on a mobile home run (brief: 3.3 s and 8.3 s). Third-party tags deferred (4 s after load or first interaction) — present in code and in production |
| Unused JavaScript | 0 bytes flagged on the sampled run (brief: 69 KB) |
| Unused CSS | about 30 KB flagged (brief: 30 KB). **Not reduced.** Render-blocking CSS also remains by design (async CSS was tried and made TBT worse, 2026-11-05) |
| Image optimisation | Home page uses AVIF/WebP (11 WebP, 1 AVIF, 3 JPG, 2 PNG); LCP image is an AVIF; images have width/height. Largely done |
| Third-party scripts | Google tag, Clarity and Google Ads deferred, queued stubs keep events; the Cloudflare Google-tag-gateway duplicate was disabled earlier (`/le48`). The dual GA4 reporting to `G-QXEEJ4EK4J` is treated as intended [USER, from earlier session]. |
| Compression | **Brotli active** (`content-encoding: br`) on HTML, JS and CSS |
| Caching | Hashed JS, CSS and fonts: `public, max-age=31536000, immutable`. HTML: `max-age=0` (deliberate; a Cloudflare HTML cache rule broke auto-deploy and was removed) |
| Console errors | none on the sampled run |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` present. HSTS present with max-age 15552000 (about 180 days) **without** `includeSubDomains`/`preload`. **No Content-Security-Policy. No Trusted Types.** No COOP isolation. These are informational Lighthouse checks and do not lower the Best Practices score (100). **Not done.** |
| Third-party cookies | Not changed; depends on Google and Clarity tags |

The brief asks for a proposed action plan and completion timeline: no plan or timeline was written. The earlier work (sections 2–4 of `lighthouse-reports-2026-11-05/REPORT.md`) is the record of what was implemented.

### 13.8 Remaining issues and priorities

| Priority | Issue | Type |
|---|---|---|
| **High** | No automated monitoring is running (cloud routines blocked) | access |
| **High** | 16 spam URLs still "Soft 404" in Google's records; need Google to recrawl (nothing to change on the site) | waiting |
| **High** | 19 pages "Crawled, currently not indexed" and 12 sitemap URLs not yet crawled | waiting / content |
| **High** | Service pages lack links to products and blog articles (7 `/service/*` pages, 4 guides) | code, needs approval |
| **Medium** | FAQs missing on 5 of 7 `/service/*` pages; photos missing on 3; thin pages | content (**BLOCKED** on facts and photos) |
| **Medium** | Contact page lacks studio photos; STEK/product pages lack FAQs, process, verified specs | content (**BLOCKED**) |
| **Medium** | Bike catalogue FAQ still says "6-8 hours" (owner says 36–48 h) | database change needs approval; script ready, not run |
| **Medium** | `/service/*` initial HTML thin (first-paint content is added by JavaScript) | code, needs approval |
| **Medium** | Mobile Lighthouse: LCP 3.1 s (target 2.5 s), `/ppf` 4.7 s, performance 87 and 72 (target 90) | performance work |
| **Medium** | Blogger posts: "Redirect error" persists; 96% duplicate post | Blogger (manual) |
| **Low** | `//services` returns 200 | code |
| **Low** | 410 sent as `text/plain` rather than the document's `text/html` | code |
| **Low** | 5 non-descriptive gallery filenames; annual-package title says ₹18,000 vs ₹9,999 | content |
| **Low** | No CSP, Trusted Types, or HSTS `includeSubDomains`/`preload` | security hardening |

### 13.9 Manual actions

**You or your manager**
1. Search Console, main property: run Test Live URL on the homepage and each important service page; save screenshots (document deliverable 9). Request indexing in small batches when quota allows. Do not restart validation yet.
2. Provide real facts and files: studio photographs (contact page, blog articles, service pages), FAQ answers for the 5 service pages with none, manufacturer-verified STEK specifications, and a decision on the annual-package price.
3. Approve the bike FAQ database change (36–48 hours), and decide on the ceramic guide versus car page (keep both, or 301).
4. Check Search Console Security Issues and Manual Actions for both properties (reported clear **[USER]**).
5. Re-enable monitoring: allow `p91carcare.com` in the cloud environment's network allowlist, or run `node scripts/seo-monitor.mjs` locally or from a Windows scheduled task.
6. Blogger: replace the duplicate post with the draft (fill or delete the 3 `[P91: ...]` brackets), and check the Blogger Crawl stats again in a few days.
7. Optional: review server access logs and Cloudflare firewall events for the spam-URL source (logs were not accessible to me).

**Needs your approval before I act**
- Merge `seo/monitoring` to `main` (adds only scripts and docs, but any merge to `main` triggers the production auto-deploy).
- Code changes: related product and blog links on service pages, FAQs rendered into the first HTML, `//services` handling, 410 content type.

### 13.10 Final completion status

**The manager's URL-correction and technical-SEO task is NOT fully complete. It is complete for the technical URL-correction part and in production, and incomplete for content and some verification.**

- **PASS, verified in production:** all 22 spam URLs return 410; unknown URLs return 404; permanent changes return 301 with one hop; no redirect to the homepage; sitemap, canonicals, robots meta, `robots.txt`, API headers and error handling are correct; no invalid URLs or links; the site is indexed again (homepage "Submitted and indexed"); 467 of 467 unit tests and 41 of 41 relevant integration tests pass.
- **PARTIAL:** content requirements (service-page links to products and blog, FAQs, photos, contact page photos, STEK/product specs, thin pages); initial-HTML content on `/service/*` pages; the spam-source investigation (server logs and Search Console security screens not available); Search Console recovery (16 of 22 Soft 404 not yet recrawled, 19 crawled-not-indexed, 12 uncrawled); Lighthouse mobile targets (performance 87 vs 90, LCP 3.1 s vs 2.5 s, `/ppf` 72).
- **FAIL / pending:** bike catalogue FAQ still states "6-8 hours"; no automated monitoring running; no performance action plan or timeline written.
- **BLOCKED:** Search Console Live Test screenshots and Request Indexing (manual); real photos, FAQ answers and verified specifications from the business.
- **Blogger (separate property):** unresolved "Redirect error" on 2 posts; duplicate post not yet replaced.


---

## 14. Implementation pass, 2026-11-10 (safe code improvements)

Everything below was done in a **separate git worktree** `D:\company project\CarCareBooker\CarCareBooker-svc` on a new branch `seo/service-links-html`, created from `origin/main` (`c65f0c6`). **Nothing is committed, pushed, merged or deployed, and no production data was touched.** The local build and the checks use read-only GET requests to the live API.

Evidence labels: **[LOCAL]** repo, build or test run; **[PROD-READ]** read-only GET against production; **[ASSUME]** inference.

### 14.1 Status at a glance

| Item | Status |
|---|---|
| 1. Product and blog links on the 7 `/service/*` pages | **Implemented locally**, tested, visually checked at 390 px and 1280 px |
| 2. Thin initial HTML on `/service/*` | **Investigated.** Cause found. Safe partial improvement implemented (links and duration in the first HTML). The remainder depends on content that does not exist in the database. |
| 3. Bike FAQ 6–8 h to 36–48 h | **Prepared, not run.** Script inspected; needs your approval to run against production |
| 4a. 410 body is `text/plain` | **Fixed locally** (small `text/html` page with noindex) |
| 4b. `//services` returns 200 | **Fixed locally** (301 to `/services`) |
| 4c. Descriptive gallery filenames | **Proposal only**; no rename recommended (see 14.6) |
| 4d. Annual-package price | **Verified, not changed**; it is a database field and a business decision |
| 5. Mobile Lighthouse plan | **Written**: `MOBILE-PERFORMANCE-PLAN.md`. No performance change was made. |

### 14.2 Service-page linking (item 1)

Files changed [LOCAL]:
- `client/src/lib/service-related-links.ts` (new): the link map. Descriptive anchor text, no generic anchors.
- `client/src/pages/service-landing.tsx`: renders a section "Related guides, products and reading" from the map, using the existing `.mini-grid` / `.mini` card classes, placed after the existing "Other services" block. Routes, SEO metadata, booking flow and design are untouched.
- `client/src/lib/crawlable-content.ts`: the same links appear in the first HTML that crawlers read (see 14.3).
- Tests: `tests/seo-foundation.test.mjs` (6 new tests).

The topic match was checked against the blog posts' own text (hard water, windshield and glass, interior, headlight coverage in the PPF article). **Superseded by section 15:** the first version linked single brand pages (STEK, Nasiol) from three service pages. None of the seven catalogue records names a brand, so that could read as "this service uses that brand". The corrected map below links **only the /products hub, with a label that names no brand**, from every page.

| Service page | Related service links | Products link | Article links |
|---|---|---|---|
| `/service/exterior-detailing-hard-water-new` | Ceramic coating guide; All services | Products hub | Hard water spots; Monsoon damage |
| `/service/headlight-restoration-both` | PPF guide; All services | Products hub | How much PPF your car needs; How to choose a studio |
| `/service/interior-detailing-service` | Interior detailing guide; All services | Products hub | How to choose a studio; Monsoon damage |
| `/service/premium-car-wash-special` | All services (the ceramic guide was removed, see section 15) | Products hub | Hard water spots; How to choose a studio |
| `/service/windshield-glass-coating-new` | Sun control film and glass guide; All services | Products hub | Windshield heat rejection film; How to choose a studio |
| `/service/windshield-glass-polishing` | Sun control film and glass guide; All services | Products hub | Windshield heat rejection film; How to choose a studio |
| `/service/annual-maintenance-package` | Interior detailing guide; All services | Products hub | How to choose a studio; Monsoon damage |

Hub anchor text (all seven pages): "Browse the films and coatings P91 Car Care fits, on the products page". The section heading is "Related guides, products and reading".

Editorial note for the business [ASSUME]: the pairings are topic-based and live in one file, `client/src/lib/service-related-links.ts`. Your manager may prefer different ones.

Verified [LOCAL]:
- Rendered through a local build at 390 px and 1280 px on all 7 pages: the section appears with 5 cards (4 on the car-wash page, see section 15), **no horizontal overflow, exactly one `<h1>`, zero console errors, layout shift 0**. The page grows by about 686 px on mobile (664 px on the two windshield pages). I looked at the mobile and desktop screenshots of one page and they match the existing card styling.
- `tsc` reports the same 35 pre-existing errors as `origin/main`, none in the changed files.
- Not verified: a real (non-preview) server response with the database, because that would connect to production. The unit tests cover `servicePageContent()`.

### 14.3 Thin initial HTML (item 2)

Finding [LOCAL + PROD-READ]:
- The server already injects the full catalogue record into the first HTML (`servicePageContent`): H1, description, price, included items, "why choose", process steps and FAQs. The pages are thin **because those database rows are thin**, not because rendering is broken. The live records: headlight, interior, car wash, exterior and annual have **no FAQ rows and no process rows** (0 and 0); the windshield pages have 5 FAQs and no process; "why choose" text is 191–234 characters; the annual package has none.
- The rest of the rendered page (sliders, photos, "why choose P91" boilerplate, studio information) is added by React after load. The first HTML has no images by design (the snapshot is hidden off-screen; adding images would only add bytes before the first paint).
- The snapshot is replaced by React (`createRoot`, not hydration), so adding to it cannot cause a hydration mismatch, a layout shift or a second `<h1>`. It is positioned off-screen, so it is not painted.

Implemented [LOCAL]: the first HTML for each of the 7 pages now also carries (a) the same duration the page shows ("Time at the studio: about 4 hrs.", from the same `formatServiceTime` function, so it cannot disagree with the page; omitted when the record has no plausible duration) and (b) the related-links section, 5 descriptive links. Unit tests assert one `<h1>`, the links and labels, and the duration line.

Cannot be solved with code (needs business information or approval):
- FAQ answers for 5 service pages and process steps for 7 records. Writing them would invent business facts. Real answers can be added in the admin panel or with a data script.
- Photos in the first HTML: needs a decision. Recommended not to bake images into the snapshot.

### 14.4 Bike FAQ correction (item 3)

Script: `scripts/2026-11-05-bike-ceramic-duration-faq.mjs`, already on `main`. Inspected [LOCAL]:
- Data-only change; **no schema migration** (`services.faq` is `jsonb`). Dependencies `@neondatabase/serverless` and `ws` are in `package.json`. Syntax check passes.
- It selects the row `1-year-bike-ceramic-coating`, finds the FAQ "How long does the application process take?", and replaces **only that answer**, and only while it still contains "6-8 hours" (idempotent). It prints BEFORE and AFTER. Dry run by default; `--apply` is required to write; it sets `updated_at`.
- Without a database URL it exits with an error and touches nothing (tested).
- Proposed text: "The complete process takes 36 to 48 hours, including paint preparation, correction, coating application and curing. Plan to leave your bike with us for that time."
- The catalogue duration for the bike is already 2880 minutes, and `service-time.ts` already shows "36-48 hrs" on the page. So the correction aligns the FAQ with what the page already says.
- The bike page and its FAQPage JSON-LD read the live row per request, so the change appears without a deploy.

To run it (needs your approval; this connects to production):
1. Dry run: `CARCARE_TARGET_DATABASE_URL=<production url> node scripts/2026-11-05-bike-ceramic-duration-faq.mjs` (reads one row, prints BEFORE/AFTER, writes nothing).
2. If the output is right: add `--apply`.
3. Verify: `curl -s https://p91carcare.com/api/services/1-year-bike-ceramic-coating` shows the new answer.
4. Rollback (manual): the old answer was "The complete process takes 6-8 hours including paint preparation, correction, coating application, and curing. We recommend leaving your bike with us for the day to ensure perfect results." Restore it with the same script logic reversed, or in the admin panel.

Related finding [PROD-READ]: the **car** ceramic FAQ also says "6-8 hours" while its catalogue duration is 1440 minutes (24 h). The real car time is unknown to me; ask the studio before changing it.

### 14.5 Minor SEO issues (item 4a, 4b)

**410 response body.** Cause: `server/middleware/gone-paths.ts` and the trailing-slash middleware sent `text/plain` "Gone". Change [LOCAL]: a new `server/lib/gone-response.ts` sends a minimal page (`text/html`, `X-Robots-Tag: noindex`, a noindex meta, `<h1>410 Gone</h1>`, no scripts, links or app shell), shared by both middlewares. Status code is unchanged (410). Tests assert status, content type, header, no redirect, and no script, link or app root.

**`//services` returns 200.** Cause: the trailing-slash middleware only acted on paths ending in `/`, so a path starting with extra slashes fell through to the page. Production returns 200 with canonical `/services`, so it was a second live URL. Change [LOCAL]: a path beginning with `//` now 301s to the single-slash path (query kept). The Location is always a same-host single-slash path (`//evil.com` goes to `/evil.com`, `//` to `/`). GET and HEAD only; POST is untouched. Tests cover these cases.

Test results [LOCAL]: `gone-paths`, `trailing-slash`, `canonical-host`, `sitemap-indexable`, `service-page-unavailable` and `security-headers` integration suites: **44 of 44 pass**. The 16 tests for the first three also pass on their own.

### 14.6 Gallery filenames and the annual price (item 4c, 4d)

**Gallery filenames** [LOCAL]: the four `01.jpg` files are the first slides of four blog carousels. Their URLs already carry a descriptive folder, for example `/attached_assets/carousels/ppf-vs-ceramic/01.jpg`. The fifth item, `Car Care (4)_...png`, is the site logo, not a gallery photo. Alt text is present on all 26 gallery images. Renaming would change `slideSrc()` and the image manifest, and old URLs would break unless duplicated, for no real SEO gain. **No rename recommended.** If wanted later, names such as `ppf-vs-ceramic-slide-01.jpg` could be added as copies while the old paths keep working. Nothing was changed.

**Annual-package price** [PROD-READ]: confirmed. The database field `metaTitle` for `annual-maintenance-package` is "Annual Maintenance Package - ₹18,000 | P91 Car Care". The same row has `price` 9999 and `originalPrice` 18000, and the page shows ₹9,999 with ₹18,000 struck through. So the page title advertises the original price. It is a database value (not code), so nothing was changed. Options for the business: change the meta title to ₹9,999, or drop the price from the title (a price in a title also goes stale). Needs a business decision and a data update.

### 14.7 Tests, build and route checks

- `npm test`: **488 tests, 488 pass, 0 fail, 0 skipped** [LOCAL] (before the change: 467; the increase is the new tests plus the build-dependent test that runs when a build exists).
- `npx vite build`: succeeds. `node scripts/prerender.mjs`: succeeds (31 routes plus 404.html). [LOCAL]
- Integration suites listed in 14.5: 44 of 44 pass. The other `*.itest.mjs` suites (booking, payment, campaigns, offers) were not run; they use payments and the database and are unrelated to these changes.
- Routes checked with a local read-only preview server (static build plus the live API for data): all 7 `/service/*` pages [LOCAL + PROD-READ].
- Not done: a real Express boot, because it connects to the production database; and a Lighthouse re-run of the changed pages, since the change adds one static section below the fold and no scripts or images. A before/after Lighthouse comparison should be part of the review.

### 14.8 Performance plan (item 5)

`MOBILE-PERFORMANCE-PLAN.md` (repo root of the main checkout, uncommitted) contains the current numbers from fresh runs, the LCP breakdown, measurable interim and final targets, seven proposed changes with evidence, risk and effort estimates, the changes already rejected with measurements, and the verification protocol. No performance change was made. The largest remaining costs are the 880–890 ms document response, one render-blocking stylesheet (300 ms on home, 1,300 ms on `/ppf`), React-rendered LCP on `/ppf` (1.6 s load delay plus 1.5 s render delay) and long JavaScript tasks.

### 14.9 What remains, and what it depends on

| Item | Depends on |
|---|---|
| Review, then commit, push and merge branch `seo/service-links-html` | **Your approval.** A merge to `main` triggers the production auto-deploy (4–25 minutes). |
| Run the bike FAQ script against production | **Your approval** (and a production database URL) |
| FAQ answers for 5 service pages, process steps, longer "why choose" text | **Business information** from the studio; no invented content |
| Studio photos on the contact page and blog articles; verified STEK specifications | **Business information / files** |
| Annual-package meta title (₹18,000 vs ₹9,999) and the car FAQ duration (6–8 h vs 24 h) | **Business decision** |
| Different link pairings on the service pages | **Manager's editorial preference** (one file) |
| Mobile performance items A–G | **Your approval** per item; D and F also need Cloudflare access and a decision |
| Cloud monitoring routines, Search Console Live Test screenshots, Request Indexing, Blogger fixes | **Manual or external access**, as listed in section 13.9 |

### 14.10 Files changed in the worktree (uncommitted)

Modified: `client/src/lib/crawlable-content.ts`, `client/src/pages/service-landing.tsx`, `server/middleware/gone-paths.ts`, `server/middleware/trailing-slash.ts`, `tests/gone-paths.itest.mjs`, `tests/seo-foundation.test.mjs`, `tests/trailing-slash.itest.mjs`. New: `client/src/lib/service-related-links.ts`, `server/lib/gone-response.ts`. 7 files changed, 213 insertions, 14 deletions, plus the 2 new files. The worktree branch `seo/service-links-html` has no commits of its own yet.


---

## 15. Review corrections and merge plan (2026-11-10)

### 15.1 Independent review of `origin/seo/service-links-html` (tip `2f9375f`) and the corrections

An independent review before merge found three links that could be read as brand claims, and one weak link. Evidence [PROD-READ + LOCAL]: none of the seven catalogue records mentions STEK, Nasiol, film or ceramic. The two windshield services are glass *coating* and *polishing*, not film. The exterior hard-water service lists "Protective wax application", not a coating.

Corrections (commit `936acb0`, on top of the two earlier commits, pushed to the same branch):

| Change | Detail |
|---|---|
| Windshield glass coating and polishing | STEK sun-control film link replaced by the `/products` hub |
| Exterior detailing (hard water) | Nasiol ceramic coating link replaced by the `/products` hub |
| Hub anchor text, all seven pages | "Browse the films and coatings P91 Car Care fits, on the products page". Names no brand. |
| Car-wash page | Ceramic coating guide link **removed**. No replacement: the page already lists exterior detailing as a related service, so any other link would duplicate it or be weak. The page keeps 4 cards (all services, products hub, two articles). |
| Wording | The section heading and the card tag now say "products" instead of "brands", in the page and in the first HTML |

Tests and checks after the corrections [LOCAL]:
- `npm test`: **490 tests, 490 pass, 0 fail, 0 skipped**.
- The 6 integration suites (`gone-paths`, `trailing-slash`, `canonical-host`, `sitemap-indexable`, `service-page-unavailable`, `security-headers`): **44 of 44 pass** (33 without a build present, since 11 `sitemap-indexable` tests need `dist/`).
- `vite build` and `scripts/prerender.mjs`: succeed. `tsc`: the same 35 pre-existing errors as `origin/main`, none in the changed files.
- New tests: no service page links a single brand page; the hub label names no brand, in both the page data and the first-HTML block; the car-wash page has no ceramic guide link and keeps its two articles. A mutation check (temporarily putting a STEK link back) made the new test fail, then the file was restored.
- Browser check of the rebuilt pages at 390 px and 1280 px on all 7 pages: no horizontal overflow, exactly one `<h1>`, zero console errors, layout shift 0. Six pages show 5 cards; the car-wash page shows 4.
- First HTML versus the rendered page, all 7 pages: the related links are identical in destination, anchor text and order; every label appears in the rendered page; the heading appears in both; no link to a brand page.

Not changed by this correction: the 410 and `//` middleware, the bike FAQ script (never run), the annual-package price, Blogger, any production data.

### 15.2 Merge order and report reconciliation (Plan A, tested, not performed)

Both branches change `REPORT.md`, and only that file conflicts. `seo/monitoring`'s `REPORT.md` is a byte-for-byte prefix of the one on `seo/service-links-html`, which adds sections 12.7, 13, 14 and 15. So the version on this branch is the complete one.

Plan A, verified in a temporary local worktree on 2026-11-10 (the temporary worktree and branch were deleted; nothing was pushed):
1. Merge `seo/service-links-html` into `main` first (fast-forward; the branch is based on the current `origin/main`). **A merge to `main` triggers the production auto-deploy.**
2. Then merge `origin/seo/monitoring` into `main`. Git stops with a conflict in `REPORT.md` only.
3. Resolve it with the `main` side: `git checkout --ours REPORT.md`, then `git add REPORT.md` and commit. The result is identical to the service-links branch's `REPORT.md`, so no section is lost.
4. The merge adds exactly three files: `scripts/seo-monitor.mjs`, `scripts/seo-monitor-baseline.json` and `blogger-draft-handover-inspection.md`. None affects the running website.
5. Check afterwards: `git diff origin/seo/service-links-html -- REPORT.md` shows nothing.

Fallback (Plan B, also tested): commit this branch's `REPORT.md` onto `seo/monitoring` first; a later merge then has no conflict.

**Neither merge has been performed.** Both wait for your explicit approval.

### 15.3 Merge readiness after the corrections

| Check | Result |
|---|---|
| Diff contains only intended changes | PASS |
| Link pairings: no misleading brand association | **PASS** (corrected) |
| First HTML consistent with the rendered page | PASS |
| 410 and `//path` middleware, valid routes | PASS (Cloudflare behaviour for `//` unverified) |
| Tests and build | PASS |
| Independent of `seo/monitoring` | PASS |
| Report reconciliation plan | PASS (tested) |
| Real-database boot and staging test | **BLOCKED** (not available) |

Remaining before or after merge: the production auto-deploy follows any merge to `main`; after deploy, check one `/service/*` page's first HTML and rendered links, one 410 (`text/html`) and `//services` (301), and run `node scripts/seo-monitor.mjs` locally. The bike FAQ script, the annual-package price, FAQ and photo content, and the manager's choice of link pairings still depend on you, your manager or the business, as listed in section 14.9.


---

## 16. Pre-merge sitemap, robots.txt and discovery-file verification (2026-11-10)

Question: does merging `seo/service-links-html` require any change to `sitemap.xml`, `robots.txt` or other discovery files? **Answer: no. Nothing was changed.**

All checks are against production with a Googlebot user agent [PROD], unless marked [LOCAL].

### 16.1 `sitemap.xml`

| Check | Result |
|---|---|
| Served | 200, `application/xml`, `X-Robots-Tag: noindex` (a resource, not a search result), valid XML with the sitemap namespace |
| Entries | 31, no duplicates, all absolute `https://p91carcare.com`, no trailing-slash (except the root), no query strings, no off-host URLs |
| `lastmod` | present on 16 entries, none invalid, none in the future |
| The seven `/service/*` pages | **all seven present**: annual-maintenance-package, exterior-detailing-hard-water-new, headlight-restoration-both, interior-detailing-service, premium-car-wash-special, windshield-glass-coating-new, windshield-glass-polishing |
| Every sitemap URL fetched | **31 of 31: HTTP 200, no redirect, canonical equal to the sitemap URL, meta robots `index,follow`, no `X-Robots-Tag`**, `text/html` |
| Redirecting, noindex, 404 or 410 URLs in the sitemap | **none** (0 problems) |
| Consolidated PPF and ceramic variant pages (`/service/ppf-sedan` and similar) | correctly **not** in the sitemap: they canonicalise to `/ppf`, `/ceramic-coating/car` or `/ceramic-coating/bike` |
| Noindex pages (3 blog categories, 3 legal pages) | correctly not in the sitemap |

### 16.2 Does the branch change what the sitemap should contain?

- The branch changes **no sitemap, robots, llms.txt, IndexNow or canonical-mapping code**: of its 11 files, none matches those names, and neither `server/routes.ts` nor `client/src/lib/canonical-overrides.ts` is touched [LOCAL].
- It adds **no new URL and no new route.** It adds links and one in-page section only.
- Every destination of the new links is already in the sitemap and returns 200: `/products`, `/services`, the four `/services/*-bangalore` guides and the five blog posts used [PROD + LOCAL]. So no link points at a URL the sitemap would need to gain or lose.
- The sitemap is generated from the live active-service rows, so adding or retiring a service in the admin panel already updates it without a deploy. The `//path` redirect and the `text/html` 410 do not affect any sitemap URL (all 31 are clean, slash-free paths).

### 16.3 `robots.txt`

Unchanged and correct: `Allow: /`; `Disallow: /admin/`, `/api/admin/`, `/booking-confirmation/`; `Sitemap: https://p91carcare.com/sitemap.xml`. It does not block `/api/` (pages render from it) or any page in the sitemap. No change needed.

### 16.4 Other discovery files

| File | Status | Needs a change? |
|---|---|---|
| `/llms.txt` | 200, 35 URLs, all return 200; lists all seven `/service/*` pages | No. It also lists the six PPF variants, the two ceramic variants, `/refund-policy` and the root without a slash. They are not sitemap entries (llms.txt is not a sitemap and is for AI readers, not Google), they return 200, and nothing here is wrong. Optional tidy-up for later, not part of this task. |
| `/site.webmanifest` | 200 | No |
| `/ads.txt`, `/humans.txt`, `/.well-known/security.txt`, `/sitemap_index.xml`, `/news-sitemap.xml` | 404 (do not exist) | No. None is required. |
| IndexNow (`scripts/indexnow.mjs`) | not run | Not needed for this merge. It notifies Bing and others, not Google, and only about URLs that exist or changed. No URL is new. It could be run after deploy if you want Bing to recrawl the seven pages; that is optional. |

### 16.5 Conclusion

`sitemap.xml`, `robots.txt` and the other discovery files are correct and **need no modification** for this merge. They were left unchanged. Reminder: after the deploy (a merge to `main` triggers it), re-run `node scripts/seo-monitor.mjs` locally; it re-checks the same sitemap conditions.
