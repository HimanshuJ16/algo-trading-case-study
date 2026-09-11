"use client";

import { Fragment, useEffect, useRef } from "react";
import { hero, sections } from "@/content/caseStudy";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/motion";
import { useReveal } from "@/lib/useReveal";
import { useScramble } from "@/lib/useScramble";
import Ledger from "@/components/sections/hero/Ledger";

const LEAD = hero.headline.lead.split(" ");
const ACCENT = hero.headline.accent.split(" ");

export default function Hero() {
  const headline = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useReveal(topRef, { selector: "[data-item]", stagger: 0.1, y: 12, start: "top 100%" });
  useReveal(bodyRef, { selector: "[data-item]", stagger: 0.12, y: 18, start: "top 100%" });
  useReveal(statsRef, { selector: "[data-item]", stagger: 0.08, y: 16, start: "top 100%" });
  useScramble(statsRef);

  // The headline is the one thing that does not wait to be scrolled to: each
  // word rides up through its own mask as soon as the page is interactive.
  useEffect(() => {
    const el = headline.current;
    if (!el || prefersReducedMotion()) return;
    registerGsap();
    const words = Array.from(el.querySelectorAll<HTMLElement>(".word-mask > span"));
    const ctx = gsap.context(() => {
      gsap.set(el, { visibility: "visible" });
      gsap.from(words, { yPercent: 115, duration: 1.1, ease: "reveal", stagger: 0.07, delay: 0.1 });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative grid min-h-svh grid-cols-1 overflow-hidden border-b border-line md:grid-cols-[minmax(0,1fr)_clamp(11rem,18vw,16rem)]"
    >
      <div className="flex flex-col pt-6 pr-[var(--gutter-r)] pb-10 pl-[var(--gutter-l)]">
        <div
          ref={topRef}
          className="flex flex-wrap justify-between gap-x-6 gap-y-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted"
        >
          <span data-item className="js-reveal">
            {hero.eyebrow}
          </span>
          <span data-item className="js-reveal">
            {hero.meta}
          </span>
        </div>

        <div ref={bodyRef} className="flex flex-1 flex-col justify-center py-12 md:py-16">
          <p data-item className="js-reveal mb-7 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-accent">
            {hero.kicker}
          </p>
          <h1
            ref={headline}
            id="hero-title"
            className="js-reveal m-0 max-w-[11ch] text-[clamp(3rem,8.4vw,9rem)] leading-[0.92] font-bold tracking-[-0.035em] text-balance [font-variation-settings:'wdth'_82,'opsz'_96]"
          >
            {/* The space lives outside the mask; inside it, overflow:hidden
                eats it and the words run together. */}
            {LEAD.map((w) => (
              <Fragment key={w}>
                <span className="word-mask">
                  <span>{w}</span>
                </span>{" "}
              </Fragment>
            ))}
            {ACCENT.map((w) => (
              <Fragment key={w}>
                <span className="word-mask">
                  <span className="text-accent">{w}</span>
                </span>{" "}
              </Fragment>
            ))}
          </h1>
          <p
            data-item
            className="js-reveal mt-10 max-w-[46ch] text-[clamp(1.05rem,1.3vw,1.25rem)] leading-[1.5] text-pretty text-fg/80"
          >
            {hero.sub}
          </p>
        </div>

        <div
          ref={statsRef}
          className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-x-8 gap-y-6 border-t border-line pt-6"
        >
          {hero.stats.map((s) => (
            <div key={s.label} data-item className="js-reveal flex flex-col gap-1.5">
              <span data-scramble className="font-mono text-[1.75rem] font-medium tracking-[-0.02em] tabular-nums">
                {s.value}
              </span>
              <span className="text-[0.78rem]">{s.label}</span>
              <span className="font-mono text-[0.64rem] text-muted">{s.note}</span>
            </div>
          ))}
          <a
            data-item
            href={`#${sections[0].id}`}
            className="scroll-cue js-reveal inline-flex items-center gap-2.5 self-end justify-self-start font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent sm:justify-self-end"
          >
            {hero.scrollCue}
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              aria-hidden="true"
              className="[animation:cue_1.8s_ease-in-out_infinite]"
            >
              <path
                d="M7 2v10M3 8l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>

      <Ledger />
    </section>
  );
}
