"use client";

import { useEffect, useRef, useState } from "react";
import { strategy } from "@/content/caseStudy";
import { ScrollTrigger, registerGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Signals in, orders out. A small rigid-body world (Matter.js). The first
 * gate is a funnel that collects every signal into one gap. Each gate after
 * it is a roof: a disc drops from the previous gap onto a pin at the roof's
 * peak and is deflected either forward, down the slope into this gate's gap,
 * or backward, down the other slope into the gutter, where it is vetoed.
 * Nothing is scripted; the geometry and the disc's momentum decide, and only
 * a fraction of signals reach the floor as orders. The engine steps at a
 * fixed 60 Hz only while the figure is on screen and the tab is visible; the
 * library is not even loaded until the figure is near the viewport. Reduced
 * motion: one settled frame is drawn and the simulation never runs.
 */
export default function SignalFunnel() {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [counts, setCounts] = useState({ inn: 0, out: 0, veto: 0 });
  const f = strategy.funnel;
  const layers = strategy.layers;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    registerGsap();

    let disposed = false;
    let cleanup: (() => void) | null = null;

    // Nothing loads until the figure is within a viewport of the screen.
    const near = new Promise<void>((resolve) => {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            resolve();
          }
        },
        { rootMargin: "100% 0px" },
      );
      io.observe(wrap);
      cleanup = () => io.disconnect();
    });

    (async () => {
      await near;
      if (disposed) return;
      const Matter = await import("matter-js");
      if (disposed) return;
      const { Engine, Bodies, Composite, Body, Events } = Matter;

      const css = getComputedStyle(document.documentElement);
      const ink = css.getPropertyValue("--fg").trim() || "#141413";
      const line = css.getPropertyValue("--line").trim() || "#d9d7cc";
      const muted = css.getPropertyValue("--muted").trim() || "#64635d";
      const accent = css.getPropertyValue("--accent").trim() || "#9a5a12";
      const down = css.getPropertyValue("--down").trim() || "#a3362f";
      const panel = css.getPropertyValue("--bg-2").trim() || "#ebe2d3";

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let W = 0;
      let H = 0;
      let narrowRef = false;
      let R = 4;
      let GAP = 22;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const GATES = layers.length;
      const GUTTER = 34;
      const TOP = 54;
      const BOTTOM = 64;

      const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0019 } });
      const world = engine.world;
      type Seg = { body: Matter.Body };
      let segs: Seg[] = [];
      let pins: Matter.Body[] = [];
      let labels: { text: string; x: number; y: number }[] = [];
      const discs: { body: Matter.Body; born: number; state: "live" | "out" | "veto" }[] = [];
      let seed = 4242;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      let inn = 0;
      let out = 0;
      let veto = 0;

      const segment = (x0: number, y0: number, x1: number, y1: number) => {
        const len = Math.hypot(x1 - x0, y1 - y0);
        const body = Bodies.rectangle((x0 + x1) / 2, (y0 + y1) / 2, len, 5, {
          isStatic: true,
          angle: Math.atan2(y1 - y0, x1 - x0),
          friction: 0.004,
          frictionStatic: 0,
          restitution: 0.05,
          chamfer: { radius: 2 },
        });
        Composite.add(world, body);
        segs.push({ body });
      };

      const build = () => {
        const rect = wrap.getBoundingClientRect();
        W = Math.max(320, Math.round(rect.width));
        const narrow = W < 600;
        narrowRef = narrow;
        H = narrow ? 560 : 520;
        R = narrow ? 3.2 : 4;
        GAP = narrow ? 16 : 22;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.height = `${H}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        Composite.clear(world, false);
        segs = [];
        pins = [];
        labels = [];
        Composite.add(world, [
          Bodies.rectangle(W / 2, H + 20, W + 80, 40, { isStatic: true }),
          Bodies.rectangle(-20, H / 2, 40, H * 2, { isStatic: true }),
          Bodies.rectangle(W + 20, H / 2, 40, H * 2, { isStatic: true }),
        ]);

        const usable = H - TOP - BOTTOM;
        const step = usable / GATES;
        const drop = Math.min(14, step * 0.32);
        const back = Math.min(26, step * 0.5);
        // The intake gap must clear the first pin below it by a full disc.
        const intake = Math.min(38, step - 24);
        const right = W - GUTTER;
        const stepX = Math.max(34, Math.min(120, (right - GUTTER - 140) / GATES));
        let peak = GUTTER + (narrow ? 50 : 80);

        for (let g = 0; g < GATES; g++) {
          const yTop = TOP + step * g + 8;
          const gap = peak + stepX;
          if (g === 0) {
            // Intake: a V steep enough that every signal rolls into the first gap.
            segment(GUTTER, yTop, gap - GAP / 2 - 5, yTop + intake);
            segment(gap + GAP / 2 + 5, yTop + intake, right, yTop);
          } else {
            // Roof: back slope to the gutter (veto), front slope to the gap (pass),
            // and a return slope beyond the gap so nothing is stranded.
            segment(GUTTER, yTop + back, peak, yTop);
            segment(peak, yTop, gap - GAP / 2, yTop + drop);
            segment(gap + GAP / 2, yTop + drop, right, yTop);
            // The pin at the peak, a hair ahead of the landing path: momentum
            // carries many discs forward, the pin throws the rest back.
            const pin = Bodies.circle(peak + 0.8, yTop - 9, 2.4, { isStatic: true, restitution: 0.35, friction: 0 });
            Composite.add(world, pin);
            pins.push(pin);
          }
          labels.push({ text: layers[g].name.toUpperCase(), x: GUTTER + 6, y: yTop + (g === 0 ? -12 : back - 12) });
          peak = gap;
        }
      };

      build();

      const spawn = () => {
        if (discs.filter((d) => d.state === "live").length > 60) return;
        const spread = Math.min(W - GUTTER * 2 - 40, narrowRef ? W : 0.6 * (W - GUTTER * 2));
        const x = GUTTER + 20 + rnd() * spread;
        const body = Bodies.circle(x, TOP - 18, R, { restitution: 0.12, friction: 0.004, frictionStatic: 0, frictionAir: 0.003, density: 0.002 });
        Body.setVelocity(body, { x: (rnd() - 0.5) * 0.4, y: 0 });
        Composite.add(world, body);
        discs.push({ body, born: engine.timing.timestamp, state: "live" });
        inn++;
      };

      Events.on(engine, "afterUpdate", () => {
        for (const d of discs) {
          if (d.state !== "live") continue;
          const { x, y } = d.body.position;
          if (y > TOP && x < GUTTER - 1) {
            d.state = "veto";
            veto++;
          } else if (y > H - BOTTOM + 6) {
            d.state = "out";
            out++;
          }
        }
        for (let i = discs.length - 1; i >= 0; i--) {
          const d = discs[i];
          if (d.state !== "live" && engine.timing.timestamp - d.born > 9000) {
            Composite.remove(world, d.body);
            discs.splice(i, 1);
          }
        }
      });

      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        // Veto gutter on the left, order tray along the floor.
        ctx.fillStyle = panel;
        ctx.fillRect(0, TOP - 26, GUTTER, H - TOP + 26);
        ctx.fillStyle = line;
        ctx.fillRect(GUTTER, H - BOTTOM, W - GUTTER, 1);
        // Gates
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.85;
        for (const s of segs) {
          const v = s.body.vertices;
          ctx.beginPath();
          ctx.moveTo(v[0].x, v[0].y);
          for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Pins
        ctx.fillStyle = muted;
        for (const p of pins) {
          ctx.beginPath();
          ctx.arc(p.position.x, p.position.y, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // Labels
        ctx.font = "500 10.5px system-ui, sans-serif";
        ctx.fillStyle = muted;
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
        for (const l of labels) ctx.fillText(l.text, l.x, l.y);
        // Discs
        for (const d of discs) {
          const { x, y } = d.body.position;
          ctx.beginPath();
          ctx.arc(x, y, R, 0, Math.PI * 2);
          ctx.fillStyle = d.state === "out" ? accent : d.state === "veto" ? down : ink;
          ctx.globalAlpha = d.state === "live" ? 0.9 : 0.6;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        // Counters
        ctx.font = "500 11px ui-monospace, Menlo, monospace";
        ctx.fillStyle = muted;
        ctx.fillText(`${f.counters.inn} ${inn}`, GUTTER + 8, H - 24);
        ctx.fillStyle = accent;
        ctx.fillText(`${f.counters.out} ${out}`, GUTTER + 118, H - 24);
        ctx.fillStyle = down;
        ctx.fillText(`${f.counters.veto} ${veto}`, GUTTER + 228, H - 24);
      };

      if (reduced) {
        for (let i = 0; i < 14; i++) spawn();
        for (let i = 0; i < 360; i++) Engine.update(engine, 1000 / 60);
        draw();
        cleanup = () => {
          Composite.clear(world, false);
          Engine.clear(engine);
        };
        return;
      }

      let raf = 0;
      let running = false;
      let last = 0;
      let spawnAcc = 0;
      let stepAcc = 0;
      const STEP = 1000 / 60;
      const loop = (t: number) => {
        if (!running) return;
        const dt = Math.min(48, t - (last || t));
        last = t;
        spawnAcc += dt;
        const every = narrowRef ? 420 : 640;
        while (spawnAcc > every) {
          spawnAcc -= every;
          spawn();
        }
        stepAcc += dt;
        while (stepAcc >= STEP) {
          Engine.update(engine, STEP);
          stepAcc -= STEP;
        }
        draw();
        if ((inn & 3) === 0) setCounts({ inn, out, veto });
        raf = requestAnimationFrame(loop);
      };
      const start = () => {
        if (running || document.hidden) return;
        running = true;
        last = 0;
        raf = requestAnimationFrame(loop);
      };
      const stop = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };
      const st = ScrollTrigger.create({
        trigger: wrap,
        start: "top 90%",
        end: "bottom 10%",
        onToggle: (self) => (self.isActive ? start() : stop()),
      });
      const onVis = () => (document.hidden ? stop() : st.isActive && start());
      document.addEventListener("visibilitychange", onVis);
      const ro = new ResizeObserver(() => {
        stop();
        discs.length = 0;
        build();
        if (st.isActive) start();
      });
      ro.observe(wrap);
      draw();

      cleanup = () => {
        stop();
        st.kill();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        Composite.clear(world, false);
        Engine.clear(engine);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [reduced, layers, f.counters]);

  return (
    <figure ref={wrapRef} className="funnel">
      <figcaption className="fig-title mb-3">{f.title}</figcaption>
      <canvas ref={canvasRef} className="funnel-canvas" role="img" aria-label={f.alt} />
      <p className="fig-caption mt-3 max-w-[70ch]">
        {f.caption}
        <span className="sr-only">
          {" "}
          {f.counters.inn} {counts.inn}, {f.counters.out} {counts.out}, {f.counters.veto} {counts.veto}.
        </span>
      </p>
    </figure>
  );
}
