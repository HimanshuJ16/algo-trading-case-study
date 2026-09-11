"use client";

import { useRef } from "react";
import { architecture, sectionBySlug } from "@/content/caseStudy";
import { useReveal } from "@/lib/useReveal";
import ChapterHeader from "@/components/ChapterHeader";
import ArchDiagram from "@/components/sections/architecture/ArchDiagram";

const meta = sectionBySlug("architecture");

export default function Architecture() {
  const figRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const siblingRef = useRef<HTMLDivElement>(null);
  useReveal(figRef, { selector: "[data-item]", stagger: 0.1, y: 14 });
  useReveal(notesRef, { selector: "[data-item]", stagger: 0.11, y: 18 });
  useReveal(siblingRef, { y: 18 });

  return (
    <section id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad border-t border-line bg-bg-2">
      <ChapterHeader meta={meta} intro={architecture.intro} />

      <div ref={figRef}>
        <p data-item className="js-reveal label-mono mb-4">
          Fig. {architecture.figTitle}
        </p>
        <ArchDiagram />
        <p data-item className="js-reveal mt-4 max-w-[70ch] text-[0.82rem] leading-[1.5] text-muted">
          {architecture.figCaption}
        </p>
      </div>

      <div ref={notesRef} className="mt-20 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-10">
        {architecture.notes.map((n) => (
          <div key={n.title} data-item className="js-reveal border-t border-line-strong pt-5">
            <h3 className="m-0 mb-3 text-[1.15rem] font-semibold tracking-[-0.015em]">{n.title}</h3>
            <p className="m-0 text-[0.95rem] leading-[1.5] text-fg/80">{n.body}</p>
          </div>
        ))}
      </div>

      <div
        ref={siblingRef}
        className="js-reveal mt-16 grid gap-6 border border-accent/35 px-8 py-7 md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]"
      >
        <h3 className="label-mono m-0 leading-[1.6] text-accent">{architecture.sibling.title}</h3>
        <p className="m-0 max-w-[72ch] text-[0.95rem] leading-[1.5] text-fg/80">{architecture.sibling.body}</p>
      </div>
    </section>
  );
}
