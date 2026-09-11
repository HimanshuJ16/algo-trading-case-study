"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

let registered = false;

/**
 * Registers plugins and the page's named eases exactly once. Safe to call
 * from every component effect. Never runs on the server.
 */
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin, MotionPathPlugin, ScrambleTextPlugin);
  // Named cubic-beziers so no tween on the page uses a stock ease.
  CustomEase.create("reveal", "0.165,0.84,0.44,1"); // quart-out
  CustomEase.create("wipe", "0.77,0,0.175,1"); // quart in-out
  CustomEase.create("settle", "0.33,1,0.68,1"); // cubic-out, softer
  CustomEase.create("snap", "0.34,1.56,0.64,1"); // slight overshoot for magnetic reset
  registered = true;
}

export const EASE = {
  reveal: "reveal",
  wipe: "wipe",
  settle: "settle",
  snap: "snap",
} as const;

/** Same curves as JS functions, for Lenis and rAF-driven work. */
export const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Sync check used before any animation is scheduled. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

export { gsap, ScrollTrigger, SplitText };
