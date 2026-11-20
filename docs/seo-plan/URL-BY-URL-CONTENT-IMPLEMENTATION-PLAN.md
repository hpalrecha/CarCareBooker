# URL-by-URL content and design implementation plan

Date: 20 November 2026. Planning document. No page copy is rewritten here. Every new paragraph below is a brief; draft copy is written per page after you approve the brief, and any fact marked **needs studio** is left out until the studio answers. Prices, cure times, warranty wording and database rows are not changed until you confirm them.

Inputs: the audit and maps (`CONTENT-SEO-STRUCTURE-AUDIT-AND-IMPLEMENTATION-PLAN.md`), the Phase 0 staging results (`PHASE0-STAGING-RESULTS.md`), Search Console demand (19 Aug to 17 Nov), and your approved previews.

## 1. Order of work

You asked for car wash, interior cleaning, polishing and glass first, because they match real search demand (car wash 277 impressions, interior cleaning 54, polishing 52, window film 20, all with 0 clicks).

| Wave | Pages | Why now |
|---|---|---|
| A | car wash, interior (item and guide), glass coating, glass polishing, headlight, glass and sun-film guide, polishing (see decision 1) | demand exists, pages are the thinnest (125 to 285 words) |
| B | `/ppf`, `/ceramic-coating/car`, `/ceramic-coating/bike` | revenue pages, "crawled, not indexed" |
| C | home, `/services`, exterior and annual-maintenance items, PPF and ceramic guides | hubs and remaining guides |
| D | `/gallery`, `/contact`, `/faq`, `/products*`, articles, `/blog` | proof and support pages |

Each wave is its own branch from origin/main after you approve Phase 0 (`seo/wave-a-service-pages`, and so on), with unit tests, the integration suite on staging, mobile checks at 360, 390, 768, 1024 and 1440, and a first-HTML parity run. Nothing is pushed or deployed without your approval.

## 2. Layouts for the remaining pages (distinct, same brand)

Same logo, header, footer partial, fonts, colours and buttons as the approved previews. The layouts differ:

| Layout | Used for | What makes it different |
|---|---|---|
| Cinematic (approved) | home | full-bleed video, image panels, film strip of work |
| Technical (approved) | `/ppf` | spec grid, selector, comparison table, section index |
| Glossy (approved) | `/ceramic-coating/car` and `/bike` | cover hero, photo rows, water-bead panel, sticky-photo timeline |
| **Process-first** (new) | car wash, interior, exterior detailing, annual maintenance | split hero with a short real clip, a numbered stage timeline from the studio's own steps, "what is and is not covered" two-column, price card, FAQ |
| **Clarity** (new) | glass coating, glass polishing, headlight, glass and sun-film guide | full-bleed glass and headlight photography, before and after pair, compact spec list, film-strip of the 4 reels |
| **Editorial** (new) | guides (`/services/*`) and articles (`/blog/*`) | 680 px reading column, sticky table of contents built from the article's own headings, pull quotes taken from the text, inline figures, related rail; byline only if you approve one |
| **Image-led mosaic** (new) | `/gallery` | filterable masonry (PPF, Ceramic, Detailing, Glass), lightbox, one approved caption per photo |
| **Brand sheet** (new) | `/products*` | brand header, "fits" list with price-page links, specification table filled only with manufacturer-verified rows |
| Map-first | `/contact` | map and hours first, then directions and the studio photo |
| Accordion hub | `/faq` | topic tabs, one accordion per topic |

Photos and video: the studio's own stills and the five reel clips already in the repository; more from the Instagram export when you provide it. Nothing is invented.

## 3. URL-by-URL plan

Legend: **Facts** = where the content comes from. **Needs studio** = blocked until the studio answers. Keyword = primary keyword from `02-keyword-map.csv`. Links = what Phase 0 already added.

### Wave A

| URL | Keyword (demand) | Layout | Add (briefs, no copy yet) | Facts | Needs studio | Status |
|---|---|---|---|---|---|---|
| `/service/premium-car-wash-special` | premium car wash Bangalore ("car wash near me" 277 impr) | Process-first | stage-by-stage wash steps; what is and is not included; how it differs from the interior and exterior services; time; one real foam-wash photo and clip (photo exists: `p91-wash-foam-*`) | catalogue record, existing description, wash photos | exact steps and products; **price conflict** (description says ₹599, record says ₹999) must be settled first | links done (1 to 4 pages); copy waits for studio |
| `/service/interior-detailing-service` | car interior cleaning Bangalore (54 impr) | Process-first | cabin zones cleaned in order; methods (steam, extraction) only if confirmed; exclusions; time; interior photos (steam seat, steering, vacuum exist) | catalogue, photos | steps, methods, exclusions, why 18 to 36 h | links done (2 to 4) |
| `/services/interior-detailing-bangalore` (guide) | car interior detailing Bangalore | Editorial | move the booking link above the fold; table of contents; "what to ask before booking" | existing guide, STUDIO answers | none for structure | planned |
| `/service/windshield-glass-coating-new` | windshield glass coating Bangalore | Clarity | stages; what the coating changes in rain; wiper and wash guidance; photo of water behaviour | catalogue, FAQ already in record | **conflicts:** windshield vs full-car price (₹1,999 / ₹2,499), stay time (24 h vs 36 to 48 h); product name and durability | links done (4 to 5) |
| `/service/windshield-glass-polishing` | windshield glass polishing Bangalore | Clarity | stages; scratch depth it can and cannot remove; when coating is the better choice | catalogue | **conflicts:** price (₹1,699/₹1,999 vs ₹1,999/₹1,399); depth limits | links done (2 to 4) |
| `/service/headlight-restoration-both` | headlight restoration Bangalore | Clarity | restoration stages, expected result, limits (moisture inside the lens, deep cracks), before and after pair | catalogue, existing photos (`p91-headlight-*`) | stages; whether the "6-month warranty" is real | links done (2 to 3) |
| `/services/glass-sun-control-film-bangalore` (guide) | car window film Bangalore (20 impr) | Editorial | table of contents; film types the studio fits (STEK only); what the numbers on a film mean (from the existing heat-rejection article) | existing guide and article, STEK page | confirm legal tint rules wording before any statement | planned |
| Polishing | car polish and rubbing (52 impr) | none yet | **no active polishing page exists** | gallery reel "Machine polishing", `car-polishing` hero clip | **decision 1** | blocked |

### Wave B

| URL | Keyword | Layout | Add | Needs studio / approval | Status |
|---|---|---|---|---|---|
| `/ppf` | PPF price Bangalore | Technical (approved) | "Why prices differ", "Which coverage do I need" (links to the sizing article), "What to ask any studio before booking", local line for Koramangala, HSR Layout, Shanti Nagar | film data for Basic and Premium; each new paragraph approved | approved layout; copy waits |
| `/ceramic-coating/car` | car ceramic coating price Bangalore | Glossy (approved) | PPF vs ceramic table; why paint correction adds time; aftercare. **The four hidden claims stay hidden.** The 5 remaining FAQs stay; 3 replacement answers are proposed in section 4 | time at studio (24 h vs 36 to 48+ h); approval of section 4 | claims hidden in Phase 0 |
| `/ceramic-coating/bike` | bike ceramic coating Bangalore | Glossy, bike photo set (`p91-bike-ceramic-coating-promo`) | bike-specific process, tank and fairing notes | studio confirms bike service details | blocked on facts |

### Wave C

| URL | Keyword | Layout | Add | Needs | Status |
|---|---|---|---|---|---|
| `/` | car detailing Bangalore | Cinematic (approved) | keep the live H1 (your decision); hub order unchanged | none | Phase 0 parity done (17 to 1 missing blocks) |
| `/services` | car detailing services Bangalore | Cinematic-lite hub | group by Protection / Finish / Care / Glass; each card links the service page and its guide | none | parity 16 to 3 |
| `/service/exterior-detailing-hard-water-new` | hard water spot removal car Bangalore | Process-first | stages in order, what etching can and cannot be removed, link to ceramic car page | studio steps; "how long the protection lasts" | links done (5 to 8) |
| `/service/annual-maintenance-package` | annual maintenance package Bangalore | Process-first | calendar of the 6 + 2 + 1 visits | **schedule, whether ₹9,999 is permanent and ₹18,000 is a real former price, pickup and drop** (the DB meta still says ₹18,000) | links done (1 to 3) |
| `/services/paint-protection-film-bangalore`, `/services/ceramic-coating-bangalore` | PPF and ceramic guides | Editorial | table of contents; price page link above the fold; "what to ask" | none for structure | never crawled by Google; request indexing 3 to 5 at a time after deploy |

### Wave D

| URL | Layout | Add | Needs |
|---|---|---|---|
| `/gallery` | Image-led mosaic | caption on every photo; filter chips; link from each group to its service page | captions for the photos that have none (Mercedes GLE, MG Comet EV, Macan, BMW already have approved tags) |
| `/contact` | Map-first | directions, nearest landmark, parking, what to bring | landmarks and parking from the studio |
| `/faq` | Accordion hub | topic tabs; 3 replacement ceramic answers (section 4) | approval |
| `/products`, `/products/stek`, `/products/nasiol`, `/products/p91-premium-ppf` | Brand sheet | specification table, fits list linked to price pages (done), warranty line aligned | manufacturer sheets; decision on the "manufacturer's warranty" sentence on the STEK page |
| 8 articles, `/blog` | Editorial | table of contents, FAQ block per article where the article already answers questions; widen the two short titles | none |

## 4. Proposed replacement answers for the three hidden ceramic FAQs (for approval)

Each uses only sentences or clauses already on the site; the hidden claim is the only thing removed.

1. **How is this different from regular wax?** "Traditional car wax lasts only 4-8 weeks and provides minimal protection. Our 1-Year Ceramic Coating is engineered to last 12 months with proper care and maintenance." (first sentence of the old wax answer plus the first sentence of "How long does the ceramic coating last?")
2. **Will ceramic coating prevent all scratches?** "Ceramic coating cannot prevent deep scratches from impacts or sharp objects. It significantly reduces the risk of wash-induced scratches and maintains your paint's clarity." (the old answer without its "9H hardness" clause)
3. **Is the coating safe for my car paint?** Dropped entirely unless you can document "safe". If you want a replacement, the only existing support is "It creates a sacrificial layer that protects your original paint from UV damage, oxidation, and environmental contaminants."

## 5. Decisions I need

1. **Polishing:** does the studio sell paint polishing or "rubbing and polishing" as a service? If yes, which package and price? If no, no polishing page is created.
2. The studio's answers in `STUDIO-INFORMATION-REQUEST.md`, starting with the car wash, interior and glass items (wave A).
3. The price and time conflicts: wash ₹599 vs ₹999, glass coating ₹1,999 / ₹2,499 and 24 h vs 36 to 48 h, glass polishing, annual package ₹9,999 vs ₹18,000, ceramic time at studio.
4. `guaranteeText` ("100% Satisfaction Guaranteed ... 1-year performance warranty") on the ceramic rows: keep or hide.
5. The section 4 replacement answers.
6. Approve the layouts in section 2, then I build previews for the three new ones (Process-first, Clarity, Editorial) before any code.
7. Approve Phase 0 for production (staging is clean), or tell me what to change first.
