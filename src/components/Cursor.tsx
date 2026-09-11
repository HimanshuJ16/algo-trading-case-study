"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap, hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { cursorLabels } from "@/content/caseStudy";

/**
 * Custom cursor: a dot that tracks tightly and a ring that lags, both in
 * `mix-blend-mode: difference` so they invert whatever they cross, plus a
 * small label that names what the region does. Mounted only for fine
 * pointers. Under reduced motion the ring follows without lag.
 *
 * Elements opt in with `data-cursor="link|scrub|sideways|trace"`; the label
 * text comes from `cursorLabels` in the content file.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasFinePointer()) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    registerGsap();
    const reduced = prefersReducedMotion();
    document.documentElement.classList.add("has-cursor");

    const dx = gsap.quickTo(dot, "x", { duration: reduced ? 0 : 0.12, ease: "settle" });
    const dy = gsap.quickTo(dot, "y", { duration: reduced ? 0 : 0.12, ease: "settle" });
    const rx = gsap.quickTo(ring, "x", { duration: reduced ? 0 : 0.42, ease: "reveal" });
    const ry = gsap.quickTo(ring, "y", { duration: reduced ? 0 : 0.42, ease: "reveal" });
    const lx = gsap.quickTo(label, "x", { duration: reduced ? 0 : 0.5, ease: "reveal" });
    const ly = gsap.quickTo(label, "y", { duration: reduced ? 0 : 0.5, ease: "reveal" });

    let visible = false;
    const show = () => {
      if (visible) return;
      visible = true;
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3, ease: "settle" });
    };
    const hide = () => {
      visible = false;
      gsap.to([dot, ring, label], { autoAlpha: 0, duration: 0.3, ease: "settle" });
    };

    const onMove = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      lx(e.clientX);
      ly(e.clientY);
      show();
    };

    const modes: Record<string, { scale: number; text?: string }> = {
      link: { scale: 2.4, text: cursorLabels.open },
      scrub: { scale: 1.6, text: cursorLabels.scrub },
      sideways: { scale: 1.6, text: cursorLabels.sideways },
      trace: { scale: 1.8, text: cursorLabels.trace },
    };

    let current: Element | null = null;
    const apply = (t: Element | null) => {
      if (t === current) return;
      current = t;
      const mode = t ? modes[(t as HTMLElement).dataset.cursor ?? "link"] ?? modes.link : null;
      if (mode) {
        gsap.to(ring, { scale: mode.scale, duration: 0.5, ease: "reveal" });
        gsap.to(dot, { scale: 0.4, duration: 0.5, ease: "reveal" });
        if (mode.text) {
          label.textContent = mode.text;
          gsap.to(label, { autoAlpha: 1, duration: 0.35, ease: "settle" });
        } else {
          gsap.to(label, { autoAlpha: 0, duration: 0.25, ease: "settle" });
        }
      } else {
        gsap.to([ring, dot], { scale: 1, duration: 0.6, ease: "snap" });
        gsap.to(label, { autoAlpha: 0, duration: 0.25, ease: "settle" });
      }
    };
    const onOver = (e: Event) => apply((e.target as Element | null)?.closest("[data-cursor]") ?? null);
    const onLeave = () => hide();

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("has-cursor");
      gsap.killTweensOf([dot, ring, label]);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] hidden [@media(pointer:fine)]:block">
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 mix-blend-difference"
        style={{ willChange: "transform" }}
      />
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 opacity-0 mix-blend-difference"
        style={{ willChange: "transform" }}
      />
      <div
        ref={labelRef}
        className="absolute left-0 top-0 ml-12 -translate-y-1/2 whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white opacity-0 mix-blend-difference"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
