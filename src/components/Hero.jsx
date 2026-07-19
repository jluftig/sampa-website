import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LOGO_VB, markSvgString, sampleMarkPoints } from './heroMark';

// "Assembly" hero: ~6k particles assemble into the SAMPA wordmark, breathe with
// the cursor, scatter on click, and always spring back home. Chosen from the
// July 2026 hero exploration (concept 03).

const TEAL_SHADES = ['#2E9C91', '#36A79C', '#4BB8AC'];
const PURPLE_SHADES = ['#7D14B5', '#8513C1', '#9C3BD3'];
const REPEL_RADIUS = 110;   // px around the cursor that pushes particles away
const SPRING = 0.055;       // pull toward home position
const DAMPING = 0.86;       // velocity decay per frame

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));

export default function Hero() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const markZoneRef = useRef(null);
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reducedMotion) return undefined;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const markZone = markZoneRef.current;
    if (!section || !canvas || !markZone) return undefined;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let parts = null;
    let born = 0;
    let disposed = false;
    let rafId = 0;

    const pointer = { x: -9999, y: -9999 };

    // Size the canvas to the section and aim each particle's home at the
    // (layout-driven) mark zone. Runs on mount and on every resize; particles
    // keep their current positions and spring to the new homes.
    function layout() {
      const rect = section.getBoundingClientRect();
      const zone = markZone.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!parts) return;
      const zx = zone.left - rect.left;
      const zy = zone.top - rect.top;
      const cell = zone.width / (w > 900 ? 280 : 160);
      for (const p of parts) {
        p.hx = zx + p.nx * zone.width;
        p.hy = zy + p.ny * (zone.width * (LOGO_VB.h / LOGO_VB.w));
        p.size = clamp(cell * 0.38, 1.1, 2.7);
      }
    }

    sampleMarkPoints(window.innerWidth > 900 ? 280 : 160).then(({ pts }) => {
      if (disposed) return;
      const rect = section.getBoundingClientRect();
      parts = pts.map((p) => {
        const a = rnd(Math.PI * 2);
        const R = Math.hypot(rect.width, rect.height) * rnd(0.42, 0.75);
        return {
          nx: p.x,
          ny: p.y,
          hx: 0,
          hy: 0,
          x: rect.width / 2 + Math.cos(a) * R,
          y: rect.height * 0.42 + Math.sin(a) * R,
          sx: 0,
          sy: 0,
          vx: 0,
          vy: 0,
          delay: p.x * 0.9 + rnd(0.3),
          size: 2,
          col: (p.c ? PURPLE_SHADES : TEAL_SHADES)[Math.floor(rnd(3))],
        };
      });
      for (const p of parts) {
        p.sx = p.x;
        p.sy = p.y;
      }
      layout();
      born = performance.now();
    });

    function frame() {
      ctx.clearRect(0, 0, w, h);
      if (parts) {
        const tSec = (performance.now() - born) / 1000;
        const R2 = REPEL_RADIUS * REPEL_RADIUS;
        for (const p of parts) {
          const e = clamp((tSec - p.delay) / 1.15, 0, 1);
          if (e < 1) {
            const k = easeOutCubic(e);
            p.x = p.sx + (p.hx - p.sx) * k;
            p.y = p.sy + (p.hy - p.sy) * k;
          } else {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / REPEL_RADIUS) * 2.6;
              p.vx += (dx / d) * f;
              p.vy += (dy / d) * f;
            }
            p.vx += (p.hx - p.x) * SPRING;
            p.vy += (p.hy - p.y) * SPRING;
            p.vx *= DAMPING;
            p.vy *= DAMPING;
            p.x += p.vx;
            p.y += p.vy;
          }
          ctx.fillStyle = p.col;
          const s = p.size;
          ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
        }
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    function onPointerMove(e) {
      const rect = section.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }

    function scatter(cx, cy) {
      if (!parts) return;
      for (const p of parts) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const d = Math.hypot(dx, dy) || 1;
        const f = d < 420 ? rnd(10, 22) : rnd(2, 4.5);
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f - rnd(1.5);
      }
    }

    function onClick(e) {
      if (e.target.closest('a, button')) return;
      const rect = section.getBoundingClientRect();
      scatter(e.clientX - rect.left, e.clientY - rect.top);
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('click', onClick);
    const ro = new ResizeObserver(layout);
    ro.observe(section);

    if (import.meta.env.DEV) {
      // Frame pump for automated review in hidden windows (rAF suspended).
      window.__heroStep = (n = 1) => {
        for (let i = 0; i < n; i += 1) {
          cancelAnimationFrame(rafId);
          frame();
        }
      };
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('click', onClick);
      ro.disconnect();
      if (import.meta.env.DEV) delete window.__heroStep;
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 pt-24 pb-16 bg-gradient-to-br from-[#FBFCFC] via-[#F0F7F5] to-[#F6F0F8]"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full"
      />

      <div className="relative z-10 w-full flex flex-col items-center text-center">
        {/* Layout target the particles assemble into (holds the static mark when motion is reduced). */}
        <div
          ref={markZoneRef}
          className="w-[min(90vw,1100px)] md:w-[min(74vw,1100px)] aspect-[711/183] mb-[6vh]"
          {...(reducedMotion
            ? { dangerouslySetInnerHTML: { __html: markSvgString({ holeFill: '#F4F7F5' }) } }
            : { 'aria-hidden': 'true' })}
        />
        {!reducedMotion && <span className="sr-only">SAMPA</span>}

        <div className="font-data text-[11px] md:text-xs tracking-[0.22em] uppercase text-text/60 mb-5">
          Society of Addiction Medicine PAs
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text mb-6 [text-wrap:balance]">
          Stronger <span className="font-drama font-semibold">together</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-xl text-text/70 leading-relaxed font-medium">
          SAMPA connects the physician associates delivering evidence-based,
          patient-centered care to people and communities impacted by substance
          use disorder.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <a
            href="#membership"
            className="btn-magnetic bg-primary-text text-white text-lg px-8 py-4 rounded-full shadow-xl shadow-primary/20 group flex items-center justify-center"
          >
            <span>Join as a Founding Member</span>
            <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </a>
          <Link
            to="/news"
            className="px-8 py-4 rounded-full text-text/80 hover:text-primary-text font-semibold transition-colors"
          >
            Read the news
          </Link>
        </div>
      </div>
    </section>
  );
}
