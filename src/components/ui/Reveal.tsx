"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
  type Ref,
} from "react";

type RevealProps = {
  children: ReactNode;
  variant?: "item" | "card";
  className?: string;
  as?: ElementType;
  /** Forwards to the host element. The reveal's own ref is merged in. */
  ref?: Ref<HTMLElement>;
};

export function Reveal({
  children,
  variant = "item",
  className = "",
  as: Tag = "div",
  ref,
}: RevealProps) {
  const ownRef = useRef<HTMLElement>(null);

  const setRefs = (node: HTMLElement | null) => {
    ownRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref && typeof ref === "object") (ref as React.MutableRefObject<HTMLElement | null>).current = node;
  };

  useEffect(() => {
    const element = ownRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      element.classList.add("is-visible");
      return;
    }

    const box = element.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      element.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.16 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={setRefs as Ref<never>} className={`reveal reveal-${variant} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

export function useDisclosure(duration = 180) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<"open" | "closed">("closed");

  const closeTimer = useRef(0);
  const openFrame = useRef(0);
  const isOpenRef = useRef(false);

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
      window.cancelAnimationFrame(openFrame.current);
    },
    [],
  );

  const open = useCallback(() => {
    if (isOpenRef.current) return;
    isOpenRef.current = true;
    setIsOpen(true);
    setMounted(true);
    window.clearTimeout(closeTimer.current);
    window.cancelAnimationFrame(openFrame.current);
    openFrame.current = window.requestAnimationFrame(() => setState("open"));
  }, []);

  const close = useCallback(() => {
    if (!isOpenRef.current) return;
    isOpenRef.current = false;
    setIsOpen(false);
    setState("closed");
    window.clearTimeout(closeTimer.current);
    window.cancelAnimationFrame(openFrame.current);
    closeTimer.current = window.setTimeout(() => setMounted(false), duration);
  }, [duration]);

  const toggle = useCallback(() => {
    if (isOpenRef.current) close();
    else open();
  }, [close, open]);

  return { isOpen, mounted, state, open, close, toggle };
}
