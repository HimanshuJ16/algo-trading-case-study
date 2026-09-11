"use client";

import { useEffect, useMemo, useRef } from "react";
import raw from "@/data/bars.json";
import { trade as copy, sectionById } from "@/content/caseStudy";
import { supertrend, simulateLong, firstLongFlip, type Bar } from "@/lib/indicators";
import { gsap, registerGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSectionTheme } from "@/lib/useSectionTheme";
import SectionHeader from "@/components/SectionHeader";
import TradeChart, { type ChartModel } from "./trade/TradeChart";

const meta = sectionById("trade");
const readoutLabels = ["bar", "close", "atr(14)", "stop", "room"] as const;

type BarsFile = {
  symbol: string;
  date: string;
  provisional?: boolean;
  warmup?: Bar[];
  bars: Bar[];
  entry?: { t: string; price: number };
  exit?: { t: string; price: number; reason: string };
};

const data = raw as BarsFile;

/** Compute the model once; the file may or may not carry entry/exit. */
function buildModel(): ChartModel {
  const warm = data.warmup ?? [];
  const all = [...warm, ...data.bars];
  const st = supertrend(all, 20, 1);
  const off = warm.length;
  let entryAll = data.entry ? all.findIndex((b, i) => i >= off && b.t === data.entry!.t) : -1;
  if (entryAll < 0) entryAll = firstLongFlip(st.dir, off + 1, all.length - 2);
  if (entryAll < 0) entryAll = off + Math.min(4, data.bars.length - 2);
  const sim = simulateLong(all, st.atr, entryAll);
  return {
    bars: data.bars,
    line: st.line.slice(off),
    dir: st.dir.slice(off),
    atr: st.atr.slice(off),
    sim: {
      ...sim,
      entryIdx: sim.entryIdx - off,
      exitIdx: sim.exitIdx - off,
      stops: sim.stops.slice(off),
    },
  };
}

/**
 * The pinned, scrubbed trade. A tall scroll track holds a sticky stage; one
 * GSAP timeline is scrubbed by scroll progress. Sticky rather than a
 * ScrollTrigger pin so the same code works on touch. Two chart instances
 * exist (wide and compact); CSS shows one and the timeline targets whichever
 * is visible. Reduced motion: no track, no timeline, the chart is fully
 * drawn with all four captions in normal flow.
 */
export default function Trade() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const model = useMemo(() => buildModel(), []);
  useSectionTheme(ref, meta.theme);

  const { sim, bars } = model;
  const n = bars.length;
  const phaseAt = useMemo(() => [0, sim.entryIdx, Math.min(sim.entryIdx + 1, n - 1), sim.exitIdx], [sim, n]);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage || reduced) return;
    registerGsap();

    const mm = gsap.matchMedia();
    const build = (inactiveAlpha: number) => {
      const svg = Array.from(stage.querySelectorAll<SVGSVGElement>("svg[data-chart]")).find(
        (s) => s.getClientRects().length > 0,
      );
      if (!svg) return;
      const candles = Array.from(svg.querySelectorAll<SVGGElement>("[data-candle]"));
      const clip = svg.querySelector<SVGRectElement>("[data-clip]");
      const entry = svg.querySelector<SVGGElement>('[data-marker="entry"]');
      const exit = svg.querySelector<SVGGElement>('[data-marker="exit"]');
      const ratchets = Array.from(svg.querySelectorAll<SVGGElement>("[data-ratchet]"));
      const captions = Array.from(stage.querySelectorAll<HTMLElement>("[data-phase]"));
      const progress = stage.querySelector<HTMLElement>("[data-progress]");
      const readout = stage.querySelector<HTMLElement>("[data-readout]");
      if (!clip || !entry || !exit) return;

      gsap.set(candles, { scaleY: 0, autoAlpha: 0 });
      gsap.set(clip, { scaleX: 0 });
      gsap.set([entry, exit], { scale: 0, autoAlpha: 0 });
      gsap.set(ratchets, { scale: 0, autoAlpha: 0 });
      gsap.set(captions, { autoAlpha: inactiveAlpha });
      gsap.set(captions[0], { autoAlpha: 1 });
      if (progress) gsap.set(progress, { scaleX: 0 });

      let lastBar = -1;
      const fmt = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const setReadout = (i: number) => {
        if (!readout || i === lastBar) return;
        lastBar = i;
        const b = bars[i];
        const a = model.atr[i];
        const st = sim.stops[i];
        const cells = readout.querySelectorAll<HTMLElement>("[data-cell]");
        const vals = [
          b.t,
          fmt(b.c),
          Number.isNaN(a) ? "—" : a.toFixed(2),
          st === null ? "—" : fmt(st),
          st === null || Number.isNaN(a) || a === 0 ? "—" : `${((b.c - st) / a).toFixed(2)} ATR`,
        ];
        cells.forEach((c, k) => (c.textContent = vals[k] ?? ""));
        readout.dataset.state = i < sim.entryIdx ? "flat" : i < sim.exitIdx ? "long" : "closed";
      };
      setReadout(0);

      const tl = gsap.timeline({
        scrollTrigger: { trigger: track, start: "top top", end: "bottom bottom", scrub: 0.8 },
        onUpdate() {
          setReadout(Math.max(0, Math.min(n - 1, Math.floor(this.time()))));
        },
      });
      candles.forEach((c, i) => tl.to(c, { scaleY: 1, autoAlpha: 1, duration: 0.6, ease: "reveal" }, i));
      tl.to(clip, { scaleX: 1, duration: n, ease: "none" }, 0);
      if (progress) tl.to(progress, { scaleX: 1, duration: n, ease: "none" }, 0);
      // Ratchet ticks pop at their bar; ticks are in bar order in the DOM.
      const tickBars = bars.map((_, i) => i).filter((i) => {
        const s0 = sim.stops[i];
        const p0 = i > 0 ? sim.stops[i - 1] : null;
        return s0 !== null && p0 !== null && s0 > p0;
      });
      ratchets.forEach((r, k) => {
        const at = tickBars[k] ?? sim.entryIdx;
        tl.to(r, { scale: 1, autoAlpha: 0.9, duration: 0.5, ease: "snap" }, at + 0.35);
      });
      tl.to(entry, { scale: 1, autoAlpha: 1, duration: 0.8, ease: "snap" }, sim.entryIdx + 0.3);
      tl.to(exit, { scale: 1, autoAlpha: 1, duration: 0.8, ease: "snap" }, sim.exitIdx + 0.3);
      phaseAt.forEach((at, p) => {
        if (p === 0) return;
        tl.to(captions[p - 1], { autoAlpha: inactiveAlpha, duration: 0.5, ease: "settle" }, at);
        tl.to(captions[p], { autoAlpha: 1, duration: 0.5, ease: "settle" }, at);
      });
      tl.to({}, { duration: 2 });
    };

    mm.add("(min-width: 1024px)", () => build(0.7));
    mm.add("(max-width: 1023px)", () => build(0));
    return () => mm.revert();
  }, [reduced, sim, n, phaseAt, bars, model.atr]);

  const note = data.provisional ? copy.provisionalNote : copy.realNote;
  const finalBar = bars[sim.exitIdx];
  const finalStop = sim.stops[sim.exitIdx];
  const finalAtr = model.atr[sim.exitIdx];
  const staticReadout = [
    finalBar.t,
    finalBar.c.toFixed(2),
    Number.isNaN(finalAtr) ? "—" : finalAtr.toFixed(2),
    finalStop === null ? "—" : finalStop.toFixed(2),
    finalStop === null || Number.isNaN(finalAtr) || finalAtr === 0 ? "—" : `${((finalBar.c - finalStop) / finalAtr).toFixed(2)} ATR`,
  ];
  const symbol = data.symbol.replace("NSE:", "").replace("-EQ", "");

  return (
    <section ref={ref} id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad">
      <SectionHeader meta={meta} intro={copy.intro} />

      <div ref={trackRef} className={reduced ? "" : "trade-track"}>
        <div ref={stageRef} className={reduced ? "" : "trade-stage"} data-cursor={reduced ? undefined : "scrub"}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                <span className="whitespace-nowrap">
                  {symbol} · {data.date}
                </span>
                <span className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="whitespace-nowrap text-fg/70">{copy.legend.price}</span>
                  <span className="whitespace-nowrap text-up/90">{copy.legend.supertrend}</span>
                  <span className="whitespace-nowrap text-accent">{copy.legend.stop}</span>
                </span>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-line bg-bg-2 p-2 md:p-4">
                <div className="hidden md:block">
                  <TradeChart model={model} id="trade-chart-wide" width={1000} />
                </div>
                <div className="md:hidden">
                  <TradeChart model={model} id="trade-chart-compact" width={560} />
                </div>
              </div>
              {!reduced ? (
                <div className="mt-3 h-px w-full bg-line">
                  <div data-progress className="h-px w-full origin-left bg-accent" />
                </div>
              ) : null}
              <dl data-readout data-state="flat" className="readout mt-3">
                {readoutLabels.map((l, k) => (
                  <div key={l}>
                    <dt>{l}</dt>
                    <dd data-cell>{reduced ? staticReadout[k] : "—"}</dd>
                  </div>
                ))}
              </dl>
              <p className="fig-caption mt-3 max-w-[70ch]">{note}</p>
            </div>

            <ol className="trade-captions flex flex-col gap-5 lg:gap-7">
              {copy.phases.map((p, i) => (
                <li key={p.key} data-phase className="border-l border-line pl-4">
                  <h3 className="mb-1.5 flex items-baseline gap-3 font-sans text-[0.98rem] font-medium tracking-[-0.005em] text-fg">
                    <span className="font-mono text-[0.68rem] text-fg">0{i + 1}</span>
                    {p.title}
                  </h3>
                  <p className="text-[0.98rem] leading-[1.5] text-fg/90">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
