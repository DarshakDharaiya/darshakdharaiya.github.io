"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, ViewTransition } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import type { Project } from "@/data/types";
import { PhoneStage } from "./PhoneStage";
import { TiltCard } from "@/components/ui/TiltCard";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/ui/Icons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { pad2, cn } from "@/lib/utils";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const flip = index % 2 === 1; // 01 → image right, 02 → image left …

  // Perspective entrance: the stage tilts up from the floor and settles as it reaches centre
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 60%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0, 1], [80, 0]);

  const href = `/work/${project.slug}`;

  return (
    <article
      ref={ref}
      aria-labelledby={`p-${project.slug}`}
      className="grid grid-cols-1 items-center gap-10 md:gap-14 lg:grid-cols-12 lg:gap-16"
    >
      {/* Visual */}
      <motion.div
        className={cn("lg:col-span-7", flip ? "lg:order-1" : "lg:order-2")}
        style={reduced ? undefined : { rotateX, scale, opacity, transformPerspective: 1400, transformOrigin: "50% 100%" }}
      >
        <Link
          href={href}
          transitionTypes={["page-forward"]}
          data-cursor="label"
          data-cursor-label="VIEW PROJECT →"
          aria-label={`View ${project.title} case study`}
          className="group/stage block rounded-card focus-visible:outline-offset-8"
        >
          <TiltCard className="rounded-card" max={5}>
            <ViewTransition name={`stage-${project.slug}`} share="morph" default="none">
              <PhoneStage
                project={project}
                priority={index === 0}
                className="transition-shadow duration-700 group-hover/stage:shadow-glow"
              />
            </ViewTransition>
          </TiltCard>
        </Link>
      </motion.div>

      {/* Content */}
      <motion.div
        className={cn(
          "transition-transform duration-700 ease-out-expo lg:col-span-5",
          flip ? "lg:order-2" : "lg:order-1",
        )}
        style={reduced ? undefined : { y: contentY }}
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-fg-subtle">{pad2(index + 1)}</span>
          <span className="h-px flex-1 bg-line" aria-hidden />
          <Image src={project.icon} alt="" width={40} height={40} className="size-10 rounded-[11px] shadow-soft-sm" />
        </div>

        <h3 id={`p-${project.slug}`} className="mt-6 text-h2 font-semibold">
          <Link href={href} transitionTypes={["page-forward"]} className="link-underline">
            {project.shortTitle}
          </Link>
        </h3>
        <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.14em] text-fg-muted">
          {project.platform} • {project.stack.slice(0, 2).join(" • ")}
        </p>
        <p className="mt-6 text-lead text-fg-muted">{project.description}</p>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
          <div>
            <dt className="eyebrow">Role</dt>
            <dd className="mt-1.5 text-fg">{project.role.split("—")[0].trim()}</dd>
          </div>
          <div>
            <dt className="eyebrow">Google Play</dt>
            <dd className="mt-1.5 flex items-center gap-2 text-fg">
              {project.store.installs === "New" ? "Recently launched" : `${project.store.installs} installs`}
              {project.store.rating && (
                <span className="inline-flex items-center gap-1 text-fg-muted">
                  · <StarIcon className="size-3.5 text-accent" /> {project.store.rating}
                </span>
              )}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="eyebrow">Technology</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {project.stack.map((s) => (
                <span key={s} className="rounded-pill border border-line px-3 py-1 text-[13px] text-fg-muted">
                  {s}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <ul className="mt-8 space-y-2 border-l border-line pl-5 text-[15px] text-fg">
          {project.achievements.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button href={href} transitionTypes={["page-forward"]} arrow="right" size="md">
            View case study
          </Button>
          <Button href={project.store.url} variant="ghost" size="md" arrow="up-right" magnetic={false}>
            Google Play
          </Button>
          {project.links?.github && (
            <Button href={project.links.github} variant="ghost" size="md" arrow="up-right" magnetic={false}>
              GitHub
            </Button>
          )}
        </div>
      </motion.div>
    </article>
  );
}
