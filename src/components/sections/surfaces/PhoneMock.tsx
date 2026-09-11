"use client";

import { useEffect, useRef } from "react";
import { surfaces } from "@/content/caseStudy";
import { gsap, registerGsap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * A locked phone at 11:40. When the frame enters, the alerts arrive as push
 * notifications, dropping in one after another with a slight overshoot; the
 * critical one nudges the whole device sideways twice, the way a haptic
 * would. Transform and opacity only. Reduced motion: the notifications are
 * simply there.
 */
export default function PhoneMock() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const p = surfaces.phone;

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    registerGsap();
    const ctx = gsap.context(() => {
      const notifs = Array.from(root.querySelectorAll<HTMLElement>("[data-notif]"));
      gsap.set(notifs, { autoAlpha: 0, y: -28, scale: 0.96 });
      const tl = gsap.timeline({
        defaults: { ease: "snap" },
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
      });
      notifs.forEach((n, i) => {
        tl.to(n, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 }, 0.4 + i * 0.55);
        if (n.dataset.level === "critical") {
          tl.to(root, { x: -3, duration: 0.05, ease: "none" }, 0.45 + i * 0.55)
            .to(root, { x: 3, duration: 0.05, ease: "none" })
            .to(root, { x: -2, duration: 0.05, ease: "none" })
            .to(root, { x: 0, duration: 0.08, ease: "settle" });
        }
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={ref} className="phone" role="img" aria-label={`A locked phone at ${p.lock.time} receiving ${p.alerts.length} push notifications from the alerts app`}>
      <div className="phone-notch" aria-hidden="true" />
      <div className="phone-screen">
        <div className="phone-status" aria-hidden="true">
          <span>{p.lock.time}</span>
          <span className="phone-status-icons">
            <i /> <i /> <i /> <b />
          </span>
        </div>
        <div className="phone-lock">
          <div className="phone-time">{p.lock.time}</div>
          <div className="phone-date">{p.lock.date}</div>
        </div>
        <ul className="phone-notifs">
          {p.alerts.map((a) => (
            <li key={a.event} data-notif data-level={a.level} className={`phone-notif is-${a.level}`}>
              <div className="phone-notif-head">
                <span className="phone-app-icon" aria-hidden="true">
                  {p.lock.appInitial}
                </span>
                <span className="phone-app-name">{p.lock.appName}</span>
                <span className="phone-notif-when">{p.lock.when}</span>
              </div>
              <b>{a.title}</b>
              <p>{a.body}</p>
            </li>
          ))}
        </ul>
        <div className="phone-home" aria-hidden="true" />
      </div>
    </div>
  );
}
