import { About } from '../components/About';
import { Audiences } from '../components/Audiences';
import { ConnectionMap } from '../components/ConnectionMap';
import { Ecosystem } from '../components/Ecosystem';
import { FinalCta } from '../components/FinalCta';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { Navbar } from '../components/Navbar';
import { ParticleField } from '../components/ParticleField';
import { Philosophy } from '../components/Philosophy';
import { Products } from '../components/Products';
import { Technology } from '../components/Technology';
import { Vision } from '../components/Vision';

export function HomePage() {
  return (
    <>
      <div className="page-enter min-h-screen overflow-x-clip">
        <ParticleField />
        <Navbar />

        {/* `tabindex` so the skip link moves focus, not just the scroll position.
            The hero owns the single h1; every section heading is an h2. */}
        <main id="main" tabIndex={-1}>
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
        </main>

        <Footer />
      </div>
    </>
  );
}
