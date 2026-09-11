import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import Contents from "@/components/sections/Contents";

// Everything below the fold is split into its own chunk. Server rendering is
// kept, so the HTML is complete without JavaScript; only the hydration code
// for these sections arrives after the hero is interactive.
const Overview = dynamic(() => import("@/components/sections/Overview"));
const Architecture = dynamic(() => import("@/components/sections/Architecture"));
const Trade = dynamic(() => import("@/components/sections/Trade"));
const Strategy = dynamic(() => import("@/components/sections/Strategy"));
const Problems = dynamic(() => import("@/components/sections/Problems"));
const Surfaces = dynamic(() => import("@/components/sections/Surfaces"));
const Numbers = dynamic(() => import("@/components/sections/Numbers"));
const Next = dynamic(() => import("@/components/sections/Next"));

export default function Page() {
  return (
    <main id="main" className="flex-1">
      <Hero />
      <Contents />
      <Overview />
      <Architecture />
      <Trade />
      <Strategy />
      <Problems />
      <Surfaces />
      <Numbers />
      <Next />
    </main>
  );
}
