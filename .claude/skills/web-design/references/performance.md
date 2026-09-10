# Performance-conscious design

Visual polish that costs a second of load time is a net loss — especially on a page paid
traffic lands on, where the visitor has no prior commitment.

## The three that matter

**LCP** — the largest thing in the first screen, usually a hero image or headline. Do not
lazy-load it. Preload it if it is discovered late.

**CLS** — content jumping after paint. Almost always: images without reserved space, a
webfont swapping in, or an injected banner.

**INP** — responsiveness to input. Usually too much JavaScript on the main thread.

## Images

Normally the largest cost on a design-led page.

- Use the project's existing image pipeline. If it produces a width ladder, use it rather
  than adding your own.
- Reserve space: `width`/`height` attributes, or `aspect-ratio`.
- Honest `sizes`. Without it the browser assumes `100vw` and fetches the largest variant
  for a 340px slot — a common 10× waste.
- Modern formats (AVIF/WebP) with a fallback.
- `loading="lazy"` for below-the-fold images. Never for the LCP image.
- Verify `naturalWidth`/`naturalHeight` against the displayed box. A 4000px source in a
  340px card is a bug the eye cannot see.

## Fonts

- Two families. Each additional one is a request and a shift risk.
- Self-host where practical: a third-party font stylesheet adds two origins, each costing
  DNS + TLS before first paint.
- Variable fonts serve every weight from one file — requesting four weights of a variable
  face can download the same file four times.
- `font-display: swap` for content, `optional` where a late swap would shift layout.
- Preload only faces that render above the fold; preloading everything makes them compete
  with the LCP image.
- `crossorigin` is required on font preloads even same-origin, or the file is fetched twice.

## CSS and JS

- CSS over JavaScript for anything CSS can do: scroll-snap carousels, sticky positioning,
  transitions, `:has()` state.
- **Do not add a UI library for one component.** A carousel library to show three cards is
  a large dependency reimplementing what `overflow-x` + `scroll-snap` does natively — with
  worse accessibility.
- Route-level code splitting so a visitor to one page does not download the admin bundle.
  Keep the most common entry page eager; lazy-loading the landing page adds a round trip in
  front of the LCP.
- Scope CSS so unused rules are not shipped to every page.

## Animation

- Animate only `transform` and `opacity`. Anything else triggers layout or paint per frame.
- No infinite loops near content.
- Honour `prefers-reduced-motion`.
- The page must be readable at rest: nothing meant to be read should sit at `opacity: 0`
  waiting for an observer. That first still frame is what a thumbnail, a shared link and a
  fast scroller all get.

## Third parties

Every tag is someone else's JavaScript on your critical path. Load analytics and chat
widgets async, after content. Audit what is already there before adding another.

## Checking

Do not guess. Measure: total transferred bytes, image bytes vs JS bytes, the LCP element
and when it lands, layout shift after paint. On a design-polish pass, at minimum confirm
you have not increased image weight, added a font, or added a dependency.
