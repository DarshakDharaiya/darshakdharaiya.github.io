"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { ease, viewportOnce } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type Props = {
  text: string | string[];
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  /** "chars" for display headings, "words" for longer lines */
  by?: "chars" | "words";
  delay?: number;
  stagger?: number;
  /** Animate on mount instead of on viewport entry */
  immediate?: boolean;
  lineClassName?: string;
};

const item: Variants = {
  hidden: { y: "105%", opacity: 0, filter: "blur(8px)", rotateX: -40 },
  visible: {
    y: "0%",
    opacity: 1,
    filter: "blur(0px)",
    rotateX: 0,
    transition: { duration: 1.1, ease: ease.outExpo },
  },
};

/**
 * Masked, staggered text reveal (blur → sharp, rising from a clip mask).
 * Accessible: the full string is exposed once as visually-hidden text; split spans are aria-hidden.
 */
export function TextReveal({
  text,
  as = "span",
  className,
  by = "chars",
  delay = 0,
  stagger,
  immediate,
  lineClassName,
}: Props) {
  const reduced = useReducedMotion();
  const lines = Array.isArray(text) ? text : [text];
  const label = lines.join(" ");
  const each = stagger ?? (by === "chars" ? 0.028 : 0.06);

  if (reduced) {
    return (
      <Static as={as} className={className}>
        {lines.map((l, i) => (
          <span key={i} className={cn("block", lineClassName)}>
            {l}
          </span>
        ))}
      </Static>
    );
  }

  let index = 0;
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      {...(immediate ? { animate: "visible" } : { whileInView: "visible", viewport: viewportOnce })}
      transition={{ staggerChildren: each, delayChildren: delay }}
      style={{ perspective: 800 }}
    >
      <span className="sr-only">{label}</span>
      {lines.map((line, li) => (
        <span key={li} aria-hidden className={cn("block", lineClassName)}>
          {line.split(" ").map((word, wi, words) => (
            <span key={wi} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-top">
              {by === "chars" ? (
                word.split("").map((ch) => (
                  <motion.span key={index++} variants={item} className="inline-block will-change-transform origin-bottom">
                    {ch}
                  </motion.span>
                ))
              ) : (
                <motion.span key={index++} variants={item} className="inline-block will-change-transform origin-bottom">
                  {word}
                </motion.span>
              )}
              {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </span>
      ))}
    </MotionTag>
  );
}

function Static({ as: Tag, ...p }: { as: NonNullable<Props["as"]>; className?: string; children: ReactNode }) {
  return <Tag {...p} />;
}
