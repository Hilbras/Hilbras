# Verification

What was measured on this build, how, and what could not be checked. Every number
here is reproducible from the commands shown.

**Build under test:** `pnpm build` output in `dist/`, served on
`http://127.0.0.1:4175` by `scripts/serve-with-headers.mjs`, which applies the
exact headers from `vercel.json`. Testing the build against the real Content
Security Policy is the point — a policy that is only ever checked by a deployment
is a policy that is broken on the day it ships.

**Browser:** Chromium and Firefox, via Playwright 1.63, headless, on Linux.
Firefox was added when its binaries were installed; it runs the same 46 tests and
finds four real differences, recorded below. **Safari and Edge are still
untested** — see *Not verified*.

**Machine caveat, read before trusting any timing number here.** The host this was
built on runs at a load average of 15-29 from work unrelated to the site. Long
tasks are wall-clock, so they measure the machine as much as the page: the same
build produced 33 long tasks locally and 24 on production hardware. Every timing
below was either taken on an idle machine or is explicitly qualified. The
assertions in `tests/e2e/performance.spec.ts` are bounded to survive this, and
the comment says so.

---

## Reproducing this

```bash
pnpm check          # types, lint, tests, coverage, build, assertions, smoke
pnpm test:e2e       # 46 browser tests, Chromium and Firefox
pnpm smoke https://hilbras.vercel.app
```

The browser suite is `tests/e2e/`, in the repository, run against the real build
served with the real `vercel.json` headers. It replaces the ad-hoc harness the
earlier verification used, which lived outside the repository and was lost when
`/tmp` was cleared.

---

## Build and data integrity

| Check | Command | Result |
| --- | --- | --- |
| Types | `pnpm typecheck` | clean, `strict` + `noUnusedLocals` + `noUnusedParameters` |
| Lint | `pnpm lint` | clean |
| Unit + component tests | `pnpm test` | 110 passed, 6 files |
| Coverage gate | `pnpm test:coverage` | passes thresholds |
| Browser tests | `pnpm test:e2e` | 60 tests, Chromium and Firefox |
| Deployment smoke | `pnpm smoke <url>` | passes against production |
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

## Routes

Thirteen prerendered documents plus a 404. Checked three ways: the build
assertion, the smoke test, and the browser suite.

| Route | Status | Canonical | JSON-LD | Prerendered text |
| --- | --- | --- | --- | --- |
| `/` | 200 | its own | 13 nodes | 13,116 chars |
| `/products` | 200 | its own | 13 nodes | present |
| `/products/:id` × 11 | 200 | its own | 3 nodes | present |
| `/products/ghostware` | **404** | — | — | 404 document, `noindex` |

A product page publishes three JSON-LD nodes — the organisation, the website and
its own product — rather than all thirteen. Describing every product on every
page would make each page's structured data assert things about products it is
not about.

Every route's description is unique: 13 distinct descriptions across 13 routes,
which the smoke test asserts. Eleven previously would not have existed at all.

## Preview deployments

A preview is the one place a build can be correct and the deployment still
wrong, and it had never been tested. It is now.

**Which origin a build claims.** `resolveSiteUrl` takes the first of:

| Source | Used for | Why |
| --- | --- | --- |
| `SITE_URL` | an explicit override | always wins, on purpose |
| `VERCEL_PROJECT_PRODUCTION_URL` | `VERCEL_ENV=production` | the production alias, **not** `VERCEL_URL`, which is unique per deployment and would give every release its own identity |
| `VERCEL_URL` | `VERCEL_ENV=preview` or `development` | the host the build is served from |
| `site.domain` | anywhere else | the committed default |

A preview that publishes the production canonical is a real defect, not a
cosmetic one: a canonical is a claim about which URL is the real one, and a
crawler that indexes a preview would record production addresses as the home of
preview content.

Verified on a real deployment of commit `9201ebe`:

```console
$ vercel
  Deployment hilbras-q63hxnsjf-….vercel.app ready.

$ vercel inspect https://hilbras-q63hxnsjf-….vercel.app --logs | grep prerender
  prerender: 13 routes + a 404, 302.1 kB of markup,
  origin https://hilbras-q63hxnsjf-….vercel.app (from VERCEL_ENV=preview)
```

Every URL the preview serves names the preview and none name production:

| Where | Value |
| --- | --- |
| `rel="canonical"` | `https://hilbras-q63hxnsjf-….vercel.app/` |
| `og:url` | same |
| JSON-LD `@id` | `…vercel.app/#organization` |
| `robots.txt` `Sitemap:` | `…vercel.app/sitemap.xml` |
| every `<loc>` in `sitemap.xml` | 13 of 13 name the preview |

`vercel --prod=false` does **not** do this — it still builds with
`VERCEL_ENV=production`. Bare `vercel` is the preview path.

**Smoke-testing a protected preview.** Preview deployments are behind Vercel
Authentication, and the failure mode is nasty: an anonymous request gets the
login interstitial, which is a **200** carrying no site content, so every
assertion fails at once and a working deploy reads as catastrophically broken.
`smoke.mjs --via-vercel-cli` routes requests through `vercel curl`, which carries
the protection bypass:

```console
$ SITE_URL="$P" node scripts/smoke.mjs "$P" --via-vercel-cli
  ok  routes       13 checked, all serve their own canonical
  ok  assets        7 referenced, all load
  smoke: passed
```

The same script, unchanged, passes against production anonymously and against
the local `dist/` — one transport, three targets, one set of assertions.

Two defects in the checking itself were found and fixed by running it. The
transport decoded `curl -i` output as text, which broke the `/og.png` magic-number
check; and `Buffer.indexOf` with a numeric needle above 255 never matches, so
every header parsed as empty and the whole CSP section silently passed vacuously.
A verification script that reports nothing is worse than none.


## Adding a product

The site's central claim is that a product is a data edit. It had never been
tested by doing it, so it was: a twelfth product was added on a branch and the
gate run at every step. **The claim was false in two places**, and the dry run
is recorded in [`ADDING_A_PRODUCT.md`](ADDING_A_PRODUCT.md).

| | before | after |
| --- | --- | --- |
| Files needing an edit | `areas.ts`, `marks.ts`, **`Mark.tsx`**, **`ConnectionMap.tsx`**, **`pages.spec.ts`** | `areas.ts`, `marks.ts` |
| Component files | 2 | 0 |
| Tests needing an edit | 1 file, 3 hardcoded counts | 0 |

The two component-coupled states:

- `MarkId` was a union of eleven literals declared in `Mark.tsx` beside the JSX
  that drew them, so `areas.ts` imported its type *from a component* and a new
  mark could not be added without editing one. Marks are data; they moved to
  `marks.ts` and `Mark` became a renderer.
- `ConnectionMap.tsx` held a `stages` array with a **hardcoded list of product
  ids**. A twelfth product did not appear in the diagram, with no error, no
  warning and no type failure. The bands moved to `stages.ts` and each product
  declares a `stage`, so the map has no second copy of the truth.

Verified in the twelve-product state:

```console
$ pnpm check
      Tests  124 passed (124)
  12/12 cases caught
prerender: 14 routes + a 404, 324.9 kB of markup
build output: ok — 117.0 kB document, 21 articles, 1 JSON-LD block
smoke: passed
$ npx playwright test --project=chromium
  62 passed
```

14 routes, 21 articles, 13 sitemap entries, and the JSON-LD graph grew by one
node — with nothing outside the data layer written.

**Four bugs found by the exercise**, three in the code and one mine:

| Bug | How it showed |
| --- | --- |
| `MarkId` closed over a component's JSX | `tsc` rejected a valid new mark |
| a product missing from the diagram | one component test; no error, no warning |
| three browser tests with a hardcoded `11` | three failures on a twelfth product |
| my new `invalid-stage-reference` check was written *inside* the `if (!areas.some(…))` block | 3 of 12 self-test cases reported "data layer consistent" on a product in a band that does not exist |

The last is the argument for `verify-validator.mjs`: a check written but never
seen to reject anything had silently never run.

Three of the twelve self-test cases are reachable **only** because
`build:server` is esbuild and does no type checking — `tsc` catches an unknown
mark during `pnpm typecheck`, but the deploy build is
`build:client && build:server`, so a cast would sail through. Those cases mutate
the data with an `as` cast for exactly that reason.

## Paint

The homepage `h1` is the largest contentful paint on the site's most important
page, and an element at `opacity: 0` is not painted at all.

| | `h1` in the document | Fully opaque |
| --- | --- | --- |
| Before | 351 ms | **1772 ms** |
| After | at first frame | **at first frame** |

The hero played on load with `animation-fill-mode: both`, so the heading sat at
zero opacity through a 170 ms delay and a 580 ms fade. The fix is the same shape
as the page-enter animation removed in v1.0.0: the hero animates `translate` only.
The slide survives, because motion is not what costs a paint.

`Reveal` had the same fragility for a different reason — content already in the
viewport depended on an observer's scheduling. It now checks its own geometry
first. Measured, the product pages went from observer-dependent to 103 ms.

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

## Browsers

`tests/e2e/` — 60 tests, run in Chromium and Firefox against the prerendered
build with the production Content Security Policy enforced. Thirteen routes are
covered: the homepage, the product index, all eleven product pages, and the
404.

| | This host | GitHub Actions, `ubuntu-latest` |
| --- | --- | --- |
| Result | 46 passed in Chromium; 34 passed + 3 skipped in Firefox, with 9 needing a retry | **89 passed, 3 skipped, 0 failed, no retries** |
| Suite duration | ~1.9 min / ~11.9 min | 51.5 s for all 92 |

92 tests is 46 run in each engine. The three skips are the Firefox
`prefers-color-scheme` limitation. The retry difference between the two columns
is the whole story about the host: on an idle runner every test passes first
time, and locally at load 15-29 about one in five needs a second attempt. The
retries exist for the second case and are doing nothing in the first.

Four real differences, all recorded next to the tests that found them:

1. **`networkidle` never settles in Firefox.** The harness waited for it and
   timed out. `gotoHome` now waits for the `h1`, which is what the tests need.
2. **Firefox runs at about a third of Chromium's speed.** A 30 s timeout failed
   intermittently; it is 60 s now.
3. **Firefox cannot emulate `prefers-color-scheme` on this host.** Verified
   directly: `newContext({ colorScheme: 'dark' })` gives `matchMedia` true in
   Chromium and false in Firefox. Three tests are scoped with the reason in the
   file.
4. **The 80 ms hover-intent delay is below Playwright's round trip to Firefox.**
   "Still closed immediately after hover" passed in one and failed in the other
   with identical behaviour. Replaced with the requirement it stood for: focus
   alone must not open the menu.

One bug was found by the suite rather than by it: `ThemeToggle`'s effect wrote
the theme to `localStorage` on mount, so the system preference was captured on a
visitor's first load and then frozen permanently. A test asserting the system
preference noticed the value coming back after `localStorage.clear()`.

## Tests

110 unit and component tests across six files, plus 60 browser tests.

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

- **Safari and WebKit.** Attempted and diagnosed rather than assumed. The
  binaries download, and the three libraries Playwright names
  (`libevent-2.1-7t64`, `libavif16`, `libmanette-0.2-0`) can be extracted from
  their `.deb`s without root and reached through `LD_LIBRARY_PATH` — so the
  "needs root" answer is not the whole story.

  It still does not run, for a reason worth recording precisely: the system
  `libsoup-3` and GStreamer are older than this WebKit build, and the process
  dies on

  ```text
  MiniBrowser: undefined symbol: soup_uri_new (fatal)
  MiniBrowser: undefined symbol: gst_init_static_plugins (fatal)
  ```

  Neither the system library nor the newest package Ubuntu 24.04 offers
  (`libsoup-3.0-0` 3.0.7.4) exports `soup_uri_new`. Satisfying WebKit therefore
  means building libsoup and the GStreamer stack from source into a private
  sysroot — a cascade, not a bounded change, and not something to leave behind as
  an undocumented local hack that only works on one machine.

  The project is configured and commented in `playwright.config.ts`; on a host
  with a compatible libsoup and GStreamer, uncommenting it is all that is needed.
  This is a real gap: the engine most likely to differ is the one untested.
- **Edge as a product.** It shares Chromium's engine, so the Chromium project
  covers its rendering behaviour, but its own shell — extension interop, its own
  settings UI — is unverified.
- **`prefers-color-scheme` in Firefox.** Firefox on this host cannot emulate it:
  the context option is accepted and ignored and `matchMedia` always reports
  false. Three theme tests are scoped to Chromium with the reason recorded. The
  system-preference fallback is therefore unobserved in Gecko, not broken.
- **The first paint in Firefox.** The no-flash test is Chromium-only: Firefox
  paints before `DOMContentLoaded`, so the first background is not observable
  through the same hook.
- **iOS Safari and Android Chrome.** Chromium with a mobile viewport and
  `isMobile` covers layout, but not Safari's own behaviours: the 100vh problem,
  the URL bar, momentum scrolling, and Safari's stricter `IntersectionObserver`
  and `ResizeObserver` delivery.
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
