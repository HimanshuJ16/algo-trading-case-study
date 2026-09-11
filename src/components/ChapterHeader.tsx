"use client";

import { useRef } from "react";
import type { SectionMeta } from "@/content/caseStudy";
import { useLinesReveal, useReveal } from "@/lib/useReveal";

type Props = {
  meta: SectionMeta;
  intro?: string;
  /**
   * "stacked" runs the intro under the title at reading width. "split" sets
   * the title and the intro side by side, baseline-aligned — used where the
   * intro is a statement in its own right rather than a subtitle.
   */
  layout?: "stacked" | "split";
  className?: string;
};

/** Shared chapter chrome: CH.0n, the kicker, the title, and the intro. */
export default function ChapterHeader({ meta, intro, layout = "stacked", className = "" }: Props) {
  const kickerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  useReveal(kickerRef, { selector: "[data-item]", stagger: 0.1, y: 12 });
  useLinesReveal(titleRef);
  useLinesReveal(introRef, { delay: 0.15 });

  const kicker = (
    <div ref={kickerRef} className="chapter-kicker mb-5">
      <span data-item className="js-reveal text-accent">
        CH.{meta.index}
      </span>
      <span data-item className="js-reveal">
        {meta.kicker}
      </span>
    </div>
  );

  const title = (
    <h2 ref={titleRef} id={`${meta.id}-title`} className="chapter-title js-reveal m-0 max-w-[16ch]">
      {meta.title}
    </h2>
  );

  if (layout === "split") {
    return (
      <header className={`mb-16 grid items-end gap-x-16 gap-y-8 md:grid-cols-2 ${className}`}>
        <div>
          {kicker}
          {title}
        </div>
        {intro ? (
          <p
            ref={introRef}
            className="js-reveal m-0 max-w-[52ch] text-[clamp(1.1rem,1.5vw,1.45rem)] leading-[1.4] text-pretty text-fg/85"
          >
            {intro}
          </p>
        ) : null}
      </header>
    );
  }

  return (
    <header className={`mb-12 md:mb-14 ${className}`}>
      {kicker}
      {title}
      {intro ? (
        <p
          ref={introRef}
          className="js-reveal mt-6 max-w-[58ch] text-[clamp(1.05rem,1.3vw,1.25rem)] leading-[1.5] text-pretty text-fg/80"
        >
          {intro}
        </p>
      ) : null}
    </header>
  );
}
