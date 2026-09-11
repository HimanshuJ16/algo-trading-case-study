/**
 * Tiny event bus between the hero mosaic and the WebGL field. A tile that
 * ticks reports its viewport centre; the field ripples from that point.
 */
export type TickEvent = { x: number; y: number; dir: "up" | "down" | "" };

type Listener = (e: TickEvent) => void;
const listeners = new Set<Listener>();

export const heroBus = {
  emit(e: TickEvent) {
    listeners.forEach((l) => l(e));
  },
  on(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/** True when a WebGL context can be created; false on software renderers that refuse. */
export function webglAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
