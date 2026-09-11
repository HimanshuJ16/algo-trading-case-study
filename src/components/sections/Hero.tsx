"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { webglAvailable } from "@/lib/heroBus";
import { hero, sections } from "@/content/caseStudy";
import { gsap, ScrollTrigger, SplitText, registerGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSectionTheme } from "@/lib/useSectionTheme";
import Magnetic from "@/components/Magnetic";
import HeroStrip from "./hero/HeroStrip";
import HeroMosaic from "./hero/HeroMosaic";
import SplitHeadline, { type SplitHeadlineHandle } from "./hero/SplitHeadline";

/**
 * Hero. Copy on the left, the market mosaic on the right, a ticker strip on
 * the floor. Load sequence (all transform/opacity):
 *   0.00s  wipe cover scales to zero from the right
 *   0.10s  headline chars rise through per-line masks, 14 ms stagger
 *   0.45s  mosaic tiles scale in on a diagonal grid stagger
 *   0.55s  meta lines settle out of a digit scramble
 *   0.75s  sub-paragraph lines rise through masks
 *   0.95s  stats, scroll cue, strip
 * On scroll the copy lifts and fades while the mosaic drifts more slowly.
 * Reduced motion: nothing above runs; the section renders complete and static.
 */
const HeroField = dynamic(() => import("./hero/HeroField"), { ssr: false });

export default function Hero() {
  const reduced = useReducedMotion();
  const [field, setField] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const mosaicRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<SplitHeadlineHandle>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(true);

  useSectionTheme(sectionRef, "ink");

  // The field mounts on the first interaction, or 2.5 s after load, whichever
  // comes first, and only where WebGL exists. The copy is long interactive by
  // then, so the renderer's parse and compile never sit on the critical path.
  useEffect(() => {
    if (reduced || !webglAvailable()) return;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      setField(true);
    };
    const events = ["pointermove", "wheel", "touchstart", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
    const t = window.setTimeout(go, document.readyState === "complete" ? 2500 : 4000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, go));
      window.clearTimeout(t);
    };
  }, [reduced]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const copy = copyRef.current;
    const mosaic = mosaicRef.current;
    const h1 = headlineRef.current?.el;
    const cover = headlineRef.current?.cover;
    const sub = subRef.current;
    if (!section || !copy || !mosaic || !h1 || !cover || !sub) return;
    registerGsap();

    let splitH1: SplitText | null = null;
    let splitSub: SplitText | null = null;
    let cancelled = false;

    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (cancelled) return;

        splitH1 = SplitText.create(h1, {
          type: "lines,chars",
          mask: "lines",
          linesClass: "line",
          charsClass: "char",
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.chars, {
              yPercent: 112,
              duration: 1.05,
              ease: "reveal",
              stagger: { each: 0.014, from: "start" },
              delay: 0.1,
            });
          },
        });

        splitSub = SplitText.create(sub, {
          type: "lines",
          mask: "lines",
          linesClass: "line",
          autoSplit: true,
          aria: "none",
          onSplit(self) {
            return gsap.from(self.lines, { yPercent: 100, duration: 0.9, ease: "reveal", stagger: 0.07, delay: 0.75 });
          },
        });

        const tiles = mosaic.querySelectorAll("[data-tile]");
        const tl = gsap.timeline({ defaults: { ease: "reveal" } });
        tl.set([h1, cover, sub], { visibility: "visible" }, 0)
          .fromTo(cover, { scaleX: 1 }, { scaleX: 0, duration: 1.15, ease: "wipe" }, 0)
          .fromTo(
            tiles,
            { autoAlpha: 0, scale: 0.86 },
            { autoAlpha: 1, scale: 1, duration: 0.9, stagger: { each: 0.03, grid: "auto", from: "start" } },
            0.45,
          )
          .fromTo(section.querySelectorAll("[data-hero-meta]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.55);
        tl.fromTo(section.querySelectorAll("[data-hero-stat]"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06 }, 0.95)
          .fromTo(section.querySelector("[data-hero-cue]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.15)
          .fromTo(section.querySelector("[data-hero-strip]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "settle" }, 1.0);
      });

      // Scrubbed exit: the copy lifts faster than the mosaic, a quiet parallax.
      gsap.to(copy, {
        yPercent: -16,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom 30%", scrub: 0.6 },
      });
      gsap.to(mosaic, {
        yPercent: -6,
        autoAlpha: 0.25,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
      });
    }, section);

    return () => {
      cancelled = true;
      splitH1?.revert();
      splitSub?.revert();
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [reduced]);

  const next = sections[0];

  return (
    <section ref={sectionRef} className="hero relative isolate flex min-h-[100svh] flex-col overflow-hidden" aria-labelledby="hero-title">
      <p className="sr-only">{hero.tapeCaption}</p>
      {field ? (
        <div className="hero-field-wrap" aria-hidden="true">
          <HeroField active={active} />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-14 pt-6 sm:px-8 md:px-12 lg:px-16">
        {/* Top row */}
        <div className="flex flex-col gap-1.5 font-sans text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <p data-hero-meta className="js-reveal">
            {hero.eyebrow}
          </p>
          <p data-hero-meta className="js-reveal sm:text-right">
            {hero.meta}
          </p>
        </div>

        <div className="grid flex-1 grid-cols-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          {/* Copy */}
          <div ref={copyRef} className="flex flex-col justify-center">
            <span id="hero-title" className="sr-only">
              {hero.headline.lead} {hero.headline.accent}
            </span>
            <SplitHeadline ref={headlineRef} />
            <p ref={subRef} className="js-reveal mt-7 max-w-[44ch] text-[clamp(1.05rem,1.35vw,1.3rem)] leading-[1.45] text-fg/85">
              {hero.sub}
            </p>

            <div className="mt-10 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {hero.stats
                  .filter((s) => s.value !== null)
                  .map((s) => (
                    <div key={s.label} data-hero-stat className="js-reveal">
                      <dt className="order-2 font-sans text-[0.68rem] uppercase tracking-[0.1em] text-muted">{s.label}</dt>
                      <dd className="order-1 font-mono text-2xl font-medium tracking-tight text-fg">{s.value}</dd>
                      {s.note ? <dd className="order-3 mt-0.5 font-sans text-xs text-muted">{s.note}</dd> : null}
                    </div>
                  ))}
              </dl>
            </div>
          </div>

          {/* Mosaic */}
          <div ref={mosaicRef} className="hero-mosaic-wrap">
            <div className="hidden lg:block">
              <HeroMosaic active={active} />
            </div>
            <div className="lg:hidden">
              <HeroMosaic active={active} limit={20} />
            </div>
            <Magnetic className="mt-5 self-start">
              <a
                href={`#${next.id}`}
                data-cursor="link"
                data-hero-cue
                className="js-reveal btn-pill"
              >
                {hero.scrollCue}
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M7 2v10M3 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Floor strip */}
      <div data-hero-strip className={reduced ? "" : "js-reveal"}>
        <HeroStrip active={active} />
      </div>
    </section>
  );
}
