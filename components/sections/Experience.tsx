"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { experience } from "@/data/experience";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/animations/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Experience() {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="experience" data-mood="calm" aria-labelledby="experience-title" className="container-x py-section">
      <SectionHeader index="03" eyebrow="Experience" title="Where I've built." />

      <ol ref={ref} className="relative">
        {/* Rail */}
        <span aria-hidden className="absolute top-0 bottom-0 left-[7px] w-px bg-line md:left-[calc(25%+7px)]" />
        <motion.span
          aria-hidden
          className="absolute top-0 bottom-0 left-[7px] w-px origin-top bg-fg md:left-[calc(25%+7px)]"
          style={{ scaleY: reduced ? 1 : fill }}
        />

        {experience.map((job, i) => (
          <Reveal as="li" key={job.company + job.start} index={i} className="group relative grid gap-4 pb-20 last:pb-0 md:grid-cols-4 md:gap-0">
            {/* Meta column */}
            <div className="pl-10 md:pl-0 md:pr-12 md:text-right">
              <p className="font-mono text-sm text-fg">
                {(job.earlierRoles?.at(-1)?.start ?? job.start)} — {job.end}
              </p>
              <p className="mt-1 text-sm text-fg-muted">{job.location}</p>
              <p className="text-sm text-fg-subtle">{job.type}</p>
            </div>

            {/* Indicator */}
            <span
              aria-hidden
              className="absolute top-1 left-0 grid size-[15px] place-items-center md:left-[25%]"
            >
              <span className="absolute size-full rounded-full bg-accent opacity-0 transition-[transform,opacity] duration-700 ease-out-expo group-hover:scale-[2.4] group-hover:opacity-20" />
              <span className="size-[15px] rounded-full border border-line-strong bg-bg transition-colors duration-500 group-hover:border-accent group-hover:bg-accent" />
            </span>

            {/* Card */}
            <div className="pl-10 md:col-span-3 md:pl-12">
              <TiltCard max={2.5} glare={false} className="rounded-card">
                <div className="-m-5 rounded-card border border-transparent p-5 transition-[background-color,border-color,box-shadow,transform] duration-700 ease-out-expo group-hover:border-line group-hover:bg-[var(--glass-bg)] group-hover:shadow-soft-md group-hover:backdrop-blur-xl md:-m-8 md:p-8">
                  <h3 className="text-h3 font-semibold">
                    {job.role}
                    <span className="text-fg-muted"> · {job.company}</span>
                  </h3>
                  {job.formerly && <p className="mt-1 text-sm text-fg-subtle">Formerly {job.formerly}</p>}
                  {job.earlierRoles && (
                    <ol aria-label="Role progression" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-fg-muted">
                      <li className="rounded-pill bg-accent-soft px-2.5 py-1 text-fg">
                        {job.role.split(" / ")[0]} · {job.start} — {job.end}
                      </li>
                      {job.earlierRoles.map((r) => (
                        <li key={r.role} className="flex items-center gap-3">
                          <span aria-hidden>←</span>
                          {r.role} · {r.start} — {r.end}
                        </li>
                      ))}
                    </ol>
                  )}
                  <p className="mt-4 max-w-2xl text-lead text-fg-muted">{job.description}</p>

                  <div className="mt-8 grid gap-8 lg:grid-cols-2">
                    <div>
                      <h4 className="eyebrow">Responsibilities</h4>
                      <ul className="mt-3 space-y-2 text-[15px] text-fg">
                        {job.responsibilities.map((r) => (
                          <li key={r} className="flex gap-3">
                            <span className="mt-2.5 size-1 shrink-0 rounded-full bg-fg-subtle" aria-hidden />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="eyebrow">Achievements</h4>
                      <ul className="mt-3 space-y-2 text-[15px] text-fg">
                        {job.achievements.map((a) => (
                          <li key={a} className="flex gap-3">
                            <span className="mt-2.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <ul aria-label="Technology" className="mt-8 flex flex-wrap gap-1.5">
                    {job.stack.map((s, si) => (
                      <li
                        key={s}
                        className="rounded-pill border border-line px-3 py-1 text-[13px] text-fg-muted transition-[opacity,transform,color,border-color] duration-500 ease-out-expo group-hover:border-line-strong group-hover:text-fg lg:translate-y-1 lg:opacity-50 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                        style={{ transitionDelay: `${si * 30}ms` }}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </TiltCard>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
