"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { spring } from "@/lib/animation";
import { useFinePointer } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Pulls its child gently toward the pointer while hovered, then springs home.
 * `strength` is the fraction of pointer offset applied (0.2–0.45 feels physical).
 */
export function Magnetic({
  children,
  strength = 0.3,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), spring.magnetic);
  const y = useSpring(useMotionValue(0), spring.magnetic);
  const enabled = fine && !reduced;

  return (
    <motion.div
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (!enabled || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
