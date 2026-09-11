import tape from "@/data/tape.json";

export type TapeRow = { s: string; o: number; h: number; l: number; c: number; p: number; v: number };

export const tapeRows = tape.rows as TapeRow[];
export const tapeDate = tape.date as string;

export const priceFmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const chgFmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "always" });

/** Deterministic PRNG so every client starts from the same sequence. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const changePct = (price: number, r: TapeRow) => ((price - r.p) / r.p) * 100;

/**
 * Nudges one symbol's price inside its real day range and writes it into
 * every cell that displays it. Returns the new price. DOM-only, no React.
 */
export function tickSymbol(
  idx: number,
  price: number[],
  cells: Map<number, HTMLElement[]>,
  rand: () => number,
): number {
  const r = tapeRows[idx];
  const range = r.h - r.l;
  const step = (rand() - 0.5) * range * 0.06;
  const next = Math.min(r.h, Math.max(r.l, price[idx] + step));
  const dir = next > price[idx] ? "up" : next < price[idx] ? "down" : "";
  price[idx] = next;
  const chg = changePct(next, r);
  for (const cell of cells.get(idx) ?? []) {
    const px = cell.querySelector(".tape-px");
    const ch = cell.querySelector(".tape-chg");
    if (px) px.textContent = priceFmt.format(next);
    if (ch) ch.textContent = `${chgFmt.format(chg)}%`;
    if (dir) cell.dataset.dir = dir;
    cell.classList.add("is-flash");
    window.setTimeout(() => cell.classList.remove("is-flash"), 90);
  }
  return next;
}

/** Collect every element carrying data-i, keyed by symbol index. */
export function collectCells(root: HTMLElement): Map<number, HTMLElement[]> {
  const cells = new Map<number, HTMLElement[]>();
  root.querySelectorAll<HTMLElement>("[data-i]").forEach((cell) => {
    const i = Number(cell.dataset.i);
    if (Number.isNaN(i) || i < 0) return;
    const list = cells.get(i) ?? [];
    list.push(cell);
    cells.set(i, list);
  });
  return cells;
}
