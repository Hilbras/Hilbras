# Adding a product

The claim this site is built on is that **adding a product is a data edit**. One
record in the data layer reaches the grid, the navigation, the footer, the
connection map, the product page, the structured data, the sitemap, the 404
page, and the tests that check all of it.

That claim had never been tested by doing it. So it was: a twelfth product was
added, on a branch, and the gate run at every step. **It was false**, in two
places, and this guide is the corrected version of the process — including the
two things that had to be fixed before the claim became true.

## Before you start: what you need

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | lower-case kebab-case. It becomes `/products/<id>`, the JSON-LD `@id`, the sitemap entry and the 404 link. Permanent. |
| `name` | yes | unique. The display name, and the accessible name of every link to it. |
| `area` | yes | the area that **owns** it. This is what the index groups by. |
| `stage` | yes | the connection-map band. See below. |
| `mark` | yes | a mark of its own from `src/data/marks.ts`. See below. |
| `kind` | yes | `library`, `service`, `platform`, `application` or `system`. Chooses the schema.org type. |
| `status` | yes | `building`, `alpha`, `beta` or `stable`. A `stable` product with no repository and no site is a build error. |
| `description` | yes | one or two sentences. The product card, and the page's meta description. |
| `summary` | yes | one line, for the navigation panel and the product list. Must not repeat the description. |
| `featured` | no | a wide card on the index. |
| `repository` | no | must be `https://github.com/Hilbras/<repo>`. |
| `href` | no | its own deployed site, if it has one. |
| `documentation` | no | published docs, if separate from the repository. |
| `platform` | no | only when specific. Never "Cross-platform". |
| `developer` | no | `package`, `version`, `install`, `license`, `verified` — only if published to a registry. |

## The steps

### 1. Add the record to `products` in `src/data/areas.ts`

```ts
  {
    id: 'widgetry',
    name: 'Hilbras Widgetry',
    area: 'security',
    stage: 'environment',
    description: 'A modular, extensible security testing and analysis platform.',
    summary: 'A modular security testing and analysis platform.',
    kind: 'service',
    status: 'beta',
    mark: 'orbit',
    repository: 'https://github.com/Hilbras/Widgetry',
  },
```

### 2. Add it to the `products` array of the area that owns it

```ts
    products: ['spectra', 'keystone', 'widgetry'],
```

This is a second edit in the same file, and it is not optional: the navigation
panel and the index read products through their area, not through the flat list.
A product in an area's array **and** in `products` is the normal state — most
products appear in two or three areas.

A product in `products` but in no area is a build error (`orphan-product`), and
an area naming a product that does not exist is one too (`dangling-area-reference`).

### 3. Add a mark to `src/data/marks.ts` — only if nobody has drawn yours

Eleven products, eleven marks, one each: a shared mark claims two products are
the same thing, and `duplicate-product-mark` rejects it.

```ts
  // A point on an orbital track.
  orbit: [
    { shape: 'circle', cx: 12, cy: 12, r: 4 },
    { shape: 'path', d: 'M20.5 12c0 2.6-3.8 4.75-8.5 4.75S3.5 14.6 3.5 12 7.3 7.25 12 7.25 20.5 9.4 20.5 12Z' },
  ],
```

Every shape sits on the same 24-unit grid with a 1.4 stroke and round caps, so
any mark aligns beside any other. Three shape kinds: `path` (a `d` string),
`circle` (`cx`, `cy`, `r`) and `rect` (`x`, `y`, `width`, `height`, optional
`rx`).

Marks must be drawn, not guessed at. `unused-mark` warns when the table holds a
mark no product uses, so the table cannot quietly accumulate spares.

### 4. Choose a band with `stage`

The connection map's four bands are data, in `src/data/stages.ts`, ordered least
to most foundational: `foundation`, `intelligence`, `application`, `environment`.

The map derives its nodes from each product's `stage`, so **there is no list to
update** — a product with a `stage` appears in the diagram, and one without is a
build error (`invalid-stage-reference`). `empty-stage` warns if a band has no
product and would render empty.

### 5. Add registry metadata, if it is published

```ts
    developer: {
      package: '@hilbras/widgetry',
      version: '1.0.0',
      install: 'npm install @hilbras/widgetry',
      license: 'MIT',
      verified: '2026-09-30',
    },
```

Every field is validated: a real npm package name, a semantic version, an
install command that actually mentions the named package, an SPDX identifier,
and a real ISO date. `verified` is not ceremony — a registry version goes out of
date, and the page shows the date it was read so a reader can judge it.

Omit the whole block if the product is not on a registry. The **Install it**
section is then absent rather than empty, and `softwareVersion` and `license` are
omitted from the structured data rather than guessed at.

### 6. Run the gate

```console
$ pnpm check
      Tests  124 passed (124)
  12/12 cases caught
prerender: 14 routes + a 404, 324.9 kB of markup
build output: ok — 117.0 kB document, 21 articles, 1 JSON-LD block
smoke: passed
```

Thirteen routes become fourteen. The build output, the sitemap entry, the JSON-LD
node and the 404 page's product list all pick it up with nothing else written.

### 7. Confirm in a browser

```bash
npx playwright test --project=chromium
```

No test needs editing. The browser suite reads the registry, so "lists every
product exactly once" asserts set equality between the page and the data — it
fails both when a product is missing from the page and when the page shows an
entry that is not a product.

## What you should not have to touch

Nothing under `src/components/`. Nothing in `src/pages/`. Nothing in
`scripts/`. The browser suite reads the product registry rather than keeping its
own copy of it, so it cannot go stale.

## What the experiment found

Adding the twelfth product initially failed, and the failures are the reason this
guide is different from the obvious version.

**1. A new mark required editing a component.** `MarkId` was a union of eleven
literals declared in `src/components/ui/Mark.tsx`, beside the JSX that drew them
— so `src/data/areas.ts` had to `import type { MarkId } from
'../components/ui/Mark'`. The data layer was in a component's dependency graph,
and the compiler rejected a product naming a mark nobody had drawn. Marks are
data, so they moved to `src/data/marks.ts`; `Mark` is now a renderer, and
`MarkId` is `keyof typeof marks`, which widens automatically.

**2. The connection map silently dropped new products.** `ConnectionMap.tsx`
held a `stages` array with the label, the note and a hardcoded list of product
ids. A twelfth product simply did not appear — no error, no warning, no type
failure, just a missing tile on the diagram. Only a component test noticed, and
a test that catches a symptom is not the same as not having the defect. The
bands moved to `src/data/stages.ts` and each product now declares its `stage`, so
the map has no second copy of the truth.

**3. Three browser tests had a hardcoded `11`.** Including an eleven-row list of
product slugs and names beside the suite. All of them now read the registry, and
assert completeness rather than a number that has to be remembered.

A fourth defect was mine rather than the code's: the new `invalid-stage-reference`
check was written inside the `if (!areas.some(...))` block, so it only ran when
the area was *also* broken, and the self-test caught it reporting "data layer
consistent" on a product in a band that does not exist. Three of the twelve
self-test cases failed until it was fixed — which is the argument for having a
self-test at all.

## The self-test

`scripts/verify-validator.mjs` takes the real data, breaks one rule at a time,
and asserts the build fails with the expected code. Twelve cases, all passing.

Three of them — an unknown mark, an unknown band, two products sharing a mark —
are reachable **only** because `build:server` is esbuild and does no type
checking. `tsc` catches those mistakes during `pnpm typecheck`, but the deploy
build is `build:client && build:server`, so a cast would sail through it. Those
cases mutate the data with an `as` cast for exactly that reason, and the
validator catches what the compiler was asked to ignore.

```console
$ node scripts/verify-validator.mjs
  12/12 cases caught
```

If you add a rule to `validation.ts`, add a case here. A validator nobody has
seen reject anything is a validator nobody trusts.
