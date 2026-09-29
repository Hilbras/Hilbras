# Product dependency audit

The roadmap asked for connection semantics that distinguish *can integrate with*
from *requires* — `integrates_with`, `optional_dependency`, `dependency`,
`compatible_with`. Before building that, it is worth knowing whether there is
anything for it to encode.

**There is not.** This is the audit, and its result.

## What was checked

Every `package.json` and `Cargo.toml` in the `github.com/Hilbras` organisation,
read from the repositories on 2026-09-30, plus the npm registry for what is
actually published.

| Repository | Package | Version | Published |
| --- | --- | --- | --- |
| `Hilbras-ai-sdk` | `@hilbras/sdk` | 3.2.0 | yes — 40 versions, MIT |
| `Keystone` | `@hilbras/keystone` | 3.5.3 | yes — 18 versions, MIT |
| `Remembra` | `@hilbras/remembra` | 5.6.0 | yes — 33 versions, MIT |
| `OmniHilbras` | `@hilbras/omnihilbras` | 1.30.0 | yes — 71 versions, MIT |
| `Hilbras-code` | `hilbras-code` | 0.1.0 | yes — 1 version, MIT |
| `Hilbras-Studio` | `hilbras-studio` | 0.10.0 | no — `private: true` |
| `Hilbras-OS` | `hilbras` | 1.0.0 | no — `private: true` |
| `HilPress` | — | — | no `package.json` |
| `Spectra` | Rust workspace | 0.1.1 | Cargo only |
| `Hilbras-Gateway`, `HilGit` | — | — | no public repository |

## Cross-references between products

**One, and it is not a product.**

```text
Hilbras-OS  →  @hilbras/adapters   (workspace:^, internal to the OS repository)
```

No other product references any other product in any manifest, in any dependency
kind — not `dependencies`, `devDependencies`, `peerDependencies` or
`optionalDependencies`. No repository has a `pnpm-workspace.yaml` linking the
products together. Five separate repositories, five separate package trees, no
shared workspace, no cross-imports.

`OmniHilbras` is the one apparent exception and is not: its repository root is
`omnihilbras-site`, which depends on `@hilbras/omnihilbras` at `workspace:*`. That
is the site consuming the library that is published from elsewhere, not one
product depending on another.

## What this means for the connection map

The current map says **"Independent by default. Stronger by choice."** and the
lede says *"Read this as an ordering of the work, not a set of dependencies."*

That is not a hedge. It is exactly what the code says. The products do not
depend on one another, so a diagram implying they do would be wrong, and the site
says so rather than implying otherwise.

## What was not built, and why

A relationship model — `integrates_with`, `optional_dependency`, `dependency` —
with data behind it. Adding it would have meant writing relationship claims for
eleven products that the manifests do not support. A connection map is one of the
places where a plausible-looking diagram is worse than none, because a reader
takes a drawn line as a fact.

If the products do start depending on one another, the data is in the manifests
and this audit becomes a one-line addition per relationship. The `Product` type
has no relationship field today because nothing reads one.

## The finding that did produce something

Five products are published to npm, all MIT, and their install commands are in
their own READMEs. That is real developer-facing content, so it is now in the
product data as `developer: { package, version, install, license, verified }` and
rendered as an **Install it** section on the product page — omitted entirely for
the six that are not published, rather than shown empty.

It also means `softwareVersion` is now used correctly. It previously carried a
status sentence, which was a misuse of the property, and had been removed. With a
real version available it is emitted for the five published products, alongside
the SPDX licence identifier.

### One thing worth following up

The `Hilbras-ai-sdk` README instructs `npm install @hilbras/react`, and
`@hilbras/react` **is not published to npm**. Either it is unreleased, renamed, or
the README is wrong. That is a repository question rather than a website one, and
this audit does not assume which.
