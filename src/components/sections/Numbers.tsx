"use client";

import { useRef } from "react";
import { numbers, sectionBySlug } from "@/content/caseStudy";
import { useReveal } from "@/lib/useReveal";
import { useScramble } from "@/lib/useScramble";
import ChapterHeader from "@/components/ChapterHeader";

const meta = sectionBySlug("numbers");

/**
 * Groups are pre-split here rather than in the view: a stat the repos cannot
 * supply is never a blank tile, it is named in a line underneath.
 */
const GROUPS = numbers.groups.map((g) => ({
  title: g.title,
  shown: g.stats.filter((s) => s.value !== null),
  missing: g.stats.filter((s) => s.value === null),
}));

export default function Numbers() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, { selector: "[data-item]", stagger: 0.06, y: 16 });
  useScramble(ref);

  return (
    <section id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad border-t border-line bg-bg-2">
      <ChapterHeader meta={meta} intro={numbers.intro} />

      <div ref={ref} className="flex flex-col gap-12">
        {GROUPS.map((g) => (
          <div key={g.title} className="grid items-start gap-x-8 gap-y-6 md:grid-cols-[minmax(0,8rem)_minmax(0,1fr)]">
            <h3 data-item className="js-reveal label-mono m-0 text-accent md:pt-6">
              {g.title}
            </h3>
            <div>
              <dl className="hair-grid m-0 grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
                {g.shown.map((s) => (
                  <div key={s.label} data-item className="js-reveal bg-bg-2 p-5">
                    <dd
                      data-scramble
                      className="m-0 font-mono text-[1.9rem] leading-none font-medium tracking-[-0.02em] tabular-nums"
                    >
                      {s.value}
                    </dd>
                    <dt className="mt-3 text-[0.9rem] text-fg/85">{s.label}</dt>
                    <dd className="mt-1 mb-0 ml-0 font-mono text-[0.62rem] text-muted">{s.note}</dd>
                  </div>
                ))}
              </dl>
              {g.missing.length ? (
                <p data-item className="js-reveal mt-3 font-mono text-[0.62rem] leading-[1.6] text-muted">
                  Not shown, because the repositories do not contain it:{" "}
                  {g.missing.map((s) => `${s.label} (${s.note})`).join(" · ")}.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
