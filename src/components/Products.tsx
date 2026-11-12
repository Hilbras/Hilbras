import { products } from "@/data/areas";
import { counts, sentence, spell } from "@/data/site";
import { ProductGrid } from "@/components/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";

export function Products() {
  return (
    <Section id="products">
      <SectionHeader
        id="products-heading"
        eyebrow="The products"
        title="What exists today, and what is still being built."
        lede={
          `${sentence(counts.products)} projects, at whatever stage each has reached. ` +
          `${spell(counts.public)} of them are public today, with a repository or a live site ` +
          "you can go and read."
        }
      />

      <div className="mt-10">
        <ProductGrid items={products} columns={3} />
      </div>

      <Reveal className="muted mt-8 text-center text-sm">
        The rest are listed because they are part of the plan, not because they are finished.
      </Reveal>
    </Section>
  );
}
