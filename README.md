# Hilbras

The public website for **Hilbras** — the company behind a family of independent
software products.

```text
Build. Connect. Create.
```

> Hilbras is not a single product. It is a technology ecosystem.

One route, eleven products, six technology areas, and no client-side router. The
page is prerendered to static HTML so it is readable in full by crawlers that do
not run JavaScript, then hydrated.

- **Purpose.** To be the entry point to the Hilbras ecosystem: what the company
  is, what it builds, and where each product sits relative to the others.
- **Audience.** Developers evaluating the SDK and infrastructure, people looking
  for a platform to build on, and contributors arriving from a repository.
- **Not a marketing microsite.** No pricing, no testimonials, no FAQ, no stock
  photography. The content is the product list and the taxonomy.

---

## Contents

- [Stack](#stack)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Architecture](#architecture)
  - [How the build works](#how-the-build-works)
  - [Project structure](#project-structure)
- [Routes](#routes)
- [Data architecture](#data-architecture)
  - [The product model](#the-product-model)
  - [Adding a product](#adding-a-product)
  - [Adding a technology area](#adding-a-technology-area)
  - [Product status](#product-status)
  - [Environments](#environments)
- [Design language](#design-language)
- [Accessibility](#accessibility)
- [SEO and structured data](#seo-and-structured-data)
- [Security](#security)
- [Performance](#performance)
- [Testing](#testing)
- [Environments](#environments)
- [CI/CD](#cicd)
- [Deployment verification](#deployment-verification)
- [Deploying](#deploying)
- [Contributing](#contributing)
- [Releasing](#releasing)
- [Reference](#reference)

---

## Stack

Chosen to share a toolchain with the design reference in `../OmniHilbras`, so the
two share a way of working as well as a look.

| Concern | Choice |
| --- | --- |
| Framework | React 19 |
| Build | Vite 8 |
| Styling | Tailwind CSS v4, tokens in CSS `@theme inline` |
| Motion | CSS transitions + one `IntersectionObserver`. No animation library. |
| Icons | `lucide-react` for UI, inline SVG for product marks |
| Types | TypeScript 5.9, `strict` + `noUnusedLocals` + `noUnusedParameters` |
| Lint | ESLint 10 flat config, `typescript-eslint`, `react-hooks` |
| Unit tests | Vitest 3 with happy-dom, `@testing-library/react`, v8 coverage |
| Browser tests | Playwright 1.63, Chromium and Firefox |
| Fonts | Geist + Geist Mono, self-hosted, `latin` and `latin-ext` subsets |
| Rendering | Prerendered to static HTML, then hydrated |
| Hosting | Vercel, static output |

No router, no state library, no CSS-in-JS, no component framework, no animation
library, no analytics, no third-party requests. The deployed output is one HTML
file, one stylesheet, one script, four font files, an SVG icon, a PNG social card,
and three generated text files.

## Getting started

Requires Node 24 and pnpm 12.

```bash
pnpm install
pnpm dev          # http://localhost:5174
```

`pnpm-workspace.yaml` carries a `allowBuilds` entry for `esbuild`, which pnpm 12
requires before it will run a dependency's install script. Committing it is what
makes a fresh install reproduce.

## Commands

```bash
pnpm dev                # vite dev server
pnpm build              # the full production build -> dist/
pnpm preview            # serve dist/ locally
pnpm typecheck          # tsc --noEmit
pnpm lint               # eslint .
pnpm test               # vitest run
pnpm test:watch         # vitest
pnpm test:coverage      # vitest run --coverage (gated)
pnpm test:e2e           # playwright test, both browsers
pnpm test:e2e:ui        # playwright test --ui
pnpm validate           # data-layer consistency, run inside the build
pnpm seo                # robots.txt, sitemap.xml, site.webmanifest
pnpm icons             # regenerate the application icons from favicon.svg
pnpm smoke:local        # deployment checks against a server it starts itself
pnpm smoke <url>        # the same checks against a deployed URL
pnpm serve:headers      # dist/ with the real vercel.json headers

pnpm check              # everything below — run this before pushing
pnpm assert:build       # the built document is crawlable
pnpm assert:headers     # the security policy is strong
pnpm assert:design      # no colour literals, no arbitrary type values
pnpm verify:validator   # proves assert-style checks actually fire
pnpm verify:build-assertion
pnpm check:all          # check + the browser suite
```

`pnpm check` is the whole gate:

```text
typecheck → lint → tests + coverage → validator self-test
          → build → build-output assertions → header assertions → design
          → smoke
```

It starts its own server for the smoke step, so it works on a clean machine with
no setup. CI runs the same command rather than a parallel implementation of it.

`pnpm check:all` adds the browser suite, which needs a build first and is slow
enough to keep out of the inner loop. `pnpm check` is what CI's `check` job and
`e2e` job both gate on.

## Architecture

```text
React components
      ↓
src/data/*        one source of truth: products, areas, copy, domain
      ↓
Vite client build          Vite SSR build (--mode ssr)
      ↓                          ↓
dist/assets/*              .ssr/entry-server.mjs
                                 ↓
                        validate → seo → prerender
                                 ↓
                    dist/index.html  (static, crawlable)
                                 ↓
                            React hydrates on top
```

Three properties this arrangement is chosen for:

1. **Adding a product is a data edit.** One record in `src/data/areas.ts` reaches
   the grid, the navigation, the footer, the connection map, the structured data,
   and the sitemap. No component changes.
2. **The first paint is real markup.** The prerender step exists because search
   engines run JavaScript but GPTBot, ClaudeBot, PerplexityBot, and most
   archiving tools do not.
3. **One domain, one description.** Every absolute URL and every text field in
   `<head>` is generated from `site.domain` and `site` at build time, so they
   cannot disagree.

### How the build works

`pnpm build` runs five steps:

1. **`build:client`** — the browser bundle and the HTML shell.
2. **`build:server`** — `vite build --mode ssr` compiles `src/entry-server.tsx`
   to a plain Node module. The app was already server-renderable: the only
   browser APIs in play sit behind `useEffect`, which never runs on a server.
3. **`validate`** — `scripts/validate-data.mjs` imports that same compiled module
   and fails the build if the data layer is inconsistent. It reads the bundle
   rather than the sources so it checks exactly what is about to be prerendered.
4. **`seo`** — writes `robots.txt`, `sitemap.xml` and `site.webmanifest` into
   `dist/` from `site.domain` and `site.lastModified`.
5. **`prerender`** — renders the page into `dist/index.html`, rewrites every
   absolute URL and description, injects the JSON-LD graph once, and removes the
   compiled bundle.

Steps 3 to 5 all read `.ssr/entry-server.mjs`, so it must outlive them; step 5
owns the cleanup.

### Project structure

```text
src/
├── components/
│   ├── ui/
│   │   ├── Mark.tsx          11 product marks + the Hilbras mark, inline SVG
│   │   ├── ProductMark.tsx   the mark on a shared 24-unit grid
│   │   ├── ProductLink.tsx   the single place a product link is built
│   │   ├── StatusPill.tsx    the status pill, full and compact
│   │   ├── AssuranceRow.tsx  the two claim rows, plain and with icons
│   │   ├── Reveal.tsx        Reveal + useDisclosure — the no-library motion
│   │   ├── Section.tsx       <section> + SectionHeader
│   │   └── GitHubMark.tsx
│   ├── Hero.tsx  Navbar.tsx  About.tsx  Ecosystem.tsx  Products.tsx
│   ├── ConnectionMap.tsx  Technology.tsx  Audiences.tsx  Philosophy.tsx
│   ├── Vision.tsx  FinalCta.tsx  Footer.tsx
│   ├── ParticleField.tsx     the drifting node field behind the page
│   ├── ThemeToggle.tsx
│   └── components.test.tsx
├── data/
│   ├── areas.ts              products, areas, statuses, kinds, helpers
│   ├── site.ts               company, domain, navigation, copy, audiences
│   ├── links.ts              productHref / isExternalHref / externalRel
│   ├── structuredData.ts     the JSON-LD graph
│   ├── validation.ts         the rules the build enforces
│   └── *.test.ts
├── components/navbar/
│   ├── Navbar.tsx            the arrangement: nothing else
│   ├── ProductsMenu.tsx      the disclosure and its panel
│   ├── NavigationParts.tsx   the actions cluster and the mobile menu
│   └── useHoverIntent.ts     the two timers, and Escape
├── pages/
│   ├── App.tsx               the page shell, and the only path switch
│   ├── HomePage.tsx          the homepage sections, in order
│   ├── ProductIndexPage.tsx  every product, grouped by owning area
│   ├── ProductPage.tsx       one product
│   ├── NotFoundPage.tsx      lists every product, since a stale link is likeliest
│   └── pages.test.tsx
├── test/
│   └── setup.ts              matchMedia stub, localStorage reset
├── entry-server.tsx          SSR entry; also the module the build scripts import
├── main.tsx                  hydration entry
├── routes.ts                 the only place a path becomes a page
└── index.css                 fonts, tokens, components, motion

tests/
├── e2e/
│   ├── fixtures.ts           collects console errors, failures, hydration warnings
│   ├── homepage.spec.ts      content, prerendered HTML, hydration, overflow
│   ├── navigation.spec.ts    the disclosure: click, hover, Escape, focus
│   ├── mobile.spec.ts        the menu below the large breakpoint
│   ├── theme.spec.ts         preference, persistence, storage failure, reduced motion
│   ├── accessibility.spec.ts skip link, focus rings, names, heading order
│   ├── links.spec.ts         rel, target, announcements, dead anchors
│   ├── pages.spec.ts         every product page, the index, and the 404
│   └── performance.spec.ts   canvas size, long tasks, layout shift, paint, third parties

scripts/
├── prerender.mjs             markup injection, metadata generation, JSON-LD
├── generate-seo.mjs          robots / sitemap / manifest
├── generate-icons.mjs        application icons, rendered from favicon.svg
├── validate-data.mjs         fails the build on inconsistent data
├── assert-build-output.mjs   the built document is crawlable
├── assert-security-headers.mjs  the policy is strong
├── serve-with-headers.mjs    dist/ with the real vercel.json headers
├── smoke.mjs                 deployment checks, against any URL
├── smoke-local.mjs           the same, against a server it starts
├── verify-validator.mjs      proves the validator rejects bad data
├── verify-build-assertion.mjs  proves the build assertions fire
└── og-template.html          editable source for public/og.png

public/
├── fonts/                    4 woff2 subsets, self-hosted
├── icons/                    192, 512 and a maskable 512, generated
├── favicon.svg  og.png
└── theme-init.js             theme + has-js, before first paint

.github/workflows/ci.yml
```

`robots.txt`, `sitemap.xml` and `site.webmanifest` are **not** in `public/`. They
are generated, because they were static files with the domain written into them
and that is how an earlier domain change missed one of them.

## Routes

Thirteen documents, all prerendered:

```text
/                    the company homepage
/products            the index, grouped by area
/products/:product   one per product, 11 of them
404.html             served with a 404 status, marked noindex
```

**There is no router, and there does not need to be one.** Every route is
prerendered to its own HTML file, so a request for `/products/sdk` gets a
complete document and there is nothing for a client-side router to intercept.
`react-router-dom` would add a dependency and a navigation model to a site that
does not navigate on the client.

What is left is `src/routes.ts`: `resolveRoute(pathname)` is the only place a
path becomes a page, and both sides use it — the prerender walks `allRoutes()` to
decide what to write to disk, and the client passes `window.location.pathname`.
Deciding the page twice is how a hydration mismatch happens.

`allRoutes()` derives from the product registry, so **a product added to
`areas.ts` produces a page, a sitemap entry and its own JSON-LD with no second
edit.** `assert-build-output.mjs` and `smoke.mjs` both check every route, so a
product with no page fails the build.

Section links are root-relative — `/#ecosystem`, not `#ecosystem` — because they
are followed from the product pages too, and a bare fragment resolves against
whatever page the reader is on. `#main` is the exception: every page has a
`main`, so the skip link stays on the current document.

## Data architecture

Everything the page says about the company is in `src/data`. Components read it;
they do not restate it.

| File | Holds |
| --- | --- |
| `areas.ts` | products, technology areas, status labels and definitions, schema mapping |
| `site.ts` | name, domain, tagline, headline, description, navigation, audiences, principles, vision, footer groups |
| `links.ts` | the one rule for where a product link goes |
| `structuredData.ts` | builds the JSON-LD graph from `areas.ts` and `site.ts` |

### The product model

```ts
{
  id: 'newproduct',              // kebab-case; used as a URL fragment
  name: 'New Product',
  area: 'platforms',             // the area that owns it
  description: 'Two or three sentences. Shown on the product card.',
  summary: 'One line. Shown in the navigation dropdown.',
  kind: 'platform',              // library | service | platform | application | system
  status: 'alpha',               // stable | beta | alpha | building
  mark: 'panel',                 // a MarkId from components/ui/Mark.tsx
  repository: 'https://github.com/Hilbras/NewProduct',  // omit if not public
  documentation: 'https://github.com/Hilbras/NewProduct#readme',
  href: 'https://newproduct.dev',                        // omit if not deployed
  platform: 'Linux',             // omit if cross-platform
  featured: true,                // gives it the wide card
}
```

`kind` is what the structured data keys off, so an operating system is not
published as a developer application. `summary` exists because the full
description does not fit in a navigation dropdown.

A product page renders only what these fields hold, and each section is
conditional on its data existing — so there is no empty "Use cases" heading on
nine of eleven products. `features`, `useCases` and `integrations` are
deliberately absent: inventing eleven products' feature lists is not something a
website should do. They arrive the day the data supports them.

### Adding a product

1. Add the record above to `products` in `src/data/areas.ts`.
2. Add its id to the owning area's `products` array. A product can be in two.
3. Add a mark to `components/ui/Mark.tsx` if it needs its own geometry.

Nothing else changes. The product grid, the ecosystem cards, the navigation
dropdown, the mobile menu, the footer, the connection map, the JSON-LD graph, and
the counts all derive from the data.

`pnpm check` will tell you if the record is malformed, and `pnpm assert:content`
will tell you if a heading still states the old number of products.

### Adding a technology area

Same file. Add an entry to `areas` with a `mark`, add its id to the `AreaId`
union, then add one entry to the `detail` map in `components/Technology.tsx` for
the capability list. Everything else is derived.

### Product status

Four levels, and they mean what they say. A product without a public release says
so on its card rather than linking nowhere.

| Status | Means |
| --- | --- |
| `stable` | Publicly released. Interfaces may still gain additive changes. |
| `beta` | Usable and documented, but the interface is still settling. |
| `alpha` | Public and working, with parts of the interface still changing. |
| `building` | Under active construction. Nothing here is a supported release yet. |

The definition is attached to the pill as a `title`, so a reader is never left to
infer whether `Alpha` means production-ready.

### Environments

`site.domain` in `src/data/site.ts` is the committed default. `SITE_URL`
overrides it at build time, resolved through one function in `src/data/url.ts` so
the document, sitemap, robots, manifest and JSON-LD cannot disagree.

```bash
pnpm build                                    # uses site.domain
SITE_URL=https://hilbras-git-abc.vercel.app pnpm build   # preview identity
```

Without this, a preview deployment publishes the production canonical, Open Graph
and JSON-LD identity — so a crawler that indexes a preview records production URLs
as the address of preview content. Every published URL follows the override
except third-party references, which are left alone. A malformed `SITE_URL` falls
back with a warning rather than propagating into every URL, and
`assert-build-output.mjs` fails if a preview build published a production
identifier.

On Vercel, set `SITE_URL` per environment: production to the canonical domain, and
preview to the deployment URL — Vercel exposes it as `VERCEL_URL`.

Before switching domains, also regenerate the social image — its footer text
lives in `scripts/og-template.html`.

### Deploying

`vercel.json` pins the framework, build command, output directory, cache rules
and headers, so a Vercel project needs no further configuration.

```bash
vercel link
vercel --prod
node scripts/smoke.mjs https://hilbras.vercel.app
```

## Design language

Tokens live at the top of `src/index.css`, defined once per theme, then exposed
to Tailwind through `@theme inline`. A component never hardcodes a colour or a
colour-bearing gradient; there are **zero hex values outside the two theme
declarations**.

```text
--bg / --bg-soft / --surface / --surface-2   surfaces, warm neutrals
--text / --muted / --line / --line-strong    text and hairlines
--gold / --gold-bright / --gold-mid         the single accent ramp
--gold-text / --gold-ink / --gold-soft      accessible gold, on-gold ink, tint
--gold-border / --glow / --success / --danger / --shadow
```

The type scale is tokenised too, including the four steps Tailwind does not have:

```text
--text-9  --text-11  --text-13  --text-15     9px, 11px, 13px, 15px
--tracking-card  --tracking-feature           -0.02em, -0.03em
--tracking-label --tracking-claim             0.08em, 0.12em
```

Those were `text-[13px]` and friends in fifty places across eighteen components,
which meant changing one meant finding every use. `pnpm assert:design` fails if a
colour literal or an arbitrary type value reappears, and both are silent
otherwise — the component renders, just not from the system.

Component classes: `.shell`, `.section-band`, `.section-pad`, `.card`,
`.card-glow`, `.btn-gold`, `.btn-ghost`, `.btn-quiet`, `.eyebrow`, `.eyebrow-dot`,
`.mono-label`, `.section-title`, `.display-title`, `.gold-text`, `.hairline`,
`.grid-wash`, `.bg-glow`, `.glow-wash`, `.nav-blur`, `.node`, `.flow-line`,
`.disclosure`, `.skip-link`, `.footer-link`, `.reveal`, `.noscript-fallback`.

### Deliberate departures from the reference

| Token | Change | Why |
| --- | --- | --- |
| `--gold-ink` (light) | `#ffffff` → `#1c1704` | White on `#d4af37` is 2.1:1 and fails WCAG AA for a 14px label. Dark ink is 8.5:1. |
| `--gold-text` (light) | `#8a6d12` → `#7d620f` | The eyebrow pill is 11px; at the old value it measured 4.3:1 against its own tint. Now 5.0:1. |
| `--gold-mid` (new) | — | The display gradient needed a mid stop that clears 3:1 as large text. `--gold-bright` did not. |
| `--gold-border` (new) | — | The gold button's own border, previously a hardcoded `color-mix` against black in the middle of the file. |
| `--success` (light) | `#177d47` → `#0f5c38` | Status pills tint their own background 10% with this colour, which dropped the 10px "Stable" label to 4.1:1. |
| `:focus-visible` | `--gold` → `--gold-text` | Pure gold is 2.1:1 on the light background; a focus ring must clear 3:1. |

Two structural departures, both measured:

- **No animation library.** Scroll reveals are a CSS transition toggled by one
  `IntersectionObserver`; the two navbar disclosures use `useDisclosure`. Bundle
  127 kB → 85 kB gzipped, no visible change.
- **No page-enter animation.** It faded the whole document in over 420 ms, which on
  a prerendered page hides content the browser has already painted. It also left
  `transform` on the document wrapper, which makes an ancestor the containing
  block for `position: fixed` descendants — so the background canvas sized itself
  to the whole 10,584 px document instead of the 900 px viewport. Removing it took
  the canvas backing store from 58.1 MB to 4.9 MB and the median frame from
  92.3 ms to 27.1 ms at 4× CPU throttle.

Everything else — the ramp, the type scale, the radii, the easing, the reveal
timings, the card anatomy and its hover glow — is shared with the reference on
purpose.

## Accessibility

Verified, not assumed.

- One `h1` outside `<noscript>`; section headings are `h2`; card headings `h3`; no
  level skipped. `assert-build-output.mjs` fails the build otherwise.
- Every `<section>` is named by its own heading via `aria-labelledby`.
- The skip link is the first tab stop and moves focus to `<main tabindex="-1">`.
- The products menu is a disclosure button: click toggles, `Escape` closes and
  returns focus, blur closes, hover opens with an intent delay. Focus alone does
  not open it, so the first `Enter` cannot immediately undo it.
- The theme choice is applied before first paint from `localStorage`. The toggle's
  icon is selected by CSS from `data-theme` rather than from React state, so the
  server and client trees cannot disagree about a `localStorage` value. Its
  `aria-label` is static for the same reason.
- Under `prefers-reduced-motion: reduce` no keyframe survives, smooth scrolling is
  off, and all 61 reveals render at full opacity. The hidden state lives inside a
  `prefers-reduced-motion: no-preference` block, so it is never applied rather than
  animated away.
- With JavaScript disabled the page still renders in full: the reveal hidden state
  is gated on `html.has-js`, and the prerendered markup is present, not just the
  `<noscript>` summary.
- Hydration is clean — no warnings, and React reuses the server DOM rather than
  replacing it.
- Every link that opens a new tab carries `rel="noreferrer noopener"` and a
  screen-reader announcement. Internal anchors never open in a new tab.
- Product marks are inline SVG with `aria-hidden="true"`; each product is named
  once, in text. No mark depends on a system font.
- Contrast measured against composited backgrounds in both themes: 5.0:1 to 17.3:1
  for body and label text, 8.5:1 for the gold button, 5.5:1 for the focus ring.

## SEO and structured data

`index.html` holds the tags; the prerender fills in their contents from
`src/data/site.ts`. The title, the meta description, both Open Graph and Twitter
descriptions, the site name and the image alt are all generated. This matters
more than it sounds: they were three hand-written descriptions that did not match
each other, so the same page announced itself three different ways depending on
who was reading.

Generated at build time:

- `robots.txt` — allows everything, points at the sitemap.
- `sitemap.xml` — one route, `lastmod` from `site.lastModified`. Product pages
  belong here when they exist.
- `site.webmanifest` — name, colours, and real application icons: 192, 512 and a
  maskable 512 generated from `favicon.svg` by `pnpm icons`. It previously used
  the 1200×630 social card, which is the wrong aspect ratio for every icon
  consumer and is cropped to nothing by Android's adaptive mask.

Structured data is one JSON-LD block in `<head>`, built from the same data the
cards render from, so it cannot drift from what a visitor sees:

| Product kind | `@type` | `applicationCategory` |
| --- | --- | --- |
| `library` | `SoftwareSourceCode` | `DeveloperLibrary` |
| `service` | `SoftwareApplication` | `DeveloperApplication` |
| `platform` | `SoftwareApplication` | `BusinessApplication` |
| `application` | `SoftwareApplication` | `ConsumerApplication` |
| `system` | `OperatingSystem` | `OperatingSystem` |

Plus one `Organization` and one `WebSite`, `codeRepository` and `hasPart` where
they exist, and `creativeWorkStatus` carrying maturity.

`operatingSystem` is emitted only where it is informative. It was
`"Cross-platform"` on all eleven nodes, which tells a crawler nothing and drowns
out the one product with a specific answer; Hilbras OS is Ubuntu-based and says
`Linux`, and the rest omit it rather than assert the obvious.

Every absolute URL is built from the resolved origin, so `SITE_URL` moves the
canonical, Open Graph, sitemap, robots, manifest and JSON-LD together — see
[environments](#environments).

`assert-build-output.mjs` checks the document has a doctype, a lang, a
description, a canonical, Open Graph and Twitter tags, a manifest link and the
external theme script; that the prerender actually injected the app; that there
is enough static text and that five distinct fragments of the page are present in
it; one `h1`; no skipped heading level; no dead anchors; exactly one JSON-LD
block that parses; the generated files; and that the canonical domain is the
configured one.

## Security

Headers live in `vercel.json` and are asserted by `assert-security-headers.mjs`,
which checks them for their properties rather than an exact string — so tightening
the policy does not break the build and weakening it does.

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'; …; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; …` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Permissions-Policy` | twenty device APIs disabled, none of which the site uses |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `X-DNS-Prefetch-Control` | `on` |

The policy has **no exceptions**. Two things had to move for it:

- **The theme bootstrap.** It was an inline `<script>` in `<head>`. An inline
  script needs a nonce or a hash, and a static host issues no per-request nonce —
  so the usual outcomes were a hash to keep in sync with every edit, or
  `unsafe-inline`, which removes the protection while appearing not to. Nineteen
  lines moved to `public/theme-init.js`, which is same-origin and shares a
  connection the stylesheet already uses. It stays a blocking script because it
  has to run before first paint.
- **Inline styles.** `style-src 'self'` blocks `style` attributes, which surfaced
  two places reaching past the design system: the gold wash behind the featured
  card and the closing CTA, which was the same radial gradient written twice as
  `style={{}}` and is now `.glow-wash`; and the `<noscript>` fallback, which is
  now `.noscript-fallback` in the stylesheet — so the policy holds for a visitor
  with scripting disabled, which is when a broken fallback matters most.

Hashed assets and fonts are served `immutable` for a year; the theme script for an
hour, so a change reaches people without waiting on a deploy.

Test it locally rather than finding out in production:

```bash
pnpm serve:headers     # dist/ on :4175 with the real vercel.json headers
```

## Performance

```text
HTML           110.8 kB   (97.6 kB of it prerendered markup)
CSS             39.5 kB   ( 8.5 kB gzipped)
JS             273.4 kB   (84.8 kB gzipped)
Fonts           81.8 kB   (4 files, latin subsets preloaded)
Images          28.4 kB   (one PNG, the social card; nothing on the page)
Third parties     0
Requests          6
```

Four decisions did most of that work:

- **The page ships as static HTML.** First paint does not wait on the bundle.
- **No animation library.** Reveals are a CSS transition toggled by one
  observer. This also made the page more robust: the hidden state now depends on
  a CSS media query rather than on hydration.
- **Fonts are self-hosted**, removing a render-blocking third-party stylesheet
  from the critical path and keeping visitor IPs off a third party. The page
  makes zero cross-origin requests.
- **The canvas is correctly sized.** See the page-enter note under
  [design language](#deliberate-departures-from-the-reference).

The particle field is measured, not guessed at. `Math.sqrt` instead of
`Math.hypot` on the pair loop is a 6.3× difference (0.229 ms → 0.037 ms per frame
at 72 particles). A uniform spatial grid was benchmarked and **not** adopted: at
0.173 ms it was slower than the plain loop it was meant to improve, because 72
particles is 2,556 pairs and the counting sort costs more than the pairs it
skips. It would only pay off in the thousands, and the numbers are in the source
so nobody re-adds it. It also runs at 30 fps rather than 60 — invisible at 0.2 px
per frame — uses 30 particles on coarse pointers, and observes the canvas with a
`ResizeObserver` so a mobile browser collapsing its URL bar does not rebuild the
field.

## Testing

```bash
pnpm test            # 110 unit and component tests
pnpm test:coverage   # with the thresholds enforced
pnpm test:e2e        # 60 tests across Chromium and Firefox
pnpm check:all       # everything
```

Four layers. The first three are fast; the browser suite needs a build first.

**Data and logic** (`src/data/*.test.ts`) — unique ids and names, ids safe as URL
fragments, every product in a real area, every area referencing a real product,
repository URLs inside the organisation, nothing marked stable without something
publicly released, link helpers, origin resolution including malformed
`SITE_URL` values, and the structured data: one node per product, every identifier
built from the resolved origin, each product typed by what it is, no
`operatingSystem` where it says nothing, and nothing that could break out of the
script element.

**Components** (`src/components/*.test.tsx`) — the status pill states a level and
explains it, the product card says plainly when there is no public release, the
disclosure's `aria-expanded` and focus return, the theme toggle's persistence
rules, the footer, the connection map, and the whole page's link integrity.
`counts.test.tsx` renders each section and checks the numbers in its headings
against `counts`, so the copy cannot contradict the data.

**Browser** (`tests/e2e/`) — the real build, served with the real `vercel.json`
headers. Against a dev server the prerender never runs; without the headers every
interaction the CSP could block passes vacuously. Covers homepage content and
prerendered HTML, hydration, the disclosure on click, hover, Escape and focus
return, the mobile menu, theme preference and persistence and storage failure,
reduced motion, the skip link and focus visibility and heading order, link
`rel`/`target`/announcements, and runtime cost.

**Self-tests** — `verify:validator.mjs` breaks the product data nine different
ways and asserts the build rejects each. `verify-build-assertion.mjs` corrupts the
built document six ways and asserts the assertions reject each. A check nobody
has seen fail is not known to work.

Coverage is gated on `areas.ts`, `links.ts`, `url.ts` and `structuredData.ts`.
`validation.ts` is deliberately excluded rather than the bar being lowered: its
error branches only execute on invalid data, which is the self-test's job.

### What the browsers disagreed about

Running the same suite in two engines is what found these:

- `networkidle` never settles in Firefox. `gotoHome` waits for the heading
  instead, which is what the tests need and what Playwright recommends.
- Firefox runs this suite at about a third of Chromium's speed, so a 30 s
  timeout failed intermittently. Now 60 s, with the reason recorded.
- Firefox cannot emulate `prefers-color-scheme` on the host this was built on —
  the context option is accepted and ignored, and `matchMedia` always reports
  false. Those three tests are scoped to Chromium with the reason in the file,
  not deleted, so they resume covering Firefox wherever emulation works.
- The 80 ms hover-intent delay is shorter than Playwright's round trip to
  Firefox, so "still closed immediately after hover" passed in one browser and
  failed in the other with identical behaviour. That assertion was measuring the
  delay rather than the requirement; it now asserts that focus alone does not
  open the menu.

WebKit is configured in `playwright.config.ts` and not enabled: it needs three
system libraries that need root. Safari is untestable on the build host, and Edge
shares Chromium's engine so the Chromium project covers its behaviour, but its
own shell is unverified.

### A race the tests found

The navigation disclosure test failed intermittently — once in three runs, then
once in eight. It was two bugs stacked, both real:

- `useDisclosure`'s `close` did not cancel the pending open frame. Opening
  schedules a `requestAnimationFrame` so the browser has the closed styles to
  animate from; a close landing in the same tick was undone when that frame fired,
  leaving a panel rendered fully open while `aria-expanded` said it was closed —
  content a screen reader has been told is hidden and a keyboard user can still
  tab into.
- The navbar's hover-intent timer was why it kept happening. A pointer over the
  trigger means `mouseenter` already queued an open, and it landed ~80 ms after
  `Escape` dismissed the panel. Click Products, press Escape without moving the
  mouse, and it comes back.

Both fixed, with a test that asserts the close wins deterministically.

## CI/CD

`.github/workflows/ci.yml`, on every push and pull request to `main`. Four jobs,
gating on the same commands as `pnpm check`.

| Job | Does |
| --- | --- |
| `check` | install, typecheck, lint, tests with coverage, validator self-test, build, build-output assertions, design system, build-assertion self-test, uploads `dist/` |
| `e2e` | installs Chromium and Firefox, builds, runs the browser suite, uploads the report and any traces on failure |
| `smoke` | runs `scripts/smoke.mjs` against a local server, and against `vars.SMOKE_URL` if one is configured |
| `security` | `pnpm audit --audit-level=high --prod` and the header assertions |

`assert-design-system.mjs` fails on the two ways of bypassing the token layer: a
colour literal in a component, which makes the theme unable to change it, and a
`text-[...]` or `tracking-[...]`, which is a scale step that does not exist. Both
are silent — the component renders, just not from the system.

The build step is worth having on this repository in particular: it is a
single-page site whose HTML is generated, so a change can typecheck, lint, pass
every test, and still produce a document with no content in it.

The `smoke` job checks a local server every run so the suite itself is exercised,
and reports a `::notice::` rather than pretending when no deployment URL is
configured.

## Deployment verification

`scripts/smoke.mjs` runs against any URL, because a build can be correct and a
deployment still be wrong — a missing header, a rewrite that strips a query, a
CDN serving a stale `index.html`. None of those fail a local check.

```bash
node scripts/smoke.mjs https://hilbras.vercel.app
```

It verifies seven endpoints return 200 with the right content type and real
content; the document's title, description, canonical, Open Graph and Twitter
tags, manifest link and prerendered text; that the canonical names the expected
origin; that the `og:image` resolves to a fetchable image rather than a
directory; that there is one `h1` and no dead anchors; that the JSON-LD parses
with no foreign origin; that the policy has no `unsafe-inline` and the transport
headers are present; and that every asset the document references loads.

## Deploying

```bash
vercel --prod
node scripts/smoke.mjs https://hilbras.vercel.app
```

**The repository is private**, so there is no Vercel Git integration and deploys
are manual from a clone. Connecting one requires adding the project to the
account explicitly or making the repository public.

Before a real launch:

- **A domain.** Set `SITE_URL` (or `site.domain`) and rebuild. See
  [environments](#environments) for what is already generated from it.
- **The social image.** `public/og.png` is a committed artifact;
  `scripts/og-template.html` is its editable source. Render at 1200×630.
- **Search Console.** Submit `sitemap.xml`. Needs a human.

## Contributing

1. Branch from `main`.
2. `pnpm check` must pass. It is the same gate CI runs.
3. Add or update a test for behaviour you changed.
4. If you changed the data, the validators and content assertions will tell you
   what copy is now out of step. Fix the copy rather than the assertion.
5. Keep component boundaries as they are. One section per file, shared primitives
   in `components/ui/`, no product facts in a component.
6. Do not add a dependency to solve something the platform already does. The
   current bundle is 85 kB gzipped with no animation library, no router, and no
   UI framework; each of those was a deliberate absence.

## Releasing

The repository is tagged `vX.Y.Z` and releases are published on GitHub.

```bash
pnpm check
vercel --prod          # deploy the exact commit you are about to tag
git tag -a v1.1.0 -m "…"
git push origin main --tags
gh release create v1.1.0 --title "v1.1.0" --notes-file notes.md
```

Order matters: deploy first, verify, then tag. A tag should point at a commit
whose output is live.

Versions follow semver. A copy change, a dependency bump, or a bug fix is a
patch. A new section, a new generated file, or a new command is a minor.

## Reference

- `docs/ASSESSMENT.md` — the inspection of `../OmniHilbras` this design system was
  derived from: what was reused, what was adapted, what is specific to Hilbras.
- `docs/VERIFICATION.md` — the measured claims in this file, with the commands
  that produce them and what could not be checked.
- `../OmniHilbras` — the design reference. **Not modified by this project, and not
  to be.**
