"use client";

import { useRef } from "react";
import { next, footer, site, sectionById } from "@/content/caseStudy";
import { useSectionTheme } from "@/lib/useSectionTheme";
import { useLinesReveal, useReveal } from "@/lib/useReveal";
import { useLenis } from "@/components/SmoothScroll";
import { easeOutExpo } from "@/lib/motion";
import Magnetic from "@/components/Magnetic";
import SectionHeader from "@/components/SectionHeader";

const meta = sectionById("next");

export default function Next() {
  const ref = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLParagraphElement>(null);
  const lenisRef = useLenis();
  useSectionTheme(ref, meta.theme);
  useReveal(listRef, { selector: "[data-item]", stagger: 0.1 });
  useLinesReveal(closingRef);

  const toTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    e.preventDefault();
    lenis.scrollTo(0, { duration: 1.6, easing: easeOutExpo });
  };

  return (
    <section ref={ref} id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad">
      <SectionHeader meta={meta} intro={next.intro} />

      <div ref={listRef} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {next.items.map((item, i) => (
          <div key={item.title} data-item className="js-reveal rounded-[var(--radius-lg)] bg-bg-2 p-6 md:p-8">
            <h3 className="flex items-baseline gap-3 font-sans text-[1rem] font-medium tracking-[-0.005em] text-fg">
              <span className="font-mono text-[0.66rem] text-accent">0{i + 1}</span>
              {item.title}
            </h3>
            <p className="mt-3 text-[1rem] leading-[1.5] text-fg/85">{item.body}</p>
          </div>
        ))}
      </div>

      <p
        ref={closingRef}
        className="js-reveal mt-20 max-w-[32ch] font-serif text-[clamp(1.6rem,3vw,2.6rem)] italic leading-[1.22] text-fg md:mt-28"
      >
        {next.closing}
      </p>

      <footer className="mt-20 flex flex-col gap-6 border-t border-line pt-8 md:mt-28 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[60ch]">
          <p className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted">
            {site.author} · {site.year}
          </p>
          <p className="mt-2 text-[0.95rem] leading-[1.5] text-fg/75">{footer.colophon}</p>
        </div>
        <Magnetic className="self-start md:self-auto">
          <a
            href="#main"
            onClick={toTop}
            data-cursor="link"
            className="btn-pill"
          >
            {footer.backToTop}
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M7 12V2M3 6l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </Magnetic>
      </footer>
    </section>
  );
}
