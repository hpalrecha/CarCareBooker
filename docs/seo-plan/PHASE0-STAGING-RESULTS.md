# Phase 0 and approved link work: staging results

Date: 20 November 2026. Branch `seo/phase0-links-claims` (worktree `D:\p91-phase0`, from origin/main `95a2ead`, head `384a518`). **Not pushed, not deployed. No production data, database, DNS, Cloudflare setting, sitemap or redirect was changed.** Everything below was run against a local staging copy.

## 1. What was implemented (5 commits)

| Commit | What | Your condition |
|---|---|---|
| `455370f` claims | "100% safe", "permanent bond", "certified technicians" and "9H" are dropped from every customer-facing surface: public `GET /api/services` and `/api/services/:slug`, the server-rendered HTML, the FAQPage JSON-LD, the page. Drop-only: a list item, a whole FAQ entry or a sentence goes; nothing is reworded or added. The database and the admin endpoints are untouched, so editing in the admin panel can never save a filtered copy. | 5 |
| `20acb31`, `384a518` first-HTML parity | The text the finished page shows is now in the first HTML response: How it works, Visit the studio block, reviews, brand rows, "Which one do you need?", gallery captions and reel captions, service descriptions, the PPF statement, photo headings, article cards. One shared source for each (`studio-sections-data.ts`, `products-page-data.ts`, `gallery-photos.ts`, `landing-pages.ts`), so page and snapshot cannot drift. | 3 |
| `9ff976f`, `384a518` links | Approved internal links only: sibling links on the 7 service pages, 5 to 6 extra links on each of the 3 landing pages, brand pages retargeted to the price pages they sell, 2 `/contact` links inside existing sentences, an "All guides" link. Anchors reuse existing labels (nav, brand, page names). | 2 |
| `bde7238` | type fix: zero new TypeScript diagnostics | |

Not touched (your conditions): the 16 spam URLs and the 410 handling (pinned by `tests/spam-soft404-urls.test.mjs`, still green), every booking-record URL (`/service/ppf-*`, `/service/1-year-*`) and its canonical, any price, cure time, warranty wording or database row, the approved copy.

## 2. How staging was built (same method as 18 Nov)

PostgreSQL 18 (embedded) on `127.0.0.1:54329`; schema from the repo; 15 catalogue rows loaded earlier from the live public API (GET only); the app built from this branch (`npm run build:app`) and started with `NODE_ENV=production` in a clean environment with local-only variables, a guard that exits if `DATABASE_URL` is not the local database, no payment or messaging keys. Nothing was written to production. The raw catalogue rows in staging still contain the four claims, so the filter is tested against real data. Ports stay local; the server runs on `127.0.0.1:5099`.

## 3. Results

| Check | Result |
|---|---|
| Unit and regression tests | **661 run, 661 pass, 0 fail, 0 skipped.** Baseline origin/main: 645 run, 643 pass, 0 fail, 2 skipped (those 2 need a build output, which this run had). 8 new tests: 6 for the claims filter, 2 for the link wording |
| Integration tests | 471 run, 427 pass, **44 fail, the same 44 as the baseline** (Diwali offer, payment and webhook mocks). Failing-test names diffed against the earlier baseline: identical. Baseline was the 18 Nov run; it was not repeated on today's origin/main |
| TypeScript | 34 diagnostics on the branch, 34 on the baseline, same files |
| Production build and prerender | succeeds, no warnings |
| Staging app log | no error lines |
| 40 URLs fetched (all sitemap pages, noindex pages, booking-record pages) | all 200, 0 invalid JSON-LD blocks, exactly one H1 on each, self-canonical on every sitemap page; `/service/ppf-*` canonical to `/ppf`, `/service/1-year-ceramic-coating` to `/ceramic-coating/car`, `/service/1-year-bike-ceramic-coating` to `/ceramic-coating/bike` |
| Claims sweep (HTML, meta, JSON-LD, both public API endpoints) | **none found** in any product text. "9H" still appears on 3 pages in the studio's own educational copy that explains what a 9H rating does and does not mean (`/faq`, `/services/ceramic-coating-bangalore`, `/blog/ppf-vs-ceramic-coating-bangalore`); these are not product claims and were not filtered |
| Mobile, 17 key pages at 390 and 360 px | no horizontal overflow, one H1, same text as before. Console shows 404s for `/attached_assets/_opt/*` image variants only, because staging does not generate them (same as the 18 Nov run; they return 200 in production) |
| Booking | no booking, payment or slot file was changed; the booking integration tests give the same pass and fail set as the baseline |

### 3.1 First-HTML parity (text visible on the finished page but missing from the first response, 11 pages)

| Page | Production today | Staging |
|---|---|---|
| `/` | 17 | 1 |
| `/services` | 16 | 3 |
| `/products` | 14 | 0 |
| `/ppf` | 10 | 5 |
| `/gallery` | 10 | 2 |
| `/contact` | 2 | 2 |
| `/service/premium-car-wash-special` | 4 | 2 |
| `/service/interior-detailing-service` | 3 | 1 |
| `/blog` | 2 | 2 |
| `/ceramic-coating/car` | 4 | 1 |
| `/services/ceramic-coating-bangalore` | 12 | 6 |
| **Total** | **94 of 256 blocks** | **25 of 256 blocks** |

The 25 left are deliberate or interface text: price and booking-fee lines (kept out of the snapshot by the standing no-price rule), carousel counters, button labels, and the four claim lines now hidden everywhere.

### 3.2 Internal links (pages that link to a page from body text; menu and footer excluded)

Pages with fewer than 3 body-linking pages: **11 before, 1 after** on the final build. The one left is the homepage, which does not need body links (its logo and menu link it everywhere). The last commit added an "All guides" link to `/blog` from the three landing pages and a headlight link from the glass-coating page. Largest gains: `/contact` 1 to 27 (the studio block now reaches the first HTML), `/service/premium-car-wash-special` 1 to 4, `/service/interior-detailing-service` 2 to 4, `/service/annual-maintenance-package` 1 to 3, `/faq` 0 to 3, local PPF article 2 to 5, "made in USA" article 2 to 3.

## 4. What was deliberately not done

- Measured on the final staging build (body links in the first HTML, menu and footer excluded): **162 links before, 240 after (+79, 1 removed: a Cloudflare email-protection artefact)**. **51 of the 107 planned additions are now present.** The rest were skipped because no existing sentence mentions the topic naturally (forcing an anchor would mean rewriting approved copy), because the page already links the destination, or because the link would have implied a brand claim. Articles already carry 4 to 12 links each.
- No link from service pages to `/gallery` or `/contact` (the studio block already links `/contact` on every one of them).
- Service pages link the brand **hub**, never a single brand (existing rule, still enforced by test).

## 5. Things I found that need your decision (nothing changed)

1. `/service/1-year-ceramic-coating` and the bike twin: the catalogue meta description still says **₹5,999 (50% off)** and **₹2,999**; live prices are ₹7,500 and ₹3,999. The page is canonical to the landing page, but the text is in the HTML. Price conflict, so untouched.
2. Catalogue field `guaranteeText` on the two ceramic rows: "100% Satisfaction Guaranteed ... 1-year performance warranty". Not on your list, still shown on the service pages. Confirm or I hide it.
3. `/products/stek` says "Warranty on any STEK job is the manufacturer's, issued in writing at handover", which conflicts with the approved "Written warranty terms provided at handover" used elsewhere.
4. The first-HTML snapshot is visually hidden text that mirrors the page. That is allowed when it is the same content, and it now is, but the lasting fix is real server-side rendering with hydration. Worth a separate project.
5. Four FAQs on the ceramic car page and the bike service record now show fewer entries (8 to 5), because the answers contained the hidden claims. The wax-comparison answer, the scratch answer and the safety answer were removed whole. Replacement answers need your wording.

## 6. Rollback

Each commit is independent and reverts cleanly: `git revert 455370f` restores the claims, `git revert 20acb31` the first-HTML changes, `git revert 9ff976f 384a518` the links. Nothing in the database depends on this branch.

## 7. Files changed (high level)

`client/src/lib/withheld-claims.ts`, `server/routes.ts`, `server/vite.ts`, `client/src/lib/crawlable-content.ts`, `client/src/lib/studio-sections-data.ts` (new), `client/src/lib/products-page-data.ts` (new), `client/src/lib/gallery-photos.ts`, `client/src/lib/landing-pages.ts`, `client/src/lib/service-related-links.ts`, `client/src/lib/brand-pages.ts`, `client/src/lib/blog-posts.ts` (2 link tokens), `client/src/components/redesign/studio-sections.tsx`, `client/src/pages/products.tsx`, `client/src/pages/gallery.tsx`, `client/src/pages/campaign-landing.tsx`, `scripts/prerender.mjs`, `scripts/prerender-content-entry.ts`, tests: `unverified-claims`, `link-plan-wording`, `seo-foundation` (two assertions updated for sibling links, one for the products wording location).
