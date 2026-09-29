# Verification

What was measured on this build, how, and what could not be checked. Every number
here is reproducible from the commands shown.

**Build under test:** `pnpm build` output in `dist/`, served on
`http://127.0.0.1:4175` by `scripts/serve-with-headers.mjs`, which applies the
exact headers from `vercel.json`. Testing the build against the real Content
Security Policy is the point — a policy that is only ever checked by a deployment
is a policy that is broken on the day it ships.

**Browser:** Chromium 1243 (Playwright build), headless, on Linux. This is the
limitation worth reading first: **Firefox, Safari and Edge were not tested.** No
binaries for them are installed on this machine. See *Not verified* below.

---

## Reproducing this

```bash
pnpm check                 # the whole gate: types, lint, tests, build, assertions
pnpm serve:headers         # dist/ on :4175 with the real vercel.json headers
```

The browser-level checks below were driven with `playwright-core` and a locally
installed Chromium. The commands are given per section.

---

## Build and data integrity

| Check | Command | Result |
| --- | --- | --- |
| Types | `pnpm typecheck` | clean, `strict` + `noUnusedLocals` + `noUnusedParameters` |
| Lint | `pnpm lint` | clean |
| Unit + component tests | `pnpm test` | 56 passed, 3 files |
| Coverage gate | `pnpm test:coverage` | passes thresholds |
| Data validation | `pnpm validate` | no errors, no warnings |
| Validator self-test | `pnpm verify:validator` | 9/9 cases caught |
| Build output | `pnpm assert:build` | 110.9 kB document, 13,286 chars of static text, 20 articles, 1 JSON-LD block |
| Build-assertion self-test | `pnpm verify:build-assertion` | 6/6 cases caught |
| Security headers | `pnpm assert:headers` | CSP with no unsafe directives; HSTS with preload |
| Content consistency | `pnpm assert:content` | 6 areas, 11 products, 4 featured, 4 of 7 others public, 5 principles, 3 audiences |

Both self-tests exist because a check nobody has seen reject anything is not
known to work. Each corrupts the thing it inspects — the product data nine ways,
the built document six ways — and asserts the failure.

## Content Security Policy

Verified against the real policy, not assumed: theme toggled both ways, products
panel opened and dismissed, full-page scroll, then measured.

| | |
| --- | --- |
| CSP violations | **0** |
| Console errors | **0** |
| Theme applied before paint | yes |
| `html.has-js` set | yes |
| Fonts loading | Geist, Geist Mono |
| Reveals completed | 61 of 61 |
| JSON-LD data block | parses, 13 nodes |
| Particle canvas | painting |
| Card glows | 28 present |

The JSON-LD result is the interesting one: `script-src 'self'` does not apply to
`<script type="application/ld+json">`, which is a data block rather than an
executable script, so the structured data survives an otherwise strict policy.

With **scripting disabled**, the fallback renders from the stylesheet rather than
from an inline `style` attribute the policy would have blocked: 640 px wide,
48 px / 20 px padding, `system-ui`, heading at 24 px.

## Responsive

Four viewports × two themes, under the real policy, scrolling the full page.

| Viewport | Console errors | Failed requests | Horizontal overflow | Stuck reveals | Dead anchors |
| --- | --- | --- | --- | --- | --- |
| 1440 (desktop) | 0 | 0 | 0 | 0 | 0 |
| 1280 (laptop) | 0 | 0 | 0 | 0 | 0 |
| 834 (tablet) | 0 | 0 | 0 | 0 | 0 |
| 390 (mobile) | 0 | 0 | 0 | 0 | 0 |

Identical in light theme. **320 px (small mobile)** also checked: no horizontal
overflow in either theme, no errors.

"Stuck reveals" counts elements left at `opacity: 0` after a full scroll — the
failure mode a scroll-reveal implementation silently has. Zero everywhere.

## Structure and semantics

| Check | Result |
| --- | --- |
| `h1` outside `<noscript>` | exactly 1 |
| Heading levels skipped | none |
| `<main>` | 1 |
| `<section>` | 10, each named by its own heading via `aria-labelledby` |
| Product cards | 11 |
| Dead internal anchors | 0 |
| Hydration warnings | 0 |
| Server DOM reused | yes — React hydrates rather than replacing |

## Links

| Check | Result |
| --- | --- |
| External links | 17 |
| External links missing `rel="noreferrer noopener"` | 0 |
| External links missing `target` | 0 |
| New-tab links missing a screen-reader announcement | 0 |
| Internal anchors opening in a new tab | 0 |
| Dead internal anchors | 0 |

Every product link is now built by one component, so `href`, `target`, `rel` and
the "opens in a new tab" announcement cannot disagree between the six places
products are linked.

## Keyboard

Tabbed through the first 26 stops.

| Check | Result |
| --- | --- |
| Tab stops | 26 |
| Stops without a visible focus ring | 0 |
| Invisible elements receiving focus | 0 |
| First tab stop | "Skip to content" |
| `Enter` on the products button | opens (`aria-expanded="true"`) |
| `Escape` | closes and returns focus to the trigger |

## Colour contrast

Measured against **composited** backgrounds — alpha tints were resolved over
their backdrop before computing, and Tailwind v4 mixes in oklab, not sRGB.

| Pair | Dark | Light | Needs |
| --- | --- | --- | --- |
| Eyebrow label (11 px) | 9.81:1 | 5.03:1 | 4.5 |
| Body text | 17.11:1 | 17.32:1 | 4.5 |
| Muted on page | 6.60:1 | 5.25:1 | 4.5 |
| Muted on card | 6.23:1 | 5.54:1 | 4.5 |
| Gold text on card | 11.26:1 | 5.79:1 | 4.5 |
| Status pill — stable | 11.03:1 | 6.45:1 | 4.5 |
| Status pill — beta | 11.93:1 | 5.50:1 | 4.5 |
| Status pill — alpha | 5.94:1 | 5.04:1 | 4.5 |
| Status pill — building | 6.60:1 | 5.25:1 | 4.5 |
| Gold button label | 10.10:1 | 8.51:1 | 4.5 |
| Focus ring vs page | 11.93:1 | 5.50:1 | 3 |
| Display gradient, lightest stop | 13.95:1 | 3.40:1 | 3 |

**24 of 24 pass**, both themes.

## Performance

Cold cache, local server, Chromium, paint and layout timings from the Performance
domain and transfer sizes from the Network domain.

| | No throttle | 4× CPU |
| --- | --- | --- |
| First contentful paint | 1104 ms | 1040 ms |
| Largest contentful paint | 1104 ms | 1848 ms |
| Cumulative layout shift | **0** | **0** |
| DOM content loaded | 1393 ms | 2516 ms |
| Load | 1408 ms | 2855 ms |
| DOM nodes | 1666 | 1654 |
| JS heap | 2.2 MB | 2.2 MB |
| Requests | 7 | 7 |
| Transferred | 484 KB | 484 KB |
| Third-party origins | **0** | **0** |

At no throttling the largest contentful paint equals the first paint, which is the
prerender doing its job: the content is in the HTML rather than arriving after
the bundle.

Asset sizes:

```text
CSS             39.5 kB raw    8.5 kB gzipped
JS            273.4 kB raw   84.8 kB gzipped
Fonts         81.8 kB        4 files
Images        28.4 kB        one PNG, the social card, not on the page
```

### The particle canvas

The largest single performance problem found, and no automated check caught it.
Lighthouse scored 100, there were no long tasks, no console errors and no layout
shift. Measuring the canvas dimensions directly found that the `page-enter`
animation left `transform: matrix(1,0,0,1,0,0)` on the document wrapper, and a
non-`none` transform on an ancestor makes it the containing block for
`position: fixed` descendants. The background canvas therefore sized itself to
the whole document instead of the viewport.

Measured on the same machine, 4× CPU throttle, live before against local after:

| | Live (before) | Local (after) |
| --- | --- | --- |
| Median frame | 92.3 ms | **27.1 ms** |
| p95 frame | 169 ms | **109 ms** |
| Canvas backing store | 1440 × 10584 | **1440 × 900** |
| Canvas memory | 58.1 MB | **4.9 MB** |

Zero long tasks across a full-page scroll.

The pair loop was then measured rather than guessed at. At 72 particles (2,556
pairs per frame):

| Approach | ms per frame |
| --- | --- |
| `Math.hypot` (was) | 0.229 |
| `Math.sqrt` (now) | 0.037 |
| Uniform spatial grid | 0.173 |

**A spatial grid is slower than the plain loop** at this scale, because the
counting sort costs more than the pairs it skips. It was not adopted, and the
numbers are in the source comment so nobody re-adds it. The cost was `hypot`, not
the pairwise arithmetic — a 6.3× difference for one function call.

> A direct live-vs-local comparison of the paint timings above is **not** valid:
> localhost and a remote CDN are not the same network. The canvas figures are
> valid because both sides ran on this machine.

## Tests

56 tests across three files.

- **Data and logic** — unique ids and names, ids safe as URL fragments, every
  product in a real area, every area referencing a real product, repository URLs
  inside `github.com/Hilbras`, nothing marked stable without something publicly
  released, link helpers, and the structured data: one node per product, every
  identifier built from the configured domain, each product typed by what it is,
  an operating system not published as cross-platform, no `softwareVersion`
  abuse, and nothing that could break out of the script element.
- **Components** — status pill states and explains a level, the product card says
  plainly when there is no public release and links nowhere false, the disclosure's
  `aria-expanded` and focus return, the theme toggle's static label and storage
  write, footer, connection map, and the whole page's link integrity.
- **Self-tests** — nine data defects and six build defects, each asserted to be
  rejected.

A real defect surfaced here. The disclosure test failed intermittently — once in
three runs, then once in eight. Two stacked bugs:

1. `useDisclosure`'s `close` did not cancel the pending open frame, so a close
   landing in the same tick was undone when the frame fired — a panel rendered
   open while `aria-expanded` said closed.
2. The navbar's hover-intent timer was the reason it kept happening: a pointer
   over the trigger had already queued an open that landed ~80 ms after `Escape`.

Both fixed, with a deterministic regression test. Ten consecutive clean runs
after.

Coverage is gated on `areas.ts`, `links.ts` and `structuredData.ts`.
`validation.ts` is deliberately excluded: its error branches only execute on
invalid data, which is the self-test's job, and unit-testing them would assert
that a deliberately corrupted object throws.

---

## Not verified

Stated plainly rather than implied by omission.

- **Firefox, Safari and Edge.** No binaries on this machine. Chromium only. The
  code avoids the usual divergence points — no `backdrop-filter` on anything
  load-bearing, no `:has()` in a critical path, `translate` rather than `transform`
  where it matters — but that is reasoning, not evidence. A cross-browser pass
  needs real browsers.
- **A real domain.** `hilbras.vercel.app` is what `site.domain` says, so every
  canonical, Open Graph and sitemap URL points there. Moving to a real domain is a
  one-line change plus a rebuild, but nothing has been tested against a domain
  that is not Vercel's.
- **Search Console, analytics, real backlinks.** Nothing to verify; not set up.
- **Screen reader output.** The ARIA was audited structurally — attributes, roles,
  names, focus order, live behaviour — and tested through the accessibility tree,
  but no NVDA, JAWS or VoiceOver session was run. Structural correctness is not
  the same as a good experience in a specific reader.
- **Load and scale.** This is a static site with no server, so there is no load
  test to run. The Vercel Hobby plan's limits were not investigated.
- **Long-session behaviour.** Checksummed over minutes, not hours. A tab left open
  for a day was not observed.
