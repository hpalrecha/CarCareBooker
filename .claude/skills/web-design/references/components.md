# Components

Reuse before you build. A new button that is 2px different from the existing one is a bug,
not a design.

## Buttons

**One primary action per view.** If two buttons look equally important, neither is. A
secondary action should be visibly quieter — a ghost or text treatment, not a second
filled button in a different colour.

- Minimum 44px tall for touch.
- Label states the outcome: "Publish", not "Submit". Then the confirmation says
  "Published".
- **Never build a label from live data.** `Get {product.name} — {price}` becomes a 700px
  label that wraps to three ragged lines and causes horizontal scroll. Keep the label
  short and fixed; put the variable part in its own element and carry the full name on
  `aria-label`. `white-space: nowrap` is only safe while the label is static — say so in a
  comment next to it.
- Disabled buttons must explain themselves; a dead control with no reason is worse than an
  enabled one that reports an error.
- Loading state must not change the button's width, or the layout jumps.

## Cards

Cards separate objects. Do not use them as generic containers — see "not everything is a
card" in the main skill.

When you do use them:

- Same edges, padding and baselines across a row; a recurring element sits in the same
  place on each.
- Let content set the height; do not stretch one card over dead space.
- Pick a column count the items actually fill. Four items in a three-column grid leaves one
  orphaned.
- The whole card as one link is usually right — but then do not add a separate "Read more"
  link to the same destination, which a screen reader announces as a second, less
  informative link. Style it as text and mark it `aria-hidden`.
- Text that can outgrow its box must wrap or scroll in its own container. Clipped text is a
  bug.

## Forms

- Label every field with a real `<label>`. Placeholders are not labels — they vanish on
  focus and fail contrast.
- Errors go next to the field, name the problem and the fix. A single generic banner for
  eight possible causes means the user guesses.
- **Server errors must reach the field.** If the server returns field-keyed errors, map
  them onto the inputs. Stricter validation without that just produces more people seeing
  a generic failure with no way to fix it.
- Ask for the minimum. Every optional field costs completions.
- Be permissive about format, strict about content: accept `+91 98765 43210`,
  `09876543210` and `9876543210`; reject `1` and `abc`. Rejecting on punctuation loses real
  submissions.
- `inputmode` and `autocomplete` on mobile are free wins.
- Do not disable submit until the form is valid — let them submit and show what is wrong.

## Selection controls

For a small single-choice set, use radio semantics (`role="radiogroup"` +
`role="radio"` + `aria-checked`, or real inputs). Arrow-key navigation and "2 of 3"
announcements come free; a row of buttons gives neither.

**Selection must be visible without colour.** Border plus fill plus a mark (a check, a
dot) — so the state survives a greyscale render and a colour-vision difference.

## Navigation

- Mark the current page (`aria-current="page"`), visibly and semantically.
- The mobile menu must trap focus while open, close on Escape, and return focus to the
  toggle.
- A sticky header should be short. On a 640px-tall phone a 90px header is 14% of the
  screen, permanently.

## Tables

- Real `<table>` for tabular data. A div grid loses row/column semantics.
- Wide tables scroll inside their own `overflow-x: auto` container so the page body never
  scrolls sideways.
- Right-align numbers, use tabular figures.
- On mobile, a card-per-row layout usually beats a squeezed table — but keep the header
  association.

## Modals and dialogs

- Focus moves in on open and returns on close.
- Escape closes. The backdrop closes only if nothing would be lost.
- A dialog that can be mounted before it is opened must still read fresh props when it
  opens — form defaults captured once at mount will be stale.
- Constrain height and scroll the body, not the page behind it.

## Empty, loading, error states

Design all three. A component that only has a happy path will show a blank rectangle on
the day the API is slow.

- Empty: say what would be here and how to get it.
- Loading: reserve the final layout's space so nothing shifts. Skeletons only if the shape
  is predictable.
- Error: what failed, what to do next.
