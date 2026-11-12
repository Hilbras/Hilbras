export const connectionStages = [
  {
    id: "foundation",
    label: "Foundation",
    note: "Identity, access, and the audit trail everything else assumes.",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    note: "Reaching models, controlling the route, and keeping what matters.",
  },
  {
    id: "application",
    label: "Application",
    note: "Runtimes, automation, authoring, and storage.",
  },
  {
    id: "environment",
    label: "Environment",
    note: "The tooling that inspects what the other bands produce.",
  },
] as const;

export type StageId = (typeof connectionStages)[number]["id"];

export const stageIds = connectionStages.map((stage) => stage.id) as readonly StageId[];

export const stageById = new Map(connectionStages.map((stage) => [stage.id, stage]));
