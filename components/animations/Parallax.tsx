"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Moves its child at a different rate than the page. `speed` in px over the element's viewport transit. */
export function Parallax({ children, speed = 80, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  return (
    <motion.div ref={ref} className={className} style={reduced ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
