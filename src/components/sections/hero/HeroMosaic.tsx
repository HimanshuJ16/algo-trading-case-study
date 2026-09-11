"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { gsap, registerGsap, hasFinePointer } from "@/lib/motion";
import { tapeRows, priceFmt, chgFmt, changePct, mulberry32, tickSymbol, collectCells } from "@/lib/tape";
import { heroBus } from "@/lib/heroBus";

/**
 * The market as a mosaic: one tile per symbol, tinted by the sign and size of
 * its real move on the day. A scheduler nudges one price at a time inside
 * that symbol's real range, flashes the tile and reports its centre to the
 * WebGL field. On fine pointers each tile is a damped spring: the cursor
 * pushes it aside and it settles back with a little overshoot. The parent
 * timeline handles the entrance (tiles carry `data-tile`). Reduced motion:
 * static tiles at the close, no springs.
 */
export default function HeroMosaic({ active, limit }: { active: boolean; limit?: number }) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const rows = limit ? tapeRows.slice(0, limit) : tapeRows;

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Ticking.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const rand = mulberry32(20260907 + rows.length);
    const cells = collectCells(root);
    const price = tapeRows.map((r) => r.c);
    let timer = 0;
    const tick = () => {
      timer = window.setTimeout(() => {
        if (activeRef.current && !document.hidden && root.getClientRects().length) {
          const idx = Math.floor(rand() * rows.length);
          const before = price[idx];
          const next = tickSymbol(idx, price, cells, rand);
          const el = cells.get(idx)?.[0];
          if (el) {
            const r = el.getBoundingClientRect();
            heroBus.emit({ x: r.left + r.width / 2, y: r.top + r.height / 2, dir: next > before ? "up" : next < before ? "down" : "" });
          }
        }
        tick();
      }, 420 + rand() * 700);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [reduced, rows.length]);

  // Spring physics: tiles yield to the cursor and settle back.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || !hasFinePointer()) return;
    registerGsap();
    const tiles = Array.from(root.querySelectorAll<HTMLElement>("[data-tile]"));
    type Body = { el: HTMLElement; cx: number; cy: number; x: number; y: number; vx: number; vy: number; sx: (v: number) => void; sy: (v: number) => void };
    const bodies: Body[] = tiles.map((el) => ({
      el,
      cx: 0,
      cy: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      sx: gsap.quickSetter(el, "x", "px") as (v: number) => void,
      sy: gsap.quickSetter(el, "y", "px") as (v: number) => void,
    }));
    // Centres in page coordinates; refreshed on resize.
    const measure = () => {
      bodies.forEach((b) => {
        const r = b.el.getBoundingClientRect();
        b.cx = r.left + r.width / 2 - b.x + window.scrollX;
        b.cy = r.top + r.height / 2 - b.y + window.scrollY;
      });
    };
    measure();
    const mouse = { x: -1e4, y: -1e4, on: false };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX + window.scrollX;
      mouse.y = e.clientY + window.scrollY;
      mouse.on = true;
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onLeave = () => (mouse.on = false);
    const K = 0.09; // spring stiffness
    const D = 0.78; // damping
    const R = 150; // cursor influence radius, px
    let raf = 0;
    const step = () => {
      raf = 0;
      if (!activeRef.current) return;
      let moving = false;
      for (const b of bodies) {
        let tx = 0;
        let ty = 0;
        if (mouse.on) {
          const dx = b.cx - mouse.x;
          const dy = b.cy - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < R && d > 0.001) {
            const f = (1 - d / R) * 22;
            tx = (dx / d) * f;
            ty = (dy / d) * f;
          }
        }
        b.vx = (b.vx + (tx - b.x) * K) * D;
        b.vy = (b.vy + (ty - b.y) * K) * D;
        b.x += b.vx;
        b.y += b.vy;
        if (Math.abs(b.vx) > 0.02 || Math.abs(b.vy) > 0.02 || Math.abs(b.x) > 0.05 || Math.abs(b.y) > 0.05) moving = true;
        b.sx(b.x);
        b.sy(b.y);
      }
      if (moving) raf = requestAnimationFrame(step);
    };
    const onResize = () => measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      bodies.forEach((b) => {
        b.sx(0);
        b.sy(0);
      });
    };
  }, [reduced, rows.length]);

  return (
    <div ref={rootRef} className="mosaic" aria-hidden="true">
      {rows.map((r, i) => {
        const chg = changePct(r.c, r);
        const k = Math.min(1, Math.abs(chg) / 6);
        return (
          <div
            key={r.s}
            data-tile
            data-i={reduced ? -1 : i}
            data-dir={chg > 0 ? "up" : chg < 0 ? "down" : ""}
            className="tape-cell mosaic-tile js-reveal"
            style={{ ["--k" as string]: k.toFixed(2) }}
          >
            <span className="tape-sym">{r.s}</span>
            <span className="tape-px">{priceFmt.format(r.c)}</span>
            <span className="tape-chg">{chgFmt.format(chg)}%</span>
          </div>
        );
      })}
    </div>
  );
}
