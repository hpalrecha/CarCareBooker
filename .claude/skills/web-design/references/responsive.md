# Responsive layout

Mobile-first, and mean it: write the small case as the default and add breakpoints upward.
Retrofitting mobile onto a desktop layout produces a pile of overrides that fight.

## Widths that matter

| Width | Why |
|---|---|
| 320 | narrowest phone still in real use — the true stress test |
| 360 | the most common Android width |
| 390 | current iPhone |
| 768 | tablet portrait / where two columns become viable |
| 1024 | tablet landscape, small laptop |
| 1440 | common desktop |

If it works at 320 and 1440 it almost certainly works between. **320 is where things
break**, and it is the width people skip.

## Breakpoints

Pick them where the *content* stops working, not at device names. Three or four is enough
for most sites. Use the project's existing breakpoints; a second set is a source of
one-off inconsistencies.

## Layout patterns worth knowing

**Intrinsic grid** — responsive with no breakpoint at all:

```css
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
```

**Explicit two-column that collapses:**

```css
grid-template-columns: minmax(0, 1fr) minmax(0, 480px);
@media (max-width: 900px) { grid-template-columns: 1fr; }
```

`minmax(0, …)` is load-bearing: a grid/flex child defaults to `min-width: auto` and will
not shrink below its content, which is how one long word causes horizontal overflow.

**Horizontal scroller instead of a wrapped grid** — for a short set of cards on mobile:

```css
display: flex;
overflow-x: auto;
scroll-snap-type: x mandatory;
```

with `scroll-snap-align: start` on children. Native momentum, keyboard support and
accessibility come free; a JS carousel reimplements all three, worse and heavier.

Let the track bleed to the viewport edge and size children to ~82% so the next one peeks —
that peek is the affordance that says "this scrolls", and it removes the need for dots.

## Reordering on mobile

When a two-column hero stacks, decide deliberately which comes first. Usually the copy and
the CTA, not the image — an image above them pushes the actual message below the fold.
`order` on the grid child does this without duplicating markup.

## Traps

- **A component wrapper can expand into several layout children.** A component that renders
  `<picture>` where a global rule sets `picture { display: contents }` puts `<source>`
  *and* `<img>` into the parent grid — four items where you expected two, and content lands
  in the wrong row. If a child's position looks wrong, count the actual grid items. Wrapping
  in a plain `<div>` fixes it locally without touching the global rule.
- **A descendant selector needs a descendant.** `.page .variant .section` will never match
  `<div class="page variant"><section class="section">` — the variant *is* the page
  element, not inside it. It must be `.page.variant .section`. Silent failure: the rule
  simply never applies and the element keeps inherited values.
- **Fixed and sticky elements cover content.** A sticky header, a floating chat button, a
  sticky CTA bar. Reserve space (`scroll-margin-top`, bottom padding) and check the last
  element on the page is reachable.
- **`100vh` on mobile** is the pre-scroll viewport and shifts as browser chrome hides. Use
  `svh`/`dvh`, or avoid full-height sections.
- **Tap targets** below ~44px are hard to hit. Text links in a dense list are the usual
  offender.
- **Edge-hugging.** Buttons and cards touching the viewport edge look unfinished. Keep a
  consistent gutter.

## Images

`max-width: 100%` and an explicit `width`/`height` or `aspect-ratio` to reserve space
before load — otherwise the page reflows and cumulative layout shift spikes.

Honest `sizes` on responsive images. Without it the browser assumes `100vw` and downloads
the largest variant for a 340px slot.

Be careful with `object-fit: cover` plus a fixed aspect ratio on user-supplied photos: a
portrait source in a wide box shows a sliver of the middle. Check against the real assets,
including the worst-shaped one.
