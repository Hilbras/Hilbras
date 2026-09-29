import { products } from '../data/areas';
import { FeaturedProductCard, ProductGrid } from './ProductCard';
import { Reveal } from './ui/Reveal';
import { Section, SectionHeader } from './ui/Section';

const featured = products.filter((product) => product.featured);
const rest = products.filter((product) => !product.featured);

/** Derived, so the sentence can never disagree with the data. */
const publicCount = products.filter((product) => product.repository || product.href).length;

export function Products() {
  return (
    <Section id="products">
      <SectionHeader
        id="products-heading"
        eyebrow="Featured products"
        title="What exists today, and what is still being built."
        lede="Four products lead the ecosystem today. The rest are earlier — and most of them already have a public repository, so you can follow the shape of the company as it grows."
      />

      {featured.length > 0 ? (
        <div className="stagger mt-10 grid gap-4 lg:grid-cols-2">
          {featured.map((product) => (
            <FeaturedProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="mt-10">
          <h3 className="mono-label">Also in the ecosystem</h3>
          <div className="mt-4">
            <ProductGrid items={rest} columns={4} />
          </div>
        </div>
      ) : null}

      <Reveal className="muted mt-8 text-center text-sm">
        {publicCount} of the {products.length} projects are public today. The rest are listed because they
        are part of the plan, not because they are finished.
      </Reveal>
    </Section>
  );
}
