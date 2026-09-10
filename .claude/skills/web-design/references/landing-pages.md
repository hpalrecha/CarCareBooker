# Landing pages and conversion-focused layouts

A landing page has one job. Someone arrived from a specific promise — an ad, a search
result, a link — and the page either matches that promise immediately or loses them.

## Message match

The page must visibly continue the thing that was clicked. An ad for "ceramic coating for
bikes" landing on a general services page is a bounce, however good the page is.

If several ads point at one destination, either build separate pages or make the page's
first screen adapt. Do not make the visitor re-select the thing they already chose by
clicking.

## The first screen

Within one viewport — **including at 320px** — the visitor should be able to answer:

1. **What is this?** — the service or product, in words they used
2. **Is it for me?** — vehicle, size, plan, audience
3. **What does it cost?** — the real price, or an honest reason there isn't one
4. **What is the offer?** — if there is one, and precisely what it covers
5. **What do I do next?** — one obvious action

Order matters less than presence. If any of the five is below the fold on a phone, that is
a defect, not a preference.

**Do not bury the price.** Hiding it to force contact is a strategy that reliably costs
more than it gains, and if the business genuinely has no fixed price, say "book a
consultation" rather than showing nothing.

## Offer clarity

If the offer is narrower than it sounds, the page must say so **where the offer is stated**,
not in fine print further down.

The failure mode: a page showing a large price and a button reading "Book Free" with
nothing reconciling the two. The visitor either distrusts the page or arrives expecting
free work.

Make the qualifier structurally inseparable from the claim — same sentence, same block,
same component. If the component that renders "Free" cannot render without also rendering
the price, a future edit cannot quietly drop it.

## Urgency

Only real deadlines. A countdown that resets on refresh, or one seeded from
`now + 3 days`, is a fabricated deadline and readers recognise it.

A genuine countdown should:

- come from a server-supplied end time, not the device clock
- clamp at zero and change state when it expires — never show a negative or frozen timer
- be readable but not dominant; it supports the CTA, it does not compete with it
- not flash, pulse or animate

## Structure

A reliable order, to adapt rather than follow blindly:

```
hero: what / for whom / price / offer / primary CTA
↓ selection, if the product genuinely varies (size, tier, model)
↓ what you actually get — from real product data
↓ why this, factually
↓ proof, only if genuine
↓ questions, only if real answers exist
↓ related content / internal links
↓ final CTA
```

Every section must earn its place by answering a question the visitor actually has. Cut
anything that exists only because landing pages usually have one.

## CTAs

- One primary action, repeated at natural decision points — after the price, after the
  detail, at the end.
- Secondary action (call, WhatsApp, chat) visibly quieter.
- A mobile sticky CTA is legitimate, but reserve space so it never covers the last section,
  and do not stack it with a chat bubble in the same corner.

## Trust

Use only what is true and verifiable: real photographs of real work, genuine warranty
terms, actual included items from the product record, real published articles, real
business details and location.

Never invent ratings, review counts, customer counts, testimonials, certifications or
awards. On a page carrying paid traffic these are an advertising-standards exposure, not
just a content problem. If the business has not supplied proof, ship the page without a
proof section and say what is needed.

## Forms

Shortest form that lets the business act. Every field costs completions. Capture the
attribution automatically rather than asking "how did you hear about us".

## Measuring

A landing page that cannot be measured cannot be improved. Ensure the destination URL
carries campaign parameters, that they survive navigation to the form, and that they reach
the record. That is engineering work, not design work, but design is where it gets
forgotten.
