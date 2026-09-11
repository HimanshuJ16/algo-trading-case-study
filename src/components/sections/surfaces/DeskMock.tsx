"use client";

import { useEffect, useRef } from "react";
import { desk, DESK_CURVE } from "@/content/caseStudy";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/motion";

/** Hatched block standing in for a redacted figure, sized in characters. */
function Redacted({ ch, sign = false }: { ch: number; sign?: boolean }) {
  return (
    <span className="redacted" style={{ width: `${ch}ch`, marginLeft: sign ? "0.9em" : undefined }}>
      {sign ? (
        <span className="redacted-sign" aria-hidden="true">
          +
        </span>
      ) : null}
      <span className="sr-only">{desk.redacted}</span>
    </span>
  );
}

const CURVE_POINTS = DESK_CURVE.replace(/[ML]/g, " ")
  .trim()
  .split(/\s+/)
  .map((p) => p.split(",").map(Number) as [number, number]);

/** Vertical position of the curve at a fractional x, as a percentage. */
function curveTopAt(at: number): number {
  const x = at * 1000;
  let best = CURVE_POINTS[0];
  for (const p of CURVE_POINTS) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  return (best[1] / 300) * 100;
}

/**
 * The operations desk on a trading day, recreated from a screenshot. Every
 * P&L, quantity and storage figure is hatched out by design; the layout, the
 * markers and the shape of the day are as they were.
 */
export default function DeskMock() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    registerGsap();
    const curve = el.querySelector<SVGPathElement>("[data-curve]");
    if (!curve) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        curve,
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 2.2, ease: "wipe", delay: 0.4, scrollTrigger: { trigger: el, start: "top 60%", once: true } },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="desk" aria-label="Operations desk, recreated from a screenshot" role="img">
      <div className="desk-top">
        <span className="desk-logo">{desk.topbar.logo}</span>
        <span className="desk-dim">{desk.topbar.session}</span>
        <span className="desk-indices">
          {desk.topbar.indices.map((ix) => (
            <span key={ix.k}>
              <span className="desk-dim">{ix.k}:</span> {ix.v} <span className="desk-down">({ix.chg})</span>
            </span>
          ))}
        </span>
        <span className="desk-tabs">
          {desk.topbar.tabs.map((t, i) => (
            <span key={t} className={i === 0 ? "is-on" : undefined}>
              {t}
            </span>
          ))}
        </span>
        <span className="desk-assets">
          {desk.topbar.assets.map((a, i) => (
            <span key={a} className={i === 1 ? "is-on" : undefined}>
              {a}
            </span>
          ))}
        </span>
        <span className="flex gap-2">
          {desk.topbar.actions.map((a) => (
            <span key={a} className={`desk-btn${a === "HALT" ? " desk-btn-halt" : ""}`}>
              {a}
            </span>
          ))}
        </span>
      </div>

      <div className="desk-grid">
        <div className="desk-panel desk-feed">
          <div className="desk-panel-head">
            <span className="desk-live-dot" /> {desk.feed.title}
            <span className="desk-dim ml-auto">{desk.feed.tag}</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {desk.feed.items.map((f) => (
              <li key={f.text} className="border-b border-desk-line pb-2">
                <span className="desk-chip">{f.src}</span>
                <span className="desk-dim">{f.t}</span>
                <p className="mt-1 mb-0">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="desk-panel desk-portfolio">
          <div className="desk-panel-head">
            {desk.portfolio.title}
            <span className="desk-up ml-auto">LIVE</span>
          </div>
          <ul className="m-0 list-none p-0">
            {desk.portfolio.rows.map((r) => (
              <li key={`${r.side}-${r.sym}`} className="grid grid-cols-[1fr_auto_auto] gap-3 py-1">
                <span className="desk-up">
                  {r.side} {r.sym}
                </span>
                <Redacted ch={5} sign />
                <Redacted ch={6} sign />
              </li>
            ))}
          </ul>
        </div>

        <div className="desk-panel desk-chart">
          <div className="desk-panel-head">
            {desk.chart.title}
            <span className="ml-auto flex gap-5">
              {desk.chart.stats.map((s) => (
                <span key={s} className="flex flex-col items-end gap-0.5">
                  <span className="desk-dim">{s}</span>
                  {s === "TRADES" ? (
                    <b className="text-[0.9rem]">{desk.chart.tradesCount}</b>
                  ) : (
                    <Redacted ch={s === "WIN RATE" ? 4 : 6} />
                  )}
                </span>
              ))}
            </span>
          </div>

          <div className="desk-big">
            <Redacted ch={9} sign />
            <span className="desk-dim text-[0.62rem]">UNREALIZED P/L: —</span>
          </div>

          <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="desk-svg" aria-hidden="true">
            <defs>
              <linearGradient id="desk-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--desk-up)" stopOpacity="0.22" />
                <stop offset="1" stopColor="var(--desk-up)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[75, 150, 225].map((y) => (
              <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="var(--desk-fg)" strokeOpacity="0.06" />
            ))}
            {/* Break-even, where the day started. */}
            <line x1="0" x2="1000" y1="232" y2="232" stroke="var(--desk-fg)" strokeOpacity="0.18" strokeDasharray="3 5" />
            <path d={`${DESK_CURVE} L1000,300 L0,300 Z`} fill="url(#desk-fill)" />
            <path data-curve d={DESK_CURVE} fill="none" stroke="var(--desk-up)" strokeWidth="2.5" />
          </svg>

          <div className="desk-markers">
            {desk.chart.markers.map((m, i) => (
              <span
                key={`${m.label}-${i}`}
                className="desk-marker"
                data-kind={m.kind}
                style={{ left: `${m.at * 100}%`, top: `${curveTopAt(m.at)}%` }}
              >
                {m.kind === "buy" ? "▲" : "▼"} {m.label}
              </span>
            ))}
          </div>

          <div className="desk-dim mt-1 flex justify-between">
            {desk.chart.times.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        <div className="desk-panel desk-console">
          <div className="desk-panel-head">
            {desk.console.title}
            <span className="desk-dim ml-3 flex gap-2.5 tracking-[0.08em]">
              {desk.console.tabs.map((t, i) => (
                <span key={t} className={i === desk.console.tabs.length - 1 ? "is-on text-desk-accent" : undefined}>
                  {t}
                </span>
              ))}
            </span>
            <span className="desk-dim ml-auto">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-desk-up" /> {desk.console.filesLabel}
            </span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {desk.console.files.map((f) => (
              <li
                key={f.name}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 border border-desk-line px-2 py-1.5"
              >
                <span className="h-6 w-6 border border-desk-line" />
                <span className="flex min-w-0 flex-col">
                  <b>{f.name}</b>
                  <span className="desk-dim truncate">{f.path}</span>
                </span>
                <span className="flex gap-1.5">
                  {f.actions.map((a) => (
                    <span key={a} className={`desk-btn${a === "VIEW" ? " text-desk-up border-desk-up" : ""}`}>
                      {a}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="desk-panel desk-ledger">
          <div className="desk-panel-head">
            {desk.ledger.title}
            <span className="desk-up ml-auto">LIVE</span>
          </div>
          <table>
            <thead>
              <tr>
                {desk.ledger.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {desk.ledger.rows.map((r) => (
                <tr key={`${r.entry}-${r.sym}`}>
                  <td>{r.entry}</td>
                  <td>{r.exit}</td>
                  <td>{r.sym}</td>
                  <td className={r.type === "BUY" ? "desk-up" : "desk-down"}>{r.type}</td>
                  <td>
                    <Redacted ch={3} />
                  </td>
                  <td>{r.entryPx}</td>
                  <td>{r.exitPx}</td>
                  <td>
                    <Redacted ch={4} sign />
                  </td>
                  <td>
                    <Redacted ch={5} sign />
                  </td>
                  <td>
                    <Redacted ch={5} sign />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
