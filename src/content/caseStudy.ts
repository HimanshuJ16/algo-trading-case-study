/**
 * All copy for the case study lives here. Components render this file and
 * contain no prose of their own. Every figure was read from the repos on
 * 2026-09-10; a `null` value means the repos do not contain that number and
 * the tile is simply not rendered until you fill it in.
 *
 * Redaction rules applied throughout: the broker and hosting vendors are
 * named by category only; no P&L, returns, drawdown, win rate or capital
 * figures appear anywhere.
 */

export type Stat = {
  label: string;
  /** Display string. `null` = NEEDS INPUT, tile is skipped. */
  value: string | null;
  note?: string;
};

export type SectionMeta = {
  /** Anchor id, and the order the page reads in: ch1 … ch8. */
  id: string;
  /** Stable semantic name, independent of chapter order. */
  slug: string;
  index: string;
  /** Chapter label on the header, the contents list and the rail. */
  kicker: string;
  title: string;
};

export const site = {
  title: "One thread is allowed to move money",
  description:
    "An engineering case study of a retail algorithmic trading system for NSE equities and Nifty options: a fail-closed Python execution engine, a real-time relay, a web operations desk and a mobile alerts app.",
  author: "Himanshu Jangir",
  year: "2026",
} as const;

/**
 * The eight chapters, in reading order. The page is framed as a build log,
 * so the order is the order the system was built in rather than the order a
 * reference document would use: the rule comes before the wiring, and what
 * broke comes before what was drawn to stop it breaking again.
 */
export const sections: SectionMeta[] = [
  { id: "ch1", slug: "overview", index: "01", kicker: "First, one process", title: "What it is, and what it is not" },
  { id: "ch2", slug: "trade", index: "02", kicker: "Then, a rule", title: "Entry, ratchet, exit" },
  { id: "ch3", slug: "strategy", index: "03", kicker: "Then, the walls", title: "Seven layers between a signal and an order" },
  { id: "ch4", slug: "problems", index: "04", kicker: "Then it broke", title: "Six things that were harder than they look" },
  { id: "ch5", slug: "architecture", index: "05", kicker: "Then, the wire", title: "Four services, one room" },
  { id: "ch6", slug: "surfaces", index: "06", kicker: "Then, the room", title: "The desk and the phone" },
  { id: "ch7", slug: "numbers", index: "07", kicker: "Then, the audit", title: "What the repos actually contain" },
  { id: "ch8", slug: "next", index: "08", kicker: "Still unproven", title: "What is still unproven" },
];

/** Look a chapter up by its stable slug, not by its position in the log. */
export const sectionBySlug = (slug: string) => {
  const s = sections.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown section ${slug}`);
  return s;
};

/* ────────────────────────────────────────────────────────────────────────── */

export const hero = {
  eyebrow: "Case study · Engineering write-up",
  meta: "NSE equities · Nifty options · 2026",
  kicker: "A build log · eight chapters",
  /** Split per word and masked; the accent half is set in amber. */
  headline: {
    lead: "One thread is allowed to",
    accent: "move money.",
  },
  sub: "An intraday trading system for Indian markets, built and run by one person: a Python execution engine that fails closed, a real-time relay, a web operations desk, and a phone that wakes up when a stop fires. This page is about the engineering, not the returns.",
  stats: [
    { label: "lines of first-party code", value: "33,031", note: "Python, TypeScript, Node" },
    { label: "test functions", value: "252", note: "engine only" },
    { label: "audit findings resolved", value: "43 / 43", note: "15 Aug 2026" },
    { label: "services in production", value: "4", note: "engine, relay, desk, mobile" },
  ] satisfies Stat[],
  scrollCue: "Scroll. The page is the timeline.",
  tapeCaption:
    "Background tape: NSE daily bhavcopy for 7 September 2026, the forty most-traded symbols by turnover. Prices move within each symbol's real high–low range for the day; the motion is simulated, the range is not.",
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

export const overview = {
  statement:
    "Every morning a Python process on a hardened Linux box picks a handful of NSE stocks, waits for the market to prove they are worth trading, and then trades them with a stop that only ever tightens. Everything else in the system exists so that one person can watch that process, change its limits, and stop it from a phone.",
  is: {
    title: "What it is",
    items: [
      "An intraday engine for NSE cash equities: Supertrend(20, 1) direction-flip entries on 15-minute bars, ATR(14) × 1.5 trailing-stop exits, a two-stage profit lock, and square-off before the close.",
      "A two-stage universe: about twenty pre-market candidates at 09:08, of which the top five by opening relative volume are promoted at 09:21:30. Zero survivors means zero trades.",
      "A real-time relay that fans one Socket.IO room out to a browser desk, a mobile app, push notifications and a chat channel.",
      "A shared Postgres that is the only control plane: the desk writes configuration and a halt flag, the engine reads them.",
      "A sibling engine for Nifty index options that writes to the same tables and the same room, so the desk is dual-asset by design.",
    ],
  },
  isNot: {
    title: "What it is not",
    items: [
      "Not high-frequency. Decisions happen on bar close and on a one-second exit clock; the watchdog runs every three seconds in live mode.",
      "Not a resting-order system. The stop is evaluated tick by tick in the process, never parked at the broker, and paper fills are never allowed to be better than the breaching tick.",
      "Not multi-strategy. One entry rule, five layered exits, one eligibility filter. Variants run as independent bot ids against their own config rows.",
      "Not a performance claim. No returns, drawdown or capital figures appear on this page.",
    ],
  },
  services: [
    { name: "Execution engine", stack: "Python 3.12 · systemd on Ubuntu 24.04", role: "universe, bars, signals, orders, risk, journal" },
    { name: "Real-time relay", stack: "Node · Express · Socket.IO", role: "room multicast, ring buffers, push, chat alerts" },
    { name: "Operations desk", stack: "Next.js 16 · React 19 · Prisma 6", role: "equity curve, execution chart, config, kill switch" },
    { name: "Mobile alerts", stack: "Expo SDK 57 · React Native 0.86", role: "live position, alert feed, background push" },
  ],
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

export type ArchNode = {
  id: string;
  label: string;
  sub: string;
  /** Which service group the node belongs to; drives colour and reveal order. */
  group: "market" | "engine" | "relay" | "store" | "surface";
};

export type ArchEdge = {
  from: string;
  to: string;
  label: string;
  /** Pulses travel from→to; `both` alternates. */
  dir?: "forward" | "both";
};

export const architecture = {
  figTitle: "How the four services are wired",
  figCaption: "Solid lines carry data one way; the dashed line is the control path the desk and the engine share through the database. Hover a service to trace only its connections.",
  intro:
    "Market data enters one process and never leaves it un-mediated. Telemetry goes out through a single Socket.IO room; state goes out through a single database. Nothing talks to the engine directly.",
  nodes: [
    { id: "broker", label: "Broker API", sub: "WebSocket ticks · REST history, orders", group: "market" },
    { id: "scrape", label: "Pre-market list", sub: "Stocks-to-watch article · scraped at 09:08", group: "market" },
    { id: "engine", label: "Execution engine", sub: "Python · one mutator thread · systemd", group: "engine" },
    { id: "db", label: "Postgres", sub: "trades · journal · config · halt", group: "store" },
    { id: "r2", label: "Object storage", sub: "session CSVs and logs · archived at 15:30", group: "store" },
    { id: "relay", label: "Relay", sub: "Socket.IO room · 25,000-tick buffer", group: "relay" },
    { id: "desk", label: "Operations desk", sub: "Next.js · polls DB every 5 s", group: "surface" },
    { id: "mobile", label: "Mobile app", sub: "Expo · joins the same room", group: "surface" },
    { id: "push", label: "Push and chat", sub: "Expo push · chat bot", group: "surface" },
  ] satisfies ArchNode[],
  edges: [
    { from: "broker", to: "engine", label: "ticks", dir: "forward" },
    { from: "scrape", to: "engine", label: "candidates", dir: "forward" },
    { from: "engine", to: "broker", label: "orders", dir: "forward" },
    { from: "engine", to: "db", label: "trades · journal", dir: "forward" },
    { from: "db", to: "engine", label: "config · halt", dir: "forward" },
    { from: "engine", to: "r2", label: "archive", dir: "forward" },
    { from: "engine", to: "relay", label: "update · log · alert · status", dir: "forward" },
    { from: "relay", to: "desk", label: "algo_new_*", dir: "forward" },
    { from: "relay", to: "mobile", label: "algo_new_*", dir: "forward" },
    { from: "relay", to: "push", label: "alerts", dir: "forward" },
    { from: "desk", to: "db", label: "bot_configs · halt", dir: "both" },
    { from: "relay", to: "desk", label: "x-api-key", dir: "forward" },
  ] satisfies ArchEdge[],
  notes: [
    {
      title: "Two channels, two jobs",
      body: "Telemetry is fire-and-forget over the socket: prices, positions, logs, host CPU and memory, every five seconds. State is durable in Postgres: closed trades, session rows, the open-position journal, and the configuration the engine reads once at startup. The desk never calls the engine. It writes a row, and the watchdog reads it.",
    },
    {
      title: "Two secrets, two trust levels",
      body: "The room-join token is inlined into the browser and mobile bundles because they need it. A separate server-only key authenticates the relay to the desk's API. Arming live trading or moving the kill switch requires a human session cookie on top, so a leaked machine key can read configuration and post alerts but cannot start or stop trading.",
    },
    {
      title: "The halt that needs nothing",
      body: "The desk's stop button writes a flag the watchdog polls every three seconds in live mode. The primary emergency stop is a file on tmpfs, checked first, because when the database is the thing that broke the button does nothing and the file still works.",
    },
  ],
  sibling: {
    title: "The options sibling",
    body: "A second engine trades Nifty 50 index options on 25-minute bars with a UT Bot trailing signal. It is a separate codebase with the same shape: the same broker session pattern, the same systemd unit and timer, the same Postgres, and the same alert envelope into the same room with an asset_class field so the desk can tell them apart. This page follows the equity engine because it is the one with the audit trail; the options engine's paper path is documented in its own header as untested against a live feed.",
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

export const trade = {
  intro:
    "One trade, bar by bar. Scroll to move time forward. The stop is recomputed on every tick in the engine; here it is drawn on bar closes so the ratchet is legible.",
  phases: [
    {
      key: "warmup",
      title: "Bars close, the indicator waits",
      body: "Ticks are floored onto a grid anchored to the 09:15 session open, not the UTC epoch. Each completed 15-minute candle is handed once to the signal engine. The Supertrend line and Wilder's ATR are seeded from history before the open so the first bar of the day is already a real decision.",
    },
    {
      key: "entry",
      title: "A flip, and one market order",
      body: "The Supertrend direction flips on a bar close. That single bar-close event is the only place a live entry signal can be created. The intent goes through a callback into a queue drained by the one thread that is allowed to change position state, which sizes the order under three independent ceilings and tags it so a retry can find it.",
    },
    {
      key: "ratchet",
      title: "The stop only tightens",
      body: "On every tick the stop becomes the higher of its previous value and price minus 1.5 × ATR. It never widens. The live ATR includes the developing bar provisionally without mutating the committed Wilder chain, and a tick more than ten percent from the last print is rejected so one bad quote cannot ratchet the stop permanently.",
    },
    {
      key: "exit",
      title: "Breach, fill, journal deleted",
      body: "When a tick crosses the stop, the same thread places a market exit, confirms it socket-first with a REST fallback, and only then deletes the open-position journal row. In paper mode the fill is modelled one tick worse than the breaching print, never better.",
    },
  ],
  legend: {
    price: "15-minute bars",
    supertrend: "Supertrend(20, 1)",
    stop: "ATR(14) × 1.5 trailing stop",
    entry: "entry",
    exit: "exit",
  },
  /** Shown while bars.json is the provisional dataset. */
  provisionalNote:
    "Illustrative path: the candles are synthesised inside a real symbol's real open, high, low and close for the day. The indicator and stop arithmetic are exact; the intraday path is not a record of a trade.",
  realNote: "Session bars as recorded by the engine. The indicator and stop arithmetic mirror the engine's.",
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

export type Layer = {
  n: string;
  name: string;
  gate: string;
  detail: string;
  params: string[];
  where: string;
};

export const strategy = {
  intro:
    "The entry rule is one line. What makes the system trustworthy is everything wrapped around it, each layer able to veto the one before. Read left to right: this is the order a signal passes through.",
  layers: [
    {
      n: "01",
      name: "Eligibility",
      gate: "Relative-volume promotion",
      detail:
        "Today's 09:15–09:20 volume versus the previous session's 09:15–09:30, both summed from one-minute candles with the 09:15 auction print excluded. Survivors are ranked and the top five get capital. If the pass never runs, nothing trades.",
      params: ["threshold 5.0×", "decision 09:21:30", "fallback pass 09:25:30", "top 5"],
      where: "runtime/volume_filter.py · VolumeFilter.run",
    },
    {
      n: "02",
      name: "Entry",
      gate: "Supertrend direction flip",
      detail:
        "Supertrend(20, 1) on hl2, TradingView-exact, evaluated only on a completed 15-minute bar. A signal is valid for zero extra bars: chase the bar or skip it. At most three entry attempts per bar and three trades per stock per day.",
      params: ["period 20", "multiplier 1", "valid bars 0", "max chase 1.0 ATR"],
      where: "signals.py · SupertrendSignalEngine.on_bar_close",
    },
    {
      n: "03",
      name: "Exit I",
      gate: "ATR trailing stop",
      detail:
        "Wilder ATR(14) × 1.5 below price for longs, above for shorts, rounded to tick, never wider than the bar before. A minimum two-tick buffer stops a zero ATR from collapsing the stop onto the price.",
      params: ["period 14", "multiplier 1.5", "min buffer 2 ticks", "tick 0.05"],
      where: "engine.py · check_exit_conditions",
    },
    {
      n: "04",
      name: "Exit II",
      gate: "Two-stage profit lock",
      detail:
        "Nothing arms until peak unrealised profit clears the first threshold; then a floor holds half of the peak. At the second threshold the floor rises to seventy percent. The floor is derived from the journaled peak price rather than stored, so it survives a crash.",
      params: ["stage 1 keeps 50%", "stage 2 keeps 70%", "derived, not stored"],
      where: "engine.py · _update_profit_lock",
    },
    {
      n: "05",
      name: "Exit III",
      gate: "Circuit proximity",
      detail:
        "A stock within 1.5 percent of its exchange circuit limit is exited before the limit locks the book and the stop can no longer be honoured.",
      params: ["proximity 1.5%"],
      where: "engine.py · check_circuit_proximity",
    },
    {
      n: "06",
      name: "Exit IV",
      gate: "Square-off by eligibility",
      detail:
        "Positions in stocks with derivatives square off at 15:00; the rest at 15:15, ahead of the broker's own intraday auto-square-off. No new entries after 14:30.",
      params: ["F&O 15:00", "non-F&O 15:15", "entry cutoff 14:30"],
      where: "engine.py · _is_squareoff_time",
    },
    {
      n: "07",
      name: "Exit V",
      gate: "Kill switch",
      detail:
        "Judged on the worse of local and broker-reported realised loss, every three seconds in live mode. On trigger every position is flattened with market orders and the session ends; the engine refuses to start again the same day.",
      params: ["watchdog 3 s live", "worse of two P&L sources", "no same-day restart"],
      where: "runtime/supervisor.py · watchdog_check",
    },
  ] satisfies Layer[],
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

export type Problem = {
  n: string;
  title: string;
  failure: string;
  fix: string;
  where: string[];
};

export const problems = {
  intro:
    "None of these are in the strategy. They are the reasons the strategy can be trusted to run unattended.",
  items: [
    {
      n: "01",
      title: "Exactly one thread mutates position state",
      failure:
        "Three threads could each decide to close the same position: the tick handler, the exit clock, and the watchdog's force-close sweep. Two of them sometimes did, and the second exit order went out against a flat book.",
      fix:
        "The runtime was split into five modules with a one-directional dependency graph. Strategy code emits intents through a callback into a bounded queue; a single worker thread drains it and is the only code that changes a position. A test parses every module's AST to prove no other module calls a mutating function, and a per-symbol exit mutex remains as a second layer for sweeps that still run on the caller's thread.",
      where: ["runtime/execution.py · ExecutionEngine.worker_loop", "tests/test_runtime_split.py", "engine.py · _close_trade"],
    },
    {
      n: "02",
      title: "A crash must not lose the stop",
      failure:
        "An open position existed only in memory. After a crash the process restarted, found a broker position it had no record of, and correctly refused to start. The safe behaviour made recovery impossible.",
      fix:
        "An open-position journal is written synchronously on entry, throttled to every five seconds as the stop ratchets, and deleted on exit. It deliberately bypasses the asynchronous write queue, because a dead writer thread takes the queue with it. On restart the journal is reconciled against the broker and the position is adopted with its stop and peak price intact, but only after warm-up, so a cold ATR of zero cannot collapse the stop and exit instantly.",
      where: ["persistence/db.py · journal_open_position", "execution/positions.py · reconcile_positions_with_broker", "runtime/execution.py · recover_from_broker"],
    },
    {
      n: "03",
      title: "Unknown is not the same as failed",
      failure:
        "A lost HTTP response after an order submit looks identical to a rejected order. Retrying on that signal doubled positions. A confirm timeout treated as failure did the same thing more slowly.",
      fix:
        "Every submit is preceded by an order-book lookup for the client tag, matching the broker's prefixed form of the tag, which is the detail that made the lookup actually hit. A network error re-checks by tag before any retry. The broker's request-made-but-unacknowledged code resolves against the order book rather than guessing. A timeout is classified UNKNOWN and escalates through six slower resolution passes before the symbol is quarantined for the day.",
      where: ["execution/orders.py · place_live_order", "execution/orders.py · _resolve_unknown_order", "execution/orders.py · _find_order_by_tag"],
    },
    {
      n: "04",
      title: "The opening auction poisons the volume filter",
      failure:
        "The broker folds the 09:15 pre-open auction cross into whatever candle covers that instant. Charting tools count only continuous trading. On one symbol the auction print was 97.9 percent of the five-minute volume, and the filter scored it at 1,496× the previous session.",
      fix:
        "Both windows are summed from one-minute candles with the 09:15 minute excluded, at the same cost of one request per symbol, and the per-minute concentration is reported on every run. The pass fails closed: if it does not complete, nothing is promoted, and zero survivors raises a critical alert instead of falling back to trading something.",
      where: ["runtime/volume_filter.py · VolumeFilter._evaluate", "data/volume_reference.py · fetch_opening_window_volume"],
    },
    {
      n: "05",
      title: "Reconnect without corrupting an irreversible ratchet",
      failure:
        "The reconnect backoff only ever grew, so one morning blip pinned every later retry at the two-minute cap. Watchdog-initiated rebuilds spent the same budget as broker drops. And the SDK exposed no honest connectivity signal at all.",
      fix:
        "Exponential backoff with ±20 percent jitter that retires after sixty seconds of healthy delivery. Forced rebuilds set a separate flag so they cost nothing. Liveness reads the SDK's private socket object and assumes live if the attribute is missing, so a version bump degrades gracefully. Exits also run off a one-second wall clock against the last known price, so a dead feed cannot suspend the stop. And because the stop only tightens, a tick more than ten percent from the last one is rejected unless three in a row agree.",
      where: ["runtime/feed.py · backoff_delay", "runtime/feed.py · _accept_tick", "runtime/strategy.py · exit_clock_loop"],
    },
    {
      n: "06",
      title: "One equity curve from two sources of truth",
      failure:
        "The desk concatenated realised P&L from Postgres with live socket ticks. The two computed equity differently, and the curve drew a sawtooth. Reconnects wrote isolated zero readings into local storage that rendered as a plunge and a fabricated drawdown.",
      fix:
        "One formula on one uniform time grid anchored at 09:15 IST, quantised to a 5, 10, 15 or 30 second step so the axis does not rescale. Candle lookup is a binary search and realised P&L is a precomputed ladder, so each point is logarithmic in the number of trades. The live buffer stores only unrealised P&L, so it structurally cannot disagree with the realised leg, and a validity gate refuses to sample until every open position has a positive last price.",
      where: ["trading-dashboard · hooks/useEquitySeries.ts · buildEquitySeries", "hooks/useEquitySeries.ts · priceAt", "hooks/useEquitySeries.ts · dropZeroGlitches"],
    },
  ] satisfies Problem[],
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

export const surfaces = {
  desk: {
    title: "The desk",
    body: "One route, four tabs, no scrolling: a fixed terminal in JetBrains Mono with zero border radius enforced at the design-token level. It is read-mostly with two write levers, configuration and the halt flag, and both require a human session.",
    facts: [
      { k: "Transports", v: "Postgres by polling every 5 s, the socket for anything sub-second, broker REST proxied server-side so the browser never holds a token." },
      { k: "Validation", v: "Fifty-six editable keys, forty-one with numeric bounds. Cross-field invariants mirror the engine: the kill-switch loss must be below capital, the profit-lock ladder must rise, and the volume windows must close before 09:21." },
      { k: "Auth", v: "Two-tier. A server-only key for machines, a session cookie for people, constant-time compared in the edge interceptor. Only people can arm live trading." },
      { k: "Charts", v: "The equity curve is hand-rolled SVG that switches from cubic Bézier to a polyline above eighty points. The execution tab is a candlestick chart with VWAP, regression slope and trade markers." },
    ],
    logTags: ["UNIVERSE", "SIGNAL", "ENTRY", "ORDER", "EXIT", "SYSTEM"],
    logLines: [
      { tag: "SYSTEM", level: "info", text: "config loaded from bot_configs · 56 keys · 0 rejected" },
      { tag: "UNIVERSE", level: "info", text: "09:08 candidates resolved · 21 · frozen to snapshot" },
      { tag: "UNIVERSE", level: "success", text: "09:21:30 promotion pass · 5 of 21 · ranked by curr/prev" },
      { tag: "SIGNAL", level: "info", text: "bar close 10:00 · supertrend flip · direction +1" },
      { tag: "ORDER", level: "order", text: "market BUY · tagged · confirmed via socket in 0.8 s" },
      { tag: "ENTRY", level: "success", text: "position opened · initial stop set · journal written" },
      { tag: "EXIT", level: "warning", text: "trailing stop breached · market SELL · confirmed" },
      { tag: "SYSTEM", level: "info", text: "heartbeat · uptime 4h12m · 5 symbols · 1 open" },
    ],
  },
  phone: {
    title: "The phone",
    lock: { time: "11:40", date: "Thursday 3 September", appName: "TradeAlert", appInitial: "T", when: "now" },
    body: "One screen, three components, one hook. It joins the same room as the desk, shows the live position and the last hundred alerts, and exists mainly so that a stop firing at 11:40 reaches a locked phone.",
    facts: [
      { k: "Delivery", v: "The engine originates the alert, the relay sends the push. Tokens are kept on socket disconnect on purpose, because push matters most when the client is gone, and pruned only when the push service reports the device unregistered." },
      { k: "Doze", v: "A maximum-importance Android channel with its own sound, plus an intent to opt out of battery optimisation. Unglamorous, and the difference between a notification and a missed one." },
      { k: "Backfill", v: "On every reconnect the relay replays the last hundred alerts from Postgres. The client dedupes them against the live stream by id, so a flaky connection does not show every trade twice." },
      { k: "Control", v: "None. The app cannot halt, pause or square off. A kill switch that lives on a device that can be lost is not a kill switch." },
    ],
    alerts: [
      { level: "success", event: "ENTRY", title: "Position opened", body: "long · initial stop set · journal written" },
      { level: "warning", event: "EXIT", title: "Trailing stop", body: "stop breached · market exit confirmed" },
      { level: "critical", event: "KILL_SWITCH", title: "Kill switch", body: "all positions flattened · session ended" },
      { level: "info", event: "HEARTBEAT", title: "Heartbeat", body: "uptime 4h12m · 5 symbols · 1 open" },
    ],
  },
  relay: {
    title: "Between them, the relay",
    body: "Five hundred lines of Node. It authenticates every subscriber, buffers 25,000 ticks and 200 log lines so a late-joining client hydrates instantly, throttles the equity feed to about one sample a second, chunks push notifications, and posts critical alerts to a chat channel.",
  },
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

export const numbers = {
  intro:
    "Everything below was read from a file. Where the repositories do not contain a figure, there is no tile.",
  groups: [
    {
      title: "Code",
      stats: [
        { label: "engine package", value: "14,156", note: "Python lines, 41 files" },
        { label: "engine repo", value: "19,440", note: "including tests and tools" },
        { label: "desk", value: "11,941", note: "TypeScript lines, 56 files" },
        { label: "mobile", value: "1,123", note: "TypeScript lines" },
        { label: "relay", value: "527", note: "Node lines" },
        { label: "commits", value: "168", note: "54 engine · 108 desk · 6 mobile" },
      ],
    },
    {
      title: "Verification",
      stats: [
        { label: "test functions", value: "252", note: "13 files, 4,221 lines, engine only" },
        { label: "largest suite", value: "61", note: "the volume filter" },
        { label: "audit findings", value: "43 / 43", note: "raised and resolved, 15 Aug 2026" },
        { label: "test coverage", value: null, note: "no coverage tool is configured" },
      ],
    },
    {
      title: "Shape",
      stats: [
        { label: "editable config keys", value: "56", note: "41 bounded, 5 enum-checked" },
        { label: "data models", value: "9", note: "shared Postgres schema" },
        { label: "API handlers", value: "20", note: "16 GET · 3 POST · 1 DELETE" },
        { label: "critical alert types", value: "12", note: "that need a human within minutes" },
      ],
    },
    {
      title: "Timing",
      stats: [
        { label: "bar interval", value: "15 min", note: "warm-up 45 calendar days" },
        { label: "exit clock", value: "1 s", note: "runs even when the feed is dead" },
        { label: "live watchdog", value: "3 s", note: "30 s in paper" },
        { label: "order confirm", value: "15 s", note: "then 6 resolution passes" },
        { label: "reconnect cap", value: "120 s", note: "retires after 60 s healthy" },
        { label: "relay buffer", value: "25,000", note: "ticks, plus 200 log lines" },
        { label: "measured tick throughput", value: null, note: "not instrumented" },
        { label: "tick-to-decision latency", value: null, note: "not instrumented" },
        { label: "days in production", value: null, note: "not recorded in the repos" },
      ],
    },
  ] satisfies { title: string; stats: Stat[] }[],
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

export const next = {
  intro:
    "The remaining gate is operational, not code. That sentence is in the engine's README and it is still the honest summary.",
  items: [
    {
      title: "Unattended paper weeks",
      body: "Two weeks of paper trading on the production box with the chaos checklist exercised, then one week live at minimum size with daily reconciliation against the broker contract note. The unit ships in paper mode on purpose: the default a forgotten step leaves you on must be the safe one.",
    },
    {
      title: "Measure what the page cannot show",
      body: "Tick throughput, tick-to-decision latency and coverage are design constants today, not measurements. Instrumenting the feed handler and the action queue, and adding a coverage run to CI, would turn three empty tiles above into numbers.",
    },
    {
      title: "Tests for the surfaces",
      body: "The engine has 252 tests; the desk and the mobile app have none. The equity-series builder and the config validator are pure functions and are the obvious place to start.",
    },
    {
      title: "One notification, not two",
      body: "With the app in the foreground a trade produces both a local notification and a remote push for the same alert. A single app-state guard fixes it.",
    },
  ],
  /** Same sentence, split so the last clause can be set in the accent. */
  closing: {
    lead: "The system is small enough for one person to hold in their head and paranoid enough to run without them watching.",
    accent: "That was the whole point.",
  },
} as const;

export const footer = {
  byline: "Himanshu Jangir · 2026 · himanshujangir.com",
  colophon:
    "Every figure on this page traces to a file in the repositories as of 10 September 2026. Background tape: NSE bhavcopy, 7 September 2026; motion simulated inside each symbol's real range.",
  backToTop: "Back to 09:15",
} as const;

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The rail: one amber thread down the left edge, drawn by scroll, with a
 * clock that runs the session as the page runs. The page is a trading day.
 */
export const rail = {
  sessionOpen: { h: 9, m: 15 },
  sessionClose: { h: 15, m: 30 },
  clockSuffix: "IST",
  /** Shown beside the thread before the first chapter is reached. */
  preludeIndex: "00",
  preludeKicker: "Open",
} as const;

/** The operations desk, recreated from a screenshot with every figure redacted. */
export const desk = {
  caption:
    "The desk on a trading day, recreated from a screenshot. Every P&L, quantity and storage figure is redacted by design; the layout, the markers and the shape of the day are as they were.",
  topbar: {
    logo: "TA",
    session: "260821 · session",
    indices: [
      { k: "NIFTY 50", v: "23,406.40", chg: "-0.11%" },
      { k: "INDIA VIX", v: "11.91", chg: "-0.08%" },
    ],
    tabs: ["DASHBOARD", "SYSTEM", "HISTORY"],
    assets: ["OPTIONS", "EQUITY"],
    actions: ["TEST ALERT", "HALT"],
  },
  feed: {
    title: "LIVE_FEED",
    tag: "MARKETS_RSS",
    items: [
      { src: "HINDU_BL_MARKETS", t: "10:02", text: "Sensex today: Indian stocks trade flat as crude oil, US yields and geopolitical tensions weigh" },
      { src: "MINT_MARKETS", t: "09:57", text: "Newly listed AI stock up 264% in five days: is the rally still worth chasing?" },
      { src: "MINT_MARKETS", t: "09:55", text: "Dividend stocks alert: last day to qualify for the record date" },
      { src: "ET_MARKETS", t: "09:52", text: "Apple event impact: Redington shares jump 5% after the first foldable iPhone" },
    ],
  },
  portfolio: {
    title: "PORTFOLIO: P/L",
    rows: [
      { side: "SELL", sym: "AMAGI" },
      { side: "BUY", sym: "AMAGI" },
    ],
  },
  chart: {
    title: "CUMULATIVE P/L",
    stats: ["PEAK TOUCHED", "MAX DD", "WIN RATE", "TRADES"],
    tradesCount: "2",
    times: ["09:15 AM", "10:43 AM", "12:12 PM", "01:40 PM", "03:08 PM"],
    markers: [
      { kind: "buy", at: 0.06, label: "BUY AMAGI" },
      { kind: "sell", at: 0.14, label: "SELL AMAGI" },
      { kind: "buy", at: 0.26, label: "BUY AMAGI" },
      { kind: "sell", at: 0.99, label: "SELL AMAGI" },
    ],
  },
  console: {
    title: "RUNTIME CONSOLE",
    tabs: ["LIVE", "EVENTS", "R2"],
    filesLabel: "3 FILES",
    files: [
      { name: "HTML Visual Log", path: "paper_trading/eq_bot_supertrend/2026-08-21/…/terminal.html", actions: ["VIEW", "DOWNLOAD"] },
      { name: "Plain Text Log", path: "paper_trading/eq_bot_supertrend/2026-08-21/…/terminal.log", actions: ["DOWNLOAD"] },
      { name: "Trades CSV", path: "paper_trading/eq_bot_supertrend/2026-08-21/…/trades.csv", actions: ["DOWNLOAD"] },
    ],
  },
  ledger: {
    title: "EXECUTION_LOG / ALL MARKETS",
    columns: ["ENTRY", "EXIT", "SYMBOL", "TYPE", "QTY", "ENTRY PX", "EXIT PX", "PTS", "CHARGES", "NET P&L"],
    rows: [
      { entry: "10:45:00", exit: "15:08:53", sym: "AMAGI", type: "SELL", entryPx: "614.00", exitPx: "601.70" },
      { entry: "09:30:00", exit: "10:02:33", sym: "AMAGI", type: "BUY", entryPx: "606.40", exitPx: "614.25" },
    ],
  },
  redacted: "redacted",
} as const;

/**
 * The desk's cumulative P&L curve, traced off the same screenshot. Viewport
 * is 1000 × 300; the path is drawn on mount and the trade markers are placed
 * against it by their fractional x position.
 */
export const DESK_CURVE =
  "M0,232 L18,236 L30,246 L40,262 L52,258 L64,250 L72,236 L84,210 L92,170 L100,150 L108,118 L116,96 L124,112 L132,168 L140,172 L152,182 L164,170 L176,168 L190,178 L204,180 L220,182 L236,186 L250,172 L262,160 L276,150 L290,128 L304,114 L318,106 L330,94 L344,60 L356,40 L366,44 L376,52 L390,58 L402,66 L414,62 L428,70 L442,76 L456,74 L470,80 L484,78 L498,84 L512,82 L526,76 L540,80 L554,74 L568,78 L582,70 L596,74 L610,66 L624,70 L638,64 L652,70 L666,62 L680,66 L694,60 L708,64 L722,58 L736,62 L750,54 L764,58 L778,50 L792,52 L806,46 L820,50 L834,44 L848,48 L862,42 L876,46 L890,40 L904,44 L918,36 L932,40 L946,34 L960,38 L974,30 L988,36 L1000,62";
