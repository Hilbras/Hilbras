import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

const LINK_DISTANCE = 118;
const MAX_PARTICLES = 72;
/** A phone gains nothing from a dense field and pays for it in battery. */
const MAX_PARTICLES_COMPACT = 30;
const MIN_PARTICLES = 18;
const AREA_PER_PARTICLE = 28000;

/**
 * The field drifts at well under a pixel per frame, so drawing it at the display
 * refresh rate is invisible work. Half the rate is indistinguishable and halves
 * the cost.
 */
const FRAME_INTERVAL_MS = 1000 / 30;

/**
 * A slow drifting node field behind the whole page. Reads as a network, which is
 * the one idea the site keeps returning to.
 *
 * Four things keep it cheap, and the numbers are why:
 *
 * - `Math.sqrt` instead of `Math.hypot`. The pair loop is the only real work
 *   here, and `hypot` is written to survive overflow that a canvas coordinate
 *   never produces. Measured at 72 particles: 0.229 ms per frame with `hypot`,
 *   0.037 ms with `sqrt` — a 6.3x difference.
 * - No spatial partitioning. A uniform grid was measured against this and came
 *   out at 0.173 ms, slower than the plain `sqrt` loop, because 72 particles is
 *   2,556 pairs and the counting sort costs more than the pairs it skips. It
 *   would only start paying off in the thousands.
 * - A `ResizeObserver` on the canvas rather than a window `resize` listener.
 *   The canvas is fixed and full-viewport, so it does not change size when a
 *   mobile browser hides its URL bar — but a window listener still fires, and
 *   the old handler rebuilt the entire field on every one of those events.
 * - 30 fps rather than the display rate, which is invisible at 0.2 px per frame
 *   and halves the work.
 *
 * On pausing when the section scrolls out of view: that does not apply here, and
 * it is worth being precise about why rather than adding a no-op observer. The
 * canvas is `position: fixed` and covers the viewport, so an
 * `IntersectionObserver` on it reports intersecting continuously — it is never
 * offscreen, no matter where the page is scrolled. Scoping the field to the hero
 * would make the observation meaningful, and would also mean the rest of the page
 * has no background, which is a design change rather than an optimisation.
 *
 * What actually stops the work is the tab being hidden, which `visibilitychange`
 * handles, and that is the only real offscreen condition this element has. The
 * one genuine bug of this kind was a size, not a lifetime: an ancestor
 * `transform` made this element's containing block the document, so it sized to
 * 10,584px and cleared 15 million pixels a frame. `tests/e2e/theme.spec.ts`
 * asserts the canvas is viewport-sized for exactly that reason.
 *
 * Under `prefers-reduced-motion` it paints a single static frame instead of
 * animating, so the texture survives without the movement.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compact = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    const maxParticles = compact ? MAX_PARTICLES_COMPACT : MAX_PARTICLES;

    let frame = 0;
    let lastDraw = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    // Resolved from the `--gold` token before the first paint. A hardcoded
    // fallback would drift the moment the accent changed, and a canvas has to be
    // given a concrete colour, so the token is read rather than referenced.
    let accent = '';
    // Mutated in place by `resize`, never reassigned.
    const particles: Particle[] = [];

    const readAccent = () => {
      accent = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim();
    };

    const makeParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      radius: Math.random() * 1.4 + 0.55,
    });

    /**
     * Resizes the backing store and reconciles the particle count, keeping the
     * particles that already exist and repositioning them into the new bounds.
     * Rebuilding from scratch on every resize made the field visibly reset.
     */
    const resize = () => {
      const previousWidth = width;
      const previousHeight = height;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (previousWidth && previousHeight) {
        const scaleX = width / previousWidth;
        const scaleY = height / previousHeight;
        for (const particle of particles) {
          particle.x *= scaleX;
          particle.y *= scaleY;
        }
      }

      const target = Math.min(
        maxParticles,
        Math.max(MIN_PARTICLES, Math.round((width * height) / AREA_PER_PARTICLE)),
      );

      while (particles.length > target) particles.pop();
      while (particles.length < target) particles.push(makeParticle());
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.lineWidth = 1;
      context.strokeStyle = accent;

      for (let i = 0; i < particles.length; i += 1) {
        const first = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const second = particles[j];
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance >= LINK_DISTANCE) continue;

          context.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.25;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }

      context.fillStyle = accent;
      context.globalAlpha = 0.62;
      for (const particle of particles) {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const step = (now: number) => {
      frame = window.requestAnimationFrame(step);
      if (now - lastDraw < FRAME_INTERVAL_MS) return;
      lastDraw = now;

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
      }
      draw();
    };

    const start = () => {
      if (reducedMotion || frame !== 0) return;
      lastDraw = 0;
      frame = window.requestAnimationFrame(step);
    };

    const stop = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
    };

    // A hidden tab should not be paying for a background texture.
    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    readAccent();
    resize();
    if (reducedMotion) draw();
    else start();

    // Observes the canvas itself. A window `resize` listener also fires when a
    // mobile browser collapses its URL bar, which resized nothing and rebuilt
    // the field anyway.
    const observer = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw();
    });
    observer.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      readAccent();
      if (reducedMotion) draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}
