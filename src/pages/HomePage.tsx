import { About } from '../components/About';
import { Audiences } from '../components/Audiences';
import { ConnectionMap } from '../components/ConnectionMap';
import { Ecosystem } from '../components/Ecosystem';
import { FinalCta } from '../components/FinalCta';
import { Hero } from '../components/Hero';
import { Philosophy } from '../components/Philosophy';
import { Products } from '../components/Products';
import { Technology } from '../components/Technology';
import { Vision } from '../components/Vision';

/**
 * The homepage.
 *
 * Just the sections, in order. The chrome — the canvas, the navigation, the
 * footer — belongs to `App`, which every page shares, so adding a page does not
 * mean copying the shell.
 *
 * The roadmap's constraint is the reason this page has not grown: it represents
 * the company and the ecosystem, and detailed product information belongs on the
 * product pages, which is where it went.
 *
 * Section order lives here and nowhere else.
 */
export function HomePage() {
  return (
    // The hero owns the single h1; every section heading is an h2. The `main`
    // element and the chrome belong to `App`.
    <>
      <Hero />
      <About />
      <Ecosystem />
      <Products />
      <ConnectionMap />
      <Technology />
      <Audiences />
      <Philosophy />
      <Vision />
      <FinalCta />
    </>
  );
}
