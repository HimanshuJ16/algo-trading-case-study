"use client";

import { useEffect, useRef } from "react";
import { changePct, chgFmt, collectRows, mulberry32, priceFmt, tapeDate, tapeRows, tickSymbol } from "@/lib/tape";
import { prefersReducedMotion } from "@/lib/motion";

/** 7 Sep 2026, so the walk is the same on every client and every reload. */
const SEED = 20260907;

const stamp = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}·${m}·${y.slice(2)}`;
};

/**
 * The forty most-traded NSE symbols of one real session, rolling behind the
 * hero. Prices start at the day's close and walk inside that symbol's real
 * high–low range: the range is from the bhavcopy, the motion is simulated.
 *
 * The list is rendered twice so a −50% translate loops seamlessly.
 */
export default function Ledger() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const rand = mulberry32(SEED);
    const price = tapeRows.map((r) => r.c);
    const rowsByIndex = collectRows(root);
    let timer = 0;

    // Irregular cadence: a tape that ticks on a metronome reads as a loader.
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!document.hidden) tickSymbol(Math.floor(rand() * tapeRows.length), price, rowsByIndex, rand);
        schedule();
      }, 420 + rand() * 700);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <aside ref={ref} aria-hidden="true" className="ledger hidden md:block">
      <div className="absolute inset-x-4 top-6 z-2 flex justify-between text-[0.6rem] uppercase tracking-[0.12em] text-muted">
        <span>NSE · EQ</span>
        <span>{stamp(tapeDate)}</span>
      </div>
      <div className="ledger-roll">
        {[0, 1].map((copy) =>
          tapeRows.map((r, i) => {
            const chg = changePct(r.c, r);
            return (
              <div key={`${copy}-${r.s}`} data-i={i} className="ledger-row">
                <span className="truncate text-muted">{r.s}</span>
                <span className="text-right">
                  <span className="ledger-px text-fg">{priceFmt.format(r.c)}</span>{" "}
                  <span className="ledger-chg" data-dir={chg > 0 ? "up" : chg < 0 ? "down" : ""}>
                    {chgFmt.format(chg)}%
                  </span>
                </span>
              </div>
            );
          }),
        )}
      </div>
    </aside>
  );
}
