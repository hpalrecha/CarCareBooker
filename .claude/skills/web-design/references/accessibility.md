# Accessibility

Treat this as part of "does it work", not a later pass. Most of it is free if done while
building and expensive to retrofit.

## Semantics first

Correct HTML gives you keyboard support, focus management and screen-reader semantics
without any ARIA. Reach for ARIA only when no element expresses the thing.

- `<button>` for actions, `<a href>` for navigation. A div with `onClick` is not
  keyboard-reachable and is not announced as anything.
- One `<h1>` per page. Do not skip levels — `h1 → h3` is a defect. Choose heading level by
  document structure, size by CSS.
- `<nav> <main> <header> <footer>` landmarks, `<ul>` for lists.
- `<table>` for tabular data, with `<th>` and scope.

**Watch for display changes that strip semantics.** A `<ul>` set to `display: flex` or
`grid` loses implicit list semantics in several browsers. Restore with `role="list"`.

## Contrast

- Body text: 4.5:1 against its **actual** background — including over an image or gradient.
- Large text (≥24px, or ≥19px bold): 3:1.
- UI boundaries and icons that carry meaning: 3:1.

Audit the metadata colour specifically. The lightest grey in a palette usually fails for
body copy; label it as metadata-only in the token file so nobody uses it for a paragraph.

## Colour is never the only signal

Selected, error, success, required — each needs a second cue: an icon, a mark, a border
change, text. Check by rendering greyscale.

## Keyboard

Everything reachable and operable. Test by tabbing the whole page.

- Visible focus. Never `outline: none` without a replacement — `:focus-visible` with a
  2px outline and offset is the minimum.
- Logical order, matching visual order. Avoid positive `tabindex`.
- Modals trap focus, close on Escape, and return focus to the trigger.
- No keyboard trap anywhere.

## Names

Every control has an accessible name.

- Icon-only buttons need `aria-label`.
- A link that says "Read more" three times gives a screen-reader user a list of three
  identical links. Make the whole card the link with the title as its name, and mark the
  decorative "Read more" `aria-hidden`.
- Form fields need real `<label>` elements.

## Images

- Meaningful `alt` describing what matters in context — not the filename, not a keyword
  list.
- Decorative images get `alt=""`, not a description.
- Text baked into an image is invisible to search and to screen readers.

## Live regions

Use sparingly and deliberately.

A per-second timer must **not** announce every second. Set the visible digits
`aria-live="off"` and provide a separate visually-hidden summary at a coarser granularity —
a string that only changes once a minute is silent in between, because live regions
announce on change.

## Motion

Honour `prefers-reduced-motion: reduce`. Nothing flashes more than three times per second.
No animation that loops indefinitely near text.

## Targets and zoom

- ~44px minimum touch targets.
- Never `maximum-scale=1` or `user-scalable=no` — blocking pinch zoom is a WCAG failure.
- The page must survive 200% zoom without content loss.

## Quick check

Tab through it · render greyscale · zoom to 200% · block images · check one heading tree ·
confirm every icon button has a name.
