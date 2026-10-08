"use client";

import { useEffect, useState } from "react";
import type { MaterialTier } from "@/lib/three/materials";

export type PerformanceProfile = {
  tier: MaterialTier;
  particleCount: number;
  constellationCount: number;
  /** Stars in the spiral galaxy (one draw call, so this can stay generous) */
  galaxyStars: number;
  maxDpr: number;
  isMobile: boolean;
};

const PROFILES: Record<MaterialTier, Omit<PerformanceProfile, "isMobile">> = {
  high: { tier: "high", particleCount: 7000, constellationCount: 260, galaxyStars: 11000, maxDpr: 1.75 },
  medium: { tier: "medium", particleCount: 4200, constellationCount: 180, galaxyStars: 6000, maxDpr: 1.5 },
  low: { tier: "low", particleCount: 1800, constellationCount: 90, galaxyStars: 2600, maxDpr: 1.25 },
};

/**
 * Coarse, synchronous device classification used to size the WebGL scene before first frame.
 * Runtime FPS monitoring (drei PerformanceMonitor) refines DPR afterwards.
 */
export function detectPerformance(): PerformanceProfile {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  const saveData = nav.connection?.saveData ?? false;

  let tier: MaterialTier = "high";
  if (saveData || cores <= 4 || memory <= 2) tier = "low";
  else if (isMobile || cores <= 6 || memory <= 4) tier = "medium";

  // Phones always get at most "medium" density regardless of SoC
  const profile = { ...PROFILES[tier], isMobile };
  if (isMobile) {
    profile.particleCount = Math.min(profile.particleCount, 2200);
    profile.constellationCount = Math.min(profile.constellationCount, 110);
    profile.galaxyStars = Math.min(profile.galaxyStars, 4000);
    profile.maxDpr = Math.min(profile.maxDpr, 1.5);
  }
  return profile;
}

export function useDevicePerformance() {
  const [profile, setProfile] = useState<PerformanceProfile | null>(null);
  useEffect(() => {
    // Client-only detection; must run after mount to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(detectPerformance());
  }, []);
  return profile;
}
