# Hilbras

The public homepage for **Hilbras** — the company behind a family of independent
software products.

```text
Build. Connect. Create.
```

> Hilbras is not a single product. It is a technology ecosystem.

This is a static, single-page site. One route, eleven products, six technology
areas, and no client-side router.

---

## Stack

Chosen to match the design system in `../OmniHilbras` so the two products share a
toolchain as well as a look.

| Concern | Choice |
| --- | --- |
| Framework | React 19 |
| Build | Vite 8 |
| Styling | Tailwind CSS v4, tokens in CSS `@theme inline` |
| Motion | CSS transitions + one `IntersectionObserver`. No animation library. |
| Icons | `lucide-react` for UI, inline SVG for product marks |
| Types | TypeScript 5.9, `strict` + `noUnusedLocals` + `noUnusedParameters` |
| Lint | ESLint 10 flat config, `typescript-eslint`, `react-hooks` |
| Fonts | Geist + Geist Mono, self-hosted, `latin` and `latin-ext` subsets |

No router, no state library, no CSS-in-JS, no component framework, no animation
library, no analytics. The whole thing is one HTML file, one stylesheet, one
script, and four font files.

## Commands

```bash
pnpm install
pnpm dev          # http://localhost:5174
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .
pnpm build        # typecheck + production build into dist/
pnpm preview      # serve dist/ locally
```

## Structure

```text
src/
├── components/
│   ├── ui/            Mark, ProductMark, StatusPill, Reveal, Section, GitHubMark
│   ├── Hero.tsx           Navbar, Hero, About, Ecosystem, Products,
│   ├── Navbar.tsx         ConnectionMap, Technology, Audiences,
│   ├── …                  Philosophy, Vision, FinalCta, Footer
│   ├── ParticleField.tsx  the drifting node field behind the page
│   ├── ThemeToggle.tsx
│   └── StructuredData.tsx JSON-LD, built from the product data
├── data/
│   ├── areas.ts        products, areas, statuses, helpers
│   └── site.ts         company, navigation, audiences, principles, vision
├── pages/
│   └── HomePage.tsx    section order
└── index.css           fonts, tokens, components, motion
```

Section order lives in `src/pages/HomePage.tsx` and nowhere else.

## Adding a product

One edit, in `src/data/areas.ts`:

```ts
{
  id: 'newproduct',
  name: 'New Product',
  area: 'platforms',          // the area that owns it
  description: 'One sentence on what it does and why it exists.',
  status: 'alpha',            // stable | beta | alpha | building
  mark: 'panel',              // a MarkId from components/ui/Mark.tsx
  repository: 'https://github.com/Hilbras/NewProduct',  // omit if not public
  href: 'https://example.dev',                         // omit if not deployed
  featured: true,             // optional: gives it the wide card
}
```

Add the id to the owning area's `products` array. The product grid, the ecosystem
cards, the navigation dropdown, the mobile menu, the footer, the connection map,
and the JSON-LD graph all pick it up from there. Nothing else changes. The count
under the grid ("8 of the 11 projects are public today") is derived too, so it
cannot go stale.

If the product belongs to a second area, list its id in that area's `products`
too. The count, the chips, and the diagram follow automatically.

## Adding a technology area

Same file. Add an entry to `areas` with a `mark`, then add its `id` to the
`AreaId` union. `components/Technology.tsx` needs one entry in its `detail` map
for the capability list; the rest is derived.

## Design language

Tokens live at the top of `src/index.css` and are defined twice — once for
`[data-theme='light']`, once for `[data-theme='dark']` — then exposed to Tailwind
through `@theme inline`. A component never hardcodes a colour; it uses
`text-muted`, `border-line`, `bg-gold-soft`, and so on.

```text
--bg / --bg-soft / --surface / --surface-2   surfaces, warm neutrals
--text / --muted / --line / --line-strong    text and hairlines
--gold / --gold-bright / --gold-mid         the single accent ramp
--gold-text / --gold-ink / --gold-soft      accessible gold, on-gold ink, tint
--glow / --success / --danger / --shadow    focus, state, elevation
```

Component classes follow the same short vocabulary as the rest of the family:
`.shell`, `.section-band`, `.section-pad`, `.card`, `.card-glow`, `.btn-gold`,
`.btn-ghost`, `.btn-quiet`, `.eyebrow`, `.eyebrow-dot`, `.mono-label`,
`.section-title`, `.display-title`, `.gold-text`, `.hairline`, `.grid-wash`,
`.bg-glow`, `.nav-blur`, `.node`, `.flow-line`, `.skip-link`, `.footer-link`.

### Deliberate departures from the reference

| Token | Change | Why |
| --- | --- | --- |
| `--gold-ink` (light) | `#ffffff` → `#1c1704` | White on `#d4af37` is 2.1:1 and fails WCAG AA for a 14px label. Dark ink is 8.5:1. |
| `--gold-text` (light) | `#8a6d12` → `#7d620f` | The eyebrow pill is 11px; at the old value it measured 4.3:1 against its own tint. Now 5.0:1. |
| `--gold-mid` (new) | — | The display gradient needed a mid stop that clears 3:1 as large text. `--gold-bright` did not. |
| `--success` (light) | `#177d47` → `#0f5c38` | Status pills tint their own background 10% with this colour, which dropped the 10px "Stable" label to 4.1:1. |
| `:focus-visible` | `--gold` → `--gold-text` | Pure gold is 2.1:1 on the light background; a focus ring must clear 3:1. |

Everything else — the ramp, the type scale, the radii, the easing curve, the
reveal timings, the card anatomy and its hover glow — is shared with OmniHilbras
on purpose. The only structural departure is that motion is CSS rather than a
library, which changed no visible behaviour and removed a dependency.

## Accessibility

Verified, not assumed. Lighthouse scores 100 for accessibility, best practices
and SEO. The specific claims behind that:

- One `h1`; section headings are `h2`; card headings are `h3`; no level is skipped.
- Every `<section>` is named by its own heading via `aria-labelledby`.
- The skip link is the first tab stop and moves focus to `<main tabindex="-1">`.
- The products menu is a disclosure button: click toggles, `Escape` closes and
  returns focus, blur closes, hover opens with an intent delay. Focus alone does
  not open it, so the first `Enter` cannot immediately undo it.
- The theme choice is applied before first paint from `localStorage`, and the
  350 ms colour transition is scoped to the switch moment only.
- Under `prefers-reduced-motion: reduce` no keyframe animation survives, smooth
  scrolling is off, and all 61 reveals render at full opacity. The hidden state
  itself lives inside a `prefers-reduced-motion: no-preference` block, so it is
  not merely animated away — it is never applied.
- With JavaScript disabled the page still renders: the reveal hidden state is
  gated on `html.has-js`, and a `<noscript>` block states what Hilbras is and
  links to the organisation on GitHub.
- Product marks are inline SVG with `aria-hidden="true"`; each product is named
  once, in its chip, via `.sr-only`. No product mark depends on a system font.
- Measured contrast against composited backgrounds, both themes, all 13 pairs at
  or above their WCAG threshold — 5.0:1 to 17.3:1 for body and label text, 8.5:1
  for the gold button label, 5.5:1 for the focus ring.

## SEO

`index.html` carries the title, description, canonical, Open Graph and Twitter
card, and a copy of the organisation JSON-LD so crawlers that do not run
JavaScript still see it. The rendered page adds a `SoftwareApplication` node per
product, built from the same data the cards render from. `public/robots.txt` and
`public/sitemap.xml` are committed.

## Performance

```text
HTML             4.8 kB
CSS             39.8 kB    (8.5 kB gzipped)
JS             278.9 kB    (85.5 kB gzipped)
Fonts            83.7 kB    (4 files, latin subsets preloaded)
Images            0 B       (no raster asset is on the page)
Third parties     0
Requests          6
```

Two decisions did most of that work:

- **The animation library is gone.** Scroll reveals are a CSS transition toggled
  by one `IntersectionObserver`, and the two navbar disclosures keep themselves
  mounted for the length of their close transition. That removed `motion` and
  took the bundle from 127 kB to 85 kB gzipped, with no visible change. It also
  made the page *more* robust: the hidden state now depends on a CSS media query
  rather than on hydration.
- **Fonts are self-hosted.** Geist and Geist Mono ship as four subset files in
  `public/fonts` with the two latin subsets preloaded. This removes a
  render-blocking third-party stylesheet from the critical path and keeps
  visitor IPs off a third party. The page now makes zero cross-origin requests.

The drifting particle field pauses when the tab is hidden, and scroll reveals run
once and never replay.

## Adding pages later

The data model does not assume this is the only page. Product records already
carry `href` and `repository`, so a product page can take over the link without a
schema change. `HomePage` is one exported component behind no router, which means
adding `react-router-dom` later is additive — the section components are already
addressable by their own `id`.

## Reference

`docs/ASSESSMENT.md` records the inspection of `../OmniHilbras` that this design
system was derived from, including what was reused, what was adapted, and what is
specific to Hilbras.
