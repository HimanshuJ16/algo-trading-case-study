"use client";

import { useRef } from "react";
import { sections } from "@/content/caseStudy";
import { useReveal } from "@/lib/useReveal";

/** The eight chapters as a table of contents, and the page's real nav. */
export default function Contents() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { selector: "[data-item]", stagger: 0.05, y: 14 });

  return (
    <nav ref={ref} aria-label="Chapters" className="pad-x border-b border-line py-10">
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-x-8 gap-y-2 p-0">
        {sections.map((s) => (
          <li key={s.id} data-item className="js-reveal">
            <a
              href={`#${s.id}`}
              className="grid grid-cols-[2.2rem_minmax(0,1fr)] items-baseline border-t border-line py-2.5 text-[0.92rem] text-fg/85 transition-colors hover:text-accent"
            >
              <span className="font-mono text-[0.64rem] text-accent">{s.index}</span>
              <span>{s.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
