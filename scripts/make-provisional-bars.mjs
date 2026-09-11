/**
 * Builds a PROVISIONAL src/data/bars.json for the pinned trade section until a
 * real 15-minute export replaces it.
 *
 * What is real: the symbol, and every day's open, high, low and close, read
 * from the NSE bhavcopy files cached by the engine. What is synthetic: the
 * intraday path between those four prices. The generator searches seeds until
 * the target day contains a Supertrend(20,1) long flip followed by a trailing
 * stop exit, so the section has all four phases to show.
 *
 *   node scripts/make-provisional-bars.mjs [SYMBOL] [TARGET_DDMMYYYY]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.resolve(here, "../../live-stocks-equity-algo-bot/equity_bot/data/data_cache");
const outFile = path.resolve(here, "../src/data/bars.json");
const SYMBOL = process.argv[2] || "SYRMA";
const TARGET = process.argv[3] || "07092026";

// ── read every cached bhavcopy day for the symbol ───────────────────────────
const files = fs.readdirSync(cacheDir).filter((f) => /^(bhavcopy|bhav_probe)_\d{8}\.csv$/.test(f));
const days = new Map();
for (const f of files) {
  const ddmmyyyy = f.match(/(\d{8})/)[1];
  const lines = fs.readFileSync(path.join(cacheDir, f), "utf8").split(/\r?\n/);
  const hdr = lines[0].split(",").map((s) => s.trim());
  const ix = (k) => hdr.indexOf(k);
  for (const line of lines.slice(1)) {
    const c = line.split(",").map((s) => s.trim());
    if (c[ix("SYMBOL")] !== SYMBOL || c[ix("SERIES")] !== "EQ") continue;
    days.set(ddmmyyyy, {
      o: +c[ix("OPEN_PRICE")], h: +c[ix("HIGH_PRICE")], l: +c[ix("LOW_PRICE")], c: +c[ix("CLOSE_PRICE")],
    });
  }
}
const toISO = (d) => `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
const ordered = [...days.keys()].sort((a, b) => toISO(a).localeCompare(toISO(b)));
if (!days.has(TARGET)) throw new Error(`no ${SYMBOL} row for ${TARGET}; have ${ordered.join(", ")}`);
const warmDays = ordered.filter((d) => toISO(d) < toISO(TARGET));
console.log(`${SYMBOL}: target ${toISO(TARGET)}, warm-up days: ${warmDays.map(toISO).join(", ")}`);

// ── synth helpers ───────────────────────────────────────────────────────────
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TIMES = Array.from({ length: 25 }, (_, i) => {
  const m = 9 * 60 + 15 + i * 15;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const r2 = (x) => Math.round(x * 20) / 20; // 0.05 tick

/** Brownian bridge from O to C, rescaled so the path touches H and L exactly. */
function synthDay(day, rand) {
  const n = TIMES.length;
  const steps = Array.from({ length: n }, () => rand() - 0.5);
  let cum = 0;
  const walk = steps.map((s) => (cum += s));
  const closes = walk.map((w, i) => {
    const bridge = w - (walk[n - 1] * (i + 1)) / n; // ends at 0
    return day.o + (day.c - day.o) * ((i + 1) / n) + bridge * (day.h - day.l) * 0.9;
  });
  const mx = Math.max(...closes, day.o), mn = Math.min(...closes, day.o);
  const scale = (day.h - day.l) / Math.max(1e-9, mx - mn);
  const norm = closes.map((c) => day.l + (c - mn) * scale * 0.96 + (day.h - day.l) * 0.02);
  norm[n - 1] = day.c;
  const bars = [];
  let prev = day.o;
  const hiIdx = norm.indexOf(Math.max(...norm));
  const loIdx = norm.indexOf(Math.min(...norm));
  for (let i = 0; i < n; i++) {
    const o = i === 0 ? day.o : prev;
    const c = norm[i];
    const wick = (day.h - day.l) * 0.012 * rand();
    let h = Math.max(o, c) + wick, l = Math.min(o, c) - wick;
    if (i === hiIdx) h = day.h;
    if (i === loIdx) l = day.l;
    h = Math.min(day.h, h); l = Math.max(day.l, l);
    bars.push({ t: TIMES[i], o: r2(o), h: r2(h), l: r2(l), c: r2(c) });
    prev = c;
  }
  return bars;
}

// ── indicators (same arithmetic as src/lib/indicators.ts) ──────────────────
function wilderAtr(bars, period = 14) {
  const out = new Array(bars.length).fill(NaN); let sum = 0, atr = NaN;
  for (let i = 0; i < bars.length; i++) {
    const p = bars[i - 1], b = bars[i];
    const tr = p ? Math.max(b.h - b.l, Math.abs(b.h - p.c), Math.abs(b.l - p.c)) : b.h - b.l;
    if (i < period) { sum += tr; if (i === period - 1) { atr = sum / period; out[i] = atr; } continue; }
    atr = (atr * (period - 1) + tr) / period; out[i] = atr;
  }
  return out;
}
function supertrend(bars, period = 20, mult = 1) {
  const atr = wilderAtr(bars, period); const dir = new Array(bars.length).fill(0);
  let upPrev = NaN, dnPrev = NaN, trend = 1;
  for (let i = 0; i < bars.length; i++) {
    if (Number.isNaN(atr[i])) continue;
    const b = bars[i], hl2 = (b.h + b.l) / 2; let up = hl2 - mult * atr[i], dn = hl2 + mult * atr[i];
    if (!Number.isNaN(upPrev)) {
      const pc = bars[i - 1].c;
      if (pc > upPrev) up = Math.max(up, upPrev); if (pc < dnPrev) dn = Math.min(dn, dnPrev);
      if (trend === -1 && b.c > dnPrev) trend = 1; else if (trend === 1 && b.c < upPrev) trend = -1;
    }
    dir[i] = trend; upPrev = up; dnPrev = dn;
  }
  return { dir, atr: wilderAtr(bars, 14) };
}
function simulateLong(bars, atr, entryIdx, mult = 1.5, tick = 0.05) {
  let stop = -Infinity;
  for (let i = entryIdx; i < bars.length; i++) {
    if (i > entryIdx && bars[i].l <= stop) return { exitIdx: i, exitPrice: r2(stop - tick), reason: "trailing_stop" };
    stop = Math.max(stop, r2(bars[i].c - Math.max(mult * (atr[i] || 0), 2 * tick)));
  }
  return { exitIdx: bars.length - 1, exitPrice: bars[bars.length - 1].c, reason: "square_off" };
}

// ── search seeds for a day with flip → ratchet (≥4 bars) → stop exit ───────
for (let seed = 1; seed < 5000; seed++) {
  const rand = mulberry32(seed);
  const warmup = warmDays.flatMap((d) => synthDay(days.get(d), rand));
  const session = synthDay(days.get(TARGET), rand);
  const all = [...warmup, ...session];
  const { dir, atr } = supertrend(all);
  const off = warmup.length;
  let entry = -1;
  for (let i = off + 1; i < all.length - 6; i++) if (dir[i] === 1 && dir[i - 1] === -1) { entry = i; break; }
  if (entry === -1 || entry - off < 2 || entry - off > 12) continue;
  const sim = simulateLong(all, atr, entry);
  if (sim.reason !== "trailing_stop" || sim.exitIdx - entry < 5 || sim.exitIdx >= all.length - 1) continue;
  const out = {
    symbol: `NSE:${SYMBOL}-EQ`,
    date: toISO(TARGET),
    provisional: true,
    note: "Synthetic intraday path inside real daily O/H/L/C from the NSE bhavcopy. Replace with a real 15m export.",
    warmup,
    bars: session,
    entry: { t: all[entry].t, price: all[entry].c },
    exit: { t: all[sim.exitIdx].t, price: sim.exitPrice, reason: sim.reason },
  };
  fs.writeFileSync(outFile, JSON.stringify(out, null, 0) + "\n");
  console.log(`seed ${seed}: entry ${out.entry.t} @ ${out.entry.price}, exit ${out.exit.t} @ ${out.exit.price} (${sim.exitIdx - entry} bars held)`);
  console.log(`wrote ${path.relative(process.cwd(), outFile)} (${warmup.length} warm-up bars, ${session.length} session bars)`);
  process.exit(0);
}
throw new Error("no seed produced a usable trade");
