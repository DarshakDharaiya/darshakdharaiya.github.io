import { projects } from "./projects";
import { parseInstalls } from "@/lib/utils";

/** Derived from project data — update projects.ts and these follow. */
const rated = projects.filter((p) => p.store.rating);
const totalInstalls = projects.reduce((n, p) => n + parseInstalls(p.store.installs), 0);
const millionPlus = projects.filter((p) => parseInstalls(p.store.installs) >= 1e6).length;
const installsM = Math.floor(totalInstalls / 1e5) / 10;
const avgRating = rated.reduce((n, p) => n + (p.store.rating ?? 0), 0) / rated.length;

export const achievements = [
  { value: installsM, decimals: Number.isInteger(installsM) ? 0 : 1, suffix: "M+", label: "Installs across live apps" },
  { value: millionPlus, decimals: 0, suffix: "", label: "Apps past one million installs" },
  { value: Math.max(...rated.map((p) => p.store.rating ?? 0)), decimals: 1, suffix: "★", label: "Highest store rating" },
  { value: avgRating, decimals: 1, suffix: "★", label: "Average rating across apps" },
];

/**
 * The three facts worth showing before anyone scrolls. Same derivation as
 * `achievements` above, formatted as strings because the hero does not animate them —
 * a counter that ticks up competes with the headline reveal rather than supporting it.
 */
export const heroProof = [
  { value: `${installsM}M+`, label: "installs on Google Play" },
  { value: `${millionPlus}`, label: "apps past one million" },
  { value: `${Math.max(...rated.map((p) => p.store.rating ?? 0)).toFixed(1)}★`, label: "top store rating" },
];
