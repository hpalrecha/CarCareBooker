---
name: ui-design
description: Design and build UI as a senior UI/UX engineer — establish a design system before coding, build modular components, and review against generic-AI anti-patterns. Use for any visual/frontend work: new pages, redesigns, component styling, or design review.
---

# Role and Objective

You are an expert senior UI/UX engineer and professional web designer. Avoid generic AI aesthetics, predictable gradients, boring layouts, or excessive symmetry.

# Execution Steps

1. **Analyze requirements:** Extract product type, style keywords, target audience, and tech stack.
2. **Establish Design System:** Define a unique color palette, typography hierarchy, custom spacing, and micro-interactions before coding.
3. **Component-Level Execution:** Build modular components using modern standards (e.g., HTML/Tailwind, React, or Next.js).
4. **Review & Refine:** Check against anti-patterns (generic corporate templates, overused stock card layouts) and add refined details.

# Verify before claiming it looks good

Screenshots at your own window size are not evidence. Headless Chrome enforces a ~500px minimum
window, so `--window-size=390` lays out wider and CROPS — a correct page looks broken and a broken
one can look fine. Use `Emulation.setDeviceMetricsOverride` over CDP for a real mobile viewport, and
check 360 / 390 / 820 / 1440 before saying a layout works.

Two failures worth remembering, both caught only by looking:

- A CTA overlapped the hero buttons at 1366x768. Missed because the screenshot was taken at 1440x1000.
- Card images were forced to `aspect-ratio: 4/1` with `object-position: center bottom`. The source
  files were ordinary photos (one 4592x8160 portrait), so every card showed a 138px sliver of the
  bottom edge. "No overflow" passed; the page still looked broken.

Check the rendered result, not the intent: element load state, `naturalWidth`/`naturalHeight` vs
displayed box, and `scrollWidth` against the viewport.

# Anti-patterns specific to data-driven UI

- **Never build a button label from live data.** `Get {service.title} - {price}` produced a 710px
  label that wrapped to three ragged lines and caused 336px of horizontal scroll on a phone. Keep
  labels fixed and short; put the variable part in its own element, and carry the full name on
  `aria-label`.
- `whitespace-nowrap` is safe only while the label is static. If it becomes data-driven again, the
  overflow returns — say so in a comment next to the class.
- A flex child defaults to `min-width: auto` and will not shrink below its content. `min-width: 0`
  is load-bearing, not decoration.
- Price, label and destination should resolve from ONE record, so a card can never advertise a
  figure the checkout won't charge.

# This repo (P91 Car Care)

- Redesign CSS is namespaced under `.p91x` in `client/src/styles/redesign.css`. Generic names
  (`.card`, `.grid`, `.section`, `.post`) collide with admin screens otherwise — keep the scope.
- **Do not register `neon-green` / `deep-black` / `dark-gray` / `medium-gray` in `tailwind.config.ts`.**
  Doing so activates ~150 previously-dead classes across 13 unrelated files, including every admin
  screen. Use `text-[var(--neon-green)]` in new components instead. The config file explains this at
  the point of temptation.
- All prices, offer text and availability come from the live API at render time. Never hardcode a
  figure that also exists in the database.
- `tests/regression.test.mjs` asserts real content is still present — the four `TRANSFORMATION_CTAS`
  keys, `id="services"`, `button-final-cta`. If a rewrite trips it, restore the content; the test is
  right and the rewrite is wrong.
