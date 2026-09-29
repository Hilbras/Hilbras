import type { MarkId } from '../components/ui/Mark';

/**
 * The taxonomy the whole site is built on.
 *
 * `id` is the stable key used by anchors, the flow diagram, and JSON-LD. Adding an
 * area or a product is a data edit — no component changes required.
 *
 * Repository URLs are the public repositories under github.com/Hilbras. A product
 * with no repository and no site says so on its card rather than linking nowhere.
 */

export type AreaId =
  | 'ai'
  | 'developer-infrastructure'
  | 'platforms'
  | 'social'
  | 'computing'
  | 'security';

export type Area = {
  id: AreaId;
  name: string;
  /** The mark used wherever the area itself is the subject. */
  mark: MarkId;
  /** Short form for chips and diagram nodes. */
  short: string;
  summary: string;
  detail: string;
  /** The product ids this area owns, in reading order. */
  products: readonly string[];
};

export type ProductStatus = 'stable' | 'beta' | 'alpha' | 'building';

export type Product = {
  id: string;
  name: string;
  area: AreaId;
  description: string;
  status: ProductStatus;
  /** A deployed, public product site. Omitted when there is none. */
  href?: string;
  /** The public repository. Omitted when the work is not public yet. */
  repository?: string;
  /** The geometric mark the card renders. */
  mark: MarkId;
  featured?: boolean;
};

export const areas: readonly Area[] = [
  {
    id: 'ai',
    mark: 'portal',
    name: 'AI Infrastructure',
    short: 'AI',
    summary: 'Model access, routing, memory, and runtime control.',
    detail:
      'The layer between an application and a model. Execution engines, unified gateways, routing policy, and durable memory for assistants that have to keep working after a context window ends.',
    products: ['sdk', 'gateway', 'omnihilbras', 'remembera'],
  },
  {
    id: 'developer-infrastructure',
    mark: 'keystone',
    name: 'Developer Infrastructure',
    short: 'Developers',
    summary: 'Identity, authoring environments, and code collaboration.',
    detail:
      'The parts every product needs and no product should reinvent. Authentication and authorization, focused coding environments, and the places where code gets written and reviewed together.',
    products: ['keystone', 'code', 'hilgit'],
  },
  {
    id: 'platforms',
    mark: 'panel',
    name: 'Platforms',
    short: 'Platforms',
    summary: 'Application runtimes, content systems, and automation.',
    detail:
      'Extensible platforms for building and operating real products. A content and application runtime, and a runtime that plans and carries out work across the accounts a team already owns.',
    products: ['hilpress', 'studio'],
  },
  {
    id: 'social',
    mark: 'branches',
    name: 'Social Technology',
    short: 'Social',
    summary: 'Publishing, communities, and developer-first networks.',
    detail:
      'Where Hilbras software meets other people. Distribution, collaboration, and community infrastructure built for the people shipping the technology rather than for engagement metrics.',
    products: ['hilgit', 'studio', 'hilpress'],
  },
  {
    id: 'computing',
    mark: 'desktop',
    name: 'Computing',
    short: 'Computing',
    summary: 'Operating systems, desktop environments, native apps.',
    detail:
      'The environment everything else runs in. A desktop operating system, its shell and system services, and the native applications that make it a place to work rather than a launcher for a browser.',
    products: ['os', 'code'],
  },
  {
    id: 'security',
    mark: 'shield',
    name: 'Security',
    short: 'Security',
    summary: 'Analysis, testing, and inspection tooling.',
    detail:
      'Software that finds out what is wrong with software. Target management, discovery, scanning, verification, and reporting — for authorised testing and internal review.',
    products: ['spectra', 'keystone'],
  },
] as const;

export const products: readonly Product[] = [
  {
    id: 'sdk',
    name: 'Hilbras SDK',
    area: 'ai',
    description:
      'A provider-agnostic LLM client SDK for TypeScript. Streaming, tool calling, structured output, circuit breaker, retry, and cost enforcement across OpenAI, Anthropic, Gemini, Azure, Groq, and Ollama — with zero runtime dependencies.',
    status: 'stable',
    mark: 'diamond',
    featured: true,
    repository: 'https://github.com/Hilbras/Hilbras-ai-sdk',
  },
  {
    id: 'remembera',
    name: 'Hilbras Remembera',
    area: 'ai',
    description:
      'External memory for AI assistants. Facts, decisions, roles, and history live outside the context window, and only the authorised, relevant subset comes back. Speaks MCP, HTTP, and TypeScript.',
    status: 'stable',
    mark: 'memory',
    featured: true,
    repository: 'https://github.com/Hilbras/Remembra',
  },
  {
    id: 'keystone',
    name: 'Hilbras Keystone',
    area: 'developer-infrastructure',
    description:
      'An API-first identity and authentication platform. OIDC and OAuth 2.0, a JWT token authority, RBAC and ABAC, WebAuthn passkeys, a federation broker, and an immutable audit log.',
    status: 'stable',
    mark: 'keystone',
    featured: true,
    repository: 'https://github.com/Hilbras/Keystone',
  },
  {
    id: 'hilpress',
    name: 'HilPress',
    area: 'platforms',
    description:
      'An extensible application and content runtime. Users, roles, content, revisions, taxonomy, media, and a plugin system with manifests, lifecycle hooks, and permissions.',
    status: 'alpha',
    mark: 'panel',
    repository: 'https://github.com/Hilbras/HilPress',
  },
  {
    id: 'studio',
    name: 'Hilbras Studio',
    area: 'platforms',
    description:
      'A goal-driven AI runtime. Give it a goal; it plans the work, schedules it, and publishes across X, Instagram, Facebook, Threads, and Telegram — pausing where a person has to approve.',
    status: 'beta',
    mark: 'target',
    href: 'https://hilbras-studio.vercel.app',
    repository: 'https://github.com/Hilbras/Hilbras-Studio',
  },
  {
    id: 'gateway',
    name: 'Hilbras Gateway',
    area: 'ai',
    description:
      'A single edge in front of every model provider. One endpoint, one key, and one place to decide where a request is allowed to run.',
    status: 'building',
    mark: 'portal',
  },
  {
    id: 'omnihilbras',
    name: 'OmniHilbras',
    area: 'ai',
    description:
      'Routing and provider management. Health checks, retries, and fallbacks decide which model serves a request, the local gateway keeps your keys on your own machine, and every decision stays readable afterwards.',
    status: 'beta',
    mark: 'prism',
    featured: true,
    repository: 'https://github.com/Hilbras/OmniHilbras',
  },
  {
    id: 'os',
    name: 'Hilbras OS',
    area: 'computing',
    description:
      'A desktop operating system with its own shell, dock, workspaces, and system services — an environment for Hilbras software rather than a rebrand of the base system.',
    status: 'building',
    mark: 'desktop',
  },
  {
    id: 'code',
    name: 'Hilbras Code',
    area: 'developer-infrastructure',
    description:
      'A coding agent with one core and four surfaces — web, desktop, CLI, and editor. A streaming agent loop, filesystem and shell tools, and a permission layer that fails closed.',
    status: 'alpha',
    mark: 'terminal',
    repository: 'https://github.com/Hilbras/Hilbras-code',
  },
  {
    id: 'hilgit',
    name: 'HilGit',
    area: 'social',
    description:
      'Code collaboration and a working community around it. Review, discussion, and the shared record of what a project is and why it looks the way it does.',
    status: 'building',
    mark: 'branches',
  },
  {
    id: 'spectra',
    name: 'Hilbras Spectra',
    area: 'security',
    description:
      'A modular, extensible security testing and analysis platform — a 21-crate Rust workspace covering target management, discovery, fingerprinting, scanning, verification, and reporting.',
    status: 'beta',
    mark: 'shield',
    repository: 'https://github.com/Hilbras/Spectra',
  },
] as const;

export const areaById = new Map(areas.map((area) => [area.id, area]));

export const productById = new Map(products.map((product) => [product.id, product]));

export function productsInArea(areaId: AreaId): readonly Product[] {
  const area = areaById.get(areaId);
  if (!area) return [];
  return area.products.map((id) => productById.get(id)).filter((product): product is Product => Boolean(product));
}

export const statusLabels: Record<ProductStatus, string> = {
  stable: 'Stable',
  beta: 'Beta',
  alpha: 'Alpha',
  building: 'In development',
};
