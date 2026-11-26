# Plan 2b, review checkpoint A (26 Nov 2026)

Batch A: the main service pages and the services hub, plus the Task 1 changes to PPF and Home.
Branch `feat/web-wave1`. Commits: `76f0d7b` (Task 1), `98d8cf7` (Task 2).

**How to preview:** `npm run web:build && npm run web:start`, then open the links below (port 3100).
Prices on the pages come from the live catalogue (`https://p91carcare.com/api/services`, GET only).

**What the owner needs to do:** read each page, then approve or comment. Task 3 (batch B) does not start until this batch is approved.

---

## Owner decisions needed (short list)

1. **Single-figure "ranges".** Car ceramic, bike ceramic, interior, exterior, headlight, glass coating, car wash and maintenance plan each have one row in the catalogue, so the "range" shows one figure (for example ceramic `₹7.5k`, interior `₹3.5k`). The formatter also rounds: 1,499 shows as `₹1.5k`, 9,999 as `₹10k`. This is Plan 2a behaviour (Home already shows it), but it reads like an exact price. Options: add a top end per service in the catalogue, hide single figures, or accept as is.
2. **Legal tint figures** on `/services/sun-control-film` ("front and rear glass at least 70% VLT, side windows at least 50%, CMVR Rule 100") are the figures Plan 2b set; no module in the repo states them. The page keeps the approved caution that court directions also apply and the rules should be confirmed before fitting. Please confirm the wording, or tell us to remove the figures.
3. **"Book your appointment online"** is step 1 on both ceramic pages (approved landing-page copy). The new site has no booking page until Plan 2c. Keep it (true once 2c ships), or change it to "WhatsApp or call to book" until then.
4. **Interior page is short** (about 380 words visible; the spec asks 1,200 to 1,800 for a main service page). The approved source has one section, the includes list and 3 FAQs. More needs new copy or facts from the studio (what moves the price, steps, photos).

## Pages

| Page | Local URL | Copy source |
|---|---|---|
| Home (Task 1 changes only) | http://localhost:3100/ | `site/home.ts` (Plan 2a), `reviews.ts` |
| PPF (moved to the template) | http://localhost:3100/services/paint-protection-film | `site/paint-protection-film.ts` (Plan 2a) |
| Services hub | http://localhost:3100/services | `SERVICES_SEO` (`static-seo.ts:55`), `apps/admin/src/pages/services.tsx:76-80`, `service-hub-links.ts`, Home service lines, `FAQ_COMPARISON` (`faq-page.ts:355`) |
| Ceramic coating | http://localhost:3100/services/ceramic-coating | `SEO_PAGES[0]` (`seo-pages.ts:83`), `LANDING_PAGES[0]` (`landing-pages.ts:158`), `CERAMIC_TIMING` (`ceramic-timing.ts:16`), `/faq` groups |
| Bike ceramic coating | http://localhost:3100/services/ceramic-coating/bike | `LANDING_PAGES[1]` (`landing-pages.ts:235`), `bikeLandingFaq()` (`bike-landing-copy.ts:28`) |
| Sun control film | http://localhost:3100/services/sun-control-film | `SEO_PAGES[3]` (`seo-pages.ts:236`), `/faq` group `sun-control-film` (`faq-page.ts:296`) |
| Interior detailing | http://localhost:3100/services/interior-detailing | `SEO_PAGES[2]` (`seo-pages.ts:191`) |
| Exterior detailing | http://localhost:3100/services/exterior-detailing | `/faq` group `car-detailing` (`faq-page.ts:266`), blog `hard-water-spot-removal-bangalore` (`blog-posts.ts:383`) |

Copy taken from `seo-pages.ts` and `faq-page.ts` is read from those modules at build time (`site/sources.ts`), so it is word for word by construction. Copy from `landing-pages.ts`, `bike-landing-copy.ts` and `blog-posts.ts` is copied in (those modules cannot be imported by the plain-Node tests); a script check confirmed every copied sentence matches its source, except the changes listed below.

## Every change from the source, and why

### Home (Task 1)
- Trust item 1: `[NEEDS: Google rating]` / `[NEEDS: review count]` replaced by "Google reviews · Read what owners wrote", linking to the Google listing (owner decision: no rating, no count).
- Trust item 2: `[NEEDS: N]-year warranty` replaced by "5 or 7-year PPF warranty"; the years are read from the catalogue rows (`warrantyYearsOf` through `buildPpfPackages`), never typed. With no years in the catalogue it falls back to "Written PPF warranty".
- New reviews section: the first six Google reviews (`HOME_REVIEW_COUNT`), word for word, with names, and a "Read all our Google reviews" link. No stars, no count, no review markup.

### PPF (Task 1)
- Same copy, moved onto the service template. Layout differences: the cost factors are now a bulleted section (bold factor name, same sentences) instead of a dark card grid; the warranty line sits after the steps.
- Warranty: the `[NEEDS: warranty years ...]` line is now "5-year (standard) or 7-year (premium) written warranty, terms at handover.", years from the catalogue.
- FAQ "How long does PPF last?": `[NEEDS: years per film line]` replaced by "It depends on the film line you choose: " + the same warranty line. It states the warranty, not a lifespan.
- Added a reviews block quoting three Google reviews that mention PPF (Nilesh Parson, suresh kumar, Rahul Manikanavar), word for word.
- Aftercare `[NEEDS: days before the first wash]` stays.

### Services hub
- H1 "All Services" → "All services" (sentence case, site style).
- Lede: "Prices and availability are live, the same figures you will see at checkout." → "Each service shows its price range and what moves your car up or down it." (plan: drop "live prices", say price ranges; the replacement sentence is the approved Home lead).
- Card notes: from `SERVICE_GUIDE_LINKS`/`SERVICE_PRICE_LINKS` and the Home lines; "with live prices" dropped. New one-line notes for the batch B cards (front, matte, bike PPF, paint correction, hard water, headlight, maintenance plan, glass coating) each restate an approved line or the catalogue includes list.
- Group intros: the three `FAQ_SERVICE_CARDS` bodies (`faq-page.ts:47`) and the PPF lede from `landing-pages.ts:325`.
- Two intro paragraphs (new, plain): the list of services from `FAQ_INTRO[1]`, and the Plan 2a "price ranges, not teaser prices" line.
- "Which one do you need?" table: new arrangement; each row restates an approved line (FAQ comparison, FAQ answers, service pages). The v2 canvas board was not available to this session, so the table is built from those sources.
- Comparison table `FAQ_COMPARISON` reused as is (it will also appear on `/faq` in batch D).

### Ceramic coating
- H1 "Ceramic Coating in Adugodi, Bangalore" → "Ceramic coating in Bangalore" (spec: "<Service> in Bangalore"; Adugodi stays in the eyebrow).
- Short answer: the landing lede, plus the price range and the confirmed studio time ("Approx. 36–48+ hours in the studio, depending on the preparation required", `CERAMIC_TIMING`).
- Benefit 1: dropped the last sentence "The full guide explains how that damage happens." (the page itself now carries the borewell section).
- Steps: the six landing-page steps are kept word for word as the step text; the short step titles ("Book", "Decontaminate", ...) are new labels.
- FAQ "How long does the car stay with you?": the source answer began "Usually a full day." That contradicts the studio's confirmed time (11 Nov), so the first sentence is replaced with the confirmed `CERAMIC_TIMING` answer; the rest of the answer is unchanged.
- "Is 9H a meaningful number?" is kept: it is the educational FAQ the owner allowed, not a 9H promise.
- Four FAQs added word for word from `/faq` (worth it, polishing vs coating, hard water stains, maintenance).
- Reviews: Pratham Pandit, Shreyash Gupta, YATHISH N (they name ceramic coating). Lily Rose is not used (her review contains star emoji and "5-star").
- Related links: the landing page's list, remapped; the duplicate "full guide" link (now the same page) and "All guides" dropped.

### Bike ceramic coating
- H1 "Ceramic Coating for Your Motorcycle" → "Bike ceramic coating in Bangalore".
- Short answer: the landing lede, plus the range and the confirmed bike time ("approx. 36–48 hours").
- No hero photo (no real motorcycle photo exists; the bike promo image is an AI render). "100% safe" and "permanent bond" were only in the catalogue row's FAQ, which is not used; the 7 FAQs are `bikeLandingFaq()` word for word.
- Step titles are new labels, as on the car page. Related: "Ceramic coating: the full guide" dropped (same destination as "Ceramic coating for cars"), "All guides" dropped.

### Sun control film
- H1 "Windshield Glass Coating & Sun Control Film in Bangalore" → "Sun control film in Bangalore" (glass coating gets its own page in batch B).
- Short answer: new, assembled from the source lede and the VLT/TSER section. Studio time is `[NEEDS]`.
- No price range and no hero photo: the catalogue has no active sun control film row, and the window-film footage in `attached_assets` is probably another installer's.
- New section "What the law allows": the CMVR Rule 100 figures from the plan (decision 2 above), plus two approved caution sentences from the FAQs.
- Includes list: "Rain-repellent coating applied and buffed to a streak-free finish" dropped (glass coating, not film).
- FAQs: 4 of the 7 source FAQs; the 3 overlapping ones (legal, darker film, windshield coating) appear once each.

### Interior detailing
- H1 "Car Interior Detailing in Adugodi, Bangalore" → "Car interior detailing in Bangalore".
- Short answer: the source lede plus the range and the "few hours, upholstery must dry" line from its FAQ.
- "What moves the price" is `[NEEDS]`. "What is the difference between car washing and car detailing?" is on the exterior page only, to avoid repeating it.

### Exterior detailing
- New page; H1 "Exterior detailing in Bangalore". Short answer reworded from the `car-detailing` FAQ answers. Studio time and price movers are `[NEEDS]`.
- Hard-water blog sections copied word for word; the blog's two h3s ("Surface deposits", "Etched spots") became bold lead-ins; its link to `/service/exterior-detailing-hard-water-new` is remapped to `/services/exterior-detailing/hard-water-spot-removal`.
- New sentence linking the headlight child page: "Hazy headlight lenses are a separate job: headlight restoration."
- Not carried over: the blog's "Stopping it coming back" paragraph ("a ceramic coating is what stops it coming back"). It contradicts the approved FAQ ("it cannot fully prevent hard water spotting"); the hard-water page in batch B is the place to settle it.
- Before/after: the orange i20 pair with the Home caption.

## Ship-gate gaps (`npm run web:ship-gate`)

```
/                                  [NEEDS: service]  (three Home work captions)
/services/paint-protection-film    [NEEDS: days before the first wash]
/services/sun-control-film         [NEEDS: time in the studio]
                                   [NEEDS: a sun control film row in the catalogue, so the price range can be shown]
/services/interior-detailing       [NEEDS: what moves the interior detailing price, for example car size or cabin condition]
/services/exterior-detailing       [NEEDS: time in the studio]
                                   [NEEDS: what moves the exterior detailing price, for example car size or paint condition]
```

Home no longer lists rating or warranty gaps.

## Template and code notes (deviations from the plan's interfaces)

- `ServiceContent` gained four optional fields: `Section.photo` (the PPF coverage photo), `beforeAfter` (exterior's i20 pair), `labels` (page headings such as "Three days, five steps", so approved headings survive the template) and a `{warranty}` token in FAQ answers. Everything else matches the plan.
- The warranty years are computed in the page from the catalogue (`apps/web/lib/warranty.ts`), because `ppf-packages.ts` cannot be imported by the plain-Node tests; `getServices()` now also returns `title` and `whatIncluded`.
- Area, brand and guide templates are built from the spec's section 2 descriptions; the v2 canvas boards were not available to this session. No route uses them yet (batches C and D).
- New tests: `tests/web-link-map.test.mjs` (every old-to-new row), and registry rules for old links, withheld claims, manufacturer's-warranty wording, ratings, review names, and reviews that quote a price (Fazil Ahmed and Rahul Mehta are both excluded by that rule).
- Main service pages are shorter than the spec's 1,200 to 1,800 words (ceramic about 1,150, PPF about 880, the rest 380 to 720), because the approved sources are short. Growing them is new copy for a later batch.
- Not on the pages yet: Book buttons (booking is Plan 2c), "gallery filtered to this service" (gallery is batch D).

## Checks at commit `98d8cf7`

- `npm test`: 731 pass, 0 fail (was 698).
- `npm run web:build`: ok, 13 static routes.
- `npm run web:check`: all registry pages pass. Pending links (later batches): /about, /areas/koramangala, /brands, /brands/nasiol, /brands/stek, /contact, /faq, /gallery, /guides, 7 guide pages, /privacy-policy, /terms-conditions, and the 9 batch B service pages.
