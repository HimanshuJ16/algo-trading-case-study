"use client";

import { useEffect, useMemo, useRef } from "react";
import { architecture, type ArchNode } from "@/content/caseStudy";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Box = { x: number; y: number; w: number; h: number };
type Pt = [number, number];
type Route = { pts: Pt[]; label: Pt; rot?: number };
type Layout = {
  viewBox: string;
  boxes: Record<string, Box>;
  /** One route per edge, keyed by the edge's index in `architecture.edges`. */
  routes: Record<number, Route>;
  fontScale: number;
  subLines: number;
};

/**
 * Desktop: four columns, orthogonal routes. Every edge is drawn by hand as
 * waypoints so nothing crosses a box or another label; the one long path,
 * desk ↔ Postgres, runs on a bus under everything.
 */
const DESKTOP: Layout = {
  viewBox: "0 0 1340 740",
  fontScale: 1,
  subLines: 1,
  boxes: {
    broker: { x: 40, y: 250, w: 240, h: 70 },
    scrape: { x: 40, y: 470, w: 240, h: 70 },
    engine: { x: 380, y: 330, w: 260, h: 90 },
    db: { x: 280, y: 560, w: 240, h: 70 },
    r2: { x: 540, y: 560, w: 200, h: 70 },
    relay: { x: 820, y: 330, w: 200, h: 90 },
    mobile: { x: 1110, y: 40, w: 200, h: 70 },
    push: { x: 1110, y: 180, w: 200, h: 70 },
    desk: { x: 1110, y: 330, w: 200, h: 90 },
  },
  routes: {
    0: { pts: [[280, 270], [340, 270], [340, 352], [380, 352]], label: [340, 311] },
    1: { pts: [[280, 505], [340, 505], [340, 398], [380, 398]], label: [340, 452] },
    2: { pts: [[380, 375], [320, 375], [320, 300], [280, 300]], label: [320, 338] },
    3: { pts: [[460, 420], [460, 560]], label: [460, 472] },
    4: { pts: [[420, 560], [420, 420]], label: [420, 512] },
    5: { pts: [[600, 420], [600, 560]], label: [600, 490] },
    6: { pts: [[640, 375], [820, 375]], label: [730, 375] },
    7: { pts: [[1020, 360], [1110, 360]], label: [1065, 360] },
    8: { pts: [[890, 330], [890, 75], [1110, 75]], label: [890, 160] },
    9: { pts: [[950, 330], [950, 215], [1110, 215]], label: [950, 272] },
    10: { pts: [[1210, 420], [1210, 680], [400, 680], [400, 630]], label: [800, 680] },
    11: { pts: [[1020, 390], [1110, 390]], label: [1065, 390] },
  },
};

/** Mobile: one column of rows, subtitles on two lines, the bus on the left edge. */
const MOBILE: Layout = {
  viewBox: "0 0 420 1160",
  fontScale: 1,
  subLines: 2,
  boxes: {
    broker: { x: 16, y: 20, w: 186, h: 80 },
    scrape: { x: 218, y: 20, w: 186, h: 80 },
    engine: { x: 60, y: 220, w: 300, h: 90 },
    db: { x: 16, y: 430, w: 186, h: 80 },
    r2: { x: 218, y: 430, w: 186, h: 80 },
    relay: { x: 60, y: 640, w: 300, h: 90 },
    mobile: { x: 16, y: 850, w: 186, h: 80 },
    push: { x: 218, y: 850, w: 186, h: 80 },
    desk: { x: 60, y: 1050, w: 300, h: 90 },
  },
  routes: {
    0: { pts: [[90, 100], [90, 220]], label: [90, 150] },
    1: { pts: [[310, 100], [310, 220]], label: [310, 160] },
    2: { pts: [[140, 220], [140, 100]], label: [140, 190] },
    3: { pts: [[110, 310], [110, 430]], label: [110, 352] },
    4: { pts: [[160, 430], [160, 310]], label: [160, 392] },
    5: { pts: [[310, 310], [310, 430]], label: [310, 370] },
    6: { pts: [[210, 310], [210, 640]], label: [210, 560] },
    7: { pts: [[204, 730], [204, 1050]], label: [210, 965] },
    8: { pts: [[110, 730], [110, 850]], label: [110, 790] },
    9: { pts: [[310, 730], [310, 850]], label: [310, 790] },
    10: { pts: [[60, 1095], [8, 1095], [8, 470], [16, 470]], label: [8, 760], rot: -90 },
    11: { pts: [[216, 730], [216, 1050]], label: [210, 1000] },
  },
};

const GROUP_ORDER: ArchNode["group"][] = ["market", "engine", "store", "relay", "surface"];

/** Polyline with rounded corners: each interior corner becomes a quadratic arc. */
function roundedPath(pts: Pt[], r = 10): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const d1 = Math.hypot(cx - px, cy - py);
    const d2 = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const ax = cx - ((cx - px) / d1) * rr;
    const ay = cy - ((cy - py) / d1) * rr;
    const bx = cx + ((nx - cx) / d2) * rr;
    const by = cy + ((ny - cy) / d2) * rr;
    d += ` L${ax},${ay} Q${cx},${cy} ${bx},${by}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0]},${last[1]}`;
}

type Props = { layout: "desktop" | "mobile"; active: boolean };

/**
 * The architecture diagram. Nodes reveal group by group as the section enters,
 * each edge draws itself once both of its nodes exist, and a pulse then
 * travels along every edge for as long as the section is on screen. Hovering
 * a node traces its connections. Reduced motion: fully drawn, no pulses.
 */
export default function ArchDiagram({ layout, active }: Props) {
  const reduced = useReducedMotion();
  const L = layout === "desktop" ? DESKTOP : MOBILE;
  const svgRef = useRef<SVGSVGElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const edges = useMemo(
    () =>
      architecture.edges.map((e, i) => {
        const route = L.routes[i];
        if (!route) throw new Error(`No route for edge ${i} in ${layout} layout`);
        return { ...e, i, d: roundedPath(route.pts), label: e.label, at: route.label, rot: route.rot ?? 0 };
      }),
    [L, layout],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || reduced) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const nodeEls = GROUP_ORDER.map((g) => Array.from(svg.querySelectorAll<SVGGElement>(`[data-group="${g}"]`)));
      const edgeEls = Array.from(svg.querySelectorAll<SVGPathElement>("[data-edge]"));
      const labelEls = Array.from(svg.querySelectorAll<SVGGElement>("[data-edge-label]"));
      const pulseEls = Array.from(svg.querySelectorAll<SVGCircleElement>("[data-pulse]"));

      gsap.set(nodeEls.flat(), { autoAlpha: 0, scale: 0.94, transformOrigin: "50% 50%" });
      gsap.set(edgeEls, { drawSVG: "0%" });
      gsap.set(labelEls, { autoAlpha: 0 });
      gsap.set(pulseEls, { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "reveal" },
        scrollTrigger: { trigger: svg, start: "top 75%", once: true },
      });

      const revealed = new Set<string>();
      const drawn = new Set<number>();
      GROUP_ORDER.forEach((g, gi) => {
        const at = gi * 0.5;
        tl.to(nodeEls[gi], { autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.1 }, at);
        architecture.nodes.filter((n) => n.group === g).forEach((n) => revealed.add(n.id));
        const ready = edges.filter((e) => revealed.has(e.from) && revealed.has(e.to) && !drawn.has(e.i));
        ready.forEach((e, k) => {
          drawn.add(e.i);
          tl.to(edgeEls[e.i], { drawSVG: "100%", duration: 1.0, ease: "wipe" }, at + 0.3 + k * 0.07);
          tl.to(labelEls[e.i], { autoAlpha: 1, duration: 0.5 }, at + 0.8 + k * 0.07);
        });
      });

      const loops: gsap.core.Tween[] = [];
      tl.call(() => {
        pulseEls.forEach((pulse, i) => {
          const edge = edges[i];
          const path = edgeEls[i];
          const dur = 2.4 + (i % 4) * 0.5;
          loops.push(
            gsap.fromTo(
              pulse,
              { autoAlpha: 0 },
              {
                autoAlpha: 1,
                duration: dur,
                ease: "none",
                repeat: -1,
                yoyo: edge.dir === "both",
                delay: (i * 0.37) % 1.8,
                motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
                onRepeat: () => gsap.set(pulse, { autoAlpha: 1 }),
              },
            ),
          );
        });
      });

      const st = ScrollTrigger.create({
        trigger: svg,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => loops.forEach((t) => (self.isActive ? t.resume() : t.pause())),
      });
      return () => st.kill();
    }, svg);

    return () => ctx.revert();
  }, [reduced, edges]);

  // Trace on hover: dim everything not touching the hovered node.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    registerGsap();
    const nodes = Array.from(svg.querySelectorAll<SVGGElement>("[data-node]"));
    const edgeEls = Array.from(svg.querySelectorAll<SVGPathElement>("[data-edge]"));
    const labelEls = Array.from(svg.querySelectorAll<SVGGElement>("[data-edge-label]"));
    const dur = reduced ? 0 : 0.4;
    const focus = (id: string | null) => {
      if (!id) {
        gsap.to([...nodes, ...edgeEls, ...labelEls], { opacity: 1, duration: dur, ease: "settle", overwrite: "auto" });
        return;
      }
      edges.forEach((e, i) => {
        const on = e.from === id || e.to === id;
        gsap.to([edgeEls[i], labelEls[i]], { opacity: on ? 1 : 0.12, duration: dur, ease: "settle", overwrite: "auto" });
      });
      const touching = new Set<string>([id, ...edges.filter((e) => e.from === id || e.to === id).flatMap((e) => [e.from, e.to])]);
      nodes.forEach((nEl) =>
        gsap.to(nEl, { opacity: touching.has(nEl.dataset.node ?? "") ? 1 : 0.3, duration: dur, ease: "settle", overwrite: "auto" }),
      );
    };
    const onOver = (e: Event) => {
      const g = (e.target as Element | null)?.closest<SVGGElement>("[data-node]");
      focus(g?.dataset.node ?? null);
    };
    const onLeave = () => focus(null);
    svg.addEventListener("mouseover", onOver);
    svg.addEventListener("mouseleave", onLeave);
    return () => {
      svg.removeEventListener("mouseover", onOver);
      svg.removeEventListener("mouseleave", onLeave);
    };
  }, [edges, reduced]);

  const fs = 13 * L.fontScale;
  const labelFs = fs * 0.7;

  const subLines = (sub: string): string[] => {
    if (L.subLines === 1) return [sub];
    const parts = sub.split(" · ");
    if (parts.length <= 1) return [sub];
    const total = sub.length;
    let first: string[] = [];
    let len = 0;
    let i = 0;
    while (i < parts.length - 1 && len + parts[i].length < total / 2) {
      first.push(parts[i]);
      len += parts[i].length + 3;
      i++;
    }
    if (!first.length) {
      first = [parts[0]];
      i = 1;
    }
    return [first.join(" · "), parts.slice(i).join(" · ")];
  };

  return (
    <svg ref={svgRef} viewBox={L.viewBox} className="h-auto w-full" role="img" aria-labelledby={`arch-title-${layout}`}>
      <title id={`arch-title-${layout}`}>
        {"System diagram: broker feed and pre-market list into the execution engine; engine to Postgres, object storage and the relay; relay to the desk, the mobile app and push; desk to Postgres for configuration and halt."}
      </title>

      {edges.map((e) => (
        <path
          key={`e-${e.i}`}
          data-edge
          d={e.d}
          fill="none"
          stroke="var(--fg)"
          strokeOpacity={0.32}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeDasharray={e.dir === "both" ? "4 5" : undefined}
        />
      ))}

      {architecture.nodes.map((n) => {
        const b = L.boxes[n.id];
        const accent = n.group === "engine";
        const lines = subLines(n.sub);
        return (
          <g key={n.id} data-group={n.group} data-node={n.id} data-cursor="trace">
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill={accent ? "var(--accent)" : "var(--bg-2)"}
              stroke={accent ? "var(--accent)" : "var(--fg)"}
              strokeOpacity={accent ? 1 : 0.22}
              strokeWidth={1}
            />
            <text
              x={b.x + 16}
              y={b.y + 28}
              fontSize={fs * 1.1}
              fontWeight={500}
              fill={accent ? "var(--accent-ink)" : "var(--fg)"}
              fontFamily="var(--font-geist-sans)"
            >
              {n.label}
            </text>
            {lines.map((line, li) => (
              <text
                key={li}
                x={b.x + 16}
                y={b.y + 50 + li * (fs * 1.15)}
                fontSize={fs * 0.78}
                fill={accent ? "var(--accent-ink)" : "var(--muted)"}
                fontFamily="var(--font-geist-mono)"
                opacity={accent ? 0.8 : 1}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {edges.map((e) => {
        const w = e.label.length * labelFs * 0.62 + 14;
        const h = labelFs * 1.8;
        const [lx, ly] = e.at;
        return (
          <g key={`l-${e.i}`} data-edge-label transform={e.rot ? `rotate(${e.rot} ${lx} ${ly})` : undefined}>
            <rect x={lx - w / 2} y={ly - h / 2} width={w} height={h} fill="var(--bg)" stroke="var(--line)" />
            <text x={lx} y={ly + labelFs * 0.36} fontSize={labelFs} textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-geist-mono)">
              {e.label}
            </text>
          </g>
        );
      })}

      {!reduced && edges.map((e) => <circle key={`p-${e.i}`} data-pulse r={3.5} fill="var(--accent)" />)}
    </svg>
  );
}
