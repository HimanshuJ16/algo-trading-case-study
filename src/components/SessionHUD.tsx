"use client";

import { useEffect, useRef, useState } from "react";
import { hud, sections } from "@/content/caseStudy";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion } from "@/lib/motion";
import { useLenis } from "@/components/SmoothScroll";
import { easeOutExpo } from "@/lib/motion";

/**
 * Fixed session HUD. The page is mapped onto one trading day: a clock runs
 * from 09:15 to 15:30 as you scroll, a marker rides a vertical rail, and a
 * "stop" line ratchets behind the marker. The stop never moves back up, the
 * way the engine's trailing stop never widens. Section ticks on the rail are
 * real links. Hidden until the hero is mostly scrolled, and on narrow screens.
 */
export default function SessionHUD() {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<string>(sections[0].id);
  const lenisRef = useLenis();

  useEffect(() => {
    const root = rootRef.current;
    const rail = railRef.current;
    const marker = markerRef.current;
    const stop = stopRef.current;
    const clock = clockRef.current;
    if (!root || !rail || !marker || !stop || !clock) return;
    registerGsap();
    const reduced = prefersReducedMotion();

    const open = hud.sessionOpen.h * 60 + hud.sessionOpen.m;
    const close = hud.sessionClose.h * 60 + hud.sessionClose.m;
    let lastMinute = -1;
    let high = 0;

    const my = gsap.quickTo(marker, "y", { duration: reduced ? 0 : 0.35, ease: "settle" });
    const sy = gsap.quickTo(stop, "y", { duration: reduced ? 0 : 0.6, ease: "reveal" });

    const update = (p: number) => {
      const h = rail.clientHeight;
      my(p * h);
      if (p > high) {
        high = p;
        sy(high * h);
      }
      const minute = Math.round(open + (close - open) * p);
      if (minute !== lastMinute) {
        lastMinute = minute;
        const hh = String(Math.floor(minute / 60)).padStart(2, "0");
        const mm = String(minute % 60).padStart(2, "0");
        clock.textContent = `${hh}:${mm}`;
      }
    };

    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });

    // Visible once the hero is mostly gone.
    const hero = document.querySelector("main > section");
    const show = (on: boolean) => gsap.to(root, { autoAlpha: on ? 1 : 0, duration: reduced ? 0 : 0.5, ease: "settle", overwrite: "auto" });
    const vis = hero
      ? ScrollTrigger.create({
          trigger: hero,
          start: "60% top",
          end: "60% top",
          onEnter: () => show(true),
          onLeaveBack: () => show(false),
          onRefresh: (self) => show(self.progress > 0 || window.scrollY > (hero as HTMLElement).offsetHeight * 0.6),
        })
      : null;

    // Current section label.
    const secTriggers = sections.map((s) =>
      ScrollTrigger.create({
        trigger: `#${s.id}`,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => self.isActive && setCurrent(s.id),
      }),
    );

    update(0);
    return () => {
      st.kill();
      vis?.kill();
      secTriggers.forEach((t) => t.kill());
    };
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const lenis = lenisRef.current;
    const target = document.getElementById(id);
    if (!lenis || !target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4, easing: easeOutExpo });
    history.replaceState(null, "", `#${id}`);
  };

  const active = sections.find((s) => s.id === current) ?? sections[0];

  return (
    <div ref={rootRef} className="hud js-reveal font-sans" aria-hidden={false}>
      <div className="hud-corner hud-left">
        <span className="hud-index">{active.index}</span>
        <span className="hud-kicker">{active.kicker}</span>
      </div>
      <div className="hud-corner hud-right">
        <span ref={clockRef} className="hud-clock">
          09:15
        </span>
        <span className="hud-suffix">{hud.clockSuffix}</span>
      </div>
      <nav aria-label="Session rail" className="hud-rail-wrap" title={hud.hint}>
        <div ref={railRef} className="hud-rail">
          <div ref={stopRef} className="hud-stop" aria-hidden="true">
            <span>{hud.stopLabel}</span>
          </div>
          <div ref={markerRef} className="hud-marker" aria-hidden="true" />
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => go(e, s.id)}
              data-cursor="link"
              className={`hud-tick ${s.id === current ? "is-active" : ""}`}
              style={{ top: `${((i + 1) / (sections.length + 1)) * 100}%` }}
              aria-label={`${s.index} ${s.title}`}
            >
              <span className="hud-tick-label">{s.kicker}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
