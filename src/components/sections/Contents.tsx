"use client";

import { sections } from "@/content/caseStudy";
import { useLenis } from "@/components/SmoothScroll";
import { easeOutExpo } from "@/lib/motion";

/**
 * In-page contents. Anchors work natively; when Lenis is running, clicks are
 * routed through it so the scroll is eased instead of jumping.
 */
export default function Contents() {
  const lenisRef = useLenis();

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const lenis = lenisRef.current;
    if (!lenis) return; // native anchor behaviour
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4, easing: easeOutExpo });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav aria-label="Contents" className="border-t border-line px-5 py-10 sm:px-8 md:px-12 lg:px-16">
      <p className="mb-6 font-sans text-[0.72rem] font-medium uppercase tracking-[0.12em] text-muted">Contents</p>
      <ol className="grid gap-x-10 gap-y-3 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <li key={s.id} className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-muted">{s.index}</span>
            <a
              href={`#${s.id}`}
              onClick={(e) => go(e, s.id)}
              data-cursor="link"
              className="text-[1rem] text-fg/90 underline-offset-4 transition-colors duration-300 hover:text-accent hover:underline"
            >
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
