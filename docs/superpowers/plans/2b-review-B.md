# Plan 2b, review checkpoint B (26 Nov 2026)

This covers the owner's answers to checkpoint A, applied to the batch A pages, plus batch B (sub-services).
Branch `feat/web-wave1`. Commits:

- `75150de` feat(web): hide single-price lines, longer service pages, WhatsApp booking until 2c
- `c38f0fe` feat(web): no prices on the new site; Learn more on cards; no offers in JSON-LD
- `4a63c78` feat(web): PPF variants, correction, headlight, hard water, glass coating, maintenance plan, car wash

**How to preview:** `npm run web:build && npm run web:start`, then open the links below (port 3100).

**What the owner needs to do:** read each page, approve or comment, and answer the `[NEEDS]` list at the end. Task 4 (areas and brands) does not start until this batch is approved.

---

## 1. What changed after checkpoint A

| Owner answer (26 Nov) | What was done |
|---|---|
| Single catalogue price: never show a lone figure | Done in `75150de` (a `shownRange` helper, tested), then **superseded** by the next rule. The helper and `packages/domain/src/price-ranges.ts` stay, unused, with their tests. |
| **No prices at all** (later the same day) | `c38f0fe`: the hero price line, the price block and range table, the Home hero price, the Home and hub card prices, the `{range}` sentences in short answers and the AggregateOffer in Service JSON-LD are all gone. `PriceRangeTable` is deleted. Cards now say "Learn more". Cost sections stay, with no rupee amounts. "WhatsApp a photo for the price" is not used anywhere. The "Top price needed" check was added in `75150de` and dropped again in `c38f0fe`, as instructed, so there is no "Top price needed" list. |
| Tests for no prices | Registry rule: no `₹` followed by a digit anywhere in page content, and no `{range}`/`rangeRows`/`rangeNote` slots. `web:check` now fails on any `₹` followed by a digit in visible HTML. The Service schema test asserts no offers and no price fields. |
| Length: about 1,200+ words for the batch A service pages | New sections on ceramic car, bike ceramic, sun control film, interior and exterior (listed per page below). All are now 1,200+ words of visible text. |
| Book buttons go to WhatsApp until Plan 2c | `SITE.book` = `https://wa.me/917406619191`, "Book on WhatsApp". Every service page hero shows "Book on WhatsApp" and "Call +91 74066 19191", and the closing band's primary button is "Book on WhatsApp". Ceramic step 1 now reads "Book on WhatsApp or call". |
| CMVR tint limits | Kept on `/services/sun-control-film`. |

Copy changes made because of the no-price rule:
- **Home:** the hero lead is now "...Every service page explains what the job involves and what makes it cost more or less." The hero button is now "How paint protection film works". The services heading is now "Services", and its intro explains what each page covers. The FAQ "Why do PPF quotes differ so much?" now ends "...a photo on WhatsApp gets you a quote for your car." The closing band is now "Send a photo of your car, we tell you what it needs".
- **PPF:** the short answer is now "At P91 a full-body job keeps the car about 3 days in the studio; the cost depends on car size, film line and coverage." The body-type price table is gone. The cost-factors section stays.
- **Services hub:** the lede and intro paragraph no longer mention ranges. The title is now "All Car Detailing Services in Bangalore | P91 Car Care".
- **Registry and llms.txt:** "price range" wording is removed from descriptions and from `llms.txt`.

## 2. Pages

Word counts are the visible text inside `<main>` of the built page: headings, body, FAQ, links and buttons, without scripts. The figures come from the build at `4a63c78`.

| Page | Local URL | Words |
|---|---|---|
| Home | http://localhost:3100/ | 835 |
| Services hub | http://localhost:3100/services | 533 |
| PPF (not in the length request) | http://localhost:3100/services/paint-protection-film | 768 |
| Ceramic coating | http://localhost:3100/services/ceramic-coating | 1,519 |
| Bike ceramic coating | http://localhost:3100/services/ceramic-coating/bike | 1,200 |
| Sun control film | http://localhost:3100/services/sun-control-film | 1,206 |
| Interior detailing | http://localhost:3100/services/interior-detailing | 1,215 |
| Exterior detailing | http://localhost:3100/services/exterior-detailing | 1,206 |
| Matte PPF (B) | http://localhost:3100/services/paint-protection-film/matte | 1,219 |
| Front PPF (B) | http://localhost:3100/services/paint-protection-film/front | 1,213 |
| Bike PPF (B) | http://localhost:3100/services/paint-protection-film/bike | 1,211 |
| Paint correction (B) | http://localhost:3100/services/paint-correction | 1,216 |
| Headlight restoration (B) | http://localhost:3100/services/exterior-detailing/headlight-restoration | 1,212 |
| Hard water spot removal (B) | http://localhost:3100/services/exterior-detailing/hard-water-spot-removal | 1,207 |
| Windshield glass coating (B) | http://localhost:3100/services/sun-control-film/windshield-glass-coating | 1,204 |
| Annual maintenance plan (B) | http://localhost:3100/services/maintenance-plan | 1,201 |
| Car wash (B) | http://localhost:3100/services/car-wash | 1,233 |

**How the new copy was written.** Every new section is plain and factual. It uses three kinds of source: approved modules (named per page), the live catalogue (studio time and includes lists, read at build time and never typed), or well-established public car-care knowledge with no figures. Anything about P91's own practice that is not on record is a `[NEEDS]`. No numbers, years, distances or customer stories were invented. The only figures in new copy come from the catalogue: "12 months" for the 1-year coatings, and "6 to 12 months" for glass coating, from that row's FAQ.

**Two template additions (batch B).**
- `timeSlug`: "{time}" in a short answer becomes the catalogue row's studio time (`formatServiceTime`); if there is none, that sentence is dropped.
- `catalogueIncludes`: a section that lists one row's `whatIncluded`, read live. Withheld claims, any `₹`, "Rs" or warranty line, and tick marks are dropped.

## 3. Batch A pages: the new sections

### Ceramic coating
- New sections:
  - "What moves the price of a ceramic coating": car size, paint condition, preparation, the coating chosen, coating over film. It expands the approved FAQ answer and the catalogue process steps.
  - "How long the coating lasts, and what wears it down": from the catalogue's "12 months with proper care" and "degrades gradually", plus general wash-wear knowledge.
  - "Ceramic coating or PPF?": the approved FAQ and Home lines.
  - "What to ask a studio before you book": the approved warranty and batch lines; it names Nasiol.
- Step 1 now reads "Book on WhatsApp or call".

### Bike ceramic coating
- New sections:
  - "What moves the price for a motorcycle"
  - "Washing a coated bike, step by step": the bike FAQ and catalogue maintenance answer, plus keeping pressure jets off bearings and electrics.
  - "Coating or paint protection film for a bike?": the bike FAQ "not armour".
  - "How long it lasts": the catalogue's 12 months, gradual wear and reapplication.
  - "What to ask before you book"
- Also new: a catalogue includes section, "What the 1-year bike package lists", and step 1 now reads "Book on WhatsApp or call".

### Sun control film
- New sections:
  - "The main kinds of film": dyed, metallised, carbon and ceramic film, general knowledge, no figures.
  - "What moves the price"
  - "Why heat control matters in Bangalore"
  - "Signs of a poorly fitted film"
  - "The first days after fitting": the number of days is `[NEEDS]`.
  - "What to ask before you book"
- New 5-step process: the steps are taken from the SEO_PAGES includes list.
- The CMVR Rule 100 limits stay.

### Interior detailing
- **Contradiction found:** the catalogue row says 18-36 hrs, but the old FAQ said "Most cars take a few hours". That FAQ is dropped, and the short answer reads the time from the catalogue.
- New sections:
  - "What makes an interior job bigger"
  - "Fabric, leather and plastics need different care": the catalogue's "UV protection for plastics" and the SEO leather FAQ.
  - "Steam for the places a cloth cannot reach"
  - "Where cabin smells come from"
  - "Keeping the cabin clean between details"
  - "When it is worth booking"
  - "What to ask before you book": whether seats are removed is `[NEEDS]`.
- New 6-step process, taken from the includes lists.

### Exterior detailing
- **Moved:** the hard-water blog sections went to the new hard-water page, so the two pages do not repeat each other.
- Read from the catalogue: the studio time (12-18 hrs) and a "What the exterior package lists" section.
- New sections:
  - "What exterior detailing can fix, and what it cannot"
  - "Decontamination: what a normal wash leaves behind": the catalogue process (iron remover, clay bar).
  - "Polish, wax and coating are three different things": "wax wears off within weeks" comes from the bike FAQ.
  - "Common paint problems on Bangalore cars"
  - "Wheels, tyres, chrome and trim": the catalogue includes.
  - "Keeping it that way after the detail"
  - "What to ask before you book"
- New 6-step process, taken from the catalogue includes.

## 4. Batch B pages: sources and new sections

### Matte PPF
- **Sources:**
  - `faq-page.ts:178` ("Does PPF change the colour of my car?", used whole) and `:96` (STEK gloss and matte films).
  - `seo-pages.ts:179` ("Matte film changes the finish on purpose...").
  - The `brand-pages.ts:66` idea ("changes the finish without touching the original paint").
  - The blog line "full body is the right answer for matte paint, which cannot be polished".
- **New sections:**
  - "Two reasons owners choose matte film"
  - "What matte film looks like on a car"
  - "Full body, or only some panels?"
  - "What moves the price"
  - "Caring for matte film"
  - "Living with a matte car"
  - "What to ask before you book"
- **FAQ:** two approved hub FAQs and five new ones.
- **Deviation:** the plan said family `ppf` (overall only). It is `null`, because the full-body gloss range does not describe matte work. With no prices on the site this no longer shows.

### Front PPF
- **Sources:**
  - SEO_PAGES[1] Bangalore traffic section and FAQ "Full body or just the front?".
  - Carousel slides "Partial front" and "Full front end".
  - Blog `how-much-ppf-does-your-car-need`: "Coverage is a decision, not an upsell", the three levels, "Why PPF and ceramic are quoted together" and the "What to ask" list, word for word, with links remapped. Dropped: "It is the option we fit most often", which is a claim not on record.
  - Hub FAQs on partial PPF and pressure washing.
- **New sections and lines:**
  - "What moves the price"
  - "Caring for front film"
  - One added paragraph on the partial-bonnet cut line, and one on the full front end, which covers the headlights.
- **FAQ:** two new FAQs ("Will there be a visible line...", "Can I add more panels later?") and a headlights FAQ.
- **Note:** this copy will overlap the `/guides/how-much-ppf-does-your-car-need` guide in batch D. That guide will need trimming or a different angle.

### Bike PPF
- **Sources:** new copy, plus one P91 fact on record: the Dhanush Dhanush Google review (Z900 PPF), quoted word for word.
- **New sections:**
  - "Where a motorcycle's paint gets damaged"
  - "What the film does, and what it does not"
  - "Which parts to cover"
  - "Gloss, matte and new bikes"
  - "Bangalore riding and the paint"
  - "Film or ceramic coating for a bike?"
  - "What moves the price"
  - "Riding and washing with film on"
  - "What to ask before you book"
- **FAQ:** eight new FAQs.

### Paint correction
- **Sources:** `faq-page.ts:288`, the ceramic FAQ line "Polishing improves the surface you have...", and the catalogue ceramic process.
- **Photos:** two new real P91 photos of rotary polishing on a red bonnet (`polish-red-bonnet*.webp`, from `gallery/p91-polish-bonnet-*`; each was viewed). Also the Porsche polishing frame and the i20 before/after pair.
- **New sections:**
  - "What correction actually removes"
  - "Where swirl marks come from"
  - "One stage or more"
  - "What correction cannot fix"
  - "New cars need it too"
  - "Correction before coating or film"
  - "Keeping corrected paint swirl-free"
  - "What to ask before you book"
- **Process and FAQ:** a 5-step process, six new FAQs and one hub FAQ.

### Headlight restoration
- **Photos:** `headlight-polish-lens.webp` and `headlight-restored-jetta.webp`, from `gallery/p91-headlight-polish-detail` and `p91-headlight-restored`; each was viewed. The second is a VW Jetta Mk5, as the photo catalogue says.
- **Read from the catalogue:** the studio time (4 hrs) and the includes list.
- **Warranty:** the catalogue's "6-month warranty on restoration" line is not shown. The page uses the handover warranty line, per the plan's warranty rule. Confirm whether the owner wants the 6 months stated.
- **New sections:**
  - "Why headlights turn yellow and cloudy"
  - "Why it is worth fixing"
  - "What restoration does"
  - "Signs your headlights need it"
  - "What it cannot fix"
  - "Why toothpaste and quick fixes do not last"
  - "Keeping restored headlights clear"
  - "Fog lamps and tail lamps"
  - "What to ask before you book"
- **FAQ:** eight new FAQs.

### Hard water spot removal
- **Sources:**
  - The blog lede and the sections "Why borewell water is the problem", "The habit that prevents it" and "When it needs correction", word for word. These moved here from the exterior page.
  - The blog's "Stopping it coming back" claimed a coating "stops it coming back"; it is replaced by the approved FAQ wording ("cannot fully prevent hard water spotting").
  - Glass: the catalogue's glass-polishing row ("removes water spots and light scratches").
- **New sections:**
  - "Where the spots collect"
  - "Water spots on PPF and coated cars"
  - "Home remedies to avoid"
  - "Spots on the glass"
  - "What to ask before you book"
- **FAQ:** six new FAQs plus one hub FAQ.
- **Photo and overlap:** there is no hard-water photo. This copy will overlap the `/guides/hard-water-spot-removal-bangalore` guide in batch D, which will need a different angle.

### Windshield glass coating
- **Sources:** hub FAQ `faq-page.ts:317`, SEO FAQ "What does windshield glass coating do?", and the catalogue row's time and its FAQ ("6-12 months", "windshields, side windows and mirrors").
- **Contradiction found:** the row's `durationText` says 36-48 hrs, which the page shows. Its own FAQ and includes say "24 hours". Its descriptions also carry exact prices; those are not used.
- **New sections:**
  - "What the coating does"
  - "What it does not do"
  - "Why it helps in the Bangalore monsoon"
  - "Polish first, then coat"
  - "Side windows and mirrors"
  - "Wipers on coated glass"
  - "Studio coating or a spray from a shop"
  - "Caring for the coating"
  - "When to reapply"
  - "What to ask before you book"

### Annual maintenance plan
- **Sources:** the "What the plan includes" list is read live from `annual-maintenance-package` (visit counts, schedule, validity) and is never typed. The hero photo is the Vellfire foam frame from the P91 wash bay.
- **New sections:**
  - "Who the plan suits"
  - "Why regular care beats one big clean"
  - "What each kind of visit is"
  - "Through the year in Bangalore"
  - "A plan or a visit at a time"
  - "Between visits"
  - "For coated and PPF cars"
  - "What the plan does not include"
  - "What to tell us when you sign up"
  - "Questions to settle before you buy"
- **FAQ:** seven new FAQs.

### Car wash
- **Sources:** the catalogue row's time (2 hrs) and includes list. Not used: its description ("Best value car wash in Bangalore!") and "why choose" text, which carries an exact price.
- **Photos:** `wash-foam-macan.webp` and `wash-foam-vellfire.webp`, from `gallery/p91-wash-foam-hand` and `p91-wash-foam-vellfire`, in the real P91 wash bay; each was viewed.
- **Review:** sundeep paruchuru, word for word. Mohammed Tahir's car-wash review is not used, because it contains "5 ⭐️".
- **New sections:**
  - "Why foam comes first"
  - "Hand wash or automatic wash"
  - "Drying is half the job"
  - "After the monsoon, under the car too"
  - "Between washes"
  - "A wash before detailing"
  - "Washing a coated or filmed car"
  - "Washing at home without scratching"
  - "How often to wash"
- **FAQ:** six new FAQs.

## 5. Deviations and notes

- Families on matte, front and bike PPF are `null` (see above). Families are unused while the site shows no prices.
- The PPF page is 768 words. It was not in the owner's length list, so it was left as approved in Plan 2a. Say if it should be lengthened too.
- The hub is 533 words, above the spec's 300 for hubs.
- "One link per destination per page": the related-links block avoids repeating links already in the body where possible. Body links and the closing band can still overlap with the breadcrumbs.
- `apps/web/image.png` is an untracked file not created by this work. It was left alone and not committed.

## 6. Checks at `4a63c78`

- `npm test`: 731 pass, 0 fail. There are 731 rather than 732 because the two Service-schema offer tests became one no-offer test.
- `npm run web:build`: ok.
- `npm run web:check`: all registry pages pass, with 0 failures and no `₹` figures in visible HTML.
  - Pending links (later batches): /about, /areas/koramangala, /brands, /brands/nasiol, /brands/p91-premium-ppf, /brands/stek, /contact, /faq, /gallery, /guides, the 7 guide pages, /privacy-policy, /terms-conditions.
  - No service page is pending any more.

## 7. Ship-gate gaps (`npm run web:ship-gate`): 11 pages blocked

```
/                                                   [NEEDS: service]  (three Home work captions)
/services/paint-protection-film                     [NEEDS: days before the first wash]
/services/sun-control-film                          [NEEDS: time in the studio]
                                                    [NEEDS: days before the windows can be rolled down]
/services/interior-detailing                        [NEEDS: does P91 remove seats, and for which cars]
/services/paint-protection-film/matte               [NEEDS: studio time for a full-body matte job]
                                                    [NEEDS: can P91 show a matte film sample or a finished matte car at the studio?]
/services/paint-protection-film/front               [NEEDS: studio time for partial front and full front end]
/services/paint-protection-film/bike                [NEEDS: studio time for a bike PPF job]
                                                    [NEEDS: which bike panels P91 covers, and whether kits are pre-cut or hand-cut]
                                                    [NEEDS: days before the first wash after bike PPF]
/services/paint-correction                          [NEEDS: studio time for paint correction on its own]
                                                    [NEEDS: does P91 measure paint thickness before correcting?]
/services/exterior-detailing/headlight-restoration  [NEEDS: does P91 restore fog lamp and tail lamp lenses?]
                                                    [NEEDS: how long P91's UV coat is expected to last]
                                                    [NEEDS: is a single headlight offered?]
/services/sun-control-film/windshield-glass-coating [NEEDS: is all-glass coating a separate package, and how is it priced?]
/services/maintenance-plan                          [NEEDS: confirm each plan visit is the same job as the service page it links to]
                                                    [NEEDS: does P91 schedule the visits, or does the owner choose the dates?]
                                                    [NEEDS: booking process for plan visits]
                                                    [NEEDS: policy on unused visits]
                                                    [NEEDS: transfer policy]
                                                    [NEEDS: confirm the plan can start in any month]
```

There is no "Top price needed" list: the owner's later rule (no prices at all) replaced it, and the check was removed.

Catalogue questions for the studio (not ship-gate blockers):
1. Glass coating: 36-48 hrs (`durationText`) or 24 hours (its FAQ and includes)?
2. Should the headlight page state the "6-month warranty on restoration"?
3. The car wash and glass rows have exact prices inside their description texts. The new site does not use those texts, but the old site and the catalogue still carry them.
