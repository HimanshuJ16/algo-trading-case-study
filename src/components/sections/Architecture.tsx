"use client";

import { useEffect, useRef, useState } from "react";
import { architecture, sectionById } from "@/content/caseStudy";
import { useSectionTheme } from "@/lib/useSectionTheme";
import { useReveal } from "@/lib/useReveal";
import SectionHeader from "@/components/SectionHeader";
import ArchDiagram from "./architecture/ArchDiagram";

const meta = sectionById("architecture");

export default function Architecture() {
  const ref = useRef<HTMLElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const siblingRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useSectionTheme(ref, meta.theme);
  useReveal(notesRef, { selector: "[data-item]", stagger: 0.12 });
  useReveal(siblingRef, { y: 16 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad">
      <SectionHeader meta={meta} intro={architecture.intro} />

      <p className="fig-title mb-4">{architecture.figTitle}</p>
      {/* Two layouts of the same data; CSS picks one so only one is in the DOM at a time. */}
      <div className="hidden md:block">
        <ArchDiagram layout="desktop" active={active} />
      </div>
      <div className="md:hidden">
        <ArchDiagram layout="mobile" active={active} />
      </div>
      <p className="fig-caption mt-4 max-w-[70ch]">{architecture.figCaption}</p>

      <div ref={notesRef} className="mt-16 grid grid-cols-1 gap-10 md:mt-24 md:grid-cols-3 md:gap-8">
        {architecture.notes.map((n) => (
          <div key={n.title} data-item className="js-reveal border-t border-line pt-5">
            <h3 className="mb-3 font-sans text-[1rem] font-medium tracking-[-0.005em] text-fg">{n.title}</h3>
            <p className="text-[1rem] leading-[1.5] text-fg/85">{n.body}</p>
          </div>
        ))}
      </div>

      <div ref={siblingRef} className="js-reveal mt-16 rounded-[var(--radius-lg)] bg-bg-2 p-6 md:mt-20 md:p-8">
        <h3 className="mb-3 font-sans text-[0.72rem] font-medium uppercase tracking-[0.12em] text-accent">{architecture.sibling.title}</h3>
        <p className="max-w-[72ch] text-[1rem] leading-[1.5] text-fg/85">{architecture.sibling.body}</p>
      </div>
    </section>
  );
}
