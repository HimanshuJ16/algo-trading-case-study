import { architecture } from "@/content/caseStudy";

export const VIEW = { w: 1340, h: 740 };

type Box = { x: number; y: number; w: number; h: number };

/** Where each service sits. Market data enters left, surfaces leave right. */
const BOXES: Record<string, Box> = {
  broker: { x: 40, y: 250, w: 240, h: 70 },
  scrape: { x: 40, y: 470, w: 240, h: 70 },
  engine: { x: 380, y: 330, w: 260, h: 90 },
  db: { x: 280, y: 560, w: 240, h: 70 },
  r2: { x: 540, y: 560, w: 200, h: 70 },
  relay: { x: 820, y: 330, w: 200, h: 90 },
  mobile: { x: 1110, y: 40, w: 200, h: 70 },
  push: { x: 1110, y: 180, w: 200, h: 70 },
  desk: { x: 1110, y: 330, w: 200, h: 90 },
};

type Route = { pts: [number, number][]; label: [number, number] };

/**
 * Orthogonal routes, keyed by the edge they belong to so adding or moving an
 * edge in the content file fails loudly instead of silently drawing the wrong
 * line. Two edges share relay→desk, hence the label in the key.
 */
const ROUTES: Record<string, Route> = {
  "broker>engine>ticks": { pts: [[280, 270], [340, 270], [340, 352], [380, 352]], label: [340, 311] },
  "scrape>engine>candidates": { pts: [[280, 505], [340, 505], [340, 398], [380, 398]], label: [340, 452] },
  "engine>broker>orders": { pts: [[380, 375], [320, 375], [320, 300], [280, 300]], label: [320, 338] },
  "engine>db>trades · journal": { pts: [[460, 420], [460, 560]], label: [460, 472] },
  "db>engine>config · halt": { pts: [[420, 560], [420, 420]], label: [420, 512] },
  "engine>r2>archive": { pts: [[600, 420], [600, 560]], label: [600, 490] },
  "engine>relay>update · log · alert · status": { pts: [[640, 375], [820, 375]], label: [730, 375] },
  "relay>desk>algo_new_*": { pts: [[1020, 360], [1110, 360]], label: [1065, 360] },
  "relay>mobile>algo_new_*": { pts: [[890, 330], [890, 75], [1110, 75]], label: [890, 160] },
  "relay>push>alerts": { pts: [[950, 330], [950, 215], [1110, 215]], label: [950, 272] },
  "desk>db>bot_configs · halt": { pts: [[1210, 420], [1210, 680], [400, 680], [400, 630]], label: [800, 680] },
  "relay>desk>x-api-key": { pts: [[1020, 390], [1110, 390]], label: [1065, 390] },
};

/** Orthogonal polyline with rounded corners, clamped to each leg's length. */
function roundedPath(pts: [number, number][], r = 10): string {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(r, inLen / 2, outLen / 2);
    d += ` L${cx - ((cx - px) / inLen) * rr},${cy - ((cy - py) / inLen) * rr}`;
    d += ` Q${cx},${cy} ${cx + ((nx - cx) / outLen) * rr},${cy + ((ny - cy) / outLen) * rr}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0]},${last[1]}`;
}

const LABEL_SIZE = 9.1;

/* Node text metrics. The sub line is monospaced, so it can be measured
   without the DOM: IBM Plex Mono advances 0.6em, and 0.62 leaves headroom for
   a wider fallback face while the webfont is still loading. */
export const NODE_LABEL_SIZE = 14.5;
export const SUB_SIZE = 10.2;
const SUB_CHAR = SUB_SIZE * 0.62;
const SUB_LINE_H = 14;
const TEXT_PAD = 16;
const LABEL_GAP = 8;

/**
 * Fit a node's sub line to its box. The subs read as lists separated by " · ",
 * so lines break at those separators first, and a segment is hard-wrapped on
 * spaces only when it is too wide for the box on its own.
 */
function wrapSub(text: string, boxW: number): string[] {
  const budget = Math.max(8, Math.floor((boxW - TEXT_PAD * 2) / SUB_CHAR));
  const lines: string[] = [];
  let line = "";
  const flush = () => {
    if (line) lines.push(line);
    line = "";
  };

  for (const segment of text.split(" · ")) {
    const joined = line ? `${line} · ${segment}` : segment;
    if (joined.length <= budget) {
      line = joined;
      continue;
    }
    flush();
    if (segment.length <= budget) {
      line = segment;
      continue;
    }
    for (const word of segment.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (next.length <= budget) line = next;
      else {
        flush();
        line = word;
      }
    }
  }
  flush();
  return lines;
}

export type ArchNode = {
  id: string;
  label: string;
  /** The engine is the one filled box: everything else is drawn around it. */
  primary: boolean;
  textX: number;
  labelY: number;
  /** The sub line broken to fit the box, with a baseline for each line. */
  subLines: { text: string; y: number }[];
} & Box;

export type ArchEdge = {
  key: string;
  from: string;
  to: string;
  label: string;
  d: string;
  /** Two-way control paths are dashed and are never drawn on, only faded in. */
  dashed: boolean;
  labelBox: { x: number; y: number; w: number; h: number };
  labelAnchor: { x: number; y: number };
};

export const archNodes: ArchNode[] = architecture.nodes.map((n) => {
  const box = BOXES[n.id];
  const lines = wrapSub(n.sub, box.w);
  // Centre the label-and-sub block in the box, so one that wraps to two lines
  // stays balanced instead of pushing its second line onto the bottom edge.
  const blockH = NODE_LABEL_SIZE + LABEL_GAP + SUB_SIZE + (lines.length - 1) * SUB_LINE_H;
  const labelY = box.y + (box.h - blockH) / 2 + NODE_LABEL_SIZE;
  const firstSub = labelY + LABEL_GAP + SUB_SIZE;
  return {
    id: n.id,
    label: n.label,
    primary: n.group === "engine",
    ...box,
    textX: box.x + TEXT_PAD,
    labelY,
    subLines: lines.map((text, i) => ({ text, y: firstSub + i * SUB_LINE_H })),
  };
});

export const archEdges: ArchEdge[] = architecture.edges.map((e) => {
  const key = `${e.from}>${e.to}>${e.label}`;
  const route = ROUTES[key];
  if (!route) throw new Error(`No route laid out for architecture edge ${key}`);
  const w = e.label.length * LABEL_SIZE * 0.62 + 14;
  const [lx, ly] = route.label;
  return {
    key,
    from: e.from,
    to: e.to,
    label: e.label,
    d: roundedPath(route.pts),
    dashed: "dir" in e && e.dir === "both",
    labelBox: { x: lx - w / 2, y: ly - LABEL_SIZE * 0.9, w, h: 16.4 },
    labelAnchor: { x: lx, y: ly + LABEL_SIZE * 0.36 },
  };
});

/** The node itself plus everything one edge away from it. */
export function neighbourhood(id: string): Set<string> {
  const set = new Set<string>([id]);
  for (const e of archEdges) {
    if (e.from === id) set.add(e.to);
    if (e.to === id) set.add(e.from);
  }
  return set;
}
