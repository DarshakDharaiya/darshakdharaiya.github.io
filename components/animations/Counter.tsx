"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "motion/react";
import { ease } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Counts up from 0 when scrolled into view. Writes straight to the DOM node (no re-renders).
 * Server-renders the final value so crawlers and no-JS users see real numbers.
 */
export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 2.2,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduced = useReducedMotion();
  const format = (n: number) => `${prefix}${n.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (!inView) {
      el.textContent = format(0);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: ease.outExpo,
      onUpdate: (v) => (el.textContent = format(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {format(value)}
    </span>
  );
}
