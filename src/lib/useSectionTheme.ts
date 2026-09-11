"use client";

import { useEffect, type RefObject } from "react";
import type { Theme } from "@/content/caseStudy";
import { registerGsap, ScrollTrigger } from "@/lib/motion";

/**
 * Stamps `data-theme` on <html> while the section straddles the viewport
 * midline. The colour change itself is a CSS transition on body, so this
 * hook does no animation work of its own and is safe under reduced motion
 * (globals.css disables the transition there; the swap is instant).
 */
export function useSectionTheme(ref: RefObject<HTMLElement | null>, theme: Theme) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerGsap();
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => {
        if (self.isActive) document.documentElement.dataset.theme = theme;
      },
    });
    return () => trigger.kill();
  }, [ref, theme]);
}
