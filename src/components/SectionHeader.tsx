"use client";

import { useRef } from "react";
import type { SectionMeta } from "@/content/caseStudy";
import { useLinesReveal, useReveal } from "@/lib/useReveal";

/**
 * Shared section chrome: index, kicker, and the title split into masked lines.
 */
export default function SectionHeader({ meta, intro }: { meta: SectionMeta; intro?: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  useReveal(metaRef, { selector: "[data-item]", stagger: 0.1, y: 12 });
  useLinesReveal(titleRef);
  useLinesReveal(introRef, { delay: 0.2 });

  return (
    <header className="mb-12 md:mb-16">
      <div ref={metaRef} className="mb-5 flex items-baseline gap-4 font-sans text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted">
        <span data-item className="js-reveal">
          {meta.index}
        </span>
        <span data-item className="js-reveal">
          {meta.kicker}
        </span>
      </div>
      <h2
        ref={titleRef}
        id={`${meta.id}-title`}
        className="headline js-reveal max-w-[26ch] font-serif text-[clamp(2rem,3.6vw,3.2rem)] font-normal leading-[1.08] tracking-[-0.01em] text-fg"
      >
        {meta.title}
      </h2>
      {intro ? (
        <p ref={introRef} className="js-reveal mt-6 max-w-[60ch] text-[clamp(1.05rem,1.3vw,1.25rem)] leading-[1.5] text-fg/85">
          {intro}
        </p>
      ) : null}
    </header>
  );
}
