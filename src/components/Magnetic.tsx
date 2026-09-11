"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, registerGsap, hasFinePointer, prefersReducedMotion } from "@/lib/motion";

type Props = {
  children: ReactNode;
  /** 0–1: how far toward the pointer the child moves. */
  strength?: number;
  /** Extra hit area around the element, in px. */
  radius?: number;
  className?: string;
};

/**
 * Magnetic hover: the child drifts toward the pointer while it is within
 * `radius` px, and snaps back with a slight overshoot on leave. Transform
 * only. Inert on coarse pointers and under reduced motion.
 */
export default function Magnetic({ children, strength = 0.35, radius = 48, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;
    registerGsap();

    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "reveal" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "reveal" });
    let inside = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dxRaw = e.clientX - cx;
      const dyRaw = e.clientY - cy;
      const within =
        Math.abs(dxRaw) < r.width / 2 + radius && Math.abs(dyRaw) < r.height / 2 + radius;

      if (within) {
        inside = true;
        x(dxRaw * strength);
        y(dyRaw * strength);
      } else if (inside) {
        inside = false;
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "snap", overwrite: "auto" });
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.killTweensOf(el);
    };
  }, [strength, radius]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
