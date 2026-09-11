"use client";

import { useEffect, useRef } from "react";
import { sectionBySlug, strategy } from "@/content/caseStudy";
import { registerGsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";
import ChapterHeader from "@/components/ChapterHeader";

const meta = sectionBySlug("strategy");

/**
 * The seven layers, pinned and dragged sideways. Reading order is the order a
 * signal passes through, so the chapter is horizontal on purpose: each card
 * is a gate that can veto the one before it.
 */
export default function Strategy() {
  const track = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackEl = track.current;
    const rowEl = row.current;
    if (!trackEl || !rowEl || prefersReducedMotion()) return;
    registerGsap();

    // The track is exactly as tall as the row is wide, so one screen of
    // scrolling moves one screen of cards and the pin never feels slow.
    let distance = 0;
    const measure = () => {
      distance = Math.max(0, rowEl.scrollWidth - window.innerWidth);
      trackEl.style.height = `calc(100svh + ${distance}px)`;
    };
    ScrollTrigger.addEventListener("refreshInit", measure);
    measure();

    const trigger = ScrollTrigger.create({
      trigger: trackEl,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        rowEl.style.transform = `translateX(${(-p * distance).toFixed(1)}px)`;
        const pct = `${(p * 100).toFixed(1)}%`;
        if (bar.current) bar.current.style.width = pct;
        if (dot.current) dot.current.style.left = pct;
      },
    });

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      trigger.kill();
      trackEl.style.height = "";
      rowEl.style.transform = "";
    };
  }, []);

  return (
    <section
      id={meta.id}
      aria-labelledby={`${meta.id}-title`}
      className="border-t border-line bg-bg-2 pt-[clamp(5rem,10vw,9rem)]"
    >
      <ChapterHeader meta={meta} intro={strategy.intro} className="pad-x" />

      <div ref={track} className="strategy-track">
        <div className="strategy-pin">
          <div className="strategy-progress" aria-hidden="true">
            <div ref={bar} className="strategy-bar" />
            <div ref={dot} className="strategy-dot" />
          </div>
          <ol ref={row} className="strategy-row m-0 list-none p-0">
            {strategy.layers.map((l) => (
              <li key={l.n} className="strategy-card">
                <div className="flex justify-between font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted">
                  <span>{l.name}</span>
                  <span className="text-accent">{l.n}</span>
                </div>
                <h3 className="mt-6 mb-0 text-[1.75rem] leading-[1.05] font-semibold tracking-[-0.025em] [font-variation-settings:'wdth'_90]">
                  {l.gate}
                </h3>
                <p className="mt-4 mb-0 text-[0.92rem] leading-[1.5] text-fg/80">{l.detail}</p>
                <ul className="mt-5 mb-0 flex list-none flex-wrap gap-1.5 p-0">
                  {l.params.map((p) => (
                    <li
                      key={p}
                      className="border border-line-strong px-2 py-0.5 font-mono text-[0.62rem] text-fg/85"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto mb-0 pt-6 font-mono text-[0.64rem] leading-[1.5] text-muted">{l.where}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
