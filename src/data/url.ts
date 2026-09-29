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
 * Falls back to the committed domain when `SITE_URL` is absent or unusable, and
 * warns rather than throwing: a typo in an environment variable should not take
 * down a build that would otherwise be correct, but it must not be silent
 * either.
 */
export function resolveSiteUrl(env: Record<string, string | undefined> = readEnv()): string {
  const override = env.SITE_URL;

  if (override === undefined || override.trim() === '') {
    return normalise(site.domain);
  }

  if (!isUsableOrigin(override)) {
    console.warn(
      `site: ignoring SITE_URL="${override}" — it is not an absolute http(s) origin. ` +
        `Falling back to ${site.domain}.`,
    );
    return normalise(site.domain);
  }

  return normalise(override);
}

/** Whether the build is using the committed domain rather than an override. */
export function isDefaultOrigin(env: Record<string, string | undefined> = readEnv()): boolean {
  return resolveSiteUrl(env) === normalise(site.domain);
}
