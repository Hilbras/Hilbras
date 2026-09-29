/**
 * Everything else the homepage renders, kept out of components so copy changes
 * never require a markup change.
 */

export const site = {
  name: 'Hilbras',
  /**
   * The single source of truth for every absolute URL on the site. The
   * prerender step rewrites the canonical, Open Graph and Twitter URLs in the
   * built HTML from this value, so moving to a different host is a one-line
   * edit plus a rebuild.
   */
  domain: 'https://hilbras.vercel.app',
  tagline: 'Technology for building what comes next.',
  headline: 'Build. Connect. Create.',
  description:
    'Hilbras is an independent technology company building AI infrastructure, developer tools, application platforms, computing environments, and security tooling.',
  /**
   * Bumped when the public content changes. Feeds the sitemap's `lastmod`,
   * which is why it is a single value rather than a per-route one while there
   * is only a single route.
   */
  lastModified: '2026-09-29',
  organisation: {
    legalName: 'Hilbras',
    founding: '2026',
    // No `email` key: a placeholder address in the Organization JSON-LD would be
    // published to every consumer of the structured data. Add it when a real
    // contact address exists.
    github: 'https://github.com/Hilbras',
  },
} as const;

export type NavLink = { href: string; label: string };

export const navLinks: readonly NavLink[] = [
  { href: '#ecosystem', label: 'Ecosystem' },
  { href: '#technology', label: 'Technology' },
  { href: '#philosophy', label: 'About' },
] as const;

/** The three claims the hero makes under its CTAs. */
export const heroAssurances = [
  'Independent products',
  'Bring your own infrastructure',
  'Open where it matters',
] as const;

export const audiences = [
  {
    id: 'developers',
    title: 'Developers',
    lede: 'Build on modular infrastructure instead of assembling it yourself.',
    body: 'Every Hilbras product is usable on its own. Take the SDK, or the gateway, or identity, and keep the rest of the surface out of your way until you want it.',
    points: [
      'Install one package, not a platform',
      'Bring your own keys and your own infrastructure',
      'Readable defaults, no proprietary request format',
    ],
    cta: { href: '#products', label: 'See the products' },
  },
  {
    id: 'businesses',
    title: 'Businesses',
    lede: 'Technology designed around integration, extensibility, and automation.',
    body: 'Hilbras systems are meant to sit inside existing operations. They expose stable interfaces, keep your data where it belongs, and can be automated without a bespoke integration layer.',
    points: [
      'Self-hosted or vendor-controlled, your choice',
      'Extensible at the edges that actually change',
      'Auditable identity and access by default',
    ],
    cta: { href: '#philosophy', label: 'How we build' },
  },
  {
    id: 'creators',
    title: 'Creators',
    lede: 'Create, publish, automate, and manage digital content.',
    body: 'Platforms and runtimes for the people who need to publish consistently. Connect the accounts you already have, describe what you want, and keep control of what goes out.',
    points: [
      'One place to plan and run a publishing schedule',
      'Automation with an approval step where it matters',
      'Extensions instead of migrations',
    ],
    cta: { href: '#ecosystem', label: 'Explore the ecosystem' },
  },
] as const;

export const principles = [
  {
    id: 'independent',
    number: '01',
    title: 'Independent by design',
    body: 'Every Hilbras product has to be worth installing on its own. If a project only makes sense next to another one, it is not finished yet.',
  },
  {
    id: 'connected',
    number: '02',
    title: 'Connected by choice',
    body: 'Integration should add value, not obligation. Products interoperate because the interfaces are good, not because they are bundled.',
  },
  {
    id: 'developer-first',
    number: '03',
    title: 'Developer first',
    body: 'The person reading the logs should be able to understand the system. Control, visibility, and escape hatches come before convenience.',
  },
  {
    id: 'long-term',
    number: '04',
    title: 'Build for the long term',
    body: 'Foundations outlast features. We would rather ship a smaller surface that stays correct than a large one that quietly rots.',
  },
  {
    id: 'open',
    number: '05',
    title: 'Open where it matters',
    body: 'Where a Hilbras project can be transparent, interoperable, and community-welcoming, it is — starting with the parts developers have to depend on.',
  },
] as const;

export const vision = {
  lede: 'Hilbras is not one application. The long-term work is a technology ecosystem, built in the order the layers actually depend on each other.',
  stages: [
    { id: 'identity', label: 'Identity', body: 'Knowing who is asking, and what they are allowed to do.' },
    { id: 'ai', label: 'AI', body: 'Reaching models through infrastructure you control.' },
    { id: 'memory', label: 'Memory', body: 'Keeping what matters past the end of a session.' },
    { id: 'applications', label: 'Applications', body: 'Runtimes that turn infrastructure into products.' },
    { id: 'automation', label: 'Automation', body: 'Work that runs on a schedule, with humans in the loop.' },
    { id: 'development', label: 'Development', body: 'Tools for building the next piece of the ecosystem.' },
    { id: 'collaboration', label: 'Collaboration', body: 'Shared work, review, and community.' },
    { id: 'computing', label: 'Computing', body: 'The environment all of it runs in.' },
  ],
} as const;

export const visionCaveat =
  'This is a direction, not a delivery date. Some of these layers are usable today; others are early. We would rather show the structure than predict the timeline.';

/**
 * Footer navigation. Every entry resolves to a section on this page or the
 * organisation's GitHub — nothing is listed that does not exist yet.
 */
export const footerGroups: ReadonlyArray<{ title: string; links: readonly NavLink[] }> = [
  {
    title: 'Resources',
    links: [
      { href: '#ecosystem', label: 'Ecosystem' },
      { href: '#connect', label: 'Ecosystem map' },
      { href: '#technology', label: 'Technology areas' },
      { href: '#built-for', label: 'Built for' },
      { href: 'https://github.com/Hilbras', label: 'GitHub' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '#about', label: 'About' },
      { href: '#philosophy', label: 'Philosophy' },
      { href: '#vision', label: 'Vision' },
    ],
  },
] as const;
