"use client";

import { useMemo } from "react";
import type { Bar, TradeSim } from "@/lib/indicators";
import { trade as copy } from "@/content/caseStudy";

export type ChartModel = {
  bars: Bar[];
  line: number[];
  dir: number[];
  atr: number[];
  sim: TradeSim;
};

const H = 520;
const PAD_T = 24;
const PAD_B = 40;

type Props = {
  model: ChartModel;
  id: string;
  /** viewBox width. Narrower = larger type relative to the drawing. */
  width?: number;
};

/**
 * Pure SVG. Every animated element carries a data attribute the parent's
 * timeline targets; this component knows nothing about scroll. All text
 * children are single strings so server and client HTML agree.
 */
export default function TradeChart({ model, id, width = 1000 }: Props) {
  const { bars, line, dir, sim } = model;
  const n = bars.length;
  const W = width;
  const compact = W < 800;
  const fs = compact ? 13 : 11;
  const PAD = { l: 12, r: compact ? 58 : 72 };

  const geo = useMemo(() => {
    const stops = sim.stops.filter((s): s is number => s !== null);
    const lows = bars.map((b) => b.l);
    const highs = bars.map((b) => b.h);
    const lineVals = line.filter((v) => !Number.isNaN(v));
    const min = Math.min(...lows, ...stops, ...lineVals);
    const max = Math.max(...highs, ...lineVals);
    const range = max - min || 1;
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD_T - PAD_B;
    const step = innerW / n;
    const x = (i: number) => PAD.l + step * (i + 0.5);
    const y = (p: number) => PAD_T + innerH - ((p - min) / range) * innerH;
    return { min, max, x, y, step };
  }, [bars, line, sim, n, W, PAD.l, PAD.r]);

  const { x, y, step } = geo;
  const bodyW = Math.max(3, step * 0.55);

  const stSegments = useMemo(() => {
    const segs: { d: string; dir: number }[] = [];
    let cur: string[] = [];
    let curDir = 0;
    for (let i = 0; i < n; i++) {
      if (Number.isNaN(line[i])) continue;
      const pt = `${x(i).toFixed(1)},${y(line[i]).toFixed(1)}`;
      if (dir[i] !== curDir && cur.length) {
        segs.push({ d: "M" + cur.join(" L"), dir: curDir });
        cur = [cur[cur.length - 1]];
      }
      curDir = dir[i];
      cur.push(pt);
    }
    if (cur.length > 1) segs.push({ d: "M" + cur.join(" L"), dir: curDir });
    return segs;
  }, [line, dir, n, x, y]);

  const stopPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = sim.entryIdx; i <= sim.exitIdx; i++) {
      const s = sim.stops[i];
      if (s === null) continue;
      const x0 = x(i) - step / 2;
      const x1 = x(i) + step / 2;
      pts.push(`${x0.toFixed(1)},${y(s).toFixed(1)}`, `${x1.toFixed(1)},${y(s).toFixed(1)}`);
    }
    return pts.length ? "M" + pts.join(" L") : "";
  }, [sim, x, y, step]);

  const ticks = useMemo(() => {
    const out: number[] = [];
    const span = geo.max - geo.min;
    const raw = span / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const stepV = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((v) => v >= raw) ?? raw;
    for (let v = Math.ceil(geo.min / stepV) * stepV; v <= geo.max; v += stepV) out.push(Math.round(v));
    return out;
  }, [geo]);

  const entryX = x(sim.entryIdx);
  const entryY = y(sim.entryPrice);
  const exitX = x(sim.exitIdx);
  const exitY = y(sim.exitPrice);
  const clipId = `${id}-clip`;
  const titleText = `Fifteen-minute candles with the Supertrend line, an entry marker at ${bars[sim.entryIdx].t}, the ATR trailing stop stepping up behind price, and the exit at ${bars[sim.exitIdx].t}.`;
  const entryLabel = `${copy.legend.entry} ${bars[sim.entryIdx].t}`;
  const exitLabel = `${copy.legend.exit} ${bars[sim.exitIdx].t}`;
  const labelEvery = compact ? 6 : 4;

  return (
    <svg data-chart viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{titleText}</title>
      <defs>
        <clipPath id={clipId}>
          <rect data-clip x={0} y={0} width={W} height={H} style={{ transformOrigin: "0 0" }} />
        </clipPath>
      </defs>

      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--fg)" strokeOpacity={0.08} />
          <text x={W - PAD.r + 10} y={y(v) + 4} fontSize={fs} fill="var(--muted)" fontFamily="var(--font-geist-mono)">
            {v.toLocaleString("en-IN")}
          </text>
        </g>
      ))}
      {bars.map((b, i) =>
        i % labelEvery === 0 ? (
          <text key={b.t} x={x(i)} y={H - 14} fontSize={fs} textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-geist-mono)">
            {b.t}
          </text>
        ) : null,
      )}

      <g clipPath={`url(#${clipId})`}>
        {stSegments.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.dir === 1 ? "var(--up)" : "var(--down)"}
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
        ))}
        {stopPath ? (
          <path data-stop d={stopPath} fill="none" stroke="var(--accent)" strokeWidth={compact ? 2.75 : 2.25} strokeLinejoin="round" />
        ) : null}
      </g>

      {bars.map((b, i) => {
        const up = b.c >= b.o;
        const top = y(Math.max(b.o, b.c));
        const bottom = y(Math.min(b.o, b.c));
        const cx = x(i);
        const origin = `${cx.toFixed(2)}px ${y((b.h + b.l) / 2).toFixed(2)}px`;
        return (
          <g key={b.t} data-candle style={{ transformOrigin: origin }}>
            <line x1={cx} x2={cx} y1={y(b.h)} y2={y(b.l)} stroke={up ? "var(--up)" : "var(--down)"} strokeWidth={1} />
            <rect
              x={cx - bodyW / 2}
              y={top}
              width={bodyW}
              height={Math.max(1.5, bottom - top)}
              fill={up ? "var(--up)" : "var(--down)"}
              fillOpacity={up ? 0.9 : 0.85}
            />
          </g>
        );
      })}

      {/* Ratchet ticks: one per bar where the stop moved up */}
      {bars.map((b, i) => {
        const s = sim.stops[i];
        const prev = i > 0 ? sim.stops[i - 1] : null;
        if (s === null || prev === null || s <= prev) return null;
        const cx = x(i);
        const cy = y(s);
        return (
          <g key={`r-${b.t}`} data-ratchet style={{ transformOrigin: `${cx.toFixed(2)}px ${cy.toFixed(2)}px` }}>
            <path d={`M${cx - 4},${cy + 9} L${cx},${cy + 3} L${cx + 4},${cy + 9} Z`} fill="var(--accent)" />
          </g>
        );
      })}

      <g data-marker="entry" style={{ transformOrigin: `${entryX.toFixed(2)}px ${entryY.toFixed(2)}px` }}>
        <circle cx={entryX} cy={entryY} r={7} fill="var(--bg)" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={entryX} cy={entryY} r={2.5} fill="var(--accent)" />
        <text x={entryX} y={entryY - 16} fontSize={fs} textAnchor="middle" fill="var(--accent)" fontFamily="var(--font-geist-mono)">
          {entryLabel}
        </text>
      </g>

      <g data-marker="exit" style={{ transformOrigin: `${exitX.toFixed(2)}px ${exitY.toFixed(2)}px` }}>
        <circle cx={exitX} cy={exitY} r={7} fill="var(--bg)" stroke="var(--fg)" strokeWidth={2} />
        <line x1={exitX - 3} x2={exitX + 3} y1={exitY - 3} y2={exitY + 3} stroke="var(--fg)" strokeWidth={1.5} />
        <line x1={exitX - 3} x2={exitX + 3} y1={exitY + 3} y2={exitY - 3} stroke="var(--fg)" strokeWidth={1.5} />
        <text x={exitX} y={exitY + 26} fontSize={fs} textAnchor="middle" fill="var(--fg)" fontFamily="var(--font-geist-mono)">
          {exitLabel}
        </text>
      </g>
    </svg>
  );
}
