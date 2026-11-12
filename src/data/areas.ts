import type { MarkId } from "./marks";
import type { StageId } from "./stages";

export type AreaId =
  | "ai"
  | "developer-infrastructure"
  | "platforms"
  | "social"
  | "security";

export type Area = {
  id: AreaId;
  name: string;
  mark: MarkId;
  short: string;
  summary: string;
  detail: string;
  products: readonly string[];
};

export type ProductStatus = "stable" | "beta" | "alpha" | "building";

export type ProductKind = "library" | "service" | "platform" | "application" | "system";

export type Product = {
  id: string;
  name: string;
  area: AreaId;
  stage: StageId;
  description: string;
  summary: string;
  kind: ProductKind;
  status: ProductStatus;
  href?: string;
  repository?: string;
  documentation?: string;
  developer?: {
    package: string;
    version: string;
    install: string;
    license: string;
    verified: string;
  };
  platform?: string;
  mark: MarkId;
  positioning?: {
    position: string;
    capabilities: readonly string[];
  };
  /**
   * The content that fills out the product page.
   *
   * `tagline` is the short one-liner the page header carries, in the project's
   * own framing. `metaDescription` is the search-engine snippet: ~150
   * characters, keyword-bearing, written for a reader who has never seen the
   * product. The two differ on purpose — the tagline is a claim, the meta
   * description is an answer to "what is this and what does it do".
   * `docs` are the links worth surfacing on the page: the npm package,
   * the changelog, and a hosted documentation site, each an absolute URL the
   * page points at without guessing.
   */
  page?: {
    tagline?: string;
    metaDescription?: string;
    docs?: {
      npm?: string;
      changelog?: string;
      demo?: string;
      site?: string;
    };
  };
};

export const areas: readonly Area[] = [
  {
    id: "ai",
    mark: "portal",
    name: "AI Infrastructure",
    short: "AI",
    summary: "Model access, routing, memory, and runtime control.",
    detail:
      "The layer between an application and a model. Execution engines, unified gateways, routing policy, and durable memory for assistants that have to keep working after a context window ends.",
    products: ["sdk", "omnihilbras", "omninode", "remembera"],
  },
  {
    id: "developer-infrastructure",
    mark: "keystone",
    name: "Developer Infrastructure",
    short: "Developers",
    summary: "Identity, agentic coding tools, and integration.",
    detail:
      "The parts every product needs and no product should reinvent. Authentication and authorization, an agent that writes and runs code, and the connections out to the systems that code ships to.",
    products: ["keystone", "omnicode"],
  },
  {
    id: "platforms",
    mark: "panel",
    name: "Platforms",
    short: "Platforms",
    summary: "Application runtimes, content systems, storage, and automation.",
    detail:
      "Extensible platforms for building and operating real products. A content and application runtime, a runtime that plans and carries out work across the accounts a team already owns, and storage you host yourself.",
    products: ["omnicloud"],
  },
  {
    id: "social",
    mark: "target",
    name: "Social Technology",
    short: "Social",
    summary: "Publishing, distribution, and developer-first networks.",
    detail:
      "Where Hilbras software meets other people. Publishing and distribution built for the people shipping the technology rather than for engagement metrics.",
    products: ["studio", "hilpress"],
  },
] as const;

export const products: readonly Product[] = [
  {
    id: "sdk",
    name: "Hilbras SDK",
    area: "ai",
    stage: "intelligence",
    description:
      "A provider-agnostic LLM client SDK for TypeScript. Streaming, tool calling, structured output, circuit breaker, retry, and cost enforcement across OpenAI, Anthropic, Gemini, Azure, Groq, and Ollama — with zero runtime dependencies.",
    summary: "A provider-agnostic LLM client SDK for TypeScript.",
    kind: "library",
    status: "stable",
    documentation: "https://github.com/Hilbras/Hilbras-ai-sdk#readme",
    developer: {
      package: "@hilbras/sdk",
      version: "3.8.1",
      install: "npm install @hilbras/sdk",
      license: "MIT",
      verified: "2026-11-12",
    },
    mark: "diamond",
    repository: "https://github.com/Hilbras/Hilbras-ai-sdk",
    page: {
      tagline: "Provider-agnostic AI execution engine for TypeScript.",
      metaDescription:
        "Provider-agnostic LLM client SDK for TypeScript: streaming, tool calling, structured output, and cost controls across OpenAI, Anthropic, Gemini, Azure, Groq, and Ollama — zero runtime dependencies.",
      docs: {
        npm: "https://www.npmjs.com/package/@hilbras/sdk",
        changelog: "https://github.com/Hilbras/Hilbras-ai-sdk/blob/main/CHANGELOG.md",
      },
    },
    positioning: {
      position:
        "The provider-agnostic client every Hilbras AI product builds against: one interface over every provider, so a change of model is a configuration change rather than a rewrite.",
      capabilities: [
        "Streaming, tool calling, and structured output across OpenAI, Anthropic, Gemini, Azure, Groq, and Ollama",
        "Zero runtime dependencies: the client compiles into a bundle without pulling in a provider SDK of its own",
        "Circuit breaker, retry, and cost enforcement built in rather than bolted on",
      ],
    },
  },
  {
    id: "remembera",
    name: "Hilbras Remembera",
    area: "ai",
    stage: "intelligence",
    description:
      "External memory for AI assistants. Facts, decisions, roles, and history live outside the context window, and only the authorised, relevant subset comes back. Speaks MCP, HTTP, and TypeScript.",
    summary: "Durable memory for AI assistants, outside the context window.",
    kind: "service",
    status: "stable",
    documentation: "https://github.com/Hilbras/Remembra#readme",
    developer: {
      package: "@hilbras/remembra",
      version: "5.7.1",
      install: "npm install -g @hilbras/remembra",
      license: "MIT",
      verified: "2026-11-12",
    },
    mark: "memory",
    repository: "https://github.com/Hilbras/Remembra",
    page: {
      tagline: "External memory for AI assistants, outside the context window.",
      metaDescription:
        "External memory for AI assistants: store facts, decisions, roles, and history outside the context window with MCP, HTTP, and TypeScript clients, hybrid retrieval, and multi-tenant support.",
      docs: {
        npm: "https://www.npmjs.com/package/@hilbras/remembra",
        changelog: "https://github.com/Hilbras/Remembra/blob/main/CHANGELOG.md",
      },
    },
    positioning: {
      position:
        "The memory layer for assistants that have to keep working after a context window ends: facts, decisions, roles, and history that live outside the model and come back only when they are relevant and authorised.",
      capabilities: [
        "Stores facts, decisions, roles, and history outside the context window",
        "Returns only the authorised, relevant subset of stored material, not the whole store",
        "Speaks MCP, HTTP, and TypeScript, so it plugs into existing agent toolchains rather than replacing them",
      ],
    },
  },
  {
    id: "keystone",
    name: "Hilbras Keystone",
    area: "developer-infrastructure",
    stage: "foundation",
    description:
      "An API-first identity and authentication platform. OIDC and OAuth 2.0, a JWT token authority, RBAC and ABAC, WebAuthn passkeys, a federation broker, and an immutable audit log.",
    summary: "An API-first identity and authentication platform.",
    kind: "service",
    status: "stable",
    documentation: "https://github.com/Hilbras/Keystone#readme",
    developer: {
      package: "@hilbras/keystone",
      version: "4.0.1",
      install: "npm install -g @hilbras/keystone",
      license: "MIT",
      verified: "2026-11-12",
    },
    mark: "keystone",
    repository: "https://github.com/Hilbras/Keystone",
    page: {
      tagline: "Identity and authentication, API-first, built in Go.",
      metaDescription:
        "API-first identity and authentication platform: OIDC, OAuth 2.0, JWT and WebAuthn passkeys, RBAC/ABAC authorization, SAML SSO, SCIM provisioning, and an immutable audit log, built in Go.",
      docs: {
        changelog: "https://github.com/Hilbras/Keystone/blob/main/CHANGELOG.md",
      },
    },
    positioning: {
      position:
        "The identity layer every other Hilbras product assumes: one API-first authority for who is asking and what they are allowed to do, with a decision log that never gets rewritten.",
      capabilities: [
        "OIDC and OAuth 2.0 with a JWT token authority at the centre",
        "RBAC and ABAC for access decisions, not just role checks",
        "WebAuthn passkeys as a first-class sign-in method",
        "A federation broker for signing in through an existing identity provider",
        "An immutable audit log of every decision the platform makes",
      ],
    },
  },
  {
    id: "omnihilbras",
    name: "OmniHilbras",
    area: "ai",
    stage: "intelligence",
    description:
      "Routing and provider management. Health checks, retries, and fallbacks decide which model serves a request, the local gateway keeps your keys on your own machine, and every decision stays readable afterwards.",
    summary: "Routing and provider management for model traffic.",
    kind: "service",
    status: "beta",
    documentation: "https://github.com/Hilbras/OmniHilbras#readme",
    developer: {
      package: "@hilbras/omnihilbras",
      version: "2.9.18",
      install: "npm i @hilbras/omnihilbras",
      license: "MIT",
      verified: "2026-11-12",
    },
    mark: "prism",
    href: "https://omnihilbras.hilbras.com",
    repository: "https://github.com/Hilbras/OmniHilbras",
    page: {
      tagline: "One local endpoint for every model provider.",
      metaDescription:
        "Local-first AI gateway: one OpenAI-compatible endpoint in front of 14 provider adapters, with routing, hedging, failover, an encrypted local key vault, and per-connection rate limits.",
      docs: {
        demo: "https://omnihilbras.hilbras.com",
        changelog: "https://omnihilbras.hilbras.com/changelog",
      },
    },
    positioning: {
      position:
        "The routing and failover layer in front of every model: it decides which provider serves a request, retries and falls back when one fails, and keeps the decision readable afterwards rather than a black box.",
      capabilities: [
        "Health checks, retries, and fallbacks across providers",
        "A local gateway that keeps provider keys on your own machine",
        "A decision log that shows why a given request went to a given model",
      ],
    },
  },
  {
    id: "omninode",
    name: "OmniNode",
    area: "ai",
    stage: "intelligence",
    description:
      "A provider-agnostic multi-AI orchestration platform. Coordinates CLI agents, AI providers, memory, roles, reports, and planning into one execution system, so a task spanning several agents stays one piece of work.",
    summary: "Multi-AI orchestration for CLI agents and providers.",
    kind: "service",
    status: "beta",
    documentation: "https://github.com/Hilbras/OmniNode#readme",
    developer: {
      package: "@hilbras/omninode",
      version: "2.0.3",
      install: "npm i @hilbras/omninode",
      license: "MIT",
      verified: "2026-11-12",
    },
    mark: "network",
    repository: "https://github.com/Hilbras/OmniNode",
    page: {
      tagline: "Provider-agnostic multi-AI orchestration platform.",
      metaDescription:
        "Multi-AI orchestration platform that coordinates CLI agents, AI providers, memory, roles, and planning into one execution system, so a task spanning several agents stays one piece of work.",
      docs: {
        npm: "https://www.npmjs.com/package/@hilbras/omninode",
        changelog: "https://github.com/Hilbras/OmniNode/blob/main/CHANGELOG.md",
      },
    },
    positioning: {
      position:
        "The layer that makes several agents one piece of work: it coordinates CLI agents, providers, memory, roles, reports, and planning so a task that spans more than one of them stays one task rather than a hand-off chain.",
      capabilities: [
        "Coordinates CLI agents, AI providers, memory, roles, and reporting in one execution system",
        "Plans multi-agent work so a task spanning several agents is scheduled as one unit",
        "Provider-agnostic: the orchestration layer does not assume one model or one agent runtime",
      ],
    },
  },
  {
    id: "omnicode",
    name: "OmniCode",
    area: "developer-infrastructure",
    stage: "application",
    description:
      "An agentic coding CLI with a pluggable kernel: a dependency-injection and scope engine, an Agent Client Protocol host, and a tools and addons architecture that extensions plug into rather than patch.",
    summary: "An agentic coding CLI with a pluggable kernel.",
    kind: "application",
    status: "stable",
    documentation: "https://github.com/Hilbras/OmniCode#readme",
    developer: {
      package: "@hilbras/omnicode",
      version: "1.4.1",
      install: "npm install -g @hilbras/omnicode",
      license: "MIT",
      verified: "2026-11-12",
    },
    mark: "kernel",
    repository: "https://github.com/Hilbras/OmniCode",
    page: {
      tagline: "Agentic coding CLI with a pluggable kernel.",
      metaDescription:
        "Agentic coding CLI with a pluggable kernel: dependency-injection engine, Agent Client Protocol host, subagents, and MCP tools that extensions plug into rather than patch.",
      docs: {
        npm: "https://www.npmjs.com/package/@hilbras/omnicode",
        site: "https://hilbras.github.io/omnicode/en/",
      },
    },
    positioning: {
      position:
        "The agentic coding CLI that the rest of the developer tooling plugs into: a kernel with a dependency-injection and scope engine at its centre, and an architecture where extensions add to the system rather than patch it.",
      capabilities: [
        "A dependency-injection and scope engine at the centre of the CLI",
        "Hosts the Agent Client Protocol, so agents and tools talk over one standard",
        "Tools and addons plug into the kernel by declaration rather than by forking or patching it",
      ],
    },
  },
  {
    id: "omnicloud",
    name: "OmniCloud",
    area: "platforms",
    stage: "application",
    description:
      "Self-hosted cloud storage on your own Telegram account. A web app, an API, an npm SDK and a CLI, with optional end-to-end encryption: files are encrypted on your device and the server never receives the keys.",
    summary: "Self-hosted cloud storage with client-side encryption.",
    kind: "platform",
    status: "stable",
    documentation: "https://github.com/Hilbras/OmniCloud#readme",
    developer: {
      package: "@hilbras/omnicloud",
      version: "0.6.0",
      install: "npm install @hilbras/omnicloud",
      license: "MIT",
      verified: "2026-11-12",
    },
    mark: "vault",
    href: "https://omnicloud.hilbras.com",
    repository: "https://github.com/Hilbras/OmniCloud",
    page: {
      tagline: "Your files, in your own Telegram account — with a real drive on top.",
      metaDescription:
        "Self-hosted cloud storage on your own Telegram account: web app, API, npm SDK, and CLI, with resumable uploads, version history, sharing, WebDAV, and optional end-to-end encryption.",
      docs: {
        npm: "https://www.npmjs.com/package/@hilbras/omnicloud",
        demo: "https://omnicloud.hilbras.com",
      },
    },
    positioning: {
      position:
        "Cloud storage that runs on your own Telegram account rather than a vendor: you keep the account and the data, and the platform is the layer that makes it work like cloud storage instead of a chat window.",
      capabilities: [
        "A web app, an API, an npm SDK, and a CLI over the same storage backend",
        "Optional end-to-end encryption: files are encrypted on the device and the server never receives the keys",
        "Runs on infrastructure you already own, so \"the cloud\" is your own account",
      ],
    },
  },
] as const;

export const areaById = new Map(areas.map((area) => [area.id, area]));

export const productById = new Map(products.map((product) => [product.id, product]));

export function productsInArea(areaId: AreaId): readonly Product[] {
  const area = areaById.get(areaId);
  if (!area) return [];
  return area.products
    .map((id) => productById.get(id))
    .filter((product): product is Product => Boolean(product));
}

export const statusLabels: Record<ProductStatus, string> = {
  stable: "Stable",
  beta: "Beta",
  alpha: "Alpha",
  building: "In development",
};

export const statusDefinitions: Record<ProductStatus, string> = {
  stable: "Publicly released. Interfaces may still gain additive changes.",
  beta: "Usable and documented, but the interface is still settling.",
  alpha: "Public and working, with parts of the interface still changing.",
  building: "Under active construction. Nothing here is a supported release yet.",
};

export const statusOrder: readonly ProductStatus[] = ["building", "alpha", "beta", "stable"];

export const productSchemas: Record<ProductKind, { type: string; category: string }> = {
  library: { type: "SoftwareSourceCode", category: "DeveloperLibrary" },
  service: { type: "SoftwareApplication", category: "DeveloperApplication" },
  platform: { type: "SoftwareApplication", category: "BusinessApplication" },
  application: { type: "SoftwareApplication", category: "ConsumerApplication" },
  system: { type: "OperatingSystem", category: "OperatingSystem" },
};
