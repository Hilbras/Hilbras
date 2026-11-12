import { areas, products } from "@/data/areas";
import { connectionStages, type StageId } from "@/data/stages";
import { Mark } from "@/components/ui/Mark";
import { ProductLink } from "@/components/ui/ProductLink";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";

type Stage = (typeof connectionStages)[number];

function productsInStage(stageId: StageId) {
  return products.filter((product) => product.stage === stageId);
}

function StageNodes({ stageId }: { stageId: StageId }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {productsInStage(stageId).map((product) => {
        const area = areas.find((entry) => entry.id === product.area);
        return (
          <li key={product.id} className="min-w-0">
            <ProductLink product={product} className="node flex h-full flex-col gap-1.5 px-3 py-3">
              <span className="flex items-center gap-2">
                <Mark id={product.mark} className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate text-13 font-medium">{product.name}</span>
              </span>
              <span className="muted truncate text-2xs">{area ? area.short : "Hilbras"}</span>
            </ProductLink>
          </li>
        );
      })}
    </ul>
  );
}

function StageBand({ stage, index }: { stage: Stage; index: number }) {
  return (
    <div>
      {index > 0 ? (
        <div aria-hidden="true" className="grid grid-cols-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
          <span className="flow-line hidden h-8 w-px sm:block" />
          <span className="flex items-center gap-3 sm:pl-4">
            <span className="flow-travel h-1.5 w-1.5 rounded-full bg-gold" />
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
        <div>
          <p className="mono-label">
            <span className="mr-2 text-gold-text">{String(index + 1).padStart(2, "0")}</span>
            {stage.label}
          </p>
          <p className="muted mt-2 text-xs leading-relaxed">{stage.note}</p>
        </div>
        <StageNodes stageId={stage.id} />
      </div>
    </div>
  );
}

export function ConnectionMap() {
  return (
    <Section id="connect" band>
      <SectionHeader
        id="connect-heading"
        eyebrow="How everything connects"
        title="Independent by default. Stronger by choice."
        lede="Read this as an ordering of the work, not a set of dependencies. Every box is useful on its own. Connecting two of them is where the extra value appears."
      />

      <div className="stagger mt-12">
        {connectionStages.map((stage, index) => (
          <Reveal key={stage.id}>
            <StageBand stage={stage} index={index} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-gold/25 bg-gold-soft/60 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <p className="text-sm font-semibold">A connected product is still a standalone product.</p>
        <p className="muted max-w-md text-xs leading-relaxed">
          If you only ever install one thing from this list, the diagram still holds. It is a map of where
          value can be added, not a list of things you are required to install.
        </p>
      </Reveal>
    </Section>
  );
}
