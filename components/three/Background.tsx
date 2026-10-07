"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { cn } from "@/lib/utils";

// three + r3f + drei stay out of the initial JS bundle entirely
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/**
 * Fixed, full-viewport WebGL layer behind all content.
 * Mounts after the browser is idle so text paints first (LCP), then fades in.
 */
export function Background() {
  const profile = useDevicePerformance();
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setMount(true), { timeout: 1200 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setMount(true), 300);
    return () => clearTimeout(t);
  }, [profile]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-0 transition-opacity duration-[1600ms] ease-out-expo",
        ready ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Ambient accent light pooled at the frame edges — depth without decoration */}
      <div className="ambient-glow absolute -top-[20vmax] -left-[18vmax] size-[55vmax] rounded-full" />
      <div className="ambient-glow absolute top-[30%] -right-[24vmax] size-[50vmax] rounded-full [animation-delay:-9s]" />
      {mount && profile && <Scene profile={profile} onReady={() => setReady(true)} />}
      {/* Soft vignette keeps edges calm and text legible over the field */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--bg)_100%)] opacity-70" />
    </div>
  );
}
