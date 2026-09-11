"use client";

import { useRef } from "react";
import { overview, sectionById } from "@/content/caseStudy";
import { useSectionTheme } from "@/lib/useSectionTheme";
import { useReveal } from "@/lib/useReveal";
import SectionHeader from "@/components/SectionHeader";

const meta = sectionById("overview");

export default function Overview() {
  const ref = useRef<HTMLElement>(null);
  const statementRef = useRef<HTMLParagraphElement>(null);
  const listsRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDListElement>(null);
  useSectionTheme(ref, meta.theme);
  useReveal(statementRef, { y: 18, duration: 1.1 });
  useReveal(listsRef, { selector: "[data-item]", stagger: 0.07 });
  useReveal(servicesRef, { selector: "[data-item]", stagger: 0.08, y: 16 });

  return (
    <section ref={ref} id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad">
      <SectionHeader meta={meta} />

      <p
        ref={statementRef}
        className="js-reveal dropcap mb-16 max-w-[38ch] font-serif text-[clamp(1.5rem,2.6vw,2.4rem)] leading-[1.28] tracking-[-0.005em] text-fg md:mb-24"
      >
        {overview.statement}
      </p>

      <div ref={listsRef} className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        {[overview.is, overview.isNot].map((group) => (
          <div key={group.title}>
            <h3 data-item className="js-reveal mb-6 font-sans text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted">
              {group.title}
            </h3>
            <ul className="divide-y divide-line border-t border-line">
              {group.items.map((item) => (
                <li key={item} data-item className="js-reveal py-4 text-[1.02rem] leading-[1.5] text-fg/90">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <dl ref={servicesRef} className="mt-20 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overview.services.map((s, i) => (
          <div key={s.name} data-item className="js-reveal rounded-[var(--radius-lg)] bg-bg-2 p-5">
            <dt className="flex items-baseline justify-between gap-3">
              <span className="font-sans text-[0.95rem] font-medium tracking-[-0.005em] text-fg">{s.name}</span>
              <span className="font-mono text-[0.65rem] text-muted">0{i + 1}</span>
            </dt>
            <dd className="mt-2 font-mono text-[0.68rem] leading-[1.5] text-muted">{s.stack}</dd>
            <dd className="mt-2 text-[0.95rem] leading-[1.45] text-fg/80">{s.role}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
