"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// The server cannot know the preference. Rendering the static variant on the
// server would flash for motion users, and rendering the animated one would
// hide content for reduced-motion users only until hydration, which is the
// lesser evil because the CSS gate in globals.css keeps it visible anyway.
function getServerSnapshot() {
  return false;
}

/** Reactive `prefers-reduced-motion`; re-renders if the OS setting changes. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
