import type { TradeModel } from "@/lib/indicators";

/** Chart viewport. The right pad holds the price axis, the bottom the clock. */
export const W = 1000;
export const H = 520;
const PAD = { t: 24, r: 72, b: 40, l: 12 };

export type Candle = {
  i: number;
  x: number;
  yHigh: number;
  yLow: number;
  bodyX: number;
  bodyY: number;
  bodyW: number;
  bodyH: number;
  up: boolean;
};

export type Geometry = {
  /** Centre x of bar i, and the width of one bar slot. */
  x: (i: number) => number;
  step: number;
  candles: Candle[];
  /** Supertrend, split into runs so each run can take its direction's colour. */
  trendRuns: { d: string; up: boolean }[];
  /** The trailing stop as a stepped path from entry to exit. */
  stopPath: string;
  /** A caret under every bar where the stop ratcheted up. */
  ratchets: { i: number; d: string }[];
  priceTicks: { y: number; label: string }[];
  timeLabels: { x: number; t: string }[];
  entry: { x: number; y: number; labelY: number; label: string };
  exit: { x: number; y: number; labelY: number; label: string; cross: string };
};

/**
 * Lay the session out once. Everything the scrub does later is an opacity or
 * a clip width over this geometry, so no arithmetic runs per frame.
 */
export function buildGeometry(model: TradeModel): Geometry {
  const { bars, line, dir, sim } = model;
  const n = bars.length;

  const stops = sim.stops.filter((s): s is number => s !== null);
  const trend = line.filter((v) => !Number.isNaN(v));
  const min = Math.min(...bars.map((b) => b.l), ...stops, ...trend);
  const max = Math.max(...bars.map((b) => b.h), ...trend);
  const range = max - min || 1;

  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const step = iw / n;
  const x = (i: number) => PAD.l + step * (i + 0.5);
  const y = (p: number) => PAD.t + ih - ((p - min) / range) * ih;
  const bodyW = Math.max(3, step * 0.55);

  const candles: Candle[] = bars.map((b, i) => {
    const up = b.c >= b.o;
    const top = y(Math.max(b.o, b.c));
    const bottom = y(Math.min(b.o, b.c));
    return {
      i,
      x: x(i),
      yHigh: y(b.h),
      yLow: y(b.l),
      bodyX: x(i) - bodyW / 2,
      bodyY: top,
      bodyW,
      bodyH: Math.max(1.5, bottom - top),
      up,
    };
  });

  // Break the Supertrend wherever direction flips, so a run never draws a
  // vertical leap between the two bands in one colour.
  const trendRuns: { d: string; up: boolean }[] = [];
  let run: string[] = [];
  let runDir = 0;
  for (let i = 0; i < n; i++) {
    if (Number.isNaN(line[i])) continue;
    const pt = `${x(i).toFixed(1)},${y(line[i]).toFixed(1)}`;
    if (dir[i] !== runDir && run.length) {
      trendRuns.push({ d: `M${run.join(" L")}`, up: runDir === 1 });
      run = [run[run.length - 1]];
    }
    runDir = dir[i];
    run.push(pt);
  }
  if (run.length > 1) trendRuns.push({ d: `M${run.join(" L")}`, up: runDir === 1 });

  // The stop holds its level across each bar, so it is drawn as a stair,
  // not a diagonal: it is a price, not a trend line.
  const stair: string[] = [];
  for (let i = sim.entryIdx; i <= sim.exitIdx; i++) {
    const s = sim.stops[i];
    if (s === null) continue;
    stair.push(`${(x(i) - step / 2).toFixed(1)},${y(s).toFixed(1)}`, `${(x(i) + step / 2).toFixed(1)},${y(s).toFixed(1)}`);
  }

  const ratchets: { i: number; d: string }[] = [];
  bars.forEach((_, i) => {
    const s = sim.stops[i];
    const prev = i > 0 ? sim.stops[i - 1] : null;
    if (s === null || prev === null || s <= prev) return;
    const cx = x(i);
    const cy = y(s);
    ratchets.push({ i, d: `M${cx - 4},${cy + 9} L${cx},${cy + 3} L${cx + 4},${cy + 9} Z` });
  });

  // A round step near range/5, so the axis lands on readable numbers.
  const rough = range / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const stepValue = [1, 2, 2.5, 5, 10].map((k) => k * magnitude).find((v) => v >= rough) ?? rough;
  const priceTicks: { y: number; label: string }[] = [];
  for (let v = Math.ceil(min / stepValue) * stepValue; v <= max; v += stepValue) {
    priceTicks.push({ y: y(v), label: Math.round(v).toLocaleString("en-IN") });
  }

  const eX = x(sim.entryIdx);
  const eY = y(sim.entryPrice);
  const xX = x(sim.exitIdx);
  const xY = y(sim.exitPrice);

  return {
    x,
    step,
    candles,
    trendRuns,
    stopPath: stair.length ? `M${stair.join(" L")}` : "",
    ratchets,
    priceTicks,
    timeLabels: bars.map((b, i) => ({ x: x(i), t: b.t })).filter((_, i) => i % 4 === 0),
    entry: { x: eX, y: eY, labelY: eY - 16, label: `entry ${bars[sim.entryIdx].t}` },
    exit: {
      x: xX,
      y: xY,
      labelY: xY + 26,
      label: `exit ${bars[sim.exitIdx].t}`,
      cross: `M${xX - 3},${xY - 3} L${xX + 3},${xY + 3} M${xX - 3},${xY + 3} L${xX + 3},${xY - 3}`,
    },
  };
}

const inr = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The five-cell readout under the chart, for whichever bar is current. */
export function readoutFor(model: TradeModel, i: number) {
  const b = model.bars[i];
  const a = model.atr[i];
  const stop = model.sim.stops[i];
  return [
    { k: "bar", v: b.t },
    { k: "close", v: inr(b.c) },
    { k: "atr(14)", v: Number.isNaN(a) ? "—" : a.toFixed(2) },
    { k: "stop", v: stop === null ? "—" : inr(stop) },
    { k: "room", v: stop === null || !a || Number.isNaN(a) ? "—" : `${((b.c - stop) / a).toFixed(2)} ATR` },
  ];
}

export const stateAt = (model: TradeModel, i: number): "flat" | "long" | "closed" =>
  i < model.sim.entryIdx ? "flat" : i < model.sim.exitIdx ? "long" : "closed";

/** Which of the four phases the trade is in at bar i. */
export function phaseAt(model: TradeModel, i: number): number {
  const { entryIdx, exitIdx } = model.sim;
  const marks = [0, entryIdx, Math.min(entryIdx + 1, model.bars.length - 1), exitIdx];
  let phase = 0;
  marks.forEach((at, idx) => {
    if (i >= at) phase = idx;
  });
  return phase;
}
