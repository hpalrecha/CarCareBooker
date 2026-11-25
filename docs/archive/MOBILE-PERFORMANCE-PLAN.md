# Mobile Lighthouse improvement plan: p91carcare.com

Prepared 2026-11-10. This is a plan only. **No performance change was made or tested for this document**, and nothing here is deployed. Every figure comes from Lighthouse 12 runs on the live site on 2026-11-10 (mobile preset, simulated Slow 4G and 4x CPU, headless Chrome, 3 runs per page, machine on AC power with the Balanced power plan, CPU benchmarkIndex 790–1359; 3 of 9 runs carried the "slower CPU than expected" warning). Estimates of gain and effort are judgement, not measurements, and are labelled as such.

## 1. Where we are

| Page (mobile) | Performance (3 runs) | LCP | FCP | TBT | CLS | Best Practices | A11y | SEO |
|---|---|---|---|---|---|---|---|---|
| Home | median 87 (87 / 74 / 90) | 3.1 s | 2.6 s | 237 ms | 0 | 100 | 100 | 100 |
| `/ppf` | median 72 (72 / 71 / 72) | 4.7 s | 3.3 s | 199 ms | 0.028 | 100 | 100 | 100 |

Manager's original brief (home, mobile): Performance 42, FCP 3.7 s, LCP 5.7 s, TBT 1,860 ms, Speed Index 4.6 s, Best Practices 73. Already achieved: Best Practices 100, TBT about 0.2 s, FCP 2.6 s, LCP 3.1 s.

## 2. What the 2026-11-10 runs say about the remaining cost

LCP breakdown from the Lighthouse reports (one representative run each, milliseconds):

| LCP phase | Home (LCP 2.7 s run) | `/ppf` (LCP 4.6 s run) |
|---|---|---|
| Time to first byte (HTML) | 1,380 | 972 |
| Resource load delay | 757 | **1,611** |
| Resource load time | 405 | 583 |
| Element render delay | 167 | **1,463** |
| LCP element | AVIF hero poster (HTML, underlay) | first carousel slide (rendered by React) |

Other facts from the same reports:
- Root document response about 880–890 ms; HTML is `cf-cache-status: DYNAMIC` (not cached at the edge).
- One render-blocking stylesheet, `/assets/index-CxeG60E9.css`: estimated 300 ms on home and **1,300 ms on `/ppf`**. About 30–32 KiB of its rules are unused on the page.
- Main-thread work 2.6 s (home) and 3.0 s (`/ppf`); boot-up 0.6–0.8 s; 7–9 long tasks, the largest in `react-vendor` (245 ms, 139 ms) and in the page's own code (271–338 ms).
- Third-party blocking is almost nil: Cloudflare's `beacon.min.js` (about 10 KB) shows one 101 ms long task on `/ppf`. Google tag and Clarity are already deferred.
- Total transfer 441–514 KiB; images are already AVIF/WebP with dimensions; no unused JavaScript flagged.
- CLS 0.028 on `/ppf`, caused by `<div class="lp-hero-media">`.
- Compression is Brotli; hashed assets are cached for a year.

Previously tried and **rejected with measurements** (2026-11-05 report; do not repeat): non-blocking CSS with a gated React mount (TBT rose to 2.4–4.3 s), caching HTML at the Cloudflare edge (it broke the deploy's public-build check and did not move the simulated score), `startTransition` mount, `content-visibility`, and an SSR landing-hero overlay for `/ppf` (no gain).

## 3. Targets (measurable, valid runs only)

A "valid run" means benchmarkIndex at least 1300, no slow-CPU warning, median of at least 5 runs per page, machine on AC power with Windows power mode "Best performance".

| Metric | Now | Target 1 (interim) | Target 2 (the manager's brief) |
|---|---|---|---|
| Home mobile performance | 87 | 90 | 90+ |
| Home mobile LCP | 3.1 s | 2.8 s | below 2.5 s |
| Home mobile TBT | 237 ms | 200 ms | below 200 ms |
| `/ppf` mobile performance | 72 | 80 | 90 |
| `/ppf` mobile LCP | 4.7 s | 3.5 s | below 2.5 s |
| CLS (all pages) | 0.028 | 0.01 | below 0.1 (already met) |
| Accessibility, Best Practices, SEO | 100 | keep 100 | 100 / 95+ / 100 |

Honest feasibility: three rounds of work on 2026-11-04 to 11-05 already took the cheap wins. Target 1 looks reachable with items A–C. Target 2 on mobile, especially `/ppf` at 2.5 s, probably needs the origin response time (item D) or a much smaller JavaScript and CSS payload, because the lab model adds about 1.5 s of simulated network and CPU cost on top of the 0.9 s document response. That is an inference, not a verified result.

## 4. Proposed changes, in priority order

| # | Change | Evidence | Expected effect (estimate) | Risk | Effort (estimate) |
|---|---|---|---|---|---|
| A | **Measure first:** add a repeatable protocol (valid-run rules above) and capture Chrome CSS coverage per route (home, `/ppf`, ceramic, a service page) before changing any CSS | 30–32 KiB unused CSS, 300–1,300 ms render-blocking estimate | none (measurement only) | none | 0.5 day |
| B | **Route-aware CSS:** serve the heavy landing-page rules only on the pages that use them, and keep the CSS blocking (not async). Remove rules proven unused per route in A. | One 300–1,300 ms render-blocking file; async CSS was tried and failed, so this keeps it blocking but smaller | `/ppf` FCP and LCP down 0.3–0.8 s; home 0.1–0.3 s | Visual regressions on pages that share rules; needs a pixel diff at 390 px and 1280 px on all marketing pages | 1.5–2 days |
| C | **`/ppf` hero image earlier and without layout shift:** the LCP image waits 1.6 s (load delay) plus 1.5 s (render delay) behind React. Experiment: reserve the hero box with a fixed aspect ratio (fixes the 0.028 CLS) and test the "underlay `<img>` in the static HTML" approach that worked on the home page. The SSR overlay was rejected before; this is a different, simpler mechanism. | LCP phases above | `/ppf` LCP down 0.5–1.5 s if the underlay works; CLS to about 0 | The home trick had to be an underlay, smaller than the viewport and never removed, or Chrome ignores it as an LCP candidate. Possible visible flash. Needs 5-run A/B on a quiet machine | 1 day |
| D | **Origin response time (880–890 ms):** measure real-user timing (CrUX or Cloudflare analytics) before spending anything. If real users also see slow first bytes, options are an edge cache with purge-on-deploy wired into `scripts/deploy-manual.sh`, or moving the origin or adding a cache tier closer to Bangalore. The earlier edge-cache rule failed because the deploy check read stale HTML. | TTFB is the largest LCP phase on home (1,380 ms in the sampled run) | Real-user LCP down 0.4–0.8 s. The lab score may not move, since an earlier A/B showed no simulated change for 150 ms vs 700 ms server time | Deploy verification breaks if purge fails. Infrastructure changes need your approval | 1–3 days (cache with purge), more for a region move |
| E | **Main-thread work:** profile the 245 ms and 139 ms `react-vendor` tasks and the 271–338 ms page tasks, and find what runs before first paint (bundle analysis with source maps). Candidates: smaller vendor chunk, lazy-load more below-the-fold sections on the home page. | 7–9 long tasks, 2.6–3.0 s main-thread work | TBT 237 to about 150 ms; performance +2–4 points | Mounting changes alter when content appears; earlier attempts made TBT worse. Only keep changes that A/B better on valid runs | 2–3 days |
| F | **Cloudflare Web Analytics beacon (`beacon.min.js`):** if nobody uses it, switch it off in the Cloudflare dashboard. | 101 ms long task on `/ppf`, 10 KB | TBT down about 10–100 ms on `/ppf` | Loses that analytics source. Needs your decision | 10 minutes |
| G | **Hold Best Practices at 100:** the runs where Google tag and Clarity (4 s after load) land inside the measurement window dropped to 79 in the 2026-11-05 report (audits `third-party-cookies`, `inspector-issues`). Optional: move the deferral from 4 s to first interaction only. | 2026-11-05 report | Keeps 100 in those runs | Fewer tracked visitors who leave in under 4 s; analytics owner must approve | 0.5 day |

Not proposed, and why: a CSP, Trusted Types or stricter HSTS. They are informational in Lighthouse (Best Practices is already 100) and a CSP can break the Google tag, Clarity and Razorpay; treat that as a separate security task.

## 5. Order of work and timeline (estimates)

1. A (0.5 day), then B and C in parallel branches (about 2 days), each merged only after a 5-run before/after on valid runs and pixel comparison.
2. F and G are settings decisions for you.
3. E after B and C, because their effect changes where the main-thread time goes.
4. D only after real-user data shows it matters.

Total: about 5–6 working days of engineering for A, B, C and E, spread over 2 weeks including measurement and your review. D is separate. A deploy takes about 4–25 minutes from push to live and happens only after you approve a merge.

## 6. Verification for every change

- Run `npm test`, `npx vite build` and `node scripts/prerender.mjs`.
- Mobile (390 px) and desktop (1280 px) screenshots of home, `/ppf`, ceramic, a service page, `/services`, `/contact`, compared before and after.
- Lighthouse mobile and desktop, at least 5 valid runs per page and the median, plus a neutral run on pagespeed.web.dev.
- Confirm Accessibility 100, SEO 100, Best Practices at least 95, and that the booking flow still works (page loads, slot picker, payment modal opens).
- Keep every change on its own branch and merge nothing until you approve.
