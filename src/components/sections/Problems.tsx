"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { problems, sectionById } from "@/content/caseStudy";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSectionTheme } from "@/lib/useSectionTheme";
import { useReveal } from "@/lib/useReveal";
import SectionHeader from "@/components/SectionHeader";

const meta = sectionById("problems");

function Entry({ p }: { p: (typeof problems.items)[number] }) {
  const ref = useRef<HTMLElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  useReveal(ref, { selector: "[data-item]", stagger: 0.09, y: 18 });
  // The big index numeral drifts slower than the page: a quiet depth cue.
  useEffect(() => {
    const el = ref.current;
    const num = numRef.current;
    if (!el || !num || prefersReducedMotion()) return;
    registerGsap();
    const tween = gsap.fromTo(
      num,
      { yPercent: 30 },
      { yPercent: -30, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);
  return (
    <article ref={ref} id={`problem-${p.n}`} data-problem={p.n} className="relative border-t border-line py-10 md:py-14">
      <span ref={numRef} aria-hidden="true" className="problem-numeral" data-n={p.n} />
      <h3 data-item className="js-reveal flex items-baseline gap-4 font-serif text-[clamp(1.5rem,2.4vw,2.2rem)] font-normal leading-[1.15] tracking-[-0.01em] text-fg">
        <span className="font-mono text-[0.72rem] text-accent">{p.n}</span>
        {p.title}
      </h3>
      <div className="mt-7 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-10">
        <div data-item className="js-reveal">
          <h4 className="mb-2 font-sans text-[0.7rem] font-medium uppercase tracking-[0.12em] text-down">The failure</h4>
          <p className="text-[1rem] leading-[1.5] text-fg/85">{p.failure}</p>
        </div>
        <div data-item className="js-reveal">
          <h4 className="mb-2 font-sans text-[0.7rem] font-medium uppercase tracking-[0.12em] text-up">The fix</h4>
          <p className="text-[1rem] leading-[1.5] text-fg/85">{p.fix}</p>
        </div>
      </div>
      <ul data-item className="js-reveal mt-6 flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-[0.68rem] text-muted">
        {p.where.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </article>
  );
}

export default function Problems() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(problems.items[0].n);
  useSectionTheme(ref, meta.theme);

  // Sticky index follows the entry crossing the viewport midline.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerGsap();
    const triggers = problems.items.map((p) =>
      ScrollTrigger.create({
        trigger: el.querySelector(`[data-problem="${p.n}"]`),
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && setActive(p.n),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section ref={ref} id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad">
      <SectionHeader meta={meta} intro={problems.intro} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-20">
        <nav aria-label="Hard problems" className="hidden lg:block">
          <ol className="sticky top-24 flex flex-col gap-2.5">
            {problems.items.map((p) => {
              const isActive = p.n === active;
              return (
                <li key={p.n} className="relative pl-5">
                  {isActive ? (
                    <motion.span
                      layoutId={reduced ? undefined : "problem-indicator"}
                      className="absolute left-0 top-[0.55em] h-1.5 w-1.5 rounded-full bg-accent"
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  ) : null}
                  <a
                    href={`#problem-${p.n}`}
                    data-cursor="link"
                    className={`text-[0.82rem] leading-[1.4] transition-colors duration-500 [transition-timing-function:var(--ease-reveal)] ${
                      isActive ? "text-fg" : "text-muted hover:text-fg/80"
                    }`}
                  >
                    <span className="mr-2 font-mono text-[0.66rem]">{p.n}</span>
                    {p.title}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0">
          {problems.items.map((p) => (
            <Entry key={p.n} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
