import { useMemo, useRef } from 'react';
import { navLinks, site } from '../../data/site';
import { HilbrasMark } from '../ui/Mark';
import { useDisclosure } from '../ui/Reveal';
import { MobileNavigation, NavbarActions } from './NavigationParts';
import { ProductsMenu } from './ProductsMenu';
import { useDismissOnEscape, useHoverIntent } from './useHoverIntent';

/**
 * The site header.
 *
 * Composed from four parts, each in `src/components/navbar/`: the products
 * disclosure, the actions cluster, the mobile menu, and the two hooks that
 * govern their behaviour. What is left here is the arrangement, which is the
 * part that genuinely belongs in one file.
 *
 * The behaviour worth knowing about, because it is not obvious from the markup:
 *
 * - Both panels stay mounted for the length of their close transition, so the
 *   exit is animated rather than cut off.
 * - The products menu opens on a pointer hover *with an intent delay*, and on
 *   click outright. Focus alone does not open it, so the first Enter a keyboard
 *   user presses does not immediately undo what focusing did.
 * - Escape closes both panels, cancels any queued hover open, and returns focus
 *   to the products trigger.
 */
export function Navbar() {
  const productsButtonRef = useRef<HTMLButtonElement>(null);

  const mobile = useDisclosure(200);
  const dropdown = useDisclosure(180);

  const hover = useHoverIntent({ open: dropdown.open, close: dropdown.close });

  // Stable so the document-level listener binds once rather than on every
  // render of the menu's open state.
  const panels = useMemo(
    () => [{ close: mobile.close }, { close: dropdown.close }],
    [mobile.close, dropdown.close],
  );

  // Escape also has to cancel the pending hover open: it is pressed while the
  // pointer is usually still over the trigger, so without this the menu reopens
  // itself about 80ms later. It is part of dismissing, so it lives in the hook.
  useDismissOnEscape(panels, productsButtonRef, hover.cancel);

  return (
    <header className="nav-blur sticky top-0 z-50 border-b border-line/70">
      <nav className="shell relative flex h-16 items-center gap-6" aria-label="Main">
        <a href="#main" className="skip-link btn-gold">
          Skip to content
        </a>

        <a
          href="#main"
          className="flex shrink-0 items-center gap-2.5 rounded-lg text-15 font-semibold tracking-tight"
        >
          <HilbrasMark className="h-[18px] w-[18px] text-gold" />
          <span>{site.name}</span>
        </a>

        <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 lg:flex">
          <ProductsMenu disclosure={dropdown} hover={hover} buttonRef={productsButtonRef} />
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        <NavbarActions mobile={mobile} />
      </nav>

      <MobileNavigation disclosure={mobile} />
    </header>
  );
}
