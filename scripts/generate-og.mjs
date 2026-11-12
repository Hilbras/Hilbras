/**
 * Generates the per-product Open Graph images (1200x630 PNGs) into
 * `public/og/<id>.png`. Each image is the brand's dark canvas carrying the
 * product's own logo, its name, and a one-line keyword summary, so a share
 * link shows which product it is rather than the generic company card.
 *
 * The logos are the project's own SVG marks (copied into `public/logos/`),
 * rasterised through `sharp` at 2x and composited onto a canvas. The text is
 * drawn with a system sans stack because the self-hosted Geist woff2 cannot be
 * loaded into `sharp`'s SVG renderer without a separate font pipeline; at the
 * 1200x630 scale a clean sans reads fine and stays dependency-free.
 *
 * Run with `pnpm og`. The output is committed so the build does not depend on
 * regenerating it.
 */
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;

const BG = "#0c0b09";
const GOLD = "#e2bd52";
const TEXT = "#f2efe6";
const MUTED = "#9c9584";
const LINE = "#262117";

const root = path.resolve(import.meta.dirname, "..");

const products = [
  { id: "sdk", name: "Hilbras SDK", line: "Provider-agnostic LLM client SDK for TypeScript" },
  { id: "remembera", name: "Hilbras Remembera", line: "External memory for AI assistants" },
  { id: "keystone", name: "Hilbras Keystone", line: "API-first identity and authentication platform" },
  { id: "omnihilbras", name: "OmniHilbras", line: "One local endpoint for every model provider" },
  { id: "omninode", name: "OmniNode", line: "Multi-AI orchestration platform" },
  { id: "omnicode", name: "OmniCode", line: "Agentic coding CLI with a pluggable kernel" },
  { id: "omnicloud", name: "OmniCloud", line: "Self-hosted cloud storage on your Telegram account" },
];

function svg({ name, line, logo, hasLogo }) {
  // The logo, when present, is inlined as a rasterised image placeholder by the
  // caller; here it is a 96-unit box in the upper-left content column.
  const logoBox = hasLogo
    ? `<image x="120" y="150" width="96" height="96" href="${logo}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="120" y="150" width="96" height="96" rx="24" fill="${GOLD}" opacity="0.15"/>
       <circle cx="168" cy="198" r="34" fill="none" stroke="${GOLD}" stroke-width="4"/>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="${LINE}" stroke-width="2"/>

  <!-- top rule + wordmark -->
  <text x="120" y="96" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${GOLD}" letter-spacing="6">HILBRAS</text>
  <line x1="120" y1="118" x2="1080" y2="118" stroke="${LINE}" stroke-width="2"/>

  ${logoBox}

  <text x="256" y="196" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="800" fill="${TEXT}">${escapeXml(name)}</text>
  <text x="256" y="244" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="${MUTED}">${escapeXml(line)}</text>

  <!-- footer -->
  <line x1="120" y1="512" x2="1080" y2="512" stroke="${LINE}" stroke-width="2"/>
  <text x="120" y="566" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="${GOLD}" letter-spacing="2">www.hilbras.com</text>
  <text x="1080" y="566" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="${MUTED}">Build. Connect. Create.</text>
</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function main() {
  const outDir = path.join(root, "public", "og");
  mkdirSync(outDir, { recursive: true });

  for (const product of products) {
    const logoPath = path.join(root, "public", "logos", `${product.id}.svg`);
    let hasLogo = false;
    let logoHref = "";
    if (logoPath && readFileSyncSafe(logoPath)) {
      hasLogo = true;
      // Rasterise the logo SVG to a PNG buffer and embed as a data URI so
      // `sharp` can composite it onto the canvas SVG in one pass.
      const logoPng = await sharp(readFileSync(logoPath), { density: 300 })
        .resize(384, 384, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      logoHref = `data:image/png;base64,${logoPng.toString("base64")}`;
    }

    const svgSource = svg({ name: product.name, line: product.line, logo: logoHref, hasLogo });
    const out = path.join(outDir, `${product.id}.png`);
    await sharp(Buffer.from(svgSource))
      .resize(WIDTH, HEIGHT)
      .png({ quality: 90 })
      .toFile(out);
    console.log(`✓ ${out}`);
  }

  console.log(`\n${products.length} OG images written to ${outDir}`);
}

function readFileSyncSafe(p) {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

main();
