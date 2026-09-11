"use client";

import { useEffect, useRef, useState } from "react";
import { archEdges, archNodes, neighbourhood, NODE_LABEL_SIZE, SUB_SIZE, VIEW } from "@/lib/archLayout";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/motion";

const MONO = "var(--font-plex-mono), ui-monospace, monospace";
const SANS = "var(--font-bricolage), system-ui, sans-serif";

/**
 * The four services and what runs between them. The edges draw themselves
 * once, in route order, so the figure is read the way data moves through it.
 * Hovering a service traces only its own connections.
 */
export default function ArchDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const lit = focus ? neighbourhood(focus) : null;

  useEffect(() => {
    const svg = ref.current;
    if (!svg || prefersReducedMotion()) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const solid = Array.from(svg.querySelectorAll<SVGPathElement>("[data-edge][data-dashed='0']"));
      const dashed = Array.from(svg.querySelectorAll<SVGPathElement>("[data-edge][data-dashed='1']"));

      // Solid edges are drawn on. The dashed control path cannot be — its
      // dash pattern is the meaning — so it fades in on the same beat.
      gsap.set(solid, { drawSVG: "0%" });
      gsap.set(dashed, { autoAlpha: 0 });

      const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 65%", once: true } });
      tl.to(solid, { drawSVG: "100%", duration: 1.1, ease: "wipe", stagger: 0.09 }, 0.3);
      tl.to(dashed, { autoAlpha: 1, duration: 0.6, ease: "settle" }, ">-0.4");
    }, svg);

    return () => ctx.revert();
  }, []);

  const dim = (id: string) => (lit && !lit.has(id) ? "1" : "0");

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className="arch-svg block h-auto w-full"
      data-focus={focus ?? undefined}
      onMouseLeave={() => setFocus(null)}
      role="img"
      aria-label="How the four services are wired"
    >
      {archEdges.map((e) => (
        <path
          key={e.key}
          data-edge
          data-dashed={e.dashed ? "1" : "0"}
          data-dim={lit && !(lit.has(e.from) && lit.has(e.to)) ? "1" : "0"}
          className="arch-edge"
          d={e.d}
          fill="none"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray={e.dashed ? "4 5" : undefined}
        />
      ))}

      {archNodes.map((n) => (
        <g
          key={n.id}
          data-node={n.id}
          data-dim={dim(n.id)}
          className="arch-node"
          onMouseEnter={() => setFocus(n.id)}
        >
          <rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            fill={n.primary ? "var(--accent)" : "var(--bg)"}
            stroke={n.primary ? "var(--accent)" : "var(--line-strong)"}
            strokeWidth="1"
          />
          <text
            x={n.textX}
            y={n.labelY}
            fontSize={NODE_LABEL_SIZE}
            fontWeight="600"
            fill={n.primary ? "var(--accent-ink)" : "var(--fg)"}
            fontFamily={SANS}
          >
            {n.label}
          </text>
          {n.subLines.map((line) => (
            <text
              key={line.text}
              x={n.textX}
              y={line.y}
              fontSize={SUB_SIZE}
              fill={n.primary ? "rgba(26,18,7,.8)" : "var(--muted)"}
              fontFamily={MONO}
            >
              {line.text}
            </text>
          ))}
        </g>
      ))}

      {/* Labels sit on top of their own edge, knocked out of the ground. */}
      {archEdges.map((e) => (
        <g
          key={`${e.key}-label`}
          className="arch-edge-label"
          data-dim={lit && !(lit.has(e.from) && lit.has(e.to)) ? "1" : "0"}
        >
          <rect
            x={e.labelBox.x}
            y={e.labelBox.y}
            width={e.labelBox.w}
            height={e.labelBox.h}
            fill="var(--bg-2)"
            stroke="var(--line-strong)"
          />
          <text
            x={e.labelAnchor.x}
            y={e.labelAnchor.y}
            fontSize="9.1"
            textAnchor="middle"
            fill="var(--muted)"
            fontFamily={MONO}
          >
            {e.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
