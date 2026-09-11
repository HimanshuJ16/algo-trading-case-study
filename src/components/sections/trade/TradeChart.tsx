import type { TradeModel } from "@/lib/indicators";
import { buildGeometry, H, W } from "@/lib/tradeChart";

const MONO = "var(--font-plex-mono), ui-monospace, monospace";

/**
 * One session as candles, with the Supertrend it was read from and the
 * trailing stop it was held by. Rendered complete; the scrub in Trade.tsx
 * hides what has not happened yet by index, so no-JS gets the whole chart.
 */
export default function TradeChart({ model }: { model: TradeModel }) {
  const g = buildGeometry(model);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="One trade, bar by bar">
      <defs>
        <clipPath id="trade-clip">
          <rect data-clip x="0" y="0" width={W} height={H} />
        </clipPath>
      </defs>

      {g.priceTicks.map((t) => (
        <g key={t.label}>
          <line x1="12" x2="928" y1={t.y} y2={t.y} stroke="var(--fg)" strokeOpacity="0.07" />
          <text x="938" y={t.y + 4} fontSize="11" fill="var(--muted)" fontFamily={MONO}>
            {t.label}
          </text>
        </g>
      ))}
      {g.timeLabels.map((t) => (
        <text key={t.t} x={t.x} y={H - 14} fontSize="11" textAnchor="middle" fill="var(--muted)" fontFamily={MONO}>
          {t.t}
        </text>
      ))}

      {/* The indicator and the stop are wiped in together with the bars. */}
      <g clipPath="url(#trade-clip)">
        {g.trendRuns.map((run, i) => (
          <path
            key={i}
            d={run.d}
            fill="none"
            stroke={run.up ? "var(--up)" : "var(--down)"}
            strokeOpacity="0.6"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
        ))}
        {g.stopPath ? (
          <path d={g.stopPath} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinejoin="round" />
        ) : null}
      </g>

      {g.candles.map((c) => (
        <g
          key={c.i}
          data-candle={c.i}
          className="trade-candle"
          style={{ transformOrigin: `${c.x.toFixed(1)}px ${((c.yHigh + c.yLow) / 2).toFixed(1)}px` }}
        >
          <line x1={c.x} x2={c.x} y1={c.yHigh} y2={c.yLow} stroke={c.up ? "var(--up)" : "var(--down)"} strokeWidth="1" />
          <rect x={c.bodyX} y={c.bodyY} width={c.bodyW} height={c.bodyH} fill={c.up ? "var(--up)" : "var(--down)"} />
        </g>
      ))}

      {/* A caret under every bar where the stop tightened. */}
      {g.ratchets.map((r) => (
        <path key={r.i} data-ratchet={r.i} className="trade-ratchet" d={r.d} fill="var(--accent)" opacity="0.9" />
      ))}

      <g
        data-marker="entry"
        className="trade-marker"
        style={{ transformOrigin: `${g.entry.x.toFixed(1)}px ${g.entry.y.toFixed(1)}px` }}
      >
        <circle cx={g.entry.x} cy={g.entry.y} r="7" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
        <circle cx={g.entry.x} cy={g.entry.y} r="2.5" fill="var(--accent)" />
        <text x={g.entry.x} y={g.entry.labelY} fontSize="11" textAnchor="middle" fill="var(--accent)" fontFamily={MONO}>
          {g.entry.label}
        </text>
      </g>
      <g
        data-marker="exit"
        className="trade-marker"
        style={{ transformOrigin: `${g.exit.x.toFixed(1)}px ${g.exit.y.toFixed(1)}px` }}
      >
        <circle cx={g.exit.x} cy={g.exit.y} r="7" fill="var(--bg)" stroke="var(--fg)" strokeWidth="2" />
        <path d={g.exit.cross} stroke="var(--fg)" strokeWidth="1.5" />
        <text x={g.exit.x} y={g.exit.labelY} fontSize="11" textAnchor="middle" fill="var(--fg)" fontFamily={MONO}>
          {g.exit.label}
        </text>
      </g>
    </svg>
  );
}
