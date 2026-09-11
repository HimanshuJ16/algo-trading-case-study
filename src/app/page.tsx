import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import Contents from "@/components/sections/Contents";

// Everything below the fold is split into its own chunk. Server rendering is
// kept, so the HTML is complete without JavaScript; only the hydration code
// for these chapters arrives after the hero is interactive.
const Overview = dynamic(() => import("@/components/sections/Overview"));
const Trade = dynamic(() => import("@/components/sections/Trade"));
const Strategy = dynamic(() => import("@/components/sections/Strategy"));
const Problems = dynamic(() => import("@/components/sections/Problems"));
const Architecture = dynamic(() => import("@/components/sections/Architecture"));
const Surfaces = dynamic(() => import("@/components/sections/Surfaces"));
const Numbers = dynamic(() => import("@/components/sections/Numbers"));
const Next = dynamic(() => import("@/components/sections/Next"));

/**
 * The eight chapters in build-log order: one process, a rule, the walls it
 * ran into, what broke, the wiring, the room it is watched from, the audit,
 * and what is still unproven.
 */
export default function Page() {
  return (
    <main id="main" className="relative flex-1">
      <Hero />
      <Contents />
      <Overview />
      <Trade />
      <Strategy />
      <Problems />
      <Architecture />
      <Surfaces />
      <Numbers />
      <Next />
    </main>
  );
}
