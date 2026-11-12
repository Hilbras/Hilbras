"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

const LINK_DISTANCE = 118;
const MAX_PARTICLES = 72;
const MAX_PARTICLES_COMPACT = 30;
const MIN_PARTICLES = 18;
const AREA_PER_PARTICLE = 28000;
const FRAME_INTERVAL_MS = 1000 / 30;

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compact = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    const maxParticles = compact ? MAX_PARTICLES_COMPACT : MAX_PARTICLES;

    let frame = 0;
    let lastDraw = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let accent = "";
    const particles: Particle[] = [];

    const readAccent = () => {
      accent = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
    };

    const makeParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      radius: Math.random() * 1.4 + 0.55,
    });

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

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    readAccent();
    resize();
    if (reducedMotion) draw();
    else start();

    const observer = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw();
    });
    observer.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      readAccent();
      if (reducedMotion) draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}
