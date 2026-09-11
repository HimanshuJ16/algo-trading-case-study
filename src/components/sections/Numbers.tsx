"use client";

import { useEffect, useRef } from "react";
import { numbers, sectionById } from "@/content/caseStudy";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/motion";
import { useSectionTheme } from "@/lib/useSectionTheme";
import { useReveal } from "@/lib/useReveal";
import SectionHeader from "@/components/SectionHeader";

const meta = sectionById("numbers");

/**
 * Terminal-style settle: each value scrambles through digits and resolves
 * to its real string when its tile enters. Text-only, no layout change.
 */
function useScramble(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    registerGsap();
    const groups = Array.from(el.querySelectorAll<HTMLElement>("[data-group]"));
    const ctx = gsap.context(() => {
      groups.forEach((g) => {
        const targets = Array.from(g.querySelectorAll<HTMLElement>("[data-count]"));
        const tl = gsap.timeline({ scrollTrigger: { trigger: g, start: "top 80%", once: true } });
        targets.forEach((t, i) => {
          const final = t.dataset.count ?? "";
          tl.to(
            t,
            {
              duration: 1.1,
              ease: "settle",
              scrambleText: { text: final, chars: "0123456789", speed: 0.5, revealDelay: 0.25, tweenLength: false },
            },
            i * 0.06,
          );
        });
      });
    }, el);
    return () => ctx.revert();
  }, [ref]);
}

export default function Numbers() {
  const ref = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useSectionTheme(ref, meta.theme);
  useReveal(gridRef, { selector: "[data-item]", stagger: 0.05, y: 14 });
  useScramble(gridRef);

  return (
    <section ref={ref} id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad">
      <SectionHeader meta={meta} intro={numbers.intro} />

      <div ref={gridRef} className="flex flex-col gap-14">
        {numbers.groups.map((g) => {
          const visible = g.stats.filter((s) => s.value !== null);
          const missing = g.stats.filter((s) => s.value === null);
          return (
            <div key={g.title} data-group>
              <h3 data-item className="js-reveal mb-5 font-sans text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted">
                {g.title}
              </h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((s) => (
                  <div key={s.label} data-item className="js-reveal stat-tile rounded-[var(--radius-lg)] bg-bg-2 p-5">
                    <dd
                      className="font-mono text-[1.9rem] font-medium leading-none tracking-[-0.02em] text-fg [font-variant-numeric:tabular-nums]"
                      data-count={s.value ?? ""}
                    >
                      {s.value}
                    </dd>
                    <dt className="mt-3 text-[0.95rem] text-fg/85">{s.label}</dt>
                    {s.note ? <dd className="mt-1 font-mono text-[0.66rem] text-muted">{s.note}</dd> : null}
                  </div>
                ))}
              </dl>
              {missing.length ? (
                <p data-item className="js-reveal mt-3 font-mono text-[0.66rem] text-muted">
                  Not shown, because the repositories do not contain it:{" "}
                  {missing.map((s) => `${s.label} (${s.note})`).join(" · ")}.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
