import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Hover intent for the products menu.
 *
 * Pointer users get the menu without a click, but not instantly: the delay stops
 * a menu from opening under a cursor merely passing over it on the way to
 * somewhere else, and the matching close delay stops it vanishing while the
 * pointer crosses from the trigger into the panel.
 *
 * This was a real bug twice over, which is why it is its own module and not four
 * `useRef`s in the navbar:
 *
 * - Escape has to cancel the pending open. A pointer resting over the trigger
 *   means `mouseenter` already queued one, and it landed about 80ms after
 *   Escape dismissed the panel — so the panel reopened itself, with focus on the
 *   trigger and `aria-expanded` disagreeing about it.
 * - A close has to cancel the pending open in `useDisclosure` for the same
 *   reason, one layer down.
 *
 * Both timers are cancelled on unmount, which is the other reason this is not
 * inline: a `setTimeout` that outlives its component fires against nothing.
 */
export type HoverIntent = {
  /** Cancels both timers. Call this on Escape and on unmount. */
  cancel: () => void;
  scheduleOpen: () => void;
  scheduleClose: () => void;
};

type HoverIntentOptions = {
  open: () => void;
  close: () => void;
  /** How long the pointer must rest before the menu opens. */
  openDelay?: number;
  /** How long it must be gone before the menu closes. */
  closeDelay?: number;
};

export function useHoverIntent({
  open,
  close,
  openDelay = 80,
  closeDelay = 120,
}: HoverIntentOptions): HoverIntent {
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancel = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  const scheduleOpen = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(open, openDelay);
  }, [open, openDelay]);

  const scheduleClose = useCallback(() => {
    cancel();
    closeTimer.current = window.setTimeout(close, closeDelay);
  }, [cancel, close, closeDelay]);

  useEffect(() => cancel, [cancel]);

  return { cancel, scheduleOpen, scheduleClose };
}

/**
 * Escape closes both panels and returns focus to the products trigger.
 *
 * Bound once, on the document, so Escape works wherever focus happens to be —
 * including on a product link inside the panel, where a handler scoped to the
 * button would not fire.
 */
export function useDismissOnEscape(
  panels: ReadonlyArray<{ close: () => void }>,
  returnFocusTo: RefObject<HTMLElement | null>,
  cancelPendingIntent: () => void,
): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Cancelling the hover intent comes first. Closing the panel is not
      // enough: Escape is almost always pressed with the pointer still resting
      // on the trigger, so a queued open lands about 80ms later and undoes it.
      cancelPendingIntent();
      for (const panel of panels) panel.close();
      returnFocusTo.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [panels, returnFocusTo, cancelPendingIntent]);
}
