"use client";

import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import { hero } from "@/content/caseStudy";

export type SplitHeadlineHandle = {
  el: HTMLHeadingElement | null;
  cover: HTMLSpanElement | null;
};

/**
 * The hero headline. Plain text (the parent decides whether to split it) so
 * reduced-motion and no-JS readers get one clean <h1>. The accent phrase is
 * the display serif italic; the wipe cover is a transform-only mask.
 */
const SplitHeadline = forwardRef<SplitHeadlineHandle, { children?: ReactNode }>(function SplitHeadline(_props, ref) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const cover = useRef<HTMLSpanElement>(null);
  useImperativeHandle(ref, () => ({ el: h1.current, cover: cover.current }), []);

  return (
    <div className="relative">
      <h1
        ref={h1}
        className="headline js-reveal max-w-[13ch] font-serif text-[clamp(2.5rem,5.4vw,5.5rem)] font-normal leading-[0.98] tracking-[-0.0175em] text-fg [text-wrap:balance]"
      >
        {hero.headline.lead}{" "}
        <em className="italic text-accent">{hero.headline.accent}</em>
      </h1>
      <span ref={cover} aria-hidden="true" className="wipe-cover" />
    </div>
  );
});

export default SplitHeadline;
