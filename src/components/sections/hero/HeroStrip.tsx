"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { tapeRows, priceFmt, chgFmt, changePct, mulberry32, tickSymbol, collectCells } from "@/lib/tape";

/**
 * One-row ticker strip along the bottom edge of the hero: a seamless marquee
 * of the real symbols, with one price nudged every 0.6–1.4 s inside its real
 * day range. Pauses when the hero is off-screen or the tab is hidden.
 * Reduced motion: a static, clipped row.
 */
export default function HeroStrip({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    registerGsap();
    const track = root.querySelector<HTMLElement>(".strip-track");
    if (!track) return;

    const marquee = gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 140, ease: "none", repeat: -1 });
    const rand = mulberry32(20260907);
    const cells = collectCells(root);
    const price = tapeRows.map((r) => r.c);
    let paused = !activeRef.current || document.hidden;
    let timer = 0;
    const tick = () => {
      timer = window.setTimeout(() => {
        if (!paused) tickSymbol(Math.floor(rand() * tapeRows.length), price, cells, rand);
        tick();
      }, 600 + rand() * 800);
    };
    tick();
    const sync = () => {
      paused = !activeRef.current || document.hidden;
      if (paused) marquee.pause();
      else marquee.resume();
    };
    document.addEventListener("visibilitychange", sync);
    const poll = window.setInterval(sync, 400);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", sync);
      marquee.kill();
    };
  }, [reduced]);

  const cells = (dup: number) =>
    tapeRows.map((r, i) => {
      const chg = changePct(r.c, r);
      return (
        <span key={`${dup}-${r.s}`} className="tape-cell" data-i={reduced ? -1 : i} data-dir={chg > 0 ? "up" : chg < 0 ? "down" : ""}>
          <span className="tape-sym">{r.s}</span>
          <span className="tape-px">{priceFmt.format(r.c)}</span>
          <span className="tape-chg">{chgFmt.format(chg)}%</span>
        </span>
      );
    });

  return (
    <div ref={rootRef} className="strip" aria-hidden="true">
      <div className="strip-track">
        {cells(0)}
        {!reduced ? cells(1) : null}
      </div>
    </div>
  );
}
