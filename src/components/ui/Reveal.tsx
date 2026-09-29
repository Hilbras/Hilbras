import { useCallback, useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  /** `item` for text blocks, `card` for surfaces that also scale in. */
  variant?: 'item' | 'card';
  className?: string;
  as?: ElementType;
};

/**
 * A scroll reveal with no animation library behind it.
 *
 * The hidden state lives in CSS, gated on `html.has-js` and on the absence of a
 * reduced-motion preference, so the page is never hidden from someone who
 * cannot or does not want to see the transition. This component only adds a
 * class; it never sets an inline style, which is what keeps it compositor-only.
 */
export function Reveal({ children, variant = 'item', className = '', as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Anything that cannot observe is shown immediately rather than left hidden.
    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          element.classList.add('is-visible');
          observer.disconnect();
        }
      },
      // The same threshold the reference implementation used, so a card counts
      // as revealed once about a sixth of it is on screen.
      { threshold: 0.16 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal reveal-${variant} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

/**
 * A disclosure that can animate its own exit.
 *
 * An animation library normally owns this bookkeeping. The only part that is not
 * a plain CSS transition is *when to unmount*, so the hook owns that and hands
 * the caller `open` / `close` / `toggle` rather than a boolean to set — which
 * also means the open and close paths cannot be used inconsistently.
 */
export function useDisclosure(duration = 180) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<'open' | 'closed'>('closed');

  const closeTimer = useRef(0);
  const openFrame = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
      window.cancelAnimationFrame(openFrame.current);
    },
    [],
  );

  const open = useCallback(() => {
    setIsOpen(true);
    setMounted(true);
    window.clearTimeout(closeTimer.current);
    window.cancelAnimationFrame(openFrame.current);
    // A frame later, so the browser has the closed styles to transition from.
    openFrame.current = window.requestAnimationFrame(() => setState('open'));
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setState('closed');
    window.clearTimeout(closeTimer.current);
    // Cancel the pending open frame. Without this, a close that lands in the same
    // tick as an open — Escape pressed immediately after opening, or a click
    // followed by a blur — is undone when the frame fires, leaving a panel
    // rendered fully open while `aria-expanded` says it is closed.
    window.cancelAnimationFrame(openFrame.current);
    // Stay mounted for the length of the transition so the exit is not cut off.
    closeTimer.current = window.setTimeout(() => setMounted(false), duration);
  }, [duration]);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  return { isOpen, mounted, state, open, close, toggle };
}
