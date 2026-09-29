import { site } from './site';

/**
 * Where the site says it lives.
 *
 * `site.domain` in `./site` is the committed default. `SITE_URL` overrides it at
 * build time, which is what a preview deployment needs: a preview should not
 * publish a canonical, Open Graph, sitemap or JSON-LD identity pointing at the
 * production domain, because a crawler that indexes the preview would then
 * record production URLs as the address of preview content.
 *
 * The override is resolved here rather than inside each build script so the
 * document, the sitemap, robots, the manifest and the structured data all go
 * through one function and cannot disagree about the origin.
 *
 * This module is only evaluated on the server — during the prerender, the SEO
 * generation and the build assertions. It is not in the client bundle; the
 * client uses `site.domain` for in-page anchors, which is correct because those
 * are relative.
 */

/** Trailing slashes are stripped, because every caller appends a path. */
function normalise(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

/**
 * Whether a value is a plain absolute origin. A malformed `SITE_URL` would
 * otherwise propagate into every canonical, every sitemap entry and every
 * JSON-LD identifier, and a build producing those would still look successful.
 */
function isUsableOrigin(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function readEnv(): Record<string, string | undefined> {
  return typeof process !== 'undefined' && process.env ? process.env : {};
}

/**
 * The effective origin.
 *
 * Resolution order, first match wins:
 *
 * 1. `SITE_URL` — an explicit override, always.
 * 2. Vercel's own variables, which is what makes a preview deployment identify
 *    as itself. A preview that publishes the production canonical is a real
 *    defect, not a cosmetic one: a crawler that indexes the preview records
 *    production URLs as the address of preview content, and a canonical is a
 *    claim about which URL is the real one.
 *    - `production` uses the production alias, not `VERCEL_URL`, which is the
 *      per-deployment host and would give every release its own identity.
 *    - `preview` uses this deployment's own host, so its canonical, Open Graph,
 *      sitemap and JSON-LD all name the preview.
 * 3. `site.domain` — the committed default, for a local build.
 *
 * Falls back with a warning rather than throwing when `SITE_URL` is unusable: a
 * typo in an environment variable should not take down a build that would
 * otherwise be correct, but it must not be silent either.
 */
export function resolveSiteUrl(env: Record<string, string | undefined> = readEnv()): string {
  const override = env.SITE_URL;

  if (override !== undefined && override.trim() !== '') {
    if (!isUsableOrigin(override)) {
      console.warn(
        `site: ignoring SITE_URL="${override}" — it is not an absolute http(s) origin. ` +
          `Falling back to ${fromVercel(env) ?? site.domain}.`,
      );
    } else {
      return normalise(override);
    }
  }

  return normalise(fromVercel(env) ?? site.domain);
}

/** The origin Vercel implies, or null when the build is not on Vercel. */
function fromVercel(env: Record<string, string | undefined>): string | null {
  // A bare host is a hostname, not an origin.
  const asOrigin = (value: string | undefined) => {
    if (!value?.trim()) return null;
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value.trim()}`;
    return isUsableOrigin(candidate) ? normalise(candidate) : null;
  };

  if (env.VERCEL_ENV === 'production') {
    return asOrigin(env.VERCEL_PROJECT_PRODUCTION_URL) ?? asOrigin(env.VERCEL_URL);
  }
  // `preview` and `development` both want the host they are served from.
  if (env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development') {
    return asOrigin(env.VERCEL_URL);
  }
  return null;
}

/** Whether the build is using the committed domain rather than an override. */
export function isDefaultOrigin(env: Record<string, string | undefined> = readEnv()): boolean {
  return resolveSiteUrl(env) === normalise(site.domain);
}
