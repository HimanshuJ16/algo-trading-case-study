"use client";

import { useEffect, type RefObject } from "react";
import { gsap, SplitText, registerGsap, prefersReducedMotion } from "@/lib/motion";

type RevealOptions = {
  /** Children to stagger. Defaults to the element itself. */
  selector?: string;
  stagger?: number;
  y?: number;
  start?: string;
  duration?: number;
};

/**
 * Enter reveal: elements rise and fade in once when the container reaches
 * `start` in the viewport. Targets should carry `.js-reveal` so they start
 * hidden only when JS is present. No-op under reduced motion.
 */
export function useReveal(ref: RefObject<HTMLElement | null>, opts: RevealOptions = {}) {
  const { selector, stagger = 0.08, y = 22, start = "top 82%", duration = 1 } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    registerGsap();
    const targets = selector ? Array.from(el.querySelectorAll<HTMLElement>(selector)) : [el];
    if (!targets.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration,
          ease: "reveal",
          stagger,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [ref, selector, stagger, y, start, duration]);
}

/**
 * Line-mask reveal for a block of text: SplitText into lines, each line rises
 * through its own overflow mask when the element enters. Re-splits on resize
 * via `autoSplit`. No-op under reduced motion.
 */
export function useLinesReveal(ref: RefObject<HTMLElement | null>, opts: { start?: string; delay?: number } = {}) {
  const { start = "top 85%", delay = 0 } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    registerGsap();
    let split: SplitText | null = null;
    let cancelled = false;
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (cancelled) return;
        gsap.set(el, { visibility: "visible" });
        split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "line",
          autoSplit: true,
          // Lines keep their text in reading order, so no aria-label is
          // needed; on a <p> it would be a prohibited attribute anyway.
          aria: "none",
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 100,
              duration: 0.95,
              ease: "reveal",
              stagger: 0.07,
              delay,
              scrollTrigger: { trigger: el, start, once: true },
            });
          },
        });
      });
    }, el);
    return () => {
      cancelled = true;
      split?.revert();
      ctx.revert();
    };
  }, [ref, start, delay]);
}
