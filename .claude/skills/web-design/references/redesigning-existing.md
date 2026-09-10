# Redesigning a site you did not build

Improving an existing site is a different job from designing a new one. The constraint is
not taste — it is everything already working that you must not break.

## Default position

**Change the minimum that solves the stated problem.** A rewrite is harder to review, more
likely to regress something, and discards decisions whose reasons are not visible to you.

Some of what looks wrong is load-bearing. A strange value, an odd override, a scoped class
name — assume there was a reason until you find otherwise, and look for the reason before
removing it.

## Inspect first, always

1. Render the pages you will change **and pages you will not**. The second set defines
   "consistent with this site".
2. Find the design system — tokens, config, component library, conventions doc.
3. Read the git history of the files you are about to touch. Commit messages often explain
   exactly why a strange thing is there.
4. Find the tests. Tests that assert visible content exist because something broke once.
5. Note what is genuinely shared: a component you change may render on ten screens.

## Preserve

Unless explicitly asked:

- routes and URLs — never delete or redirect an indexed URL without raising it first
- API shapes and data flow
- business logic, pricing, validation
- component public props
- existing tokens and class-name scoping
- content the business supplied, even where you would word it differently

Design work should be reversible without touching anything but presentation. If a visual
fix seems to need a behaviour change, stop and say so.

## Scoping

Understand how the existing CSS is scoped before adding rules. Generic names (`.card`,
`.section`, `.grid`) usually collide with admin screens or a component library — which is
why they were scoped in the first place.

When you scope a new rule, **verify it actually matches**. A descendant selector needs a
descendant: `.page .variant .section` never matches `<div class="page variant">` because
the variant is the page element, not inside it. It must be `.page.variant .section`. The
failure is silent — the rule simply never applies, and the element quietly keeps inherited
values.

## Shared components

Changing a shared component to fix one page is how a design change becomes an incident.

Options, in order of preference:

1. fix it locally at the call site (a wrapper, a modifier class, a prop)
2. add an opt-in variant to the shared component, defaulting to current behaviour
3. change the shared component — only when the current behaviour is genuinely a defect,
   and then check every call site

If a shared component surfaces content you believe should not be shown, suppressing it at
your call site and flagging the wider question is usually right. Silently changing what
every other page shows is not.

## Content you did not write

You will find claims you cannot verify — ratings, counts, superlatives, technical
assertions about a product.

- Do not amplify them into a more prominent position.
- Do not delete genuine business content because you would phrase it differently.
- Where a claim would be newly prominent and cannot be verified, withhold it **at your
  page**, document it, and ask. Removing it from the database is not your call.

The asymmetry: adding an unverifiable claim is a business risk; omitting a true one costs a
little emphasis. Omit.

## Sequence

1. capture "before" measurements
2. write the prioritised audit — page · element · problem · fix
3. get agreement on scope if the list is long
4. implement HIGH and MEDIUM, in separate coherent steps
5. re-measure and compare
6. report what you changed, what you deliberately did not, and what remains unverified

## When to say no

Push back when: the request would break a working flow; the "problem" is a decision
someone made deliberately; the change needs business information nobody has supplied; or
the scope has grown into a rewrite nobody asked for.

Say it in a sentence, offer the smaller version, and let the user decide.
