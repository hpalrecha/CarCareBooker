# Design tokens: colour, spacing, radius, elevation

A token system is what makes a site look like one product. Audit the existing one before
adding to it; most projects already have more than they are using.

## Finding the existing system

Look, in this order:

1. CSS custom properties on `:root` (`--accent`, `--surface`, `--txt-2`)
2. `tailwind.config.*` `theme.extend`
3. A `tokens.*`, `theme.*` or `design-system.*` module
4. A component library's own theme
5. Recurring literal values in existing CSS — an undeclared system, still a system

**A registered-but-unused token is a trap.** Adding a colour to a Tailwind config can
activate previously-dead utility classes across the whole codebase (`text-brand`,
`bg-brand`, `border-brand`) in files nobody intended to change. Check whether those class
names are already written somewhere before registering a name.

## Colour

### Structure, not a palette

Name tokens by **role**, never by value. `--surface-raised` survives a rebrand;
`--grey-200` becomes a lie the moment the grey changes.

A minimal complete set:

```
--bg            page ground
--surface       cards, panels
--surface-2     nested / recessed areas
--ink           primary text
--ink-2         secondary text
--ink-3         metadata only (often fails AA for body copy — label it)
--rule          hairlines, dividers
--accent        one brand colour
--accent-ink    text ON the accent
--ok --warn --danger   semantic states, separate from the accent
```

Semantic state colours are **not** the accent. A green accent plus green "success" makes
success invisible.

### Choosing neutrals

Pure `#808080` reads as unconsidered. Shift neutrals a few degrees toward the accent hue
(a green-accented product gets faintly green-grey neutrals). Pure white and near-black are
legitimate grounds — the point is that the choice was made.

### How many colours

One accent. Semantic states. Everything else is neutral. A second brand colour needs a
reason you can state.

### Dark mode

If the project supports it, there are **three** states, not two: explicit light, explicit
dark, and unset (system). Define the complete palette on bare `:root`, redefine only the
tokens under `@media (prefers-color-scheme: dark)`, and again under an explicit
`[data-theme="dark"]`. A colour whose only definition lives inside a media query does not
exist in the other theme — this is the classic unreadable-page bug.

## Spacing

Pick one scale and stay on it. A 4px base with a limited set is enough:

```
4  8  12  16  24  32  48  64  96
```

Name by intent where it helps (`--space-section`, `--space-card`), because a spacing
decision should be reviewable. `--space-l: 40px` invites the question "why 40?" in a way
that `40px` scattered through the file does not.

**Section rhythm** is the most visible spacing decision on a long page. Pick one vertical
section padding and one "tight" variant for sections that belong together, and use only
those two.

## Radius

Two or three values, tied to element size: small controls, cards, and full-round for pills
and avatars. A single radius applied everywhere flattens the hierarchy — a 4px chip and a
600px panel should not share a corner.

## Elevation

Shadows say "this floats above". Reserve them for things that genuinely do: menus,
dialogs, sticky bars. A shadow on every card is noise.

For flat/dark designs, a hairline border usually communicates separation better than a
shadow, which mostly disappears on dark grounds anyway.

## Adding a token

Only when nothing existing fits, and then:

1. name by role
2. define it beside the others, not at the point of use
3. define it for every theme the project supports
4. use it — a token used once is a literal with extra steps
