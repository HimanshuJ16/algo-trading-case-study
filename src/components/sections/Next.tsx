"use client";

import { useRef } from "react";
import { footer, next, sectionBySlug, site } from "@/content/caseStudy";
import { ordinal } from "@/lib/ordinal";
import { useLinesReveal, useReveal } from "@/lib/useReveal";
import ChapterHeader from "@/components/ChapterHeader";

const meta = sectionBySlug("next");

export default function Next() {
  const listRef = useRef<HTMLOListElement>(null);
  const closingRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  useReveal(listRef, { selector: "[data-item]", stagger: 0.09, y: 16 });
  useLinesReveal(closingRef);
  useReveal(footerRef, { y: 14 });

  return (
    <section
      id={meta.id}
      aria-labelledby={`${meta.id}-title`}
      className="border-t border-line pt-[clamp(5rem,10vw,9rem)] pr-[var(--gutter-r)] pb-12 pl-[var(--gutter-l)]"
    >
      <ChapterHeader meta={meta} intro={next.intro} />

      {/* Two columns, not auto-fit: four items across three tracks would
          leave empty cells, and an empty cell in a hairline grid shows the
          rule colour as a panel. */}
      <ol ref={listRef} className="hair-grid m-0 list-none grid-cols-1 p-0 md:grid-cols-2">
        {next.items.map((it, i) => (
          <li key={it.title} data-item className="js-reveal bg-bg px-8 py-7">
            <h3 className="m-0 flex items-baseline gap-3 text-[1.15rem] font-semibold tracking-[-0.015em]">
              <span className="font-mono text-[0.62rem] font-normal text-accent">{ordinal(i)}</span>
              {it.title}
            </h3>
            <p className="mt-3 mb-0 text-[0.95rem] leading-[1.5] text-fg/80">{it.body}</p>
          </li>
        ))}
      </ol>

      <p
        ref={closingRef}
        className="js-reveal mt-28 max-w-[22ch] text-[clamp(2rem,4.4vw,4rem)] leading-[1.02] font-medium tracking-[-0.03em] text-balance [font-variation-settings:'wdth'_85]"
      >
        {next.closing.lead} <span className="text-accent">{next.closing.accent}</span>
      </p>

      <footer
        ref={footerRef}
        className="js-reveal mt-24 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6"
      >
        <div className="max-w-[60ch]">
          <p className="label-mono m-0">{footer.byline}</p>
          <p className="mt-2 mb-0 text-[0.85rem] leading-[1.5] text-fg/65">{footer.colophon}</p>
          <p className="sr-only">
            {site.title} — {site.author}, {site.year}
          </p>
        </div>
        <a
          href="#main"
          className="inline-flex items-center gap-2.5 border border-line-strong px-4 py-3 font-mono text-[0.66rem] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
        >
          {footer.backToTop}
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M7 12V2M3 6l4-4 4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </footer>
    </section>
  );
}
