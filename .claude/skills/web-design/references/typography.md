# Typography

Type carries more of a design than any other single choice. A well-set page with two faces
beats a decorated one with six.

## Use what the project already loads

Before adding a font, find what is already there. Every added family is a network request,
a render-blocking dependency and a possible layout shift. Two families is usually right;
three is the ceiling.

## Pairing

A workable default: one face with character for headings, one highly legible face for
body, optionally a monospace for data, code and metadata labels.

Pairings that work because the faces differ enough to read as a decision:

- geometric or grotesque display + humanist body
- serif display + neutral sans body
- one superfamily used at genuinely different weights and widths

Pairings that fail: two similar sans faces (looks like a mistake), two display faces
(nothing recedes), anything where the pairing is invisible at a glance.

**Give every face a real fallback stack**, and check the page with the webfont blocked. A
silent fallback to Times is a visible failure.

## Scale

Pick a scale and stay on it. A ratio around 1.2–1.25 for dense UI, 1.25–1.333 for
editorial. Six to eight steps is plenty.

For headings that must work across viewports, `clamp()` beats a stack of breakpoints:

```css
font-size: clamp(28px, 5vw, 48px);
```

Set the minimum to what is readable on a 320px screen and the maximum to what is
comfortable on a large display — the middle takes care of itself.

## Setting text

- **Measure**: 60–75 characters for body copy. `max-width: 68ch` is the single highest-value
  typographic rule on a content page.
- **Line height**: ~1.5–1.65 for body; tighter (1.05–1.25) as headings get larger.
- **Letter-spacing**: negative for large headings (−0.01 to −0.03em); positive
  (0.08–0.14em) for uppercase labels, which are unreadable without it.
- **`text-wrap: balance`** on headings prevents a single orphaned word.
- **`font-variant-numeric: tabular-nums`** wherever digits change in place or line up in
  columns — prices, countdowns, tables. Without it the layout jitters as digits change.

## Hierarchy without size

Reach for these before making something bigger:

weight · colour (`--ink` vs `--ink-2`) · case and letter-spacing · position and whitespace ·
a rule above a heading

A page where hierarchy is expressed only through font size ends up with a 64px headline
and nowhere left to go.

## Common mistakes

- Headline so large it wraps to four lines on a phone. Check at 320px.
- All-caps body text. Fine for short labels, unreadable in a sentence.
- Centre-aligned paragraphs longer than two lines.
- Grey-on-grey metadata that fails contrast — check `--ink-3` against its actual surface.
- Different heading sizes for the same semantic level across pages.
