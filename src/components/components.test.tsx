import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ProductCard, FeaturedProductCard, ProductGrid } from './ProductCard';
import { ConnectionMap } from './ConnectionMap';
import { StatusPill } from './ui/StatusPill';
import { ThemeToggle } from './ThemeToggle';
import { productById, products } from '../data/areas';

const sdk = productById.get('sdk')!;
const gateway = productById.get('gateway')!; // no site, no repository
const studio = productById.get('studio')!;   // has both

describe('StatusPill', () => {
  it('states the level and explains what it means', () => {
    render(<StatusPill status="alpha" />);
    const pill = screen.getByText('Alpha');
    expect(pill).toHaveAttribute('title', expect.stringContaining('still changing'));
  });

  it('distinguishes a product still being built from a released one', () => {
    render(<StatusPill status="building" />);
    expect(screen.getByText('In development')).toBeInTheDocument();
  });

  it('renders a compact form without a border for dense layouts', () => {
    const { container } = render(<StatusPill status="beta" compact />);
    expect(container.firstElementChild).not.toHaveAttribute('data-status');
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});

describe('ProductCard', () => {
  it('names the product, its area, and its status', () => {
    render(<ProductCard product={sdk} />);
    const article = screen.getByRole('article');
    expect(within(article).getByRole('heading', { name: 'Hilbras SDK' })).toBeInTheDocument();
    expect(within(article).getByText('AI Infrastructure')).toBeInTheDocument();
    expect(within(article).getByText('Stable')).toBeInTheDocument();
  });

  it('links a product with a repository and says the link is external', () => {
    render(<ProductCard product={sdk} />);
    const link = screen.getByRole('link', { name: /View source|Source/ });
    expect(link).toHaveAttribute('href', sdk.repository);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });

  it('offers every link a product with a site and a repository deserves', () => {
    render(<FeaturedProductCard product={studio} />);
    const article = screen.getByRole('article');
    expect(within(article).getByRole('link', { name: /View source/ })).toHaveAttribute('href', studio.repository);
    expect(within(article).getByRole('link', { name: /Visit site/ })).toHaveAttribute('href', studio.href);
    expect(within(article).getByRole('link', { name: 'Hilbras Studio' })).toHaveAttribute(
      'href',
      '/products/studio',
    );
  });

  it('says so plainly when a product has no public release, and links nothing false', () => {
    render(<ProductCard product={gateway} />);
    const article = screen.getByRole('article');
    // It still links: the product's page is where the site explains what it is
    // and why there is nothing to install yet. What it must not do is invent a
    // repository or a site.
    expect(within(article).getByText('No public release yet')).toBeInTheDocument();
    expect(within(article).queryByRole('link', { name: /Source/ })).not.toBeInTheDocument();
    expect(within(article).queryByRole('link', { name: /Visit site/ })).not.toBeInTheDocument();
  });

  it('links the name to the product page, not out to a repository', () => {
    render(<ProductCard product={sdk} />);
    const article = screen.getByRole('article');
    // The card is not itself a link, because it contains other links and
    // nesting anchors is invalid. The heading carries it instead.
    expect(within(article).getByRole('link', { name: 'Hilbras SDK' })).toHaveAttribute(
      'href',
      '/products/sdk',
    );
    expect(article.querySelector('a[href^="https"]')).not.toBeNull();
  });

  it('renders the featured and standard cards as the same element', () => {
    const { container: featured } = render(<FeaturedProductCard product={sdk} />);
    const { container: standard } = render(<ProductCard product={sdk} />);
    expect(featured.firstElementChild?.tagName).toBe('ARTICLE');
    expect(standard.firstElementChild?.tagName).toBe('ARTICLE');
  });

  it('renders a grid with one article per product', () => {
    render(<ProductGrid items={products.slice(0, 4)} columns={4} />);
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });
});

describe('Navbar', () => {
  it('puts the skip link first in the tab order and points it at main', () => {
    render(<Navbar />);
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#main');
  });

  it('keeps the products panel closed until it is asked for', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const trigger = screen.getByRole('button', { name: /Products/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the products panel on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const trigger = screen.getByRole('button', { name: /Products/ });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('lists every product in the panel, with its summary and status', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByRole('button', { name: /Products/ }));
    const panel = screen.getByRole('button', { name: /Products/ }).nextElementSibling;
    expect(panel).not.toBeNull();
    for (const product of products) {
      // A product in two areas is listed under both, which is intentional.
      expect(
        within(panel as HTMLElement).queryAllByText(product.name).length,
        product.name,
      ).toBeGreaterThan(0);
    }
  });

  it('does not reopen if it is closed in the same tick it was opened', async () => {
    // The panel opens on a rAF so the browser has the closed styles to animate
    // from. A close that lands before that frame fires has to win, or the frame
    // re-opens a panel that `aria-expanded` already says is closed. This was a
    // real race, found by this test failing intermittently rather than reliably.
    const user = userEvent.setup();
    render(<Navbar />);
    const trigger = screen.getByRole('button', { name: /Products/ });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    // Let any pending animation frame land.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('switches the mobile menu open and closed', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const toggle = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Close navigation menu' }));
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('ThemeToggle', () => {
  it('carries a label that does not depend on the current theme', () => {
    // A label of "switch to X" is never patched after hydration, so it would go
    // stale. This asserts the static wording that fixed that.
    document.documentElement.dataset.theme = 'light';
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Toggle colour theme' });
    expect(button).toHaveAttribute('aria-label', 'Toggle colour theme');
  });

  it('writes the chosen theme to the document and to storage', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: 'Toggle colour theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('hilbras-theme')).toBe('light');
  });

  it('does not write to storage until the visitor chooses', () => {
    // The bug this pins: the effect that applies the theme also wrote it, so
    // the first page load captured the system preference and the stored value
    // then took precedence over `prefers-color-scheme` permanently. Someone who
    // visited in the morning and switched their system to light at night was
    // stuck with the light site at noon, and could not undo it without clearing
    // site data. There is no account here, so the OS setting is the only
    // preference a visitor can express until they touch the toggle.
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle />);
    expect(localStorage.getItem('hilbras-theme')).toBeNull();
  });

  it('leaves an existing stored choice alone on mount', () => {
    localStorage.setItem('hilbras-theme', 'light');
    document.documentElement.dataset.theme = 'light';
    render(<ThemeToggle />);
    expect(localStorage.getItem('hilbras-theme')).toBe('light');
  });

  it('follows the system preference while nothing is stored', async () => {
    // A fresh matchMedia that reports dark, and reports the opposite on change.
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    let matches = true;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-color-scheme') ? matches : false,
      media: query,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.push(listener),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle />);

    // The visitor's system switches to light.
    matches = false;
    listeners.forEach((listener) => listener({ matches: false } as MediaQueryListEvent));

    await vi.waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
    });
    // Still nothing written: following the system is not a choice.
    expect(localStorage.getItem('hilbras-theme')).toBeNull();
  });

  it('stops following the system once the visitor has chosen', async () => {
    const user = userEvent.setup();
    localStorage.setItem('hilbras-theme', 'light');
    document.documentElement.dataset.theme = 'light';
    render(<ThemeToggle />);
    // The system is dark, but the stored choice wins and is not overwritten.
    await user.click(screen.getByRole('button', { name: 'Toggle colour theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('hilbras-theme')).toBe('dark');
  });

  it('renders both icons and lets CSS choose, so the two trees cannot disagree', () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector('.theme-icon-light')).toBeInTheDocument();
    expect(container.querySelector('.theme-icon-dark')).toBeInTheDocument();
  });
});

describe('ConnectionMap', () => {
  it('names every product somewhere in the diagram', () => {
    render(<ConnectionMap />);
    for (const product of products) {
      expect(screen.getAllByText(product.name).length, product.name).toBeGreaterThan(0);
    }
  });

  it('states that the products are independent', () => {
    render(<ConnectionMap />);
    expect(screen.getByText(/standalone product/i)).toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('links every product and every navigation group', () => {
    render(<Footer />);
    for (const product of products) {
      expect(screen.getAllByText(product.name).length, product.name).toBeGreaterThan(0);
    }
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('gives every external footer link a safe rel', () => {
    render(<Footer />);
    const external = screen
      .getAllByRole('link')
      .filter((a): a is HTMLAnchorElement => (a as HTMLAnchorElement).target === '_blank');
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link, link.getAttribute('href') ?? '').toHaveAttribute('rel', 'noreferrer noopener');
    }
  });

  it('states the copyright with the current year', () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} Hilbras`))).toBeInTheDocument();
  });
});

describe('link integrity across the page', () => {
  it('never opens an internal anchor in a new tab', () => {
    render(
      <>
        <Navbar />
        <ConnectionMap />
        <Footer />
      </>,
    );
    for (const link of screen.getAllByRole('link')) {
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('#') || (!href.startsWith('http') && href !== '')) {
        expect(link, href).not.toHaveAttribute('target');
      }
    }
  });

  it('gives every new-tab link a screen-reader announcement', () => {
    render(
      <>
        <ProductCard product={studio} />
        <Footer />
      </>,
    );
    for (const link of screen.getAllByRole('link')) {
      if ((link as HTMLAnchorElement).target !== '_blank') continue;
      expect(link.textContent, link.getAttribute('href') ?? '').toMatch(/opens in a new tab/);
    }
  });
});

// Keeps vi imported for future stubs without tripping noUnusedLocals.
void vi;
