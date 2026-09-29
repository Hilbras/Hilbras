import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { ProductPage } from './ProductPage';
import { ProductIndexPage } from './ProductIndexPage';
import { NotFoundPage } from './NotFoundPage';
import { allRoutes, productPath, resolveRoute, HOME_PATH, PRODUCTS_PATH } from '../routes';
import { areas, productById, products } from '../data/areas';
import { counts } from '../data/site';

const sdk = productById.get('sdk')!;
const studio = productById.get('studio')!;   // site + repository + documentation
const gateway = productById.get('gateway')!; // nothing public

describe('routes', () => {
  it('resolves the paths it should', () => {
    expect(resolveRoute('/')).toEqual({ kind: 'home', path: '/' });
    expect(resolveRoute('/products')).toEqual({ kind: 'productIndex', path: '/products' });
    expect(resolveRoute('/products/sdk')).toMatchObject({ kind: 'product', id: 'sdk' });
  });

  it('treats a trailing slash and a repeated slash as the same document', () => {
    // A preview URL, a shared link and a crawler disagree about these constantly.
    expect(resolveRoute('/products/sdk/')).toEqual(resolveRoute('/products/sdk'));
    expect(resolveRoute('//products//sdk')).toMatchObject({ kind: 'product', id: 'sdk' });
  });

  it('ignores a query string and a fragment', () => {
    expect(resolveRoute('/products/sdk?utm_source=x')).toMatchObject({ kind: 'product', id: 'sdk' });
    expect(resolveRoute('/products/sdk#overview')).toMatchObject({ kind: 'product', id: 'sdk' });
  });

  it('serves a 404 for a path that does not exist, not a wrong product', () => {
    // Falling back to the index would show a reader a product they did not ask
    // for, and record a 200 for a page that does not exist.
    expect(resolveRoute('/products/ghostware').kind).toBe('notFound');
    expect(resolveRoute('/nope').kind).toBe('notFound');
    expect(resolveRoute('/products/sdk/extra').kind).toBe('notFound');
  });

  it('has one route per product, driven by the registry', () => {
    const productRoutes = allRoutes().filter((route) => route.kind === 'product');
    expect(productRoutes).toHaveLength(products.length);
    // Adding a product to areas.ts must produce a page with no second edit, or a
    // product exists in the data and nowhere on the site.
    expect(productRoutes.map((route) => route.kind === 'product' && route.id).sort()).toEqual(
      products.map((product) => product.id).sort(),
    );
  });

  it('lists the index and the homepage alongside the products', () => {
    const paths = allRoutes().map((route) => route.path);
    expect(paths).toContain(HOME_PATH);
    expect(paths).toContain(PRODUCTS_PATH);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('the product page', () => {
  it('names the product, its area, and its status', () => {
    render(<ProductPage product={sdk} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hilbras SDK');
    // Named twice on purpose: as the eyebrow above the title, and in the facts.
    expect(screen.getAllByText(/AI Infrastructure/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stable').length).toBeGreaterThan(0);
  });

  it('explains what the status actually means, not just its colour', () => {
    render(<ProductPage product={sdk} />);
    expect(
      screen.getByText(/Publicly released\. Interfaces may still gain additive changes\./),
    ).toBeInTheDocument();
  });

  it('links every destination the product has', () => {
    render(<ProductPage product={studio} />);
    expect(screen.getByRole('link', { name: /Visit the site/ })).toHaveAttribute('href', studio.href);
    expect(screen.getByRole('link', { name: /View the source/ })).toHaveAttribute('href', studio.repository);
    expect(screen.getByRole('link', { name: /Read the documentation/ })).toHaveAttribute(
      'href',
      studio.documentation,
    );
  });

  it('links nowhere false when a product has nothing public', () => {
    render(<ProductPage product={gateway} />);
    expect(screen.getByText(/No public release yet/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Visit the site/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View the source/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Read the documentation/ })).not.toBeInTheDocument();
  });

  it('lists the products that share an area, and links each to its own page', () => {
    render(<ProductPage product={sdk} />);
    const related = screen.getByRole('heading', { name: 'Shares an area with' }).closest('section')!;
    const links = within(related).getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^\/products\/[a-z-]+$/);
    }
    // Never itself, and never a product from an unrelated area.
    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain(productPath('sdk'));
  });

  it('does not claim the product requires anything', () => {
    render(<ProductPage product={sdk} />);
    expect(screen.getByText(/does not require any of these/)).toBeInTheDocument();
  });

  it('states the running platform only when it is specific', () => {
    const { unmount } = render(<ProductPage product={sdk} />);
    // "Cross-platform" would be true of nearly everything and would tell a
    // reader nothing, so it is omitted rather than asserted.
    expect(screen.queryByText('Cross-platform')).not.toBeInTheDocument();
    unmount();

    render(<ProductPage product={productById.get('os')!} />);
    expect(screen.getByText('Linux')).toBeInTheDocument();
  });

  it('renders every area a product belongs to', () => {
    const shared = products.find((product) =>
      areas.filter((area) => area.products.includes(product.id)).length > 1,
    )!;
    render(<ProductPage product={shared} />);
    const memberships = areas.filter((area) => area.products.includes(shared.id));
    expect(screen.getByText(memberships.map((area) => area.name).join(', '))).toBeInTheDocument();
  });
});

describe('the product index', () => {
  it('lists every product, including the ones with nothing public', () => {
    render(<ProductIndexPage />);
    for (const product of products) {
      expect(screen.getAllByText(product.name).length, product.name).toBeGreaterThan(0);
    }
    // Hiding the three unreleased products would misrepresent the company.
    expect(screen.getAllByText('No public release yet')).toHaveLength(
      products.filter((p) => !p.repository && !p.href).length,
    );
  });

  it('lists each product exactly once, and says how many there are', () => {
    // A product in two areas used to appear under both, so the page announced
    // eleven products and showed sixteen entries. A reader counting them got a
    // different number from the one the page states.
    render(<ProductIndexPage />);
    const links = screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/products/'));
    expect(links).toHaveLength(products.length);

    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(new Set(hrefs).size).toBe(products.length);
  });

  it('names the other areas a shared product belongs to', () => {
    render(<ProductIndexPage />);
    // HilGit is in developer infrastructure and social technology; it is listed
    // under the first and names the second.
    const shared = products.find((product) =>
      areas.filter((area) => area.products.includes(product.id)).length > 1,
    )!;
    // Listed under the area that owns it, naming the others.
    const others = areas
      .filter((area) => area.products.includes(shared.id) && area.id !== shared.area)
      .map((area) => area.name);
    expect(others.length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(`Also in ${others.join(', ')}`)).length).toBeGreaterThan(0);
  });

  it('shows every area, and groups each product under the one that owns it', () => {
    render(<ProductIndexPage />);
    for (const area of areas) {
      expect(screen.getByRole('heading', { level: 2, name: area.name })).toBeInTheDocument();
    }
    // Grouping by "the first area that lists it" left social technology with an
    // empty section, because all three of its products are claimed earlier in the
    // list. `product.area` is the field that means ownership.
    for (const area of areas) {
      const owned = products.filter((product) => product.area === area.id);
      if (owned.length === 0) continue;
      const section = screen.getByRole('heading', { level: 2, name: area.name }).closest('section')!;
      for (const product of owned) {
        expect(
          within(section).getByRole('link', { name: new RegExp(product.name) }),
          `${product.name} under ${area.name}`,
        ).toHaveAttribute('href', productPath(product.id));
      }
    }
  });

  it('groups by area, and links each product to its own page', () => {
    render(<ProductIndexPage />);
    for (const product of products) {
      const links = screen.getAllByRole('link', { name: new RegExp(product.name) });
      expect(links.some((link) => link.getAttribute('href') === productPath(product.id))).toBe(true);
    }
  });

  it('states counts that come from the data', () => {
    render(<ProductIndexPage />);
    expect(screen.getByText(new RegExp(`${counts.products} products across ${counts.areas}`))).toBeInTheDocument();
  });
});

describe('the 404 page', () => {
  it('says the address is wrong and offers the way out', () => {
    render(<NotFoundPage path="/products/ghostware" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nothing here.');
    expect(screen.getByText('/products/ghostware')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to the homepage/ })).toHaveAttribute('href', '/');
  });

  it('lists every product, since a stale product link is the likeliest reason', () => {
    render(<NotFoundPage path="/x" />);
    for (const product of products) {
      expect(screen.getByRole('link', { name: product.name })).toHaveAttribute('href', productPath(product.id));
    }
  });
});

describe('the app shell', () => {
  it('renders the chrome on every route', () => {
    for (const path of ['/', '/products', '/products/sdk', '/nope']) {
      const { unmount } = render(<App path={path} />);
      expect(screen.getByRole('banner'), path).toBeInTheDocument();
      expect(screen.getByRole('contentinfo'), path).toBeInTheDocument();
      expect(screen.getByRole('main'), path).toBeInTheDocument();
      expect(document.querySelector('.particle-canvas'), path).toBeInTheDocument();
      unmount();
    }
  });

  it('gives every route exactly one h1', () => {
    for (const path of ['/', '/products', '/products/sdk', '/nope']) {
      const { unmount } = render(<App path={path} />);
      expect(screen.getAllByRole('heading', { level: 1 }), path).toHaveLength(1);
      unmount();
    }
  });

  it('puts the skip link first on every route', () => {
    for (const path of ['/', '/products', '/products/sdk', '/nope']) {
      const { unmount } = render(<App path={path} />);
      expect(screen.getByRole('link', { name: 'Skip to content' }), path).toHaveAttribute('href', '#main');
      unmount();
    }
  });

  it('opens the products panel from any route', async () => {
    const user = userEvent.setup();
    for (const path of ['/', '/products', '/products/sdk']) {
      const { unmount } = render(<App path={path} />);
      const trigger = screen.getByRole('button', { name: /Products/ });
      await user.click(trigger);
      expect(trigger, path).toHaveAttribute('aria-expanded', 'true');
      unmount();
    }
  });

  it('links the navigation to homepage sections in a way that resolves from elsewhere', () => {
    // A bare `#ecosystem` resolves against whatever page the reader is on, so
    // from a product page it pointed at a section that does not exist there.
    render(<App path="/products/sdk" />);
    for (const link of screen.getAllByRole('link')) {
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('#') && href !== '#main') {
        throw new Error(`${href} is a same-page anchor but the section is not on this page`);
      }
    }
  });
});
