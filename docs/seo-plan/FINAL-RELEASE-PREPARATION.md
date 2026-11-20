# Final release preparation: Phase 0 and manager-audit changes

Date: 20 November 2026. **Prepared only. Nothing has been pushed or deployed. Waiting for your explicit production deployment approval.**

Release branch: `seo/manager-audit-fixes` (worktree `D:\p91-fixes`), a linear stack on `origin/main` `95a2ead` (checked: origin/main has not moved since the branch was cut). It contains Phase 0 (`seo/phase0-links-claims`) and the manager-audit fixes together, plus documents and one read-only smoke-test script.

## 1. Your decisions and where each one stands

| # | Decision | Status |
|---|---|---|
| 1 | Resolve the www HSTS warning through nginx; no `includeSubDomains`, no `preload` | Runbook written (`NGINX-WWW-HSTS-RUNBOOK.md`), **not applied**: nginx is on the Lightsail host and there is no SSH access from here. One line, `add_header Strict-Transport-Security "max-age=15552000" always;` in the 443 www block, same value as the apex. It is independent of the code release and can be applied before or after it |
| 2 | Keep the Cloudflare `email_off` fix; verify `/contact` after deploy; no `Disallow: /cdn-cgi/` | In the branch. Staging proves the markers and a clean origin HTML. The smoke test checks `/contact` for `email-protection` after deploy, and also fails if `robots.txt` ever gains a `/cdn-cgi/` rule |
| 3 | If the structured-data flags persist, get the exact error from your manager first | In place: no further schema change is queued. The two genuine gaps (missing `image` in the first HTML, stale `dateModified`) are fixed; the checklist step 12 asks for the issue detail if Semrush still flags the posts |
| 4 | Contact and annual-maintenance content unchanged until verified studio information | Verified unchanged: `client/src/pages/contact.tsx` has no diff; the contact snapshot differs only by the invisible `email_off` comment markers; the annual-maintenance record, price, text and booking are untouched. Its page gains only the navigation links in the existing "Related services" block, and the shared sitemap date |
| 5 | Preserve all 32 sitemap URLs, valid canonicals, booking, redirects, spam 410s | Verified on staging: 46 smoke checks pass (section 4) |
| 6 | Commit list, deployment checklist, rollback, smoke commands | Sections 2, 6, 7, 5 |

## 2. Combined branch commit list (`origin/main..seo/manager-audit-fixes`)

| # | Commit | Subject | Code or docs |
|---|---|---|---|
| 1 | `455370f` | feat(claims): hide 100% safe, permanent bond, certified technicians and 9H from every customer-facing surface | code |
| 2 | `20acb31` | feat(ssr): first HTML carries How it works, reviews, studio block, products, gallery and service sections the page shows | code |
| 3 | `9ff976f` | feat(links): owner-approved internal links: service cross-links, landing related lists, brand fits to price pages, two /contact links | code |
| 4 | `bde7238` | fix(types): withholdUnverifiedClaims spread typing (no new tsc diagnostics) | code |
| 5 | `384a518` | feat(links): All guides link on the three landing pages; headlight link from glass coating | code |
| 6 | `3064632` | docs(seo): Phase 0 staging results, GBP link update, URL-by-URL content implementation plan | docs |
| 7 | `5f5f886` | fix(seo): material-date sitemap lastmod, blog JSON-LD image and dateModified, Cloudflare email fence, Facebook URL, headlight links | code |
| 8 | `80a441e` | docs(seo): manager Excel and sitemap consolidated audit | docs |
| 9 | (final docs commit) | docs(release): final release preparation, nginx HSTS runbook, read-only post-deploy smoke test | docs + `scripts/post-deploy-smoke.mjs` |

Run `git log --reverse --format='%h %s' origin/main..HEAD` for the exact hashes. Code files changed by commits 1 to 5 and 7: 24 files, +704 / -139 lines (`studio-sections.tsx`, `blog-posts.ts`, `brand-pages.ts`, `crawlable-content.ts`, `gallery-photos.ts`, `instagram-reels.ts`, `landing-pages.ts`, `products-page-data.ts` (new), `service-related-links.ts`, `sitemap-dates.ts` (new), `studio-sections-data.ts` (new), `withheld-claims.ts`, `campaign-landing.tsx`, `gallery.tsx`, `products.tsx`, `prerender-content-entry.ts`, `prerender.mjs`, `server/routes.ts`, `server/vite.ts`, and 5 test files). **No database migration, no schema change, no new dependency, no environment variable.**

## 3. Documented baselines (not caused by this release)

### 3.1 The 44 baseline integration failures

Command: `node --import tsx --experimental-test-module-mocks --test tests/*.itest.mjs` with a local PostgreSQL staging database.

| Run | Tests | Pass | Fail |
|---|---|---|---|
| **origin/main `95a2ead` (today, no build output)** | 451 | 407 | **44** |
| origin/main, 18 Nov baseline `e54cb79` (earlier, with a build) | 471 | 427 | **44** |
| **This release branch (with a build)** | 471 | 427 | **44** |

**The 44 failing test names are identical in all three runs** (diffed). The 20 extra tests in the branch run (471 vs 451) are served-HTML tests that only run when a build output exists, such as "every URL in the sitemap returns indexable HTML" and "the whole /ppf response carries no withheld claim"; all 20 pass, and nothing present in the baseline is missing from the branch.

Cause, from the assertion text of the failures:
- **36 in `tests/diwali-offer-payment.itest.mjs`:** the Diwali offer ended on 8 Nov 2026 and its page and API now answer **410**; the tests still expect the offer to be live (for example `410 !== 400` on "an unknown or inactive service is refused"). They exercise payment and webhook mocks for a retired offer.
- **8 in `tests/landing-booking-e2e.itest.mjs`:** the tests expect a booking fee of `299` where the staging service rule returns `499` (`'499' !== '299'`), a drift in the fee or PPF-offer rule against old expectations.

They are product-state drift in test fixtures, not regressions, and none touches the code in this release. They stay unfixed on purpose: repairing them needs a decision on the offer and fee fixtures, and this release must not change payment behaviour.

The 44 failing tests, by file (line numbers are in the test file):

**`tests/diwali-offer-payment.itest.mjs`: 36 failing**

1. line 206: an unknown or inactive service is refused
2. line 216: a past date and an impossible time are refused
3. line 224: the lead stores the chosen slot, and a retry with another slot updates the same lead
4. line 233: the paid booking carries the chosen service, date and time
5. line 246: a PPF service is charged Rs 499, any other Rs 99
6. line 256: switching between PPF and another service on retry makes a new order at the new price
7. line 273: charges exactly Rs 99 and stores a pending Diwali lead with its Razorpay order id
8. line 294: the request cannot change the amount, the status or the source
9. line 305: is independent of the Rs 299 booking-fee setting
10. line 332: a retry by the same customer reuses the pending lead and order, updating their details
11. line 343: the same customer in any phone format is ONE lead (normalised phone stored)
12. line 355: a number that is not an Indian mobile is refused
13. line 364: after a FAILED attempt the retry reuses the same lead and order (no duplicate)
14. line 380: a customer who has already PAID cannot start a second payment (409, nothing created)
15. line 394: two simultaneous requests for one customer end up as ONE lead (unique index + recovery)
16. line 434: without Razorpay configured it refuses (503) and creates nothing
17. line 448: a valid signature marks the lead paid and creates ONE booking + ERP push; no WhatsApp; idempotent
18. line 477: a stale read cannot re-pay or rewrite an already-paid lead either
19. line 489: an invalid signature changes nothing
20. line 504: payment.captured marks it paid and books it once; a replay changes nothing; no WhatsApp
21. line 520: a badly signed webhook is rejected and changes nothing
22. line 527: payment.failed marks a pending lead failed, and a later capture makes it paid
23. line 538: payment.authorized alone does NOT mark a lead paid; only capture does
24. line 550: RACE: a payment.failed that read a stale "pending" cannot overwrite a lead that just became paid
25. line 563: a paid lead is never downgraded by a late payment.failed
26. line 624: paid lead: refused with 409, still there, payment record intact
27. line 636: RACE: paid a moment after the route read it, the DELETE itself still refuses
28. line 654: pending, failed and ordinary (no payment) leads can still be deleted
29. line 663: a missing lead is 404, and deleting needs an admin
30. line 720: valid signature is accepted (payment.captured)
31. line 727: missing signature header: 400, nothing changes
32. line 734: body altered after signing: 400, nothing changes (payment.captured and payment.failed)
33. line 745: signed with the wrong secret, wrong length, or upper-case: rejected
34. line 755: no webhook secret configured: fails CLOSED (503), never open
35. line 766: payment.captured is idempotent: N identical deliveries change nothing after the first
36. line 779: payment.failed is idempotent, and never rewrites a paid lead

**`tests/landing-booking-e2e.itest.mjs`: 8 failing**

1. line 302: vehicleCategory does NOT determine the amount — the service row does
2. line 323: a client-supplied `amount` is ignored
3. line 329: a client-supplied campaign id cannot create a free booking
4. line 339: a campaign for ANOTHER service does not make this one free
5. line 368: the service price is never written as the booking amount
6. line 393: no campaign: the fee applies exactly as before
7. line 411: an EXPIRED campaign charges normally again
8. line 484: pausing the campaign does not retroactively unattribute past bookings


### 3.2 The 34 baseline TypeScript diagnostics

Command: `npx tsc --noEmit -p .`. **34 errors on origin/main `95a2ead` and 34 on this branch, same files and codes** (one `server/routes.ts` message prints its type in a different order, same line and code). This release adds 0 new diagnostics: an early version of the claims filter added one (`withheld-claims.ts` `TS2322`), fixed in `bde7238`.

By file: `booking-confirmation.tsx` 14, `admin-dashboard.tsx` 8, `admin-whatsapp.tsx` 5, `server/routes.ts` 2, one each in `scheduler.ts`, `payment.ts`, `terms-of-service.tsx`, `service-detail.tsx`, `cancellation-policy.tsx`. The build does not run `tsc`, so they do not block it (esbuild and Vite strip types).

The 34 diagnostics (all pre-existing, none in a file this release edits except the two `server/routes.ts` lines below, which are in code the release does not change):

| File | Line | Code | Message (shortened) |
|---|---|---|---|
| `client/src/pages/admin-dashboard.tsx` | 146 | TS18046 | 'blackoutDates' is of type 'unknown'. |
| `client/src/pages/admin-dashboard.tsx` | 154 | TS18046 | 'blackoutDates' is of type 'unknown'. |
| `client/src/pages/admin-dashboard.tsx` | 1392 | TS2339 | Property 'name' does not exist on type '{}'. |
| `client/src/pages/admin-dashboard.tsx` | 1394 | TS2339 | Property 'name' does not exist on type '{}'. |
| `client/src/pages/admin-dashboard.tsx` | 1997 | TS2339 | Property 'reminderJobActive' does not exist on type '{}'. |
| `client/src/pages/admin-dashboard.tsx` | 1998 | TS2339 | Property 'reminderJobActive' does not exist on type '{}'. |
| `client/src/pages/admin-dashboard.tsx` | 2005 | TS2339 | Property 'nextReminderTime' does not exist on type '{}'. |
| `client/src/pages/admin-dashboard.tsx` | 2011 | TS2339 | Property 'timezone' does not exist on type '{}'. |
| `client/src/pages/admin-whatsapp.tsx` | 214 | TS2322 | Type 'unknown' is not assignable to type 'ReactNode'. |
| `client/src/pages/admin-whatsapp.tsx` | 287 | TS2322 | Type 'unknown' is not assignable to type 'ReactNode'. |
| `client/src/pages/admin-whatsapp.tsx` | 325 | TS2322 | Type 'unknown' is not assignable to type 'ReactNode'. |
| `client/src/pages/admin-whatsapp.tsx` | 329 | TS2322 | Type 'unknown' is not assignable to type 'ReactNode'. |
| `client/src/pages/admin-whatsapp.tsx` | 335 | TS2322 | Type 'unknown' is not assignable to type 'ReactNode'. |
| `client/src/pages/booking-confirmation.tsx` | 127 | TS2339 | Property 'paymentStatus' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 154 | TS2339 | Property 'paymentStatus' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 165 | TS2339 | Property 'service' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 171 | TS2339 | Property 'id' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 177 | TS2339 | Property 'amount' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 189 | TS2339 | Property 'timeSlot' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 189 | TS2339 | Property 'timeSlot' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 195 | TS2339 | Property 'timeSlot' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 210 | TS2339 | Property 'customerName' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 216 | TS2339 | Property 'customerEmail' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 224 | TS2339 | Property 'customerPhone' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 230 | TS2339 | Property 'createdAt' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 356 | TS2339 | Property 'id' does not exist on type '{}'. |
| `client/src/pages/booking-confirmation.tsx` | 365 | TS2339 | Property 'id' does not exist on type '{}'. |
| `client/src/pages/cancellation-policy.tsx` | 2 | TS2614 | Module '"@/components/footer"' has no exported member 'Footer'. Did you mean to use 'import Footer from "@/com |
| `client/src/pages/service-detail.tsx` | 308 | TS2739 | Type '{}' is missing the following properties from type '{ id: string; slug?: string / undefined; title: strin |
| `client/src/pages/terms-of-service.tsx` | 2 | TS2614 | Module '"@/components/footer"' has no exported member 'Footer'. Did you mean to use 'import Footer from "@/com |
| `server/routes.ts` | 569 | TS2345 | Argument of type '{ price: string; title: string; duration: number; faq?: { [x: number]: { question: string; a |
| `server/routes.ts` | 2857 | TS18046 | 'error' is of type 'unknown'. |
| `server/services/payment.ts` | 44 | TS2322 | Type 'string / number' is not assignable to type 'number'. |
| `server/services/scheduler.ts` | 30 | TS2353 | Object literal may only specify known properties, and 'scheduled' does not exist in type 'TaskOptions'. |


## 4. Validation on the release head

| Check | Result |
|---|---|
| Unit and regression tests (`node --test tests/*.test.mjs`) | **669 run, 669 pass, 0 fail, 0 skipped** with a build output present (without one: 661 run, 659 pass, 2 skipped, 0 fail; the baseline origin/main shows the same pattern, 645 run, 643 pass, 2 skipped). 16 new tests in this release (6 claims filter, 2 link wording, 8 manager-audit fixes) |
| Integration tests | 471 run, 427 pass, 44 fail, **identical failing names to the baselines** |
| TypeScript | 34 = baseline |
| `npm run build:app` (Vite, prerender, server bundle) | succeeds; no prerender failure |
| Staging app (local Postgres, production build, local-only variables) | no error lines in its log |
| Read-only smoke test against staging | **46 of 46 pass** |
| Read-only smoke test against production **today, before deploy** | 37 pass, 16 fail. The 16 are exactly what this release changes (stale lastmod, hidden claims, first-HTML sections, blog JSON-LD, Cloudflare email link, www HSTS, Facebook URL). They are the "before" picture; after a correct deploy they pass, except the www HSTS check until the nginx runbook is applied |

## 5. Production smoke-test commands (read-only)

All commands are GET or HEAD. **No POST, no booking, no payment, no WhatsApp, no indexing request.**

### 5.1 The one-command test

```bash
node scripts/post-deploy-smoke.mjs                        # production: 53 checks, exit code 1 if any fails
node scripts/post-deploy-smoke.mjs http://127.0.0.1:5099   # a staging server (skips the www and Cloudflare checks)
```

It checks: the sitemap is exactly the 32 URLs with the material-change dates; every sitemap URL is 200, self-canonical, `index,follow` with one H1; no unverified claim in `/api/services`, the single-service endpoint, or any page; the first HTML carries the shared sections; the headlight page is linked from at least 3 pages; the 8 blog JSON-LD blocks have an image, `dateModified` 2026-11-17 and an `Organization` publisher; `/contact` has no `email-protection` and `robots.txt` has no `/cdn-cgi/` rule; the 8 booking records canonicalise to their price pages; 5 redirects; the 16 spam URLs, `/le48` and the ended offer answer 410 with `noindex` and no redirect; unknown path 404; legal and category pages stay noindex and out of the sitemap; `/api/business-hours` and a service page answer 200; www answers 301 with HSTS `max-age=15552000` and no `includeSubDomains` or `preload`; the apex HSTS is unchanged; the booking host still 301s to the apex; the home JSON-LD uses the canonical Facebook URL.

### 5.2 Individual spot checks

```bash
# the email fix (decision 2): must print 0
curl -s https://p91carcare.com/contact | grep -c "email-protection"
# the studio email is still present as a mailto link: expect a match
curl -s https://p91carcare.com/contact | grep -o 'mailto:info@p91carcare.com' | head -1

# claims: both must print nothing
curl -s https://p91carcare.com/api/services | grep -oiE "100% ?safe|permanent bond|certified technician|\b9H\b" | sort -u
curl -s https://p91carcare.com/ceramic-coating/car | grep -oiE "100% ?safe|permanent bond|certified technician|\b9H\b" | sort -u

# sitemap: 32 URLs, spot-check three dates
curl -s https://p91carcare.com/sitemap.xml | grep -c "<loc>"
curl -s https://p91carcare.com/sitemap.xml | grep -A1 "<loc>https://p91carcare.com/faq</loc>"     # lastmod 2026-11-20
curl -s https://p91carcare.com/sitemap.xml | grep -A1 "blog/monsoon-damage-car-bangalore"          # lastmod 2026-11-17

# blog JSON-LD has an image and dateModified
curl -s https://p91carcare.com/blog/how-much-ppf-does-your-car-need | grep -o '"dateModified":"[^"]*"\|"image":"[^"]*"'

# first HTML parity (each must print 1 or more)
curl -s https://p91carcare.com/ | grep -c "From estimate to handover."
curl -s https://p91carcare.com/products | grep -c "Which one do you need?"

# booking and redirects unchanged
curl -sI https://p91carcare.com/service/ppf-sedan | grep -i "^HTTP"; curl -s https://p91carcare.com/service/ppf-sedan | grep -o '<link rel="canonical" href="[^"]*"'
curl -sI https://p91carcare.com/ppf-ceramic-coating | grep -iE "^HTTP|^location"
curl -sI "https://p91carcare.com/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/" | grep -iE "^HTTP|x-robots"

# www HSTS (after the nginx runbook; apex must be unchanged)
curl -sI https://www.p91carcare.com/ | grep -iE "^HTTP|^location|strict-transport"
curl -sI https://p91carcare.com/    | grep -i strict-transport
```

### 5.3 Booking check without touching a booking

There is deliberately no automated booking or payment test against production. After deploy: open `https://p91carcare.com/ppf` and `/ceramic-coating/car` in a browser, press **Book a slot**, confirm the dialog opens, the packages and prices show, and the calendar loads slots; close it without submitting. `GET /api/services`, `/api/business-hours` and a service page are covered by the script.

### 5.4 Search Console (manual, small)

After the smoke test passes: in URL Inspection, run **Test live URL** on `/`, `/ppf`, `/contact` and one blog post only. Do not request indexing for many URLs at once and do not resubmit the sitemap repeatedly; Google reads it on its own schedule.

## 6. Deployment checklist

**How production deploys (verified from the repository):** a push or merge to `main` starts GitHub Actions (`build-image.yml`), which builds and publishes the image only. A systemd timer on the host (`p91-auto-deploy.timer`, every 5 minutes) runs `scripts/auto-deploy.sh`, which pulls the image for the new commit, starts a candidate container, health-checks it, switches, health-checks the public site, and restores the previous container automatically if anything fails. It refuses to deploy in the **19:45 to 20:05 IST** window. It can be paused with `sudo touch /var/lib/carcarebooker-deploy/auto-deploy.disabled`. CI runs no tests, so the local evidence above is the test evidence.

**Before you give the go-ahead (done, with evidence above)**
- [x] Combined branch built and tested; unit tests, integration baseline, TypeScript baseline, build, staging smoke test.
- [x] `origin/main` unchanged since the branch was cut (`95a2ead`).
- [x] Rollback point defined: tag `rollback-before-phase0-and-audit-fixes` on `95a2ead` (created locally, not pushed).
- [x] No migration, no environment change, no new secret.

**At deployment (only after your explicit approval)**
1. `git fetch origin` and confirm `origin/main` is still `95a2ead`. If it moved, stop: rebase, rerun tests and the staging smoke test, and ask again.
2. Choose the time: after the studio's last booking (16:30 IST Mon to Sat, 14:00 Sun) and before 19:45 IST. The container swap is brief, but avoid booking hours.
3. Push the rollback tag: `git push origin rollback-before-phase0-and-audit-fixes` (a tag push does not start a build).
4. Push the branch and open a pull request: `git push -u origin seo/manager-audit-fixes`, then `gh pr create`. Review the 24-file diff once more.
5. Merge with a **merge commit** (not squash), so each of the commits can be reverted on its own. **One merge only**: a second push before the host deploys would restart the build.
6. Watch the build: the `build-image` run on GitHub must finish green.
7. Watch the host (needs SSH): `sudo tail -f /var/log/p91-auto-deploy.log` (or `journalctl -u p91-auto-deploy -f`). Expect: image pulled, candidate healthy, switch, public check OK. A line starting `ABORT` or `restored previous container` means it did not deploy; production stays on the old version.
8. Do not trust an exit code: confirm by behaviour (step 9).

**After deployment**
9. Run `node scripts/post-deploy-smoke.mjs`. Expected: all pass except the www HSTS check until step 11. Any other failure: stop and follow the rollback section.
10. Verify the email fix (decision 2): `curl -s https://p91carcare.com/contact | grep -c email-protection` must print 0. If it prints more than 0, Cloudflare is still rewriting the address. **Do not add `Disallow: /cdn-cgi/`.** Report it and I will propose the next step (the Cloudflare setting) for your approval.
11. Apply `NGINX-WWW-HSTS-RUNBOOK.md` on the host (backup, edit one line, `nginx -t`, reload) and rerun the smoke test; the three www checks must pass.
12. Ask your manager to re-crawl in Semrush. If the 8 blog posts are still flagged, ask for the exact issue detail (Site Audit, Issues, "Structured data that contains markup errors", the details link shows the property) **before any further schema change**.
13. Section 5.3 booking dialog check; section 5.4 Search Console checks.
14. Update `sitemap-dates.ts` in a later small change only if a deploy changed page text that the dates do not yet cover. This release itself changes text on the pages listed in that file's comments (claims hidden, sections in the first HTML); their lastmod is already the last material change from git, and the deploy date is not claimed. If you want those pages dated 2026-11-20 or the deploy date, say so; I will not guess it.

## 7. Rollback procedure

No data is involved: there is no migration, no database write and no Cloudflare or DNS change in the code release. A rollback only returns code.

| Level | When | How | Time |
|---|---|---|---|
| **A. Automatic** | the candidate fails its health checks | the host script restores the previous container and re-verifies it; nothing to do | seconds |
| **B. Host rollback to the previous container** | the release is live and something is wrong | on the host: `scripts/deploy-manual.sh rollback carcarebooker-prev-<timestamp> --execute` (the previous container is kept, stopped, as `carcarebooker-prev-<timestamp>`; `docker ps -a` lists it; the image is also tagged `carcarebooker:rollback-<timestamp>`). First `sudo touch /var/lib/carcarebooker-deploy/auto-deploy.disabled` so the timer does not redeploy the new commit, then remove that file once the fix is merged | minutes |
| **C. Revert in Git** | the issue is in one change set | `git revert <commit>` for just that commit (`455370f` claims, `20acb31` first HTML, `9ff976f` and `384a518` links, `5f5f886` sitemap dates, schema image, email fence, Facebook URL), merge to `main`; the timer deploys the fix. Full revert: `git revert -m 1 <merge commit>` | deploy cycle |
| **D. nginx** | the www header causes trouble | restore the backup and reload (see the runbook); independent of the code release | seconds |

After any rollback: `node scripts/post-deploy-smoke.mjs`. After a full rollback its 16 "before" failures return, which is the expected old state, and the booking, canonical, redirect, 410 and sitemap-membership checks still pass. Do not edit the production database during a rollback.

Items that are safe to revert alone: the sitemap dates (`sitemap-dates.ts` plus the `routes.ts` lookup), the email fence (one comment pair), the Facebook URL (one constant), the headlight links (one list). The claims filter and the first-HTML sections are the largest changes; reverting `455370f` brings the four claims back, so do that only on your instruction.

## 8. Still open, not blocking this release

- www HSTS: runbook ready, needs host access (decision 1).
- Structured-data flags: wait for the manager's exact error text if they persist (decision 3).
- Contact and annual-maintenance content: waiting for verified studio information (decision 4).
- Price and warranty conflicts from the Phase 0 report (ceramic meta ₹5,999 / ₹2,999, `guaranteeText`, the STEK "manufacturer's warranty" sentence), the polishing-service question, and the replacement answers for the three hidden ceramic FAQs.
- The 44 integration failures and 34 TypeScript diagnostics: unchanged by design; their cleanup is a separate task.
