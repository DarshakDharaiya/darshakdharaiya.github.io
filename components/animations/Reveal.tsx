"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { reveal, viewportOnce } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Fade + rise + blur-to-sharp when entering the viewport. */
export function Reveal({
  children,
  className,
  index = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  as?: "div" | "li" | "p" | "section" | "article" | "span";
}) {
  const reduced = useReducedMotion();
  const M = motion[as];
  if (reduced) return <M className={className}>{children}</M>;
  return (
    <M className={className} variants={reveal} custom={index} initial="hidden" whileInView="visible" viewport={viewportOnce}>
      {children}
    </M>
  );
}
