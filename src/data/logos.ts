/**
 * The project's own brand mark, where the project ships one. Rendered from
 * `public/logos/` so the card and the product page show the product's actual
 * identity rather than the data layer's geometric stand-in.
 *
 * The four marks the projects ship here were copied into `public/logos/` from
 * each project's own tree. `markSource` records where each one came from, so a
 * mark that drifts in the upstream repo is a copy that can be re-pulled, not a
 * silent redraw.
 */

export type BrandLogo = {
  /** The committed SVG under `public/logos/`. */
  file: string;
  /** The upstream path the SVG was read from. */
  source: string;
};

const logos: Record<string, BrandLogo> = {
  omnicloud: {
    file: "/logos/omnicloud.svg",
    source: "OmniCloud/brand/logo-mark.svg",
  },
  omnicode: {
    file: "/logos/omnicode.svg",
    source: "OmniCode-V/public/icon.svg",
  },
  omnihilbras: {
    file: "/logos/omnihilbras.svg",
    source: "OmniHilbras/brand/logo-mark.svg",
  },
  omninode: {
    file: "/logos/omninode.svg",
    source: "OmniNode/assets/logo.svg",
  },
  studio: {
    file: "/logos/studio.svg",
    source: "Studio/apps/site/public/brand-mark.svg",
  },
  hilyfy: {
    file: "/logos/hilbras-hilyfy.svg",
    source: "Hilyfy/apps/desktop/public/logo.svg",
  },
};

/** True when the product ships its own mark rather than the geometric one. */
export function hasBrandLogo(id: string): boolean {
  return Boolean(logos[id]);
}

/** The committed SVG path for a product, or null to fall back to the geometric mark. */
export function brandLogoFor(id: string): BrandLogo | null {
  return logos[id] ?? null;
}
