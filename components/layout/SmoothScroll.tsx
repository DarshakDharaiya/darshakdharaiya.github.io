"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sceneStore } from "@/lib/three/store";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis share one clock.
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
    });

    instance.on("scroll", (l: Lenis) => {
      ScrollTrigger.update();
      publish();
      sceneStore.scroll.velocity = l.velocity;
    });

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- expose instance to consumers
    setLenis(instance);
    publish();

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
