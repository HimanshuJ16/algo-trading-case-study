"use client";

import { useEffect, useRef } from "react";
import { rail as railCopy, sections } from "@/content/caseStudy";
import { registerGsap, ScrollTrigger } from "@/lib/motion";

const { sessionOpen, sessionClose, clockSuffix, preludeIndex, preludeKicker } = railCopy;
const OPEN_MIN = sessionOpen.h * 60 + sessionOpen.m;
const CLOSE_MIN = sessionClose.h * 60 + sessionClose.m;

const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * One amber thread down the left edge, drawn by scroll, with a tick for each
 * chapter and a clock that walks the session from the open to the close. The
 * page is a trading day; the thread is how far into it you are.
 *
 * Everything here writes straight to the DOM from a single ScrollTrigger
 * update, so scrolling never re-renders React.
 */
export default function Rail() {
  const root = useRef<HTMLDivElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const index = useRef<HTMLSpanElement>(null);
  const kicker = useRef<HTMLSpanElement>(null);
  const ticks = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    registerGsap();

    // Tick positions are a fraction of the whole document, so they are
    // recomputed whenever ScrollTrigger re-measures (fonts, resize, the
    // trade and strategy tracks settling on their real heights).
    const place = () => {
      const height = document.documentElement.scrollHeight;
      if (!height) return;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        const tick = ticks.current[i];
        if (el && tick) tick.style.top = `${(el.offsetTop / height) * 100}%`;
      });
    };
    ScrollTrigger.addEventListener("refresh", place);
    place();

    const progress = ScrollTrigger.create({
      trigger: "#main",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        const pct = `${(p * 100).toFixed(2)}%`;
        if (thread.current) thread.current.style.height = pct;
        if (dot.current) dot.current.style.top = pct;
        if (clock.current) clock.current.textContent = hhmm(Math.round(OPEN_MIN + (CLOSE_MIN - OPEN_MIN) * p));
      },
    });

    // The rail stays out of the hero; it fades in once the reader has
    // committed to scrolling past it.
    const hero = document.getElementById(sections[0].id)?.previousElementSibling;
    const reveal = ScrollTrigger.create({
      trigger: "#main",
      start: "top top",
      end: "max",
      onUpdate: () => {
        const el = root.current;
        if (!el) return;
        const past = window.scrollY > (hero instanceof HTMLElement ? hero.offsetHeight : window.innerHeight) * 0.6;
        el.dataset.shown = past ? "1" : "0";
      },
    });

    // Each chapter claims the rail label while it straddles the midline.
    const chapters = sections.map((s, i) => {
      const el = document.getElementById(s.id);
      if (!el) return null;
      const setLabel = (on: boolean) => {
        const tick = ticks.current[i];
        if (tick) tick.dataset.active = on ? "1" : "0";
        if (!on) return;
        if (index.current) index.current.textContent = `CH.${s.index}`;
        if (kicker.current) kicker.current.textContent = s.kicker;
      };
      return ScrollTrigger.create({
        trigger: el,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => {
          setLabel(self.isActive);
          // Scrolling back above chapter one returns the rail to the open.
          if (!self.isActive && self.direction === -1 && i === 0) {
            if (index.current) index.current.textContent = preludeIndex;
            if (kicker.current) kicker.current.textContent = preludeKicker;
          }
        },
      });
    });

    return () => {
      ScrollTrigger.removeEventListener("refresh", place);
      progress.kill();
      reveal.kill();
      chapters.forEach((t) => t?.kill());
    };
  }, []);

  return (
    <div ref={root} className="rail" data-shown="0" aria-hidden="true">
      <div className="rail-col">
        <div className="rail-groove" />
        <div ref={thread} className="rail-thread" />
        <div ref={dot} className="rail-dot" />
        {sections.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rail-tick"
            data-active="0"
            ref={(el) => {
              ticks.current[i] = el;
            }}
            tabIndex={-1}
          />
        ))}
      </div>
      <div className="rail-foot rail-foot-l">
        <span ref={index} className="text-accent">
          {preludeIndex}
        </span>
        <span ref={kicker} className="text-fg">
          {preludeKicker}
        </span>
      </div>
      <div className="rail-foot rail-foot-r">
        <span ref={clock} className="text-[0.85rem] tracking-[0.08em] text-fg tabular-nums">
          {hhmm(OPEN_MIN)}
        </span>
        <span>{clockSuffix}</span>
      </div>
    </div>
  );
}
