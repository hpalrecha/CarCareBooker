# Plan 2b content gaps (26 Nov 2026)

Output of `npm run web:ship-gate` on branch `feat/web-wave1-cd` after the owner decisions of 26 Nov. Every `[NEEDS ...]` below is a fact the studio has not supplied yet.

**No longer blocking (owner decision 26 Nov 2026, indexing priority).** The templates hide every sentence, list item, FAQ, fact row, caption and empty section that carries a marker (`packages/content/src/site/gaps.ts`), so these pages can be indexed now; `npm run web:check` fails if a marker ever reaches visible HTML. The script exits 0 and this list is the studio to-do: when a fact arrives, replace its marker in the content and it appears on the page. Counts are unique markers (the Home marker covers three photo captions). Legal pages are not in the registry; their open questions are in `2b-review-CD.md`.

```
/
  [NEEDS: service]
/services/paint-protection-film
  [NEEDS: days before the first wash]
/services/sun-control-film
  [NEEDS: time in the studio]
  [NEEDS: days before the windows can be rolled down]
/services/interior-detailing
  [NEEDS: does P91 remove seats, and for which cars]
/services/paint-protection-film/matte
  [NEEDS: studio time for a full-body matte job]
  [NEEDS: can P91 show a matte film sample or a finished matte car at the studio?]
/services/paint-protection-film/front
  [NEEDS: studio time for partial front and full front end]
/services/paint-protection-film/bike
  [NEEDS: studio time for a bike PPF job]
  [NEEDS: which bike panels P91 covers, and whether kits are pre-cut or hand-cut]
  [NEEDS: days before the first wash after bike PPF]
/services/paint-correction
  [NEEDS: studio time for paint correction on its own]
  [NEEDS: does P91 measure paint thickness before correcting?]
/services/exterior-detailing/headlight-restoration
  [NEEDS: does P91 restore fog lamp and tail lamp lenses?]
  [NEEDS: how long P91's UV coat is expected to last]
  [NEEDS: is a single headlight offered?]
/services/sun-control-film/windshield-glass-coating
  [NEEDS: is all-glass coating a separate package, and how is it priced?]
/services/maintenance-plan
  [NEEDS: confirm each plan visit is the same job as the service page it links to]
  [NEEDS: does P91 schedule the visits, or does the owner choose the dates?]
  [NEEDS: booking process for plan visits]
  [NEEDS: policy on unused visits]
  [NEEDS: transfer policy]
  [NEEDS: confirm the plan can start in any month]
/areas/koramangala
  [NEEDS: approx. drive time from Koramangala]
  [NEEDS: the usual route from Koramangala and where to park at the studio]
/areas/hsr-layout
  [NEEDS: approx. drive time from HSR Layout]
  [NEEDS: the usual route from HSR Layout to Adugodi, and whether pickup covers HSR Layout on most days]
/areas/indiranagar
  [NEEDS: approx. drive time from Indiranagar]
  [NEEDS: the usual route from Indiranagar to Adugodi]
/brands/stek
  [NEEDS: which STEK PPF lines P91 stocks, and which of them are self-healing]
  [NEEDS: whether STEK offers warranty registration or product verification for P91 jobs, and how the owner does it]
/brands/nasiol
  [NEEDS: which Nasiol coating product or products P91 applies on cars and on bikes]
  [NEEDS: how an owner can check a Nasiol coating is genuine: label, batch number, or any Nasiol registration]
/brands/p91-premium-ppf
  [NEEDS: where P91 Premium PPF is made, and who supplies it]
  [NEEDS: the finishes P91 Premium PPF comes in, and whether it is self-healing]
  [NEEDS: how a P91 Premium PPF roll is labelled, and what the owner can check on it]
/guides/ppf-cost-bangalore
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/guides/what-is-ppf
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/guides/ppf-vs-ceramic-coating-bangalore
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/guides/hard-water-spot-removal-bangalore
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/guides/windshield-heat-rejection-film-summer
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/guides/how-much-ppf-does-your-car-need
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/guides/is-your-ppf-really-made-in-usa
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/guides/monsoon-damage-car-bangalore
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/guides/best-car-detailing-in-bangalore
  [NEEDS: author name]
  [NEEDS: reviewer name and role]
/about
  [NEEDS: who runs the studio, the team and their roles, and since when, in the owner's words]

55 gap(s) on 27 page(s), hidden on the site until the studio supplies them (informational, not blocking).
```

## The same list, grouped by who answers it

- **Studio times and process (studio):** PPF first-wash days (car and bike), sun-control film studio time and roll-down days, matte full-body time, front PPF times, bike PPF time and panels, paint-correction time and paint-thickness check, headlight fog/tail lamps, UV coat life and single-headlight option, interior seat removal.
- **Packages (owner):** all-glass coating package; the six maintenance-plan policy questions.
- **Areas (studio):** drive time and usual route from Koramangala, HSR Layout and Indiranagar; parking at the studio; whether pickup covers HSR Layout on most days.
- **People (owner):** author and reviewer for all 9 guides (until then: "By the P91 Car Care team", no reviewer line); the team, roles and founding facts for /about (section hidden until then).
- **Brands (owner/studio):** which STEK PPF lines are stocked and which are self-healing; STEK warranty registration or verification; which Nasiol products are applied and how to check one is genuine; where P91 Premium PPF is made and who supplies it, its finishes and self-healing, and how its roll is labelled.
- **Home:** the three work captions (`[NEEDS: service]`).
