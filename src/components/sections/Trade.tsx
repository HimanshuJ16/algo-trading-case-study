"use client";

import { useEffect, useRef } from "react";
import barsFile from "@/data/bars.json";
import { sectionBySlug, trade } from "@/content/caseStudy";
import { buildModel, type BarsFile } from "@/lib/indicators";
import { buildGeometry, phaseAt, readoutFor, stateAt } from "@/lib/tradeChart";
import { registerGsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";
import { ordinal } from "@/lib/ordinal";
import ChapterHeader from "@/components/ChapterHeader";
import TradeChart from "@/components/sections/trade/TradeChart";

const meta = sectionBySlug("trade");
const data = barsFile as BarsFile;
const model = buildModel(data);
const geo = buildGeometry(model);

const LAST = model.bars.length - 1;
const symbol = data.symbol.replace("NSE:", "").replace("-EQ", "");
const note = data.provisional ? trade.provisionalNote : trade.realNote;

export default function Trade() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackEl = track.current;
    const stageEl = stage.current;
    if (!trackEl || !stageEl || prefersReducedMotion()) return;
    registerGsap();

    const $ = <T extends Element>(sel: string) => Array.from(stageEl.querySelectorAll<T>(sel));
    const clip = stageEl.querySelector<SVGRectElement>("[data-clip]");
    const bar = stageEl.querySelector<HTMLElement>("[data-progress]");
    const readout = stageEl.querySelector<HTMLElement>("[data-readout]");
    const cells = $<HTMLElement>("[data-cell]");
    const candles = $<SVGGElement>("[data-candle]");
    const ratchets = $<SVGPathElement>("[data-ratchet]");
    const phases = $<HTMLElement>("[data-phase]");
    const entry = stageEl.querySelector<SVGGElement>('[data-marker="entry"]');
    const exit = stageEl.querySelector<SVGGElement>('[data-marker="exit"]');

    // Time starts before the first bar, so the session opens on an empty
    // chart rather than one bar already printed.
    let current = -2;
    const draw = (next: number) => {
      if (next === current) return;
      current = next;

      if (clip) clip.setAttribute("width", String(next < 0 ? 0 : geo.x(next) + geo.step / 2));
      for (const c of candles) {
        const on = Number(c.dataset.candle) <= next;
        c.style.opacity = on ? "1" : "0";
        c.style.transform = on ? "scaleY(1)" : "scaleY(0)";
      }
      for (const r of ratchets) r.style.opacity = Number(r.dataset.ratchet) <= next ? "0.9" : "0";
      for (const [marker, at] of [
        [entry, model.sim.entryIdx],
        [exit, model.sim.exitIdx],
      ] as const) {
        if (!marker) continue;
        const on = next >= at;
        marker.style.opacity = on ? "1" : "0";
        marker.style.transform = on ? "scale(1)" : "scale(0)";
      }

      const i = Math.max(0, next);
      const values = readoutFor(model, i);
      cells.forEach((cell, k) => {
        cell.textContent = values[k].v;
      });
      if (readout) readout.dataset.state = stateAt(model, i);
      const phase = phaseAt(model, i);
      phases.forEach((el, k) => {
        el.dataset.on = k === phase ? "1" : "0";
      });
    };

    draw(-1);

    const trigger = ScrollTrigger.create({
      trigger: trackEl,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (bar) bar.style.width = `${(self.progress * 100).toFixed(1)}%`;
        // Overshoot the bar count slightly so the last bar holds on screen
        // instead of flicking past at the very end of the track.
        draw(Math.min(LAST, Math.floor(self.progress * (model.bars.length + 1.5))));
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section
      id={meta.id}
      aria-labelledby={`${meta.id}-title`}
      className="border-t border-line pt-[clamp(5rem,10vw,9rem)] pr-[var(--gutter-r)] pl-[var(--gutter-l)]"
    >
      <ChapterHeader meta={meta} intro={trade.intro} />

      <div ref={track} className="trade-track">
        <div ref={stage} className="trade-stage">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2.2fr)_minmax(16rem,1fr)]">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap justify-between gap-x-6 gap-y-1 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-muted">
                <span>
                  {symbol} · {data.date}
                </span>
                <span className="flex flex-wrap gap-x-5">
                  <span className="text-fg/70">{trade.legend.price}</span>
                  <span className="text-up">{trade.legend.supertrend}</span>
                  <span className="text-accent">{trade.legend.stop}</span>
                </span>
              </div>

              <div className="border border-line bg-bg-2 p-4">
                <TradeChart model={model} />
              </div>

              <div className="mt-3 h-px bg-line">
                <div data-progress className="h-px w-0 bg-accent" />
              </div>

              <dl
                data-readout
                data-state={stateAt(model, LAST)}
                className="readout mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border border-line px-3 py-2.5 font-mono sm:grid-cols-3 lg:grid-cols-5"
              >
                {readoutFor(model, LAST).map((r) => (
                  <div key={r.k}>
                    <dt className="text-[0.56rem] uppercase tracking-[0.14em] text-muted">{r.k}</dt>
                    <dd data-cell className="mt-0.5 mb-0 ml-0 text-[0.82rem] whitespace-nowrap tabular-nums">
                      {r.v}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 max-w-[70ch] text-[0.82rem] leading-[1.5] text-muted">{note}</p>
            </div>

            <ol className="m-0 flex list-none flex-col gap-6 p-0">
              {trade.phases.map((p, i) => (
                <li key={p.key} data-phase className="trade-phase" data-on={i === 3 ? "1" : "0"}>
                  <h3 className="m-0 mb-1.5 flex items-baseline gap-3 text-[1rem] font-semibold tracking-[-0.01em]">
                    <span className="font-mono text-[0.64rem] font-normal text-accent">{ordinal(i)}</span>
                    {p.title}
                  </h3>
                  <p className="m-0 text-[0.9rem] leading-[1.5] text-fg/80">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
