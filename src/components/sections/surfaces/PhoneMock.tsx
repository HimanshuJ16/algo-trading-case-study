"use client";

import { useEffect, useRef } from "react";
import { surfaces } from "@/content/caseStudy";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/motion";

const { lock, alerts } = surfaces.phone;

/**
 * A locked phone taking the session's alerts. The notifications drop in one
 * at a time and the handset kicks once on the last one — the point of the
 * app is that a stop firing at 11:40 reaches a phone nobody is holding.
 */
export default function PhoneMock() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const notifs = Array.from(el.querySelectorAll<HTMLElement>(".phone-notif"));
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 70%", once: true } });
      tl.from(notifs, {
        autoAlpha: 0,
        y: -28,
        scale: 0.96,
        duration: 0.7,
        ease: "snap",
        stagger: 0.55,
        delay: 0.4,
      });
      // The buzz lands with the critical alert, not after all of them.
      tl.to(el, { x: -3, duration: 0.05, repeat: 3, yoyo: true }, "<0.9");
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="phone" role="img" aria-label="Locked phone showing the session's alerts">
      <div className="phone-notch" aria-hidden="true" />
      <div className="phone-screen">
        <div className="flex justify-between px-5 pt-3 font-mono text-[0.66rem] text-fg/85">
          <span>{lock.time}</span>
          <span className="phone-status-icons" aria-hidden="true">
            <i />
            <i />
            <i />
            <b />
          </span>
        </div>

        <div className="mt-6 text-center">
          <div className="text-[3.4rem] leading-none font-medium tracking-[-0.04em] tabular-nums">{lock.time}</div>
          <div className="mt-1.5 text-[0.78rem] text-fg/70">{lock.date}</div>
        </div>

        <ul className="m-0 flex list-none flex-col gap-2 px-3 pt-5">
          {alerts.map((a) => (
            <li key={a.event} className="phone-notif" data-level={a.level}>
              <div className="mb-1 flex items-center gap-1.5 text-[0.62rem] tracking-[0.06em] uppercase text-fg/70">
                <span className="grid h-4 w-4 place-items-center rounded bg-accent font-mono text-[0.6rem] font-bold text-accent-ink">
                  {lock.appInitial}
                </span>
                <span>{lock.appName}</span>
                <span className="ml-auto tracking-normal normal-case">{lock.when}</span>
              </div>
              <b className="block text-[0.86rem] font-semibold">{a.title}</b>
              <p className="mt-0.5 mb-0 font-mono text-[0.64rem] leading-[1.4] text-fg/70">{a.body}</p>
            </li>
          ))}
        </ul>

        <div className="phone-home" aria-hidden="true" />
      </div>
    </div>
  );
}
