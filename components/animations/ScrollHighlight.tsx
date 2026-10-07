"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Apple-style "read along": words brighten in sequence, scrubbed to scroll position.
 * Wrap words in *asterisks* to render them in the serif accent face.
 */
export function ScrollHighlight({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("flex flex-wrap", className)}>
      {words.map((raw, i) => {
        const accent = raw.startsWith("*");
        const word = raw.replace(/\*/g, "");
        return (
          <Word
            key={i}
            progress={scrollYProgress}
            range={[i / words.length, (i + 1) / words.length]}
            reduced={reduced}
            className={accent ? "font-serif font-normal italic tracking-[-0.02em]" : undefined}
          >
            {word}
          </Word>
        );
      })}
    </span>
  );
}

function Word({
  children,
  progress,
  range,
  reduced,
  className,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  reduced: boolean;
  className?: string;
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <span className={cn("relative mr-[0.25em]", className)}>
      <motion.span style={reduced ? undefined : { opacity }}>{children}</motion.span>
    </span>
  );
}
