/**
 * Re-exported from its new home in `./navbar/Navbar.tsx`.
 *
 * The header was split into four parts because it had accumulated two timing
 * bugs that were impossible to see in a 241-line file: a close that a pending
 * animation frame could undo, and a hover-intent timer that reopened the panel
 * after Escape. Both are now documented in `./navbar/useHoverIntent.ts`, next to
 * the code that has to get them right.
 *
 * This file remains so `import { Navbar } from './Navbar'` keeps working; the
 * tests import it and there is no reason for them to know the new structure.
 */
export { Navbar } from './navbar/Navbar';
