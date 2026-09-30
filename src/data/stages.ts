/**
 * The bands of the connection map, ordered least to most foundational.
 *
 * This used to be a `stages` array in `src/components/ConnectionMap.tsx` holding
 * the label, the note **and a hardcoded list of product ids**. That list was a
 * second copy of knowledge the product records already carried, kept in a
 * component, and nothing connected the two: a product added to `products` and to
 * its area simply did not appear in the diagram. The component test caught it —
 * but a test that catches the symptom is not the same as not having the defect,
 * and "adding a product is a data edit" was false while that array existed.
 *
 * So the bands live here, and a product declares which band it is in with a
 * `stage:` field, the same way it already declares its `area:`. The map renders
 * the bands in this order with whatever products claim them. There is no second
 * list to fall out of step.
 *
 * The bands are an *ordering of the work*, not dependencies. `docs/DEPENDENCIES.md`
 * records the audit behind that: no Hilbras product depends on any other, so a
 * drawn line between two boxes here would assert something the manifests
 * contradict.
 */

export const connectionStages = [
  {
    id: 'foundation',
    label: 'Foundation',
    note: 'Identity, access, and the audit trail everything else assumes.',
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    note: 'Reaching models, controlling the route, and keeping what matters.',
  },
  {
    id: 'application',
    label: 'Application',
    note: 'Runtimes, automation, authoring, and collaboration.',
  },
  {
    id: 'environment',
    label: 'Environment',
    note: 'The computing surface, and the tooling that inspects it.',
  },
] as const;

export type StageId = (typeof connectionStages)[number]['id'];

export const stageIds = connectionStages.map((stage) => stage.id) as readonly StageId[];

export const stageById = new Map(connectionStages.map((stage) => [stage.id, stage]));
