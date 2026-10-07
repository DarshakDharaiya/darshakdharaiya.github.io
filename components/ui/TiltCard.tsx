"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { spring } from "@/lib/animation";
import { useFinePointer } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Card with pointer-driven 3D tilt and a soft specular highlight that follows the pointer —
 * the "glass catching light" effect. Inert on touch and reduced motion.
 */
export function TiltCard({
  children,
  className,
  max = 6,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;
  const rx = useSpring(useMotionValue(0), spring.soft);
  const ry = useSpring(useMotionValue(0), spring.soft);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareBg = useMotionTemplate`radial-gradient(600px circle at ${gx}% ${gy}%, var(--glass-highlight), transparent 45%)`;

  return (
    <motion.div
      ref={ref}
      className={cn("relative [transform-style:preserve-3d]", className)}
      style={enabled ? { rotateX: rx, rotateY: ry, transformPerspective: 1200 } : undefined}
      onPointerMove={(e) => {
        if (!enabled || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * max * 2);
        rx.set(-(py - 0.5) * max * 2);
        gx.set(px * 100);
        gy.set(py * 100);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
      {enabled && glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glareBg }}
        />
      )}
    </motion.div>
  );
}
