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
const MIN_PARTICLES = 24;
const AREA_PER_PARTICLE = 28000;

/**
 * A slow drifting node field behind the whole page. Reads as a network, which is
 * the one idea the site keeps returning to.
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
    let frame = 0;
    let width = 0;
    let height = 0;
    // Resolved from the `--gold` token before the first paint. A hardcoded
    // fallback would drift the moment the accent changed, and a canvas has to be
    // given a concrete colour, so the token is read rather than referenced.
    let accent = '';
    let particles: Particle[] = [];

    const readAccent = () => {
      accent = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, Math.round((width * height) / AREA_PER_PARTICLE)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.4 + 0.55,
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.lineWidth = 1;
      context.strokeStyle = accent;

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const first = particles[i];
          const second = particles[j];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
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

    const step = () => {
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
      }
      draw();
      frame = window.requestAnimationFrame(step);
    };

    // The page is long; the field is expensive to keep alive in the background.
    // Pause it when the tab is hidden.
    const handleVisibility = () => {
      if (reducedMotion) return;
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      if (frame === 0) frame = window.requestAnimationFrame(step);
    };

    readAccent();
    resize();
    if (reducedMotion) draw();
    else frame = window.requestAnimationFrame(step);

    const handleResize = () => {
      resize();
      if (reducedMotion) draw();
    };
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    const themeObserver = new MutationObserver(() => {
      readAccent();
      if (reducedMotion) draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}
