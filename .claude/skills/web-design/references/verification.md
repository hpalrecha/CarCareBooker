# Verifying the rendered result

Reading your own CSS is not verification. Neither is one screenshot at your window size.
This file is mostly traps, because this is where confident-sounding wrong claims come from.

## The rule

**If no browser rendered it, say so.** "Should be responsive" and "looks good" without a
render are claims you cannot support. Stating the limitation honestly is always better
than implying you looked.

## Getting a real viewport

`--window-size=390` does **not** give a 390px viewport. Headless Chrome enforces a minimum
window width (~500px), so the page lays out wider and the screenshot is cropped — a correct
page can look broken and a broken one can look fine.

Use the DevTools protocol instead:

```
Emulation.setDeviceMetricsOverride { width, height, deviceScaleFactor: 1, mobile: true }
```

Then `Page.captureScreenshot`. This is the only way to get a genuine mobile layout.

Practical notes:

- `/json/new` requires **PUT** on current Chrome.
- `Page.captureScreenshot` with `clip` uses **page** coordinates. After `scrollIntoView`,
  add `scrollY` to the element's `top`, or the clip captures the wrong region.
- Give the page time to hydrate and for data fetches to resolve before measuring.
- Serve the real build, not a dev server, when checking anything about bundling or assets.

## Measure, do not eyeball

A screenshot shows you *something is wrong*. Measurements tell you *what*. Evaluate in the
page and return numbers:

- `document.documentElement.scrollWidth > innerWidth` → horizontal overflow, plus which
  elements are wider than the viewport (excluding deliberately scrollable tracks)
- `getBoundingClientRect().top < innerHeight` for each thing that must be above the fold
- computed `font-size` of the elements competing for attention — is the thing you meant to
  be loudest actually the largest?
- every `button`/`a`/`role=radio` smaller than 44px
- elements within 12px of the viewport edge
- heading levels in document order, flagging any jump
- `img.naturalWidth`/`naturalHeight` vs the displayed box, and `img.complete`
- computed `position: fixed|sticky` elements and their heights — what might they cover?

## Interaction, not just render

For anything stateful, drive it: click the selector, open the modal, submit the form.
Verify the **outcome**, not the appearance.

Intercept the request where you can. A modal displaying the right title while submitting
the wrong id is invisible to every render-based check — the render was correct.

## Checklist per viewport

320 / 390 / 768 / 1440, at minimum:

- no horizontal overflow
- the first screen answers what the page is for
- primary CTA visible and tappable
- price/key figure readable
- no element touching the viewport edge
- images loaded, correctly cropped, correctly sized
- nothing fixed/sticky covering content
- focus visible when tabbing
- text not clipped

## Then the project's own checks

Type check, tests, build. A design change that breaks the build is not done. If tests
fail, read them: an assertion about real content being present is usually right and the
rewrite is usually wrong.

## Reporting

Report what you measured and what you did not. If you could not run a browser, say which
checks are therefore unverified rather than omitting them.
