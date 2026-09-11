"use client";

import { useEffect, useRef } from "react";
import { desk } from "@/content/caseStudy";
import { gsap, registerGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Equity-curve silhouette of the day, in a 1000×300 box, values removed. */
const CURVE =
  "M0,232 L18,236 L30,246 L40,262 L52,258 L64,250 L72,236 L84,210 L92,170 L100,150 L108,118 L116,96 L124,112 L132,168 L140,172 L152,182 L164,170 L176,168 L190,178 L204,180 L220,182 L236,186 L250,172 L262,160 L276,150 L290,128 L304,114 L318,106 L330,94 L344,60 L356,40 L366,44 L376,52 L390,58 L402,66 L414,62 L428,70 L442,76 L456,74 L470,80 L484,78 L498,84 L512,82 L526,76 L540,80 L554,74 L568,78 L582,70 L596,74 L610,66 L624,70 L638,64 L652,70 L666,62 L680,66 L694,60 L708,64 L722,58 L736,62 L750,54 L764,58 L778,50 L792,52 L806,46 L820,50 L834,44 L848,48 L862,42 L876,46 L890,40 L904,44 L918,36 L932,40 L946,34 L960,38 L974,30 L988,36 L1000,62";

function Redacted({ w = "4ch", sign }: { w?: string; sign?: "+" | "-" }) {
  return (
    <span className="redacted" style={{ width: w }} aria-label={desk.redacted} title={desk.redacted}>
      {sign ? <span className="redacted-sign">{sign}</span> : null}
    </span>
  );
}

/**
 * The operations desk, recreated. Enter sequence: chrome first, then the
 * panels in reading order, the feed items sliding in, the equity curve
 * drawing itself with the markers popping at their positions, then the
 * ledger rows. Every performance figure is a redacted block.
 */
export default function DeskMock() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    registerGsap();
    const ctx = gsap.context(() => {
      const panels = root.querySelectorAll("[data-panel]");
      const feed = root.querySelectorAll("[data-feed-item]");
      const curve = root.querySelector<SVGPathElement>("[data-curve]");
      const fill = root.querySelector<SVGPathElement>("[data-curve-fill]");
      const markers = root.querySelectorAll("[data-desk-marker]");
      const rows = root.querySelectorAll("[data-row]");
      const files = root.querySelectorAll("[data-file]");

      gsap.set(panels, { autoAlpha: 0, y: 14 });
      gsap.set(feed, { autoAlpha: 0, x: -10 });
      if (curve) gsap.set(curve, { drawSVG: "0%" });
      if (fill) gsap.set(fill, { autoAlpha: 0 });
      gsap.set(markers, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" });
      gsap.set([rows, files], { autoAlpha: 0, y: 8 });

      const tl = gsap.timeline({
        defaults: { ease: "reveal" },
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
      });
      tl.to(panels, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0)
        .to(feed, { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.1 }, 0.4);
      if (curve) tl.to(curve, { drawSVG: "100%", duration: 2.2, ease: "wipe" }, 0.5);
      if (fill) tl.to(fill, { autoAlpha: 1, duration: 1.2, ease: "settle" }, 1.2);
      markers.forEach((m, i) => {
        const at = Number((m as HTMLElement).dataset.at ?? 0);
        tl.to(m, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "snap" }, 0.5 + at * 2.2 + i * 0.02);
      });
      tl.to(files, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 }, 1.0)
        .to(rows, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 }, 1.6);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  const d = desk;

  return (
    <div ref={ref} className="desk" role="img" aria-label={d.caption}>
      {/* Top bar */}
      <div className="desk-top" data-panel>
        <span className="desk-logo">{d.topbar.logo}</span>
        <span className="desk-session">{d.topbar.session}</span>
        <span className="desk-indices">
          {d.topbar.indices.map((x) => (
            <span key={x.k}>
              <span className="desk-dim">{x.k}:</span> {x.v} <span className="desk-down">({x.chg})</span>
            </span>
          ))}
        </span>
        <span className="desk-tabs">
          {d.topbar.tabs.map((t, i) => (
            <span key={t} className={i === 0 ? "is-on" : ""}>
              {t}
            </span>
          ))}
        </span>
        <span className="desk-assets">
          {d.topbar.assets.map((t, i) => (
            <span key={t} className={i === 1 ? "is-on" : ""}>
              {t}
            </span>
          ))}
        </span>
        <span className="desk-actions">
          <span className="desk-btn">{d.topbar.actions[0]}</span>
          <span className="desk-btn desk-btn-halt">{d.topbar.actions[1]}</span>
        </span>
      </div>

      <div className="desk-grid">
        {/* Live feed */}
        <div className="desk-panel desk-feed" data-panel>
          <div className="desk-panel-head">
            <span className="desk-live-dot" /> {d.feed.title}
            <span className="desk-dim">{d.feed.tag}</span>
          </div>
          <ul>
            {d.feed.items.map((it) => (
              <li key={it.t} data-feed-item>
                <span className="desk-chip">{it.src}</span>
                <span className="desk-dim">{it.t}</span>
                <p>{it.text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Portfolio */}
        <div className="desk-panel desk-portfolio" data-panel>
          <div className="desk-panel-head">
            {d.portfolio.title}
            <span className="desk-up">LIVE</span>
          </div>
          <ul>
            {d.portfolio.rows.map((r, i) => (
              <li key={i}>
                <span className="desk-up">
                  {r.side} {r.sym}
                </span>
                <Redacted w="5ch" sign="+" />
                <Redacted w="6ch" sign="+" />
              </li>
            ))}
          </ul>
        </div>

        {/* Equity curve */}
        <div className="desk-panel desk-chart" data-panel>
          <div className="desk-panel-head">
            {d.chart.title}
            <span className="desk-stats">
              {d.chart.stats.map((s, i) => (
                <span key={s}>
                  <span className="desk-dim">{s}</span>
                  {i === 3 ? <b>{d.chart.tradesCount}</b> : <Redacted w={i === 2 ? "4ch" : "6ch"} />}
                </span>
              ))}
            </span>
          </div>
          <div className="desk-big">
            <Redacted w="9ch" sign="+" />
            <span className="desk-dim">UNREALIZED P/L: —</span>
          </div>
          <svg viewBox="0 0 1000 300" className="desk-svg" aria-hidden="true" preserveAspectRatio="none">
            <defs>
              <linearGradient id="desk-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--up)" stopOpacity="0.28" />
                <stop offset="1" stopColor="var(--up)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2="1000" y1={300 * f} y2={300 * f} stroke="var(--fg)" strokeOpacity="0.06" />
            ))}
            <line x1="0" x2="1000" y1="232" y2="232" stroke="var(--fg)" strokeOpacity="0.18" strokeDasharray="3 5" />
            <path data-curve-fill d={`${CURVE} L1000,300 L0,300 Z`} fill="url(#desk-fill)" />
            <path data-curve d={CURVE} fill="none" stroke="var(--up)" strokeWidth="2.5" />
          </svg>
          <div className="desk-markers" aria-hidden="true">
            {d.chart.markers.map((m, i) => (
              <span
                key={i}
                data-desk-marker
                data-at={m.at}
                className={`desk-marker desk-marker-${m.kind}`}
                style={{ left: `${m.at * 100}%`, top: `${markerTop(m.at)}%` }}
              >
                {m.kind === "buy" ? "▲" : "▼"} {m.label}
              </span>
            ))}
          </div>
          <div className="desk-times">
            {d.chart.times.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        {/* Console / files */}
        <div className="desk-panel desk-console" data-panel>
          <div className="desk-panel-head">
            {d.console.title}
            <span className="desk-tabs desk-tabs-sm">
              {d.console.tabs.map((t, i) => (
                <span key={t} className={i === 2 ? "is-on" : ""}>
                  {t}
                </span>
              ))}
            </span>
            <span className="desk-dim">
              <span className="desk-live-dot" /> {d.console.filesLabel}
            </span>
          </div>
          <ul className="desk-files">
            {d.console.files.map((f) => (
              <li key={f.name} data-file>
                <span className="desk-file-icon" />
                <span className="desk-file-meta">
                  <b>{f.name}</b>
                  <span className="desk-dim">{f.path}</span>
                </span>
                <span className="desk-file-actions">
                  {f.actions.map((a) => (
                    <span key={a} className={`desk-btn ${a === "VIEW" ? "desk-btn-accent" : ""}`}>
                      {a}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ledger */}
        <div className="desk-panel desk-ledger" data-panel>
          <div className="desk-panel-head">
            {d.ledger.title}
            <span className="desk-up">LIVE</span>
          </div>
          <table>
            <thead>
              <tr>
                {d.ledger.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.ledger.rows.map((r, i) => (
                <tr key={i} data-row>
                  <td>{r.entry}</td>
                  <td>{r.exit}</td>
                  <td>{r.sym}</td>
                  <td className={r.type === "BUY" ? "desk-up" : "desk-down"}>{r.type}</td>
                  <td>
                    <Redacted w="3ch" />
                  </td>
                  <td>{r.entryPx}</td>
                  <td>{r.exitPx}</td>
                  <td>
                    <Redacted w="4ch" sign="+" />
                  </td>
                  <td>
                    <Redacted w="5ch" sign="-" />
                  </td>
                  <td>
                    <Redacted w="5ch" sign="+" />
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

/** Approximate the curve's height at a fraction of its width, for marker placement. */
function markerTop(at: number): number {
  const pts = CURVE.replace(/[ML]/g, "")
    .trim()
    .split(/\s+/)
    .map((p) => p.split(",").map(Number));
  const x = at * 1000;
  let best = pts[0];
  for (const p of pts) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  return (best[1] / 300) * 100;
}
