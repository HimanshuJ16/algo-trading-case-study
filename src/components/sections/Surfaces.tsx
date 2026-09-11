"use client";

import { useRef } from "react";
import { desk, sectionBySlug, surfaces } from "@/content/caseStudy";
import { useReveal } from "@/lib/useReveal";
import ChapterHeader from "@/components/ChapterHeader";
import DeskMock from "@/components/sections/surfaces/DeskMock";
import PhoneMock from "@/components/sections/surfaces/PhoneMock";

const meta = sectionBySlug("surfaces");

/** Label/value list shared by the desk and the phone. */
function Facts({ facts }: { facts: readonly { k: string; v: string }[] }) {
  const ref = useRef<HTMLDListElement>(null);
  useReveal(ref, { selector: "[data-item]", stagger: 0.08, y: 14 });
  return (
    <dl ref={ref} className="m-0 border-t border-line">
      {facts.map((f) => (
        <div
          key={f.k}
          data-item
          className="js-reveal grid gap-6 border-b border-line py-4 sm:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <dt className="label-mono pt-1">{f.k}</dt>
          <dd className="m-0 text-[0.95rem] leading-[1.5] text-fg/85">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Surfaces() {
  const deskRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  useReveal(deskRef, { selector: "[data-item]", stagger: 0.12, y: 18 });
  useReveal(phoneRef, { selector: "[data-item]", stagger: 0.12, y: 18 });

  return (
    <section id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad border-t border-line">
      <ChapterHeader meta={meta} />

      <div ref={deskRef}>
        <div data-item className="js-reveal">
          <DeskMock />
        </div>
        <p data-item className="js-reveal mt-4 max-w-[80ch] text-[0.82rem] leading-[1.5] text-muted">
          {desk.caption}
        </p>

        <div className="mt-20 grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-x-16 gap-y-12">
          <div data-item className="js-reveal">
            <h3 className="m-0 text-[1.75rem] font-semibold tracking-[-0.025em]">{surfaces.desk.title}</h3>
            <p className="mt-3 mb-0 max-w-[48ch] text-[0.98rem] leading-[1.5] text-fg/80">{surfaces.desk.body}</p>
          </div>
          <Facts facts={surfaces.desk.facts} />
        </div>
      </div>

      <div
        ref={phoneRef}
        className="mt-24 grid gap-16 border-t border-line pt-16 lg:grid-cols-[minmax(17rem,18rem)_minmax(0,1fr)]"
      >
        <div data-item className="js-reveal flex justify-start">
          <PhoneMock />
        </div>
        <div className="flex flex-col gap-8">
          <div data-item className="js-reveal">
            <h3 className="m-0 text-[1.75rem] font-semibold tracking-[-0.025em]">{surfaces.phone.title}</h3>
            <p className="mt-3 mb-0 max-w-[48ch] text-[0.98rem] leading-[1.5] text-fg/80">{surfaces.phone.body}</p>
          </div>
          <Facts facts={surfaces.phone.facts} />
          <div data-item className="js-reveal border-t border-line pt-8">
            <h3 className="m-0 mb-3 text-[1.35rem] font-semibold tracking-[-0.02em]">{surfaces.relay.title}</h3>
            <p className="m-0 max-w-[60ch] text-[0.95rem] leading-[1.5] text-fg/80">{surfaces.relay.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
