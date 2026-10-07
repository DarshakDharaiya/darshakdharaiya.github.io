import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Frame-rate independent damping (exponential decay toward target) */
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));
export const mapRange = (v: number, inMin: number, inMax: number, outMin = 0, outMax = 1) =>
  outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** "1M+" → 1_000_000 */
export function parseInstalls(s: string): number {
  const m = s.match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] ?? "").toUpperCase() as "K" | "M" | "B"] ?? 1;
  return parseFloat(m[1]) * mult;
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
