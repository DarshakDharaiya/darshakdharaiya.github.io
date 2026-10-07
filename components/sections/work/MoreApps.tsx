"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import type { Project } from "@/data/types";
import { ArrowUpRight, StarIcon } from "@/components/ui/Icons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * "Also shipped" rail. Drifts horizontally with scroll on desktop (no pinning, no scroll-jacking);
 * becomes a native swipeable, snapping row on touch.
 */
export function MoreApps({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 768px)");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["12%", "-8%"]);

  return (
    <div ref={ref} className="mt-40 md:mt-56">
      <div className="container-x flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Also shipped</p>
          <h3 className="mt-4 text-h3 font-semibold">More apps on Google Play</h3>
        </div>
      </div>

      <div className="mt-10 overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:overflow-visible" data-lenis-prevent-touch>
        <motion.ul
          className="container-x flex snap-x snap-mandatory gap-4 md:snap-none md:gap-6"
          style={reduced || !desktop ? undefined : { x }}
        >
          {projects.map((p) => (
            <li key={p.slug} className="w-[78vw] shrink-0 snap-start sm:w-[22rem] md:w-[26rem]">
              <a
                href={p.store.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="label"
                data-cursor-label="OPEN ON PLAY ↗"
                className="group glass flex h-full flex-col rounded-card p-6 transition-[transform,box-shadow] duration-700 ease-out-expo hover:-translate-y-1.5 hover:shadow-soft-lg md:p-8"
              >
                <div className="flex items-start justify-between">
                  <Image src={p.icon} alt="" width={56} height={56} className="size-14 rounded-2xl shadow-soft-md" />
                  <ArrowUpRight className="size-5 text-fg-subtle transition-all duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
                </div>
                <p className="mt-8 text-xl font-semibold tracking-[-0.02em]">{p.title}</p>
                <p className="mt-2 text-[15px] text-fg-muted">{p.tagline}</p>
                <div className="mt-auto flex items-center gap-3 pt-8 text-sm text-fg-muted">
                  <span className="text-fg">{p.store.installs}</span> installs
                  {p.store.rating && (
                    <span className="inline-flex items-center gap-1">
                      · <StarIcon className="size-3.5 text-accent" /> {p.store.rating}
                    </span>
                  )}
                </div>
                <span className="sr-only">(opens Google Play in a new tab)</span>
              </a>
            </li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}
