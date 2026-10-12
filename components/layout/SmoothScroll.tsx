"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { sceneStore } from "@/lib/three/store";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Lenis smooth scrolling on its own rAF loop. (It used to ride GSAP's ticker, but
 * nothing uses ScrollTrigger, and GSAP was ~45 KB gzipped of first-load JS.)
 * Disabled entirely for reduced-motion users (native scrolling, no inertia).
 * Also publishes scroll state to the WebGL store.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    sceneStore.reducedMotion = reduced;

    const publish = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      sceneStore.scroll.y = window.scrollY;
      sceneStore.scroll.progress = max > 0 ? window.scrollY / max : 0;
    };

    if (reduced) {
      window.addEventListener("scroll", publish, { passive: true });
      publish();
      return () => window.removeEventListener("scroll", publish);
    }

    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch keeps native momentum — it already feels right on phones
      syncTouch: false,
      autoRaf: true,
    });

    instance.on("scroll", (l: Lenis) => {
      publish();
      sceneStore.scroll.velocity = l.velocity;
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- expose instance to consumers
    setLenis(instance);
    publish();

    return () => {
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
