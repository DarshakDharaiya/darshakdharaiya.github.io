/**
 * Motion system — one place for every easing, duration and spring.
 * CSS mirrors (globals.css @theme): --ease-out-expo, --ease-out-quart, --ease-in-out-quart, --ease-spring
 */
import type { Transition, Variants } from "motion/react";

export const ease = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
  spring: [0.34, 1.36, 0.64, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/** GSAP string equivalents */
export const gsapEase = {
  outExpo: "expo.out",
  outQuart: "quart.out",
  inOutQuart: "quart.inOut",
} as const;

export const duration = {
  instant: 0.12,
  fast: 0.24,
  base: 0.48,
  slow: 0.9,
  cinematic: 1.4,
} as const;

/** Spring presets — tuned to feel like iOS UIKit springs */
export const spring = {
  /** Snappy UI: toggles, nav pill */
  snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.8 },
  /** Default interactive: buttons, cards */
  soft: { type: "spring", stiffness: 260, damping: 26, mass: 1 },
  /** Large surfaces: panels, menus */
  gentle: { type: "spring", stiffness: 170, damping: 24, mass: 1.1 },
  /** Cursor follower */
  cursor: { type: "spring", stiffness: 600, damping: 42, mass: 0.35 },
  /** Magnetic pull */
  magnetic: { type: "spring", stiffness: 180, damping: 16, mass: 0.6 },
} as const satisfies Record<string, Transition>;

/** Physical spring constants for per-frame integration (Three.js objects) */
export const physics = {
  dObject: { stiffness: 38, damping: 9 },
  camera: { stiffness: 22, damping: 8 },
} as const;

export const reveal: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.slow, ease: ease.outExpo, delay: i * 0.08 },
  }),
};

export const stagger = (each = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: each, delayChildren } },
});

export const viewportOnce = { once: true, margin: "0px 0px -12% 0px" } as const;
