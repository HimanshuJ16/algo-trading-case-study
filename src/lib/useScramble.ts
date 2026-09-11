"use client";

import { useEffect, type RefObject } from "react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Audit numbers settle in rather than appear: the digits churn and resolve
 * left to right the first time the tile enters. Only digits are scrambled,
 * so separators and units stay put and the tile never changes width.
 *
 * No-op under reduced motion — the final value is already in the HTML.
 */
export function useScramble(ref: RefObject<HTMLElement | null>, selector = "[data-scramble]") {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    registerGsap();
    const targets = Array.from(el.querySelectorAll<HTMLElement>(selector));
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      for (const target of targets) {
        gsap.to(target, {
          duration: 1.1,
          ease: "none",
          scrambleText: { text: target.textContent ?? "", chars: "0123456789", speed: 0.6 },
          scrollTrigger: { trigger: target, start: "top 90%", once: true },
        });
      }
    }, el);
    return () => ctx.revert();
  }, [ref, selector]);
}
