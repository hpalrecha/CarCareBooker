# Plan 2b, review checkpoints C and D (26 Nov 2026)

Batches C (areas, brands) and D (guides, gallery, FAQ, contact, about, legal), plus Task 6 and the PPF page extension.
Branch `feat/web-wave1-cd` (from `feat/web-wave1` WIP `b7ba848`, merged with `origin/main` for the live price-removal fix). Commits:

- `4fb0c5c` fix(web): batch C/D review: legal after the live no-price fix, pickup and coating wording, FAQ links
- `71f190f` feat(web): area, brand, guide, gallery, FAQ, contact, about and legal pages
- `20f749b` feat(web): PPF page to 1,200+ words
- this file and `2b-ship-gate.md` (docs commit)

**How to preview:** `npm run web:build && npm run web:start`, then http://localhost:3100 plus the paths below.

Owner rules applied throughout: no prices at all (no ₹ figure, no range; price slots are "Learn more" links); no offers in JSON-LD; self-healing allowed for PPF; PPF warranty years only from the catalogue; no star rating or review count; withheld "100% safe", "permanent bond", "certified technicians", "9H" as a promise; never "manufacturer's warranty"; Indiranagar without a branch; pickup "on request, confirmed on a call"; Book CTAs to WhatsApp; real P91 photos only.

---

## 1. Review of the WIP commit (`b7ba848`)

What was already there: area/brand/guide route files, the area and guide templates, content files for areas, brands, contact/about, FAQ, gallery, guides (+ generated data), legal (+ generated data), and the two generators. Found and fixed:

| Problem | Fix |
|---|---|
| `gen-legal.mjs` no longer ran: main's live fix (`fb9f35f`) had already removed prices from the terms list and the refund headings, so two FIXES did not match. | Terms list fix rewritten (see section 4); refund heading fixes dropped (main already removed them); data regenerated. |
| Area pages and /faq quoted hub FAQs saying pickup is "available across Bangalore at cost" / "at an additional cost". | Replaced with the pickup rule. Recorded per page below. |
| /faq kept "What is the starting price of ceramic coating?" (a price slot). | Question reworded; answer is a "Learn more" link to the ceramic page. |
| Hard-water guide: "a ceramic coating is what stops it coming back" (the service page had already replaced this overclaim). | Approved FAQ wording used (faq-page.ts:249). |
| Gallery called the Mahindra collage a "BE 6"; the photo catalogue says the model is unconfirmed. | Captioned "Mahindra electric SUV". |
| FAQ answers were rendered as plain text, so markdown links would have shown raw. | `FaqList` renders answers through `RichText`; the FAQPage JSON-LD gets plain words. |
| Missing: registry entries, hub routes (/brands, /guides), /gallery, /faq, /contact, /about, the three legal routes. | Added (commit `71f190f`). |

Every photo used on these pages was viewed (all 20 files in `apps/web/public/photos`). None is a `p91-stek-*`, watermarked, stock or AI image.

## 2. Pages

Word counts: visible words inside `<main>` of the built HTML (`.next/server/app/*.html`), scripts removed, tokens without a letter or digit (such as "·") not counted. This method is slightly stricter than batch B's: by it the batch A/B service pages read 1,193 to 1,510 (bike ceramic 1,193, exterior 1,197, glass coating 1,198, maintenance plan 1,193; the rest 1,200+). They were not changed in this batch.

### Batch C: areas

| Page | Words | Sources | Changes from source | Ship-gate gaps |
|---|---|---|---|---|
| /areas/koramangala | 611 | blog `ppf-koramangala-hsr-layout-shanti-nagar-adugodi` (blog-posts.ts:111-259), hub FAQs | "written manufacturer warranty" (:167, :212) → handover line; "pickup and drop ... at cost" → pickup rule; FAQ faq-page.ts:125 answer → pickup rule | drive time; route and parking |
| /areas/hsr-layout | 475 | blog HSR mentions (:124, :234), faq-page.ts:113 (first sentence word for word), SEO_PAGES[1] ORR section, new lines | faq-page.ts:113 "available across Bangalore at cost" → "on request, confirmed on a call" | drive time; route and whether pickup covers HSR |
| /areas/indiranagar | 405 | new copy | n/a. Says "one studio, in Adugodi, and no branch in Indiranagar"; Studio fact reads "(not in Indiranagar)"; FAQ "Do you have a studio in Indiranagar?" answers No. A test guards this. | drive time; route |

Area jobs are `[]` (no area-tagged photos on record), so the "Cars from ..." section is hidden.

### Batch C: brands

| Page | Words | Sources | Changes from source | Gaps |
|---|---|---|---|---|
| /brands | 285 | PRODUCTS_HERO, PRODUCT_KIND, PRODUCT_CHOOSE (products-page-data.ts:7-26) + 3 new intro paragraphs | links remapped; cards say "Learn more" | none |
| /brands/stek | 250 | BRAND_PAGES (brand-pages.ts:49) | manufacturer-warranty sentences (:55, :58) → handover line + batch line; hero is the Creta (never `p91-stek-*`) | none |
| /brands/nasiol | 204 | BRAND_PAGES (:80) | :86, :89 → handover line; hero GLE at the Nasiol wall | none |
| /brands/p91-premium-ppf | 231 | BRAND_PAGES (:110) | "Current prices ... the same figures apply when you book" cut; hero = P91 rear-quarter fitting shot | none |

Brand pages are short (200-250 words). They are as long as the approved source. Say if they should be lengthened like the service pages.

### Batch D

| Page | Words | Sources | Changes from source | Gaps |
|---|---|---|---|---|
| /guides (hub) | 490 | BLOG_INDEX_TITLE/DESCRIPTION idea + new intro; excerpts from the posts | "No guide quotes a price" | none |
| /guides/ppf-cost-bangalore (new) | 792 | new copy, Plan 2a PPF-cost board outline | no figures; four cost factors, cheap-quote reasons, five comparison questions, how P91 quotes | author, reviewer |
| /guides/what-is-ppf (new) | 698 | new copy | self-healing stated (allowed); limits stated | author, reviewer |
| /guides/ppf-vs-ceramic-coating-bangalore | 731 | BLOG_POSTS | manufacturer's warranty line → handover line | author, reviewer |
| /guides/hard-water-spot-removal-bangalore | 450 | BLOG_POSTS | "stops it coming back" → approved FAQ wording; image is a P91 polishing photo (blog image was a ceramic wipe) | author, reviewer |
| /guides/windshield-heat-rejection-film-summer | 426 | BLOG_POSTS | no image (blog image was doubtful side-window footage) | author, reviewer |
| /guides/how-much-ppf-does-your-car-need | 639 | BLOG_POSTS | "Live prices ... on the PPF page" cut; "price shown before you book" → "the PPF page explains what moves it; send a photo"; image the Creta | author, reviewer |
| /guides/is-your-ppf-really-made-in-usa | 689 | BLOG_POSTS | "A manufacturer warranty is only worth..." → "A warranty..."; "what it costs" → "what moves the cost" | author, reviewer |
| /guides/monsoon-damage-car-bangalore | 742 | BLOG_POSTS | carousel → list of slide headings; no image (blog image showed no damage) | author, reviewer |
| /guides/best-car-detailing-in-bangalore | 1,432 | BLOG_POSTS | manufacturer warranty (3 places) → handover wording; "same-day service" claim → studio times; "pickup ... at cost" → pickup rule; "book online in under a minute" → WhatsApp (no online booking until 2c); poster image replaced by the i20 after photo | author, reviewer |
| /gallery | 401 | GALLERY_SEO h1, STUDIO_PHOTOS/REEL_CAPTIONS filtered by the photo catalogue; 4 intro paragraphs (≈330 words) | dropped: `p91-stek-*` film clips, stock steering wheel, GT-R overlay, mislabelled "Comet", bike AI render; reels not embedded (Instagram link instead) | none |
| /faq | 2,214 | FAQ_INTRO, FAQ_SERVICE_CARDS, FAQ_GROUPS, FAQ_COMPARISON (faq-page.ts) | 12 FIXES in `site/faq.ts` (each must still match or the build fails): 5 manufacturer-warranty lines (:97, :110, :208, :214, :330) → handover wording; 3 "price on the page" lines → quote wording; 3 pickup "at cost" answers → pickup rule; ceramic "starting price" Q → "How is ceramic coating priced...?" with a Learn more link | none |
| /contact | 167 | CONTACT_SEO, VISIT_STUDIO, apps/admin contact.tsx:113-221 (NAP, GSTIN, email, map) | the enquiry form is not carried (the new site never posts); hours read live from /api/business-hours with a "call for today's hours" fallback | none |
| /about | 314 | HOME_ABOUT_H2, home about paragraph (home.tsx:434-446), FAQ_INTRO[1]; "How we work" and "The studio" new | no founding year, counts or awards | team, roles, since when |
| /services/paint-protection-film | 1,580 (was 759) | + SEO_PAGES[1] lede and includes (word for word); hub FAQs faq-page.ts:142, :154, :160, :166, :178, :188, :340 | 7 new sections: What the job includes; What the film protects against, and what it does not; Self-healing, explained; STEK or P91 Premium PPF, gloss or matte; New car or older car; Living with PPF; What to ask before you book. 4 hub FAQs added (scratch-proof, Basic vs Premium, new car, partial PPF). Related links + Front PPF. Warranty years still come only from the catalogue line. | days before the first wash (unchanged) |

**Overlaps to decide (not changed):** `/guides/how-much-ppf-does-your-car-need` repeats much of `/services/paint-protection-film/front`, and `/guides/hard-water-spot-removal-bangalore` repeats `/services/exterior-detailing/hard-water-spot-removal` (both service pages took the blog sections word for word in batch B). Options: trim the guides to a different angle, or canonical the guide to the service page. Owner to choose.

## 3. Legal pages: what changed from the source

`/privacy-policy`, `/terms-conditions`, `/refund-policy`: generated by `scripts/web/gen-legal.mjs` from `apps/admin/src/pages/*.tsx` (as on main after `fb9f35f`). `noindex, follow`, self canonical, not in the registry, not in the sitemap. Dates "10 August 2026" from `LEGAL_LAST_UPDATED`. Every change:

1. **Terms §2 service list.** The live page reads the four FOOTER_SERVICES rows from /api/services and prints their titles (no prices since `fb9f35f`). The new page prints the four titles `resolveCanonical` asserts: Interior Rejuvenation Service; Exterior Detailing with Hard Water Spot Removal; Windshield Glass Coating; Headlight Restoration - Both Lights. Same words, fixed at build. If a row is renamed or deactivated, the live page drops it and the new page does not: re-run the generator.
2. **Terms §3:** "A booking fee of ₹299 (₹499 for paint protection film services priced above ₹10,000) is required" → "A booking fee, as shown at booking, is required".
3. **Refund §1:** "charges a booking fee of ₹299 (₹499 for ... above ₹10,000)" → "charges a booking fee, as shown at booking,".
4. **Refund timeline:** "Full refund of the booking fee (₹299, or ₹499 for ...)" → "Full refund of the booking fee, as shown at booking".
5. **Refund timeline:** "50% refund (₹149.50)" → "50% refund of the booking fee, as shown at booking".
6. **Refund timeline:** "No refund (₹0)" → "No refund".

Privacy: unchanged. The old exact prices in the refund headings (₹999, ₹4,000, ₹3,500, ₹1,699, ₹1,499) were already removed on main.

## 4. Legal contradictions for the owner (not corrected, as instructed)

1. **Booking fee amounts.** The legal text (before this change) said ₹299, or ₹499 for PPF above ₹10,000. The API (`apps/api/src/routes.ts:1304-1306`) charges ₹499 for a PPF service and ₹99 for any other during offers, and ₹299 for ordinary bookings. "As shown at booking" hides the figure but the owner should confirm the real rule.
2. **₹149.50 = 50% of ₹299** only; for a ₹499 PPF fee the half would differ. Now worded as "50% of the booking fee".
3. **"Services are provided at your designated location in Bangalore. Our team will arrive within the scheduled time slot ... water connection"** (Terms §4) describes a doorstep service. The business is a studio in Adugodi with pickup on request.
4. **Refund §2 "Premium Car Wash Special"**: the canonical-services note says no such service exists; the active wash row is different.
5. **Refund §5 "100% satisfaction guarantee on all services"** and "Warranty-backed service with satisfaction guarantee": guarantee language the marketing pages avoid; "Insurance coverage for any accidental damage" and Terms §5 "comprehensive insurance coverage for all services" are not on record elsewhere.
6. **Windshield Glass Coating "No refund after application"** vs §5 "Free rework / Partial refund for unsatisfactory work" for all services.
7. **"Same-day cancellation: No refund"** overlaps "Less than 12 hours: No refund".
8. **Terms §3 "All prices ... include applicable taxes"** and "Prices are quoted by the studio before work begins": fine, but the new site shows no prices, so "the amount shown at checkout" only applies once Plan 2c ships booking.
9. **Terms §7 / Refund §8** point to "our booking portal or customer service channels" with no phone or email; the contact page has both.

## 5. Task 6 checks (at the docs commit)

- `node --test "tests/**/*.test.mjs"`: 736 tests, 733 pass, 0 fail, 3 skipped (new: `tests/web-pages-cd.test.mjs`, 6 tests).
- `npm run web:build`: ok, 46 static routes.
- `npm run web:check`: all registry pages pass, 0 failures, **pending links: none**.
- Registry: **38 indexable pages** (legal excluded); sitemap has 38 URLs.
- Ship gate: 24 pages blocked; full list in `2b-ship-gate.md`.
- Not run: Lighthouse mobile (no browser run in this session). PR not opened (instructions: never push).

Build note for the worktree only: `node_modules` here are junctions to the main checkout, and Turbopack refuses to resolve `next` outside its root, so `apps/web/next.config.ts` had `repoRoot` pointed at the main checkout for the local build. That edit is **not committed**; the committed config is unchanged.

## 6. Questions for the owner

1. Approve the two new guides and the PPF additions (new copy).
2. Brand pages are 200-250 words: lengthen?
3. Guide/service overlaps (section 2): trim the guides or canonical them?
4. The legal contradictions in section 4.
5. The `[NEEDS]` list in `2b-ship-gate.md`.
