/**
 * Indicator arithmetic mirroring the engine: Wilder ATR, a TradingView-exact
 * Supertrend on hl2, and the monotonic ATR trailing stop evaluated on bar
 * closes. Pure functions, no DOM, safe on the server.
 */

export type Bar = { t: string; o: number; h: number; l: number; c: number };

export function trueRange(b: Bar, prev?: Bar): number {
  if (!prev) return b.h - b.l;
  return Math.max(b.h - b.l, Math.abs(b.h - prev.c), Math.abs(b.l - prev.c));
}

/** Wilder's smoothed ATR. NaN until `period` bars have closed. */
export function wilderAtr(bars: Bar[], period = 14): number[] {
  const out: number[] = new Array(bars.length).fill(NaN);
  let sum = 0;
  let atr = NaN;
  for (let i = 0; i < bars.length; i++) {
    const tr = trueRange(bars[i], bars[i - 1]);
    if (i < period) {
      sum += tr;
      if (i === period - 1) {
        atr = sum / period;
        out[i] = atr;
      }
      continue;
    }
    atr = (atr * (period - 1) + tr) / period;
    out[i] = atr;
  }
  return out;
}

export type SupertrendResult = { line: number[]; dir: number[]; atr: number[] };

/**
 * Supertrend with the TradingView band-carry rules:
 *   up := close[1] > up[1] ? max(up, up[1]) : up
 *   dn := close[1] < dn[1] ? min(dn, dn[1]) : dn
 *   trend flips when close crosses the previous final band.
 */
export function supertrend(bars: Bar[], period = 20, mult = 1): SupertrendResult {
  const atr = wilderAtr(bars, period);
  const line: number[] = new Array(bars.length).fill(NaN);
  const dir: number[] = new Array(bars.length).fill(0);
  let upPrev = NaN;
  let dnPrev = NaN;
  let trend = 1;
  for (let i = 0; i < bars.length; i++) {
    if (Number.isNaN(atr[i])) continue;
    const b = bars[i];
    const hl2 = (b.h + b.l) / 2;
    let up = hl2 - mult * atr[i];
    let dn = hl2 + mult * atr[i];
    if (!Number.isNaN(upPrev)) {
      const pc = bars[i - 1].c;
      if (pc > upPrev) up = Math.max(up, upPrev);
      if (pc < dnPrev) dn = Math.min(dn, dnPrev);
      if (trend === -1 && b.c > dnPrev) trend = 1;
      else if (trend === 1 && b.c < upPrev) trend = -1;
    }
    line[i] = trend === 1 ? up : dn;
    dir[i] = trend;
    upPrev = up;
    dnPrev = dn;
  }
  return { line, dir, atr };
}

export const roundTick = (x: number, tick = 0.05) => Math.round(x / tick) * tick;

export type TradeSim = {
  entryIdx: number;
  entryPrice: number;
  /** Stop level after each bar from entry to exit; null elsewhere. */
  stops: (number | null)[];
  exitIdx: number;
  exitPrice: number;
  reason: "trailing_stop" | "square_off";
};

/**
 * Long trade: enter at the signal bar's close, then on each later bar exit if
 * the low breaches the standing stop (filled one tick worse, as the paper
 * engine does), otherwise ratchet the stop to max(previous, close − mult×ATR)
 * with a minimum two-tick buffer. Square off on the last bar if still open.
 */
export function simulateLong(
  bars: Bar[],
  atr: number[],
  entryIdx: number,
  opts: { mult?: number; tick?: number; minBufferTicks?: number } = {},
): TradeSim {
  const { mult = 1.5, tick = 0.05, minBufferTicks = 2 } = opts;
  const stops: (number | null)[] = bars.map(() => null);
  let stop = -Infinity;
  let exitIdx = -1;
  let exitPrice = NaN;
  let reason: TradeSim["reason"] = "square_off";
  for (let i = entryIdx; i < bars.length; i++) {
    if (i > entryIdx && bars[i].l <= stop) {
      exitIdx = i;
      exitPrice = roundTick(stop - tick, tick);
      reason = "trailing_stop";
      stops[i] = stop;
      break;
    }
    const dist = Math.max(mult * (Number.isNaN(atr[i]) ? 0 : atr[i]), minBufferTicks * tick);
    stop = Math.max(stop, roundTick(bars[i].c - dist, tick));
    stops[i] = stop;
  }
  if (exitIdx === -1) {
    exitIdx = bars.length - 1;
    exitPrice = bars[exitIdx].c;
  }
  return { entryIdx, entryPrice: bars[entryIdx].c, stops, exitIdx, exitPrice, reason };
}

/** First bar in [from, to) where the Supertrend direction flips from −1 to +1. */
export function firstLongFlip(dir: number[], from: number, to: number): number {
  for (let i = Math.max(from, 1); i < to; i++) {
    if (dir[i] === 1 && dir[i - 1] === -1) return i;
  }
  return -1;
}

export type BarsFile = {
  symbol: string;
  date: string;
  provisional?: boolean;
  warmup?: Bar[];
  bars: Bar[];
  entry?: { t: string; price: number };
  exit?: { t: string; price: number; reason?: string };
};

export type TradeModel = {
  bars: Bar[];
  /** Supertrend line, direction and ATR, sliced back to the session. */
  line: number[];
  dir: number[];
  atr: number[];
  sim: TradeSim;
};

/**
 * Build the chart model from a bars file, the way the engine seeds itself:
 * warm-up bars are prepended so Supertrend(20, 1) and ATR(14) are already
 * converged when the session's first bar closes, then the indicator series
 * and the simulated trade are sliced back to the session's own indices.
 *
 * A recorded entry is honoured if the file has one; otherwise the first long
 * flip in the session is used, and failing that a bar early enough to leave
 * the trade room to run. Pure, so the chart renders identically on the server.
 */
export function buildModel(data: BarsFile): TradeModel {
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
