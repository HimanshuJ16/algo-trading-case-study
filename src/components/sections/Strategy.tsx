"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { strategy, sectionById } from "@/content/caseStudy";
import { gsap, registerGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSectionTheme } from "@/lib/useSectionTheme";
import SectionHeader from "@/components/SectionHeader";
import SignalFunnel from "./strategy/SignalFunnel";

const meta = sectionById("strategy");

/**
 * Horizontal strategy stack. On desktop the section pins and vertical scroll
 * drives the track sideways; the page's scroll length grows by the track's
 * overflow so the mapping is 1:1. On touch and narrow screens it is a native
 * scroll-snap carousel, no pin. Reduced motion: the carousel on every screen.
 */
export default function Strategy() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const signalRef = useRef<HTMLDivElement>(null);
  useSectionTheme(ref, meta.theme);

  useEffect(() => {
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track || reduced) return;
    registerGsap();

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (pointer: fine)", () => {
      const distance = () => track.scrollWidth - pin.clientWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          pin: true,
          scrub: 0.7,
          start: "top top",
          end: () => `+=${distance()}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      // The signal: a dot that travels card to card inside the moving track,
      // so on screen it appears to pass through each gate as it slides by.
      const signal = signalRef.current;
      const cards = Array.from(track.querySelectorAll<HTMLElement>(".strategy-card"));
      const signalTween =
        signal && cards.length
          ? gsap.fromTo(
              signal,
              { x: () => cards[0].offsetLeft + cards[0].offsetWidth / 2 },
              {
                x: () => cards[cards.length - 1].offsetLeft + cards[cards.length - 1].offsetWidth / 2,
                ease: "none",
                scrollTrigger: { trigger: pin, start: "top top", end: () => `+=${distance()}`, scrub: 0.7, invalidateOnRefresh: true },
              },
            )
          : null;
      const bar = barRef.current;
      const barTween = bar
        ? gsap.fromTo(
            bar,
            { scaleX: 0 },
            { scaleX: 1, ease: "none", scrollTrigger: { trigger: pin, start: "top top", end: () => `+=${distance()}`, scrub: true } },
          )
        : null;
      return () => {
        signalTween?.scrollTrigger?.kill();
        signalTween?.kill();
        tween.scrollTrigger?.kill();
        tween.kill();
        barTween?.scrollTrigger?.kill();
        barTween?.kill();
      };
    });
    return () => mm.revert();
  }, [reduced]);

  return (
    <section ref={ref} id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad !pb-0">
      <SectionHeader meta={meta} intro={strategy.intro} />

      <div className="mb-16 max-w-[960px] md:mb-24">
        <SignalFunnel />
      </div>

      <div ref={pinRef} className="strategy-pin" data-cursor={reduced ? undefined : "sideways"}>
        <div className="strategy-viewport">
          <div ref={trackRef} className="strategy-track">
            <div ref={signalRef} className="strategy-signal" aria-hidden="true">
              <span />
            </div>
            {strategy.layers.map((layer) => (
              <motion.article
                key={layer.n}
                className="strategy-card"
                whileHover={reduced ? undefined : { y: -6 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                aria-labelledby={`layer-${layer.n}`}
              >
                <div className="flex items-baseline justify-between font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                  <span>{layer.name}</span>
                  <span className="text-accent">{layer.n}</span>
                </div>
                <h3 id={`layer-${layer.n}`} className="mt-5 font-serif text-[1.7rem] font-normal leading-[1.12] tracking-[-0.01em] text-fg">
                  {layer.gate}
                </h3>
                <p className="mt-4 text-[0.98rem] leading-[1.5] text-fg/85">{layer.detail}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {layer.params.map((p) => (
                    <li key={p} className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.66rem] text-fg/80">
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-6 font-mono text-[0.68rem] leading-[1.5] text-muted">{layer.where}</p>
              </motion.article>
            ))}
            <div className="strategy-end" aria-hidden="true" />
          </div>
        </div>
        <div className="strategy-bar" aria-hidden="true">
          <div ref={barRef} className="h-full w-full origin-left bg-accent" />
        </div>
      </div>
    </section>
  );
}
