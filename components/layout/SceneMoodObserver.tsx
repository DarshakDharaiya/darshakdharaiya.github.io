"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sceneStore, type SceneMood } from "@/lib/three/store";

/**
 * Section-to-section environment changes: any element with `data-mood="contact"` etc.
 * shifts particle energy/density as it becomes the dominant section in view.
 */
export function SceneMoodObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-mood]"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) sceneStore.mood = (e.target as HTMLElement).dataset.mood as SceneMood;
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
