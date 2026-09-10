# SEO-friendly page structure

Design decisions that affect search. This is about structure, not keywords — and SEO must
never be allowed to degrade the reading or conversion experience.

## Per page

- **One `<h1>`**, describing the page.
- **Logical `h2`/`h3`** — the heading tree should read as an outline. Never skip a level.
- **Unique `<title>`**, ~50–60 characters, most distinctive words first.
- **Unique meta description**, ~120–155 characters. Written for a human deciding whether
  to click, not stuffed.
- **Canonical URL**, so query-string variants (`?utm_source=…`, `?fbclid=…`) do not split
  ranking signals across duplicates.
- **Open Graph + Twitter** title, description and image. Without these a link pasted into
  a chat app renders as a bare URL.

## Do not let pages compete with each other

Two pages targeting the same query is a self-inflicted problem: they split signals and
neither ranks.

If a new page overlaps an existing one, differentiate by **intent**:

- informational — "what is X", how it works, guides
- transactional — price, packages, book/buy

Give each a title that reflects its intent, and cross-link them. If they genuinely serve
the same intent, one should be canonical or redirect — but never delete or redirect an
indexed production URL without saying so first.

## Thin pages

Do not create a page per variant just for coverage. Three near-identical pages differing
only by a price are thin content and cannibalise each other. One strong page with a
selector is better for both search and the visitor.

Split only when each page has genuinely distinct content, and be able to say what.

## Structured data

Only for content that genuinely exists **and is visible** on the page.

- `FAQPage` only where real questions and answers are rendered. Never author FAQs to
  justify the markup.
- `AggregateRating` / `Review` only from a real review source. Inventing these is
  fabricating business claims in machine-readable form.
- `Offer` prices must match what the page shows and what checkout charges. A schema price
  that disagrees is worse than emitting no offer block.
- `BreadcrumbList` where a hierarchy genuinely exists.
- `LocalBusiness` / `Organization` only with confirmed details. A wrong address is harder
  to correct than a missing one.

**Watch for duplicate blocks.** If a page is prerendered *and* injects structured data at
runtime, both can end up in the DOM — check the rendered result, not just one source.

## Rendering

If the site is a client-rendered SPA, metadata written after hydration is invisible to
most link scrapers and weaker for search even where it is executed. Prerender or
server-render at least the `<head>` for pages that matter.

**Drive prerendered metadata from the same module the component reads.** Duplicating title
strings into a build script guarantees they drift; importing one source makes drift
impossible.

## Images

Descriptive `alt`, real filenames, correct dimensions, modern formats. Never bake
important text into an image.

## Internal linking

Link related pages with descriptive anchor text — not "click here". This is genuinely
useful to readers and is one of the few SEO practices that never conflicts with UX.

## Never do

Keyword stuffing · repeated phrases in headings · hidden text · doorway pages · invented
claims for rich results · metadata that misrepresents the page · sacrificing readable
layout for keyword placement.

## Checklist

Unique title · unique description · one h1 · no heading jumps · canonical · OG tags ·
structured data matching visible content · alt text · in the sitemap · internal links ·
prerendered head where applicable · no duplicate metadata or schema blocks.
