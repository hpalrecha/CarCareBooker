# Plan 3: Cutover to the new site and indexing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the new `apps/web` site on `p91carcare.com` with every old URL redirected once, online booking still working, analytics intact, and Google told about it, so the ~38 indexable pages get crawled and indexed as fast as possible.

**Architecture:** Two containers behind the existing nginx on the Lightsail host. The API container stays as it is (`127.0.0.1:8084`). A new web container (Next.js standalone, `127.0.0.1:8085`) serves everything else. nginx routes by path. Old booking pages `/service/:slug` stay on the API container (they hold the working online booking and payment flow until Plan 2c) but become `noindex` with a canonical to their new service page. All other old URLs 301 to their new page from Next. Analytics move into Next unchanged (same Google Ads and P91 GA4 IDs, Clarity).

**Tech Stack:** Next.js 16 standalone, Docker, GitHub Actions + GHCR, nginx 1.24 on Ubuntu (Lightsail), Google Search Console, IndexNow.

## Owner decisions this plan relies on (26 Nov 2026)

- Priority is indexing: pages ship without their `[NEEDS]` facts; gaps are hidden at render (done on `feat/web-wave1-cd`).
- No prices on public pages (catalogue descriptions on the old `/services` list stay for now; that page is replaced by the new `/services` at cutover anyway).
- Booking stays online: new-site "Book" buttons go to the old booking page for that service until Plan 2c.

## Global Constraints

- Production changes on the host (nginx, containers) are done by the owner in the Lightsail browser SSH session, from exact commands in `docs/superpowers/plans/plan-3-cutover-runbook.md`, after the owner says go. Every step has a rollback command printed next to it.
- Never run anything on the host across 20:00 IST (WhatsApp reminder cron in the API container).
- `nginx -t` must pass before every reload; the previous config is copied to a dated backup first.
- The API container, its port, env and volumes are not changed by this plan.
- No `sed -i` on repo files (CRLF). Commits end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Routing after cutover

| Path | Served by |
|---|---|
| `/api/*`, `/admin`, `/admin/*`, `/uploads/*`, `/attached_assets/*` | API container (8084) |
| `/service/*`, `/booking-confirmation/*` | API container (old booking pages; noindex, canonical to new page) |
| `/assets/*`, `/fonts/*`, `/favicon*`, `/og/*` and other files the old SPA needs on the pages above | API container |
| everything else (`/`, `/services/*`, `/areas/*`, `/brands/*`, `/guides/*`, `/_next/*`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, old URLs that 301) | web container (8085) |

---

### Task 1: Redirects and 410s in Next

**Files:** `apps/web/next.config.ts`, `apps/web/middleware.ts`, `packages/content/src/site/link-map.ts` (reuse `LINK_MAP`), `packages/domain/src/spam-paths.ts` (moved copy of `apps/api/src/lib/spam-paths.ts` regex), `tests/web-redirects.test.mjs`.

- [ ] Test first: every `LINK_MAP` entry and `docs/seo-plan/04-redirect-and-url-map.csv` old URL resolves (through the table) to a path that exists in `PAGES` or a known non-registry route, in one hop; no chain; `/service/*` is NOT redirected (booking pages stay).
- [ ] `next.config.ts` `redirects()` generated from `LINK_MAP` (permanent: true), excluding `/service/*`. Old `/blog/category/*` → `/guides`.
- [ ] `middleware.ts`: answer 410 Gone (with `X-Robots-Tag: noindex`) for the spam-path regex and `/offer/de-dhana-dhan`, `/le48`; trailing-slash URLs 308 to the slashless path (Next default); `www.` host is already redirected by nginx.
- [ ] `npm run web:build`; new script `scripts/web/check-redirects.mjs` runs against `web:start` and asserts each old URL returns 308/301 → expected location, and 410s.
- [ ] Commit `feat(web): old URL redirects and 410s for spam paths`.

### Task 2: Book buttons to the working booking flow

**Files:** `packages/content/src/site/booking-links.ts`, service content files, `apps/web/components/templates/service-page.tsx`, tests.

- [ ] Map each service family to its old booking page: PPF → `/ppf` is gone, so use `/service/ppf-hatchback` (the vehicle selector there switches body type), ceramic car → `/service/1-year-ceramic-coating`, bike → `/service/1-year-bike-ceramic-coating`, interior → `/service/interior-detailing-service`, exterior → `/service/exterior-detailing-hard-water-new`, headlight → `/service/headlight-restoration-both`, glass coating → `/service/windshield-glass-coating-new`, polishing → `/service/windshield-glass-polishing`, maintenance → `/service/annual-maintenance-package`, car wash → `/service/premium-car-wash-special`. Services with no booking row keep WhatsApp.
- [ ] Primary CTA "Book online" → that path; secondary "WhatsApp" stays. Test: every service page has one Book link that is either a `/service/<slug>` from the map or WhatsApp.
- [ ] Commit `feat(web): book buttons open the existing online booking`.

### Task 3: Old booking pages stop competing in search

**Files:** `apps/api/src/vite.ts` (`/service/:slug` SSR head), `packages/content/src/canonical-overrides.ts`, `packages/content/src/service-seo.ts`, `apps/admin/src/pages/service-landing.tsx` (client `ServiceSeo`), tests.

- [ ] `serviceCanonicalPath(slug)` returns the NEW service page for every slug (same map as Task 2, inverted to the family page), and `/service/:slug` emits `<meta name="robots" content="noindex,follow">` in both SSR and client head.
- [ ] The API's `/sitemap.xml`, `/robots.txt` and `/llms.txt` stay as they are (nginx sends those URLs to Next after cutover; the API copies become unused).
- [ ] Root tests updated (canonical-overrides, service SSR head) and pass; `npm run build:app` passes.
- [ ] Commit `fix(seo): old booking pages noindex with canonical to the new service page`.

### Task 4: Analytics in Next

**Files:** `apps/web/components/analytics.tsx`, `apps/web/app/layout.tsx`, `apps/web/lib/track.ts`, tests.

- [ ] Load exactly what the live site loads today (read `apps/admin/index.html` and `apps/admin/src/lib/analytics.ts`, `clarity.ts`): Google Ads `AW-11467752288` config + GA4 `G-D3QRLWNCY5` (P91 only; do NOT add `G-QXEEJ4EK4J`), Clarity `yezkqr1rwm`, with the same lazy loading (after load or first interaction) via `next/script` `strategy="lazyOnload"`.
- [ ] Events (gtag `event`): `click_call` (tel: links), `click_whatsapp` (wa.me links), `begin_booking` (Book online links) with params `{ page_type, service_family, area }`, via one delegated click listener in a client component.
- [ ] First-touch attribution: store landing page, referrer and UTM/gclid/fbclid in `localStorage` on first visit (same keys as `apps/admin/src/lib/attribution.ts` so the old booking pages keep reading them) — verify key names match.
- [ ] Commit `feat(web): GA4, Google Ads and Clarity with call, WhatsApp and booking events`.

### Task 5: Web image and CI

**Files:** `apps/web/Dockerfile`, `.github/workflows/build-web-image.yml`, `.dockerignore`.

- [ ] Multi-stage Dockerfile: `node:20-bookworm-slim`; install with `npm ci -w apps/web --include-workspace-root=false` (lockfile at root); `npm run build -w apps/web` with `API_ORIGIN=https://p91carcare.com`; runtime copies `.next/standalone`, `.next/static`, `public`; `CMD node apps/web/server.js`; `PORT=3000`; healthcheck `/`.
- [ ] Workflow mirrors `build-image.yml`: on push to main when `apps/web/**`, `packages/content/**`, `packages/domain/**` or the workflow change; image `ghcr.io/hpalrecha/carcarebooker-web:<sha>` and `:main`; label revision.
- [ ] Prove the build locally without Docker: `npm run web:build` then `node apps/web/.next/standalone/apps/web/server.js` with `PORT=3199` and curl `/`, `/services/paint-protection-film`, `/sitemap.xml` (200).
- [ ] Commit `build(web): standalone image and CI workflow`.

### Task 6: Host runbook (owner executes)

**Files:** `docs/superpowers/plans/plan-3-cutover-runbook.md`, `scripts/deploy-web.sh`, `deploy/nginx/p91carcare.locations.conf`.

- [ ] `scripts/deploy-web.sh`: pull `carcarebooker-web:<sha>`, run candidate on `127.0.0.1:18085`, check `/`, `/services/paint-protection-film`, `/sitemap.xml` return 200 with the expected title, then replace `carcarebooker-web` on `127.0.0.1:8085` (`--restart unless-stopped`), with `--dry-run` default and `--execute` to act, mirroring `deploy-manual.sh` safety checks (refuse near 20:00 IST, port checks, rollback to previous image on failure).
- [ ] `deploy/nginx/p91carcare.locations.conf`: the location blocks from the routing table (`proxy_pass http://127.0.0.1:8084` / `:8085`, same proxy headers the current block uses), designed to replace the single `location /` in the apex `server { listen 443 }` block.
- [ ] Runbook steps, each with verify + rollback:
  1. Find the vhost (`sudo grep -rln "p91carcare.com" /etc/nginx/sites-enabled`), back it up.
  2. Start the web container with `deploy-web.sh --execute` (no traffic yet). Verify `curl -s 127.0.0.1:8085/ | grep -o "<title>[^<]*"`.
  3. Insert the locations, `sudo nginx -t`, `sudo systemctl reload nginx`.
  4. Verify from outside: `/` and `/services/paint-protection-film` are the new site; `/ppf` 308 → `/services/paint-protection-film`; `/service/ppf-hatchback` is the old booking page with `noindex`; `/api/services` 200; `/admin` loads; `/sitemap.xml` lists the new URLs.
  5. Rollback: restore the backup config, `nginx -t`, reload (one command, printed).
- [ ] Extend `scripts/auto-deploy.sh` later (Plan 3b) so web images deploy on push like the API; until then the owner runs `deploy-web.sh` after each web merge.

### Task 7: Tell Google and Bing (same day as cutover)

- [ ] Search Console (Justsigns browser, property `sc-domain:p91carcare.com`): submit `https://p91carcare.com/sitemap.xml`; URL Inspection → Request indexing for: `/`, `/services`, `/services/paint-protection-film`, `/services/ceramic-coating`, `/services/ceramic-coating/bike`, `/services/sun-control-film`, `/services/interior-detailing`, `/services/exterior-detailing`, `/areas/koramangala`, `/guides` (Google limits manual requests to ~10 a day; continue the rest over the next days in registry order).
- [ ] IndexNow: generate a key file in `apps/web/public/<key>.txt`, ping `https://api.indexnow.org/indexnow` with all 38 URLs (Bing, Yandex; ChatGPT search uses Bing's index).
- [ ] Bing Webmaster Tools: import the site from Search Console, submit the sitemap.
- [ ] Google Business Profile: website and booking links point to the new URLs (owner action; `docs/seo-plan/GBP-LINK-UPDATE.md`).
- [ ] Record baseline (Page indexing: 2 indexed / 48 not) and re-check weekly for 6 weeks in `docs/superpowers/plans/indexing-log.md`.

### Task 8: After cutover

- [ ] Weekly: Page indexing report, Crawled/Discovered-not-indexed lists, fix any page Google rejects (thin or duplicate) first.
- [ ] Wave 2 (spec): 8 car-model pages with real photos and 5 new guides; then more areas when real local jobs exist.
- [ ] Plan 2c: native booking in Next; then the old `/service/*` pages can 301.
- [ ] GTM + Meta Pixel/CAPI (needs the owner's GTM container and Pixel IDs).
