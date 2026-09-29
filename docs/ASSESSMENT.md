# Implementation Assessment

Two repositories were inspected before any code was written. Nothing was modified
in either.

| Path | Role |
| --- | --- |
| `/home/gin/work/Hilbras/Hilbras.main` | Target. **Empty directory** — no project exists yet. |
| `/home/gin/work/Hilbras/OmniHilbras` | Primary design reference. Read-only. |

---

## Phase 0 — Current state of the Hilbras Homepage

`Hilbras.main` contains no files. There is no framework, no build system, no
package manager, no dependencies, no components, no pages, no assets, no styling
system, no routing, and no configuration to preserve.

### What this changes

- There is no architecture to adapt. The recommended component layout in the
  brief (`src/components/<feature>/`, `src/data/`, `src/styles/`, `src/pages/`)
  is applied directly rather than "adapted to the actual framework".
- There is no existing design system to avoid duplicating. Design tokens are
  derived from OmniHilbras once and shared across every section.
- There is no test runner, linter, or type checker to extend. The toolchain is
  established from the same family as the reference project so tooling and
  visual output stay aligned.

### Constraints adopted

- No dependency beyond what the design language requires. The reference project
  already runs on React 19 + Vite + Tailwind v4 + Motion + lucide; matching it
  means Motion and lucide are justified, and anything else is not.
- Single-page homepage. No router. Section anchors are the navigation model
  until real pages exist, and the data model does not prevent them.

---

## Phase 1 — OmniHilbras design audit

### Stack

| Concern | Value |
| --- | --- |
| Framework | React 19.3 (`react`, `react-dom`) |
| Build | Vite 8.3 + `@vitejs/plugin-react` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, tokens in CSS `@theme inline` |
| Motion | `motion` 13.4 (`motion/react`), `MotionConfig reducedMotion="user"` |
| Icons | `lucide-react` 1.47 |
| Type safety | TypeScript 5.9, `strict`, `noUnusedLocals`, `noUnusedParameters` |
| Typecheck | `tsc --noEmit` |
| Tests | Node test runner (SDK / gateway), no frontend test suite |
| Package manager | pnpm 12.5, workspace root |
| Fonts | Geist + Geist Mono, self-referenced via Google Fonts `preconnect` |
| Routing | `react-router-dom` v7 for the dashboard SPA only; the marketing page uses hash anchors |

### Visual identity

Colours are CSS custom properties on `:root` (light) and `[data-theme='dark']`,
exposed to Tailwind through `@theme inline`. There is no second palette system
and no hardcoded hex in components outside the code-window mock.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#faf9f5` | `#0c0b09` | Page. Warm near-black, not neutral. |
| `--bg-soft` | `#f3f0e7` | `#12100c` | Alternating section band |
| `--surface` | `#ffffff` | `#15130e` | Card |
| `--surface-2` | `#f7f4ec` | `#1b1812` | Nested panel, table head |
| `--text` | `#17150f` | `#f2efe6` | Primary text |
| `--muted` | `#6f6857` | `#9c9584` | Secondary text |
| `--line` | `#e7e1d1` | `#262117` | Hairline border |
| `--line-strong` | `#d8d0bb` | `#353021` | Emphasised border, scrollbar |
| `--gold` | `#d4af37` | `#e2bd52` | Brand accent |
| `--gold-bright` | `#e9c963` | `#f3d789` | Gradient highlight |
| `--gold-text` | `#8a6d12` | `#e6c768` | Accessible gold on surface |
| `--gold-ink` | `#ffffff` | `#1a1503` | Text on gold fill |
| `--gold-soft` | 14% gold | 12% gold | Tint fill |
| `--glow` | 35% gold | 25% gold | Focus ring, shadow, selection |
| `--success` | `#177d47` | `#6fdb9b` | Health, live states |
| `--danger` | `#c23b31` | `#ff8a80` | Failure |
| `--shadow` | dual-layer, 7% | dual-layer, 50% | Card elevation |

The identity is a single warm neutral ramp plus one metallic accent. There is no
second hue family. That restraint is the most reusable part of the system.

### Typography

- `Geist` 300–800 for UI and display, `Geist Mono` 400–500 for labels and data.
- Display: `clamp()`-driven, `font-extrabold`, `leading-[0.98]`, `tracking-[-0.055em]`.
  Hero runs `clamp(42px, 8vw, 76px)`.
- Section title: `clamp(28px, 4vw, 42px)`, `font-weight: 720`, `tracking: -0.035em`,
  `line-height: 1.12`.
- `.mono-label`: mono, `10px`, `letter-spacing: 0.12em`, uppercase, muted. Used for
  every metadata row.
- Eyebrow pill: `11px`, `700`, `letter-spacing: 0.11em`, uppercase, gold on
  `--gold-soft` with a 40%-gold border and a 6px dot with a 4px soft ring.
- Card heading: `18px` / `600` / `tracking: -0.02em`.
- Body: `14px` muted, `sm` and up to `16px` in wide sections, `leading-relaxed`.
- `font-weight` values above 500 (550, 650, 720) are used deliberately; the
  reference does not stick to standard multiples.

### Layout system

- Single container: `max-w-6xl` (72rem) with `px-5`. No wider container anywhere.
- Section rhythm: `py-16 sm:py-24`. Alternating sections get
  `border-y border-line bg-bg-soft/55`.
- Grids: `gap-4` for cards, `gap-3` for controls, `gap-10` / `lg:gap-16` for
  two-column splits.
- Radii: `8px` controls, `10px` buttons, `12px` inner panels, `16px` cards and
  feature panels, `999px` pills.
- Hero: 620px decorative glow wash plus a masked 48px grid wash, centred copy,
  then a full-width panel below the copy. Full-bleed `hairline` closes the band.
- Two-column splits use asymmetric ratios (`0.78fr 1.22fr`, `0.8fr 1.2fr`),
  copy on the left, artefact on the right.
- Breakpoints in use: base, `sm` 640, `md` 768, `lg` 1024, `xl` 1280, plus one
  ad-hoc `min-[360px]:` for very narrow phones.
- Breakpoint behaviour is structural, not proportional: three-column grids drop
  to one column at `md`, the routing diagram in the hero is `hidden lg:flex`,
  and the footer goes 1 → 2 → 4 columns.

### Component language

| Component | Treatment |
| --- | --- |
| `.btn-gold` | Gold gradient fill, 70%-black border, `10px` radius, 14px/650, `10px 17px`, glow shadow, `translateY(-1px)` on hover |
| `.btn-ghost` | `--surface` fill, `--line-strong` border, turns gold-soft on hover |
| `.btn-quiet` | Borderless, muted, gold-soft background on hover |
| `.card` | `--surface` fill, `--line` border, `16px` radius, `--shadow` |
| `.eyebrow` / `.eyebrow-dot` | Pill with a pulsing-feeling ringed dot |
| `.mono-label` | The metadata primitive; used everywhere instead of ad-hoc small text |
| `.hairline` | Centred gold gradient rule that fades at both ends |
| `.gold-text` | Clipped gradient text, for exactly one phrase per section |
| `.grid-wash` | 48px grid, masked to fade out by 78% |
| `.bg-glow` | Radial gold wash anchored above the fold |
| `.nav-blur` | `--bg` at 74% + 16px backdrop blur |
| `.glass` | `--surface` at 74% + 14px backdrop blur |
| `.skip-link` | Off-canvas until focused |
| `.theme-toggle` | Pill that adopts the same gold treatment |
| `.footer-link` | Muted, gold on hover |

A shared card pattern runs through the site: icon chip (10px box, gold-soft fill,
gold/25 border) top-left, mono label top-right, title, body, then a hairline
footer row with a small check icon. Hover adds a blurred gold radial in the
bottom-right corner at `opacity-0 → 100`. That is the signature interaction.

### Motion

- Reveal on scroll: container staggers children at `0.09s`; items travel `22px`
  over `0.58s`; cards additionally scale from `0.98` over `0.55s`. Easing is
  `[0.22, 1, 0.36, 1]` everywhere. `viewport: { once: true, amount: 0.16 }`.
- Hero uses `animate`, not `whileInView`, so it plays on load with a `0.35s`
  delay on the panel.
- Hover: `150ms ease` on transform, border, background, colour, box-shadow.
- Ambient: `route-travel` (2.8s line sweep), `soft-pulse`, `marquee` (34s).
- `MotionConfig reducedMotion="user"` wraps the app, and CSS has a matching
  `prefers-reduced-motion: reduce` block that kills ambient animation, sets
  `scroll-behavior: auto`, and cancels the page-enter animation.
- Focus is a global `:focus-visible` outline: 2px gold, 3px offset.

### Accessibility decisions worth inheriting

- Skip link implemented but bound to the wrong target (`#main` instead of
  `#main`) — a defect to fix, not a pattern to copy.
- Every decorative element is `aria-hidden="true"`.
- Icon-only controls carry `aria-label`; toggles carry `aria-expanded`,
  `aria-pressed`, or `role="tab"` / `aria-selected` as appropriate.
- Live regions exist where content swaps (`aria-live="polite"` on the selected
  route, `role="tablist"` on the code language switch).
- Table markup with real `<thead>` / `<th scope>` and horizontal scroll on
  narrow screens.
- The project is honest about status: cards without a working connection stay
  `status: 'available'` with `—` metrics rather than fake numbers.

---

## Phase 2 — Design language decision

### Reuse (identical values, shared intent)

Accent ramp, neutral ramp, type scale, weight choices, mono-label primitive,
`eyebrow`, `hairline`, `gold-text`, `card`, `btn-gold` / `btn-ghost` / `btn-quiet`,
grid wash, glow wash, nav blur, glass, focus ring, reduced-motion contract,
easing curve, reveal timings, card hover glow, the card anatomy above.

### Adapt

| Area | Change |
| --- | --- |
| Nav | Section anchors instead of product deep links; a real dropdown for the product tree; company-level CTA |
| Hero | Company statement instead of a single product claim; a two-value line instead of one gold phrase |
| Cards | Added status pill, area chip, and optional repository link. Hero card spans two columns |
| Ecosystem | New artefact type — a layered flow diagram, not a provider list |
| Footer | Full product column, resources, company, legal |
| Section band | Alternating bands retained, but the rhythm is longer because there are more sections |

### Hilbras-specific

Product data model, area taxonomy, layered ecosystem diagram, audience
sections, philosophy principles, the vision ladder, the company-level CTA, and
the two-token theme persistence under a Hilbras-specific storage key.

### Naming

Token names stay identical to the reference (`--gold`, `--line`, `--bg`) rather
than being renamed. Same values plus same names means the two products read as
one family in code review, and the accent stays gold because it is the Hilbras
brand, not an OmniHilbras choice.

---

## Recommended implementation approach

1. Scaffold a single-page Vite + React + TypeScript app matching the reference
   toolchain, with no router and no test-runner dependency.
2. Put the full token set and the component layer in one `index.css`, matching
   how the reference keeps them, so there is a single source of truth.
3. Drive every product, area, audience, principle, and navigation entry from
   `src/data/`. Adding a product is a data edit.
4. Build reusable `ui/` primitives once — card, section, section header, product
   mark, status pill, reveal — and have all sections consume them.
5. Wire the product data into JSON-LD structured data at the page level.
6. Verify with `pnpm typecheck`, `pnpm lint`, `pnpm build`, plus a rendered
   inspection at 1440, 1280, 834, and 390 CSS pixels.

---

## What the implementation actually did with that

The plan above was the starting position. Five things changed once the page was
rendered and measured, and all five are worth recording because each is a case
where the reference is the right answer for *looks* and the wrong answer for
*implementation*.

### The reference's animation library was replaced, not inherited

`motion` was used for three things: scroll reveals, two navbar disclosures, and
one icon swap. All three are CSS transitions or a single
`IntersectionObserver`. The reference's own motion tokens — `0.09s` stagger,
`0.58s` duration, `cubic-bezier(0.22, 1, 0.36, 1)`, `viewport amount 0.16` —
were carried over exactly, so the motion is visually identical. The bundle went
from 127 kB to 85.5 kB gzipped and one dependency disappeared.

It also made the page more correct. The reference hides content until
JavaScript reveals it, which means the page is blank without JS and for anyone
whose observer never fires. Here the hidden state lives inside a
`@media (prefers-reduced-motion: no-preference)` block gated on an `html.has-js`
class: a reduced-motion visitor and a visitor without JavaScript both get the
finished page, immediately, with no extra code path to get wrong.

### Four colours were adjusted for contrast, and the accent stayed gold

The gold ramp, the neutral ramp, and every spacing and type value are the
reference's. Four token values were not, because the reference's own values fail
WCAG on this page. Each is a one-line change with a comment at the definition.

| Token | Reference | Here | Measured |
| --- | --- | --- | --- |
| `--gold-ink` (light) | `#ffffff` | `#1c1704` | 2.1:1 → 8.5:1 on the gold button |
| `--gold-text` (light) | `#8a6d12` | `#7d620f` | 4.3:1 → 5.0:1 on the eyebrow tint |
| `--success` (light) | `#177d47` | `#0f5c38` | 4.1:1 → 6.5:1 on the status tint |
| `:focus-visible` | `--gold` | `--gold-text` | 2.1:1 → 5.5:1 against the page |

`--gold-mid` is new: the display gradient needed a mid stop that clears 3:1 as
large text, and `--gold-bright` did not.

### Product identity stopped being a font dependency

The first pass used Unicode geometric shapes as product marks. They rendered, but
they were drawn by whatever system font owned the codepoint, so the same product
looked different per platform and one glyph read as noise at 16 px. All eleven
marks are now inline SVG on one 24-unit grid, inheriting the gold token. Product
identity is a geometric mark, not a character.

### The reference's known defect was not copied

OmniHilbras's skip link points at `#main` from an element already bound to
`#main`, so activating it moves the scroll position without moving focus — a
keyboard user's next Tab still starts in the header. `<main>` here carries
`tabindex="-1"`, and the link is verified to move focus.

### Product data came from the organisation, not from memory

The eight public repositories under `github.com/Hilbras` were read directly and
the descriptions and links on the cards are taken from them. Three products —
Hilbras Gateway, Hilbras OS, and HilGit — have no public repository and no
deployed site, and their cards say "No public release yet" rather than linking
somewhere that does not exist.

---

## Follow-on verification

`docs/VERIFICATION.md` records what was measured on the current build — the
Content Security Policy, responsive behaviour, contrast, keyboard navigation, the
particle-canvas finding, and the tests — with the commands that reproduce each
number and a list of what could not be checked.
