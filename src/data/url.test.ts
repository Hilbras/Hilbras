import { describe, expect, it, vi } from 'vitest';
import { site } from './site';
import { isDefaultOrigin, resolveSiteUrl } from './url';
import { buildGraph, buildStructuredDataDocument } from './structuredData';

describe('resolving the site origin', () => {
  it('uses the committed domain when SITE_URL is not set', () => {
    expect(resolveSiteUrl({})).toBe(site.domain);
    expect(resolveSiteUrl({ SITE_URL: '' })).toBe(site.domain);
    expect(resolveSiteUrl({ SITE_URL: '   ' })).toBe(site.domain);
  });

  it('uses SITE_URL when it is a usable absolute origin', () => {
    expect(resolveSiteUrl({ SITE_URL: 'https://hilbras.example' })).toBe('https://hilbras.example');
    // http matters: a local or preview origin is often plain http, and rejecting
    // it would make the override unusable for exactly the case it exists for.
    expect(resolveSiteUrl({ SITE_URL: 'http://127.0.0.1:4175' })).toBe('http://127.0.0.1:4175');
  });

  it('strips a trailing slash, because every caller appends a path', () => {
    expect(resolveSiteUrl({ SITE_URL: 'https://hilbras.example/' })).toBe('https://hilbras.example');
    expect(resolveSiteUrl({ SITE_URL: 'https://hilbras.example///' })).toBe('https://hilbras.example');
    expect(site.domain.endsWith('/')).toBe(false);
  });

  it('falls back with a warning when SITE_URL is not an absolute origin', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const bad of ['hilbras.example', '/relative', 'not a url', 'ftp://hilbras.example', 'javascript:alert(1)']) {
      expect(resolveSiteUrl({ SITE_URL: bad }), bad).toBe(site.domain);
    }
    // Silent fallback would publish the wrong canonical without complaint.
    expect(warn).toHaveBeenCalledTimes(5);
    warn.mockRestore();
  });

  it('reports whether the build is using the committed domain', () => {
    expect(isDefaultOrigin({})).toBe(true);
    expect(isDefaultOrigin({ SITE_URL: site.domain })).toBe(true);
    expect(isDefaultOrigin({ SITE_URL: 'https://preview.vercel.app' })).toBe(false);
  });
});

describe('a preview build', () => {
  const preview = 'https://hilbras-git-feature-abc123.vercel.app';
  const graph = buildGraph(preview);
  const production = buildGraph(site.domain);

  it('publishes its own origin in every identifier', () => {
    for (const node of graph) {
      const id = String(node['@id']);
      if (!id.startsWith('http')) continue;
      expect(id, id).toContain(preview);
      expect(id, `${id} still points at production`).not.toContain(site.domain);
    }
  });

  it('publishes its own canonical-equivalent URLs', () => {
    for (const node of graph) {
      if (typeof node.url !== 'string' || !node.url.startsWith(preview)) continue;
      expect(node.url).not.toContain(site.domain);
    }
    const website = graph.find((n) => n['@type'] === 'WebSite');
    expect(website?.url).toBe(preview);
  });

  it('leaves external references alone, because they are not ours to rewrite', () => {
    const json = JSON.stringify(buildStructuredDataDocument(preview));
    // A product's own deployed site is a different host and must survive the
    // override untouched, or a preview would rewrite third-party URLs.
    expect(json).toContain('github.com/Hilbras');
    expect(json).not.toContain('"url":"https://hilbras-studio.vercel.app/#products"');
  });

  it('differs from the production build only in the origin', () => {
    const strip = (nodes: Record<string, unknown>[]) =>
      JSON.stringify(nodes).replaceAll(preview, 'ORIGIN').replaceAll(site.domain, 'ORIGIN');
    expect(strip(graph)).toBe(strip(production));
  });

  it('emits a serialisable document for the override', () => {
    const parsed = JSON.parse(buildStructuredDataDocument(preview));
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@graph']).toHaveLength(graph.length);
    expect(JSON.stringify(parsed)).not.toContain('</script');
  });
});
