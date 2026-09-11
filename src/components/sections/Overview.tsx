"use client";

import { useRef } from "react";
import { overview, sectionBySlug } from "@/content/caseStudy";
import { ordinal } from "@/lib/ordinal";
import { useReveal } from "@/lib/useReveal";
import ChapterHeader from "@/components/ChapterHeader";

const meta = sectionBySlug("overview");

const GROUPS = [
  { ...overview.is, tone: "text-up" },
  { ...overview.isNot, tone: "text-down" },
];

export default function Overview() {
  const listsRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDListElement>(null);
  useReveal(listsRef, { selector: "[data-item]", stagger: 0.07 });
  useReveal(servicesRef, { selector: "[data-item]", stagger: 0.09, y: 16 });

  return (
    <section id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad">
      <ChapterHeader meta={meta} intro={overview.statement} layout="split" />

      <div ref={listsRef} className="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-x-16 gap-y-12">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 data-item className={`js-reveal label-mono mb-4 ${group.tone}`}>
              {group.title}
            </h3>
            <ol className="m-0 list-none border-t border-line p-0">
              {group.items.map((item, i) => (
                <li
                  key={item}
                  data-item
                  className="js-reveal grid grid-cols-[2rem_minmax(0,1fr)] gap-2 border-b border-line py-4 text-[0.98rem] leading-[1.5] text-fg/85"
                >
                  <span className="pt-1 font-mono text-[0.64rem] text-muted">{ordinal(i)}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <dl ref={servicesRef} className="hair-grid mt-20 grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
        {overview.services.map((s, i) => (
          <div
            key={s.name}
            data-item
            className="js-reveal flex min-h-44 flex-col gap-3 bg-bg p-6 transition-colors hover:bg-bg-3"
          >
            <div className="flex items-baseline justify-between font-mono text-[0.64rem] text-muted">
              <span>{ordinal(i)}</span>
              <span className="text-accent" aria-hidden="true">
                ●
              </span>
            </div>
            <dt className="text-[1.25rem] font-semibold tracking-[-0.02em]">{s.name}</dt>
            <dd className="m-0 font-mono text-[0.66rem] leading-[1.5] text-muted">{s.stack}</dd>
            <dd className="mt-auto mb-0 ml-0 text-[0.9rem] leading-[1.45] text-fg/75">{s.role}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
