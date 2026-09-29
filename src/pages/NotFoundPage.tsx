import { Reveal } from '../components/ui/Reveal';
import { products } from '../data/areas';
import { productPath } from '../routes';

/**
 * What a visitor gets for a path that does not exist.
 *
 * Prerendered, so it is a real document with a real 404 status from the host
 * rather than a client-side "page not found" that crawlers and a cold reader
 * both see as a 200. The products are listed because the likeliest reason
 * someone is here is a stale product link.
 *
 * Just the content, like every other page: `App` owns the navigation and the
 * footer. The footer has to be a direct child of `<body>` to be a `contentinfo`
 * landmark, so a page that rendered one inside `<main>` would silently lose it.
 */
export function NotFoundPage({ path }: { path: string }) {
  return (
    <section aria-labelledby="notfound-heading" className="relative overflow-hidden border-b border-line/70">
        <div aria-hidden="true" className="bg-glow absolute inset-x-0 top-0 h-[420px] opacity-60" />

        <div className="shell relative pb-16 pt-20 sm:pb-24 sm:pt-28">
          <Reveal className="text-center">
            <p className="mono-label">404</p>
            <h1 id="notfound-heading" className="display-title mt-5 text-4xl sm:text-5xl">
              Nothing here.
            </h1>
            <p className="muted mx-auto mt-5 max-w-xl text-base leading-relaxed">
              There is no page at <code className="mono-label">{path || '/'}</code>. It may have moved, or
              the link may be out of date.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="/" className="btn-gold">
                Back to the homepage
              </a>
              <a href="/products" className="btn-ghost">
                All products
              </a>
            </div>
          </Reveal>

          <Reveal className="mx-auto mt-16 max-w-3xl">
            <h2 className="mono-label text-center">Every product</h2>
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {products.map((product) => (
                <li key={product.id}>
                  <a
                    href={productPath(product.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-1.5 text-13 text-muted transition-colors hover:border-gold/40 hover:text-gold-text"
                  >
                    {product.name}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
  );
}
