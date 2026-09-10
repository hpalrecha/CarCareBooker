# Before/after design review criteria

How to decide whether a redesign actually improved the page, rather than merely changed it.

Run this **against measurements taken before and after**, not from memory. Capture the
"before" numbers before you touch anything — you cannot reconstruct them later.

## Capture, both times

Per page, per viewport (320 / 390 / 768 / 1440):

| Metric | Why |
|---|---|
| horizontal overflow | binary defect |
| page height | scroll cost; a large increase needs justification |
| y-offset of: h1, price/key figure, primary CTA, offer | is the important thing early? |
| which of the "first screen" questions are answerable | comprehension |
| computed font-size of competing elements | is the intended emphasis real? |
| count of tap targets < 44px | usability |
| elements within 12px of viewport edge | polish |
| heading levels in order | semantics + SEO |
| images: natural vs displayed size, missing alt | performance + a11y |
| total image bytes, font count, JS dependencies | performance |
| title / description / canonical / h1 count / schema types | SEO |

## Pass/fail — a change that fails any of these is not shippable

- [ ] No horizontal overflow at any tested width
- [ ] Exactly one `h1`; no skipped heading levels
- [ ] Primary CTA reachable and tappable at 320px
- [ ] Every accessible name still present (no icon-only buttons without labels)
- [ ] Focus visible on every interactive element
- [ ] Contrast still meets 4.5:1 for body, 3:1 for large text and meaningful UI
- [ ] No colour-only state signalling introduced
- [ ] No new invented content — no ratings, counts, testimonials, FAQs, claims
- [ ] Structured data still matches visible content; no duplicate blocks
- [ ] Type check, tests and build pass
- [ ] No behaviour, API shape or route changed unless that was the task

## Improvement — did it get better?

Better:

- fewer questions unanswered in the first screen
- the intended emphasis is measurably the strongest element
- fewer distinct spacing values, radii, shadows, font sizes
- fewer components doing the same job in different ways
- page height reduced, or increased only where content was added
- fewer bytes, or the same
- more of the page reuses existing tokens/components

Worse, even if it "looks nicer":

- a second design system now exists alongside the first
- new one-off values that match nothing else
- the page is longer with no new information
- new dependency for something CSS could do
- important content moved below the fold
- more visual weight spent on decoration than on the primary action

## The honest questions

Ask these and answer them plainly:

1. **What problem did each change solve?** If a change has no answer, revert it. Changing
   things is not the same as improving them.
2. **Would someone who knows this product recognise it?** A redesign that drifts from the
   brand is a regression even if it is objectively prettier.
3. **Does it look like a template?** Check against the generic-AI list in the main skill.
4. **Is anything now claiming something untrue?** Highest-severity failure; nothing else
   compensates.
5. **What did I not verify?** Name it rather than letting silence imply coverage.

## Reporting a review

Prioritise by impact, and for each item give: page · element · problem · recommended fix.

- **HIGH** — hurts comprehension, conversion, accessibility or SEO
- **MEDIUM** — visible polish or inconsistency with the rest of the site
- **LOW** — cosmetic

Then implement only HIGH and MEDIUM unless asked otherwise, and say explicitly which items
you deliberately did not act on and why. A review that recommends everything is not a
review.
