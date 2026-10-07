"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Scroll progress 0..1 — of the whole document, or of an element travelling through the viewport.
 * Updates are rAF-throttled. For per-frame needs (WebGL) read sceneStore.scroll instead.
 */
export function useScrollProgress(target?: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const el = target?.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const total = r.height + window.innerHeight;
        setProgress(Math.min(1, Math.max(0, (window.innerHeight - r.top) / total)));
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [target]);

  return progress;
}
