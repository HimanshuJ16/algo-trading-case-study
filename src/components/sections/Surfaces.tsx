"use client";

import { useRef } from "react";
import { surfaces, desk, sectionById } from "@/content/caseStudy";
import { useSectionTheme } from "@/lib/useSectionTheme";
import { useReveal } from "@/lib/useReveal";
import SectionHeader from "@/components/SectionHeader";
import DeskMock from "./surfaces/DeskMock";
import PhoneMock from "./surfaces/PhoneMock";

const meta = sectionById("surfaces");

function Facts({ facts }: { facts: readonly { k: string; v: string }[] }) {
  const ref = useRef<HTMLDListElement>(null);
  useReveal(ref, { selector: "[data-item]", stagger: 0.08, y: 14 });
  return (
    <dl ref={ref} className="divide-y divide-line border-t border-line">
      {facts.map((f) => (
        <div key={f.k} data-item className="js-reveal grid grid-cols-1 gap-1 py-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
          <dt className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted">{f.k}</dt>
          <dd className="text-[0.98rem] leading-[1.5] text-fg/85">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Intro({ title, body }: { title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, { selector: "[data-item]", stagger: 0.1, y: 14 });
  return (
    <div ref={ref}>
      <h3 data-item className="js-reveal font-serif text-[1.7rem] font-normal tracking-[-0.01em] text-fg">
        {title}
      </h3>
      <p data-item className="js-reveal mt-3 max-w-[48ch] text-[1rem] leading-[1.5] text-fg/85">
        {body}
      </p>
    </div>
  );
}

export default function Surfaces() {
  const ref = useRef<HTMLElement>(null);
  const relayRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  useSectionTheme(ref, meta.theme);
  useReveal(relayRef, { y: 16 });
  useReveal(captionRef, { y: 10 });

  return (
    <section ref={ref} id={meta.id} aria-labelledby={`${meta.id}-title`} className="section-pad">
      <SectionHeader meta={meta} />

      {/* The desk, recreated */}
      <div className="min-w-0">
        <DeskMock />
        <p ref={captionRef} className="js-reveal fig-caption mt-4 max-w-[80ch]">
          {desk.caption}
        </p>
      </div>

      {/* Desk facts */}
      <div className="mt-16 grid grid-cols-1 gap-8 md:mt-24 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <Intro title={surfaces.desk.title} body={surfaces.desk.body} />
        <Facts facts={surfaces.desk.facts} />
      </div>

      {/* The phone: device on the left, its story on the right */}
      <div className="mt-20 grid grid-cols-1 gap-10 border-t border-line pt-16 md:mt-28 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
        <div className="flex justify-center lg:justify-start">
          <PhoneMock />
        </div>
        <div className="flex flex-col gap-8">
          <Intro title={surfaces.phone.title} body={surfaces.phone.body} />
          <Facts facts={surfaces.phone.facts} />
        </div>
      </div>

      <div ref={relayRef} className="js-reveal mt-16 border-t border-line pt-8 md:mt-24">
        <h3 className="mb-3 font-serif text-[1.5rem] font-normal tracking-[-0.01em] text-fg">{surfaces.relay.title}</h3>
        <p className="max-w-[70ch] text-[1rem] leading-[1.5] text-fg/85">{surfaces.relay.body}</p>
      </div>
    </section>
  );
}
