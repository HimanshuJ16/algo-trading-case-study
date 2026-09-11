"use client";

import { useEffect, useRef } from "react";
import { problems, sectionBySlug } from "@/content/caseStudy";
import { gsap, registerGsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";
import { useReveal } from "@/lib/useReveal";
import ChapterHeader from "@/components/ChapterHeader";

const meta = sectionBySlug("problems");

export default function Problems() {
  const listRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLOListElement>(null);
  useReveal(listRef, { selector: "[data-item]", stagger: 0.08 });

  useEffect(() => {
    const listEl = listRef.current;
    const navEl = navRef.current;
    if (!listEl || !navEl || prefersReducedMotion()) return;
    registerGsap();

    const entries = Array.from(listEl.querySelectorAll<HTMLElement>("[data-problem]"));
    const navItems = Array.from(navEl.querySelectorAll<HTMLElement>("[data-nav]"));

    const mark = (n: string | undefined, on: boolean) => {
      for (const item of navItems) {
        if (item.dataset.nav === n) item.dataset.on = on ? "1" : "0";
      }
    };

    const triggers: ReturnType<typeof ScrollTrigger.create>[] = [];
    const cleanups = entries.map((entry) => {
      const n = entry.dataset.problem;

      // The index marks whichever entry crosses the viewport's upper middle,
      // so the dot moves with the text rather than with a section boundary.
      const active = ScrollTrigger.create({
        trigger: entry,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => mark(n, self.isActive),
      });
      triggers.push(active);

      // The numeral drifts against the scroll, so it reads as set behind the
      // page rather than printed on it.
      const numeral = entry.querySelector<HTMLElement>(".problem-numeral");
      const drift = numeral
        ? gsap.fromTo(
            numeral,
            { yPercent: -20 },
            {
              yPercent: 20,
              ease: "none",
              scrollTrigger: { trigger: entry, start: "top bottom", end: "bottom top", scrub: true },
            },
          )
        : null;

      return () => {
        active.kill();
        drift?.scrollTrigger?.kill();
        drift?.kill();
      };
    });

    // onToggle only fires on a crossing, so a page that loads (or is deep
    // linked) mid-chapter would keep the markup's default. Sync once from
    // what the triggers actually say, and again whenever they re-measure.
    const sync = () => entries.forEach((entry, i) => mark(entry.dataset.problem, triggers[i].isActive));
    sync();
    ScrollTrigger.addEventListener("refresh", sync);

    return () => {
      ScrollTrigger.removeEventListener("refresh", sync);
      cleanups.forEach((kill) => kill());
    };
  }, []);

  return (
    <section id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad border-t border-line">
      <ChapterHeader meta={meta} intro={problems.intro} />

      <div className="grid gap-16 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
        <nav aria-label="Hard problems" className="hidden lg:block">
          <ol ref={navRef} className="sticky top-24 m-0 flex list-none flex-col gap-2.5 p-0">
            {problems.items.map((p) => (
              <li key={p.n} data-nav={p.n} data-on="0" className="relative pl-[1.1rem]">
                <span className="problem-dot" aria-hidden="true" />
                <a href={`#problem-${p.n}`} className="problem-link text-[0.8rem] leading-[1.4]">
                  <span className="mr-2 font-mono text-[0.62rem]">{p.n}</span>
                  {p.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div ref={listRef} className="min-w-0">
          {problems.items.map((p) => (
            <article
              key={p.n}
              id={`problem-${p.n}`}
              data-problem={p.n}
              className="relative border-t border-line py-14"
            >
              <span aria-hidden="true" className="problem-numeral">
                {p.n}
              </span>
              <h3
                data-item
                className="js-reveal m-0 flex max-w-[24ch] items-baseline gap-4 text-[clamp(1.5rem,2.6vw,2.4rem)] leading-[1.08] font-semibold tracking-[-0.025em] text-balance"
              >
                <span className="font-mono text-[0.68rem] font-normal text-accent">{p.n}</span>
                {p.title}
              </h3>
              <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-10">
                <div data-item className="js-reveal">
                  <h4 className="label-mono mb-2.5 text-down">The failure</h4>
                  <p className="m-0 text-[0.98rem] leading-[1.5] text-fg/85">{p.failure}</p>
                </div>
                <div data-item className="js-reveal">
                  <h4 className="label-mono mb-2.5 text-up">The fix</h4>
                  <p className="m-0 text-[0.98rem] leading-[1.5] text-fg/85">{p.fix}</p>
                </div>
              </div>
              <ul
                data-item
                className="js-reveal mt-6 mb-0 flex list-none flex-wrap gap-x-6 gap-y-1.5 p-0 font-mono text-[0.64rem] text-muted"
              >
                {p.where.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
