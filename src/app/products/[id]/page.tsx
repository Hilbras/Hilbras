import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { areaById, productById } from "@/data/areas";
import { buildGraph, buildProductPageNodes } from "@/data/structuredData";
import { isExternalHref, externalRel, site } from "@/data/site";
import { brandLogoFor } from "@/data/logos";
import { GitHubMark } from "@/components/ui/GitHubMark";
import { Mark } from "@/components/ui/Mark";
import { ProductMark } from "@/components/ui/ProductMark";
import { StatusPill } from "@/components/ui/StatusPill";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { AssuranceRow } from "@/components/ui/AssuranceRow";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return [...productById.keys()].map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = productById.get(id);
  if (!product) return {};

  const description = product.page?.metaDescription ?? product.summary;
  const ogImage = `/og/${id}.png`;

  return {
    /**
     * `title` here is the value the root layout's `template: "%s — Hilbras"`
     * wraps. Passing the bare product name keeps the company suffix in exactly
     * one place; repeating it per page is how a rename became a find-and-replace
     * across eight files the first time around.
     */
    title: product.name,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: {
      type: "website",
      title: `${product.name} — ${site.name}`,
      description,
      url: `/products/${id}`,
      siteName: site.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${product.name} — a Hilbras product` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${site.name}`,
      description,
      creator: site.socialHandle,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = productById.get(id);
  if (!product) notFound();

  const area = areaById.get(product.area);
  const schemaOrg = buildGraph(site.domain).find((node) => node["@id"] === `${site.domain}/#product-${id}`);
  const pageNodes = buildProductPageNodes(product, site.domain);

  return (
    <>
      <ProductHeader product={product} area={area} />
      <ProductCapabilities product={product} />
      <ProductInstall product={product} />
      <ProductLinks product={product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            { "@context": "https://schema.org", "@graph": [schemaOrg, ...pageNodes] },
          ).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}

function ProductHeader({
  product,
  area,
}: {
  product: import("@/data/areas").Product;
  area: import("@/data/areas").Area | undefined;
}) {
  const logo = brandLogoFor(product.id);
  const logoUrl = logo?.file ?? null;

  return (
    <section id="product-intro" className="relative overflow-hidden border-b border-line/70">
      <div aria-hidden="true" className="bg-glow absolute inset-x-0 top-0 h-[420px] opacity-60" />
      <div aria-hidden="true" className="grid-wash absolute inset-x-0 top-0 h-[420px] opacity-30" />

      <div className="shell relative pb-14 pt-14 sm:pb-16 sm:pt-16">
        <Reveal className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gold/25 bg-gold-soft">
                {/* The project's own mark, loaded from public/logos/ so the page
                    shows the product's real identity rather than the geometric
                    stand-in. `unoptimized` keeps the original viewBox without
                    the image-optimizer's re-encode. */}
                <Image
                  src={logoUrl}
                  alt={product.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </span>
            ) : (
              <ProductMark mark={product.mark} name={product.name} className="h-16 w-16" glyph="h-8 w-8" />
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display-title text-3xl sm:text-4xl">{product.name}</h1>
                <StatusPill status={product.status} />
              </div>
              {area ? (
                <p className="mono-label mt-1.5">{area.name}</p>
              ) : null}
            </div>
          </div>

          <Reveal className="muted mt-2 max-w-2xl text-base leading-relaxed sm:mt-0 sm:text-lg">
            {product.page?.tagline ?? product.summary}
          </Reveal>
        </Reveal>

        <Reveal className="mt-8">
          <p className="muted max-w-2xl text-sm leading-relaxed">{product.description}</p>
        </Reveal>

        <Reveal className="mt-8">
          <AssuranceRow
            labels={[
              "Independent by design",
              "Your infrastructure, your keys",
              "Open where it matters",
            ]}
          />
        </Reveal>
      </div>

      <div className="hairline" />
    </section>
  );
}

function ProductCapabilities({ product }: { product: import("@/data/areas").Product }) {
  const capabilities = product.positioning?.capabilities ?? [];
  const position = product.positioning?.position;

  return (
    <Section id="capabilities">
      <SectionHeader
        id="capabilities-heading"
        eyebrow="What it does"
        title="Capabilities"
        lede={position}
      />
      {capabilities.length > 0 ? (
        <ul className="stagger mt-10 grid gap-4 sm:grid-cols-2">
          {capabilities.map((capability) => (
            <li key={capability}>
              <Reveal variant="card" className="card group relative flex h-full gap-3 overflow-hidden p-5">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <p className="text-sm leading-relaxed">{capability}</p>
                <div className="card-glow" aria-hidden="true" />
              </Reveal>
            </li>
          ))}
        </ul>
      ) : (
        <Reveal className="muted mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed">
          The work on {product.name} is not public yet.
        </Reveal>
      )}
    </Section>
  );
}

function ProductInstall({ product }: { product: import("@/data/areas").Product }) {
  const dev = product.developer;
  if (!dev) {
    return (
      <Section id="install" band>
        <SectionHeader id="install-heading" eyebrow="Getting started" title="How to install it" />
        <Reveal className="muted mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed">
          {product.name} has no public release yet. The repository below is where the work is tracked.
        </Reveal>
      </Section>
    );
  }

  return (
    <Section id="install" band>
      <SectionHeader
        id="install-heading"
        eyebrow="Getting started"
        title="Install"
        lede={`Published as ${dev.package} under the ${dev.license} licence.`}
      />
      <Reveal className="card mx-auto mt-8 max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/40 px-4 py-2.5 sm:px-5">
          <span className="font-mono text-11 text-gold-text">$ terminal</span>
          <span className="font-mono text-2xs text-muted">verified {dev.verified}</span>
        </div>
        <div className="px-4 py-5 sm:px-5">
          <p className="font-mono text-sm sm:text-base">{dev.install}</p>
          <p className="muted mt-3 font-mono text-11">
            {dev.package} · v{dev.version} · {dev.license}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function ProductLinks({ product }: { product: import("@/data/areas").Product }) {
  const links: { label: string; href: string; icon?: "github" | "star" }[] = [];

  if (product.repository)
    links.push({ label: "Source", href: product.repository, icon: "github" });
  if (product.href) links.push({ label: "Visit site", href: product.href });
  const docs = product.page?.docs;
  if (docs?.npm) links.push({ label: "npm", href: docs.npm });
  if (docs?.demo) links.push({ label: "Live demo", href: docs.demo });
  if (docs?.site) links.push({ label: "Documentation", href: docs.site });
  if (docs?.changelog) links.push({ label: "Changelog", href: docs.changelog });

  return (
    <Section id="links">
      <SectionHeader id="links-heading" eyebrow="Where to go" title="Links" />
      <Reveal className="mx-auto mt-8 max-w-2xl">
        <ul className="card flex flex-col gap-1 overflow-hidden p-2">
          {links.map((link) => {
            const external = isExternalHref(link.href);
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="muted flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gold-soft hover:text-gold-text"
                  target={external ? "_blank" : undefined}
                  rel={externalRel(link.href)}
                >
                  {link.icon === "github" ? (
                    <GitHubMark className="h-4 w-4 shrink-0" />
                  ) : (
                    <Mark id={product.mark} className="h-4 w-4 shrink-0 text-gold" />
                  )}
                  <span className="font-medium">{link.label}</span>
                  <span className="muted truncate font-mono text-11">{link.href}</span>
                  {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </Section>
  );
}
