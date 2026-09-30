import { Footer } from '../components/Footer';
import { Navbar } from '../components/navbar/Navbar';
import { ParticleField } from '../components/ParticleField';
import { productById } from '../data/areas';
import { DevelopersPage } from './DevelopersPage';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { ProductIndexPage } from './ProductIndexPage';
import { ProductPage } from './ProductPage';
import { resolveRoute } from '../routes';

/**
 * The page shell, and the only place a path becomes content.
 *
 * Both entry points use this: the prerender passes each route's path, and the
 * client passes `window.location.pathname`. Because both resolve through
 * `resolveRoute`, the document the server sent and the tree the client hydrates
 * come from the same function — the alternative, deciding the page twice, is
 * exactly how a hydration mismatch happens.
 */
export function App({ path }: { path: string }) {
  const route = resolveRoute(path);
  const product = route.kind === 'product' ? productById.get(route.id) : undefined;

  return (
    // No page-enter animation: it hid the prerendered content, and its
    // `transform` made this wrapper the containing block for the fixed
    // particle canvas, which sized to the whole document. See index.css.
    <div className="min-h-screen overflow-x-clip">
      <ParticleField />
      <Navbar />

      {/*
        Every page gets one `<main>`. A `<footer>` is a `contentinfo` landmark
        only as a direct child of `<body>`, so the footer lives here rather than
        inside any page — a page that rendered its own would silently stop being
        a landmark, which is exactly what happened to the 404 page.
      */}
      <main id="main" tabIndex={-1}>
        {route.kind === 'product' && product ? <ProductPage product={product} /> : null}
        {route.kind === 'productIndex' ? <ProductIndexPage /> : null}
        {route.kind === 'developers' ? <DevelopersPage /> : null}
        {route.kind === 'home' ? <HomePage /> : null}
        {route.kind === 'notFound' || (route.kind === 'product' && !product) ? (
          <NotFoundPage path={route.path} />
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
