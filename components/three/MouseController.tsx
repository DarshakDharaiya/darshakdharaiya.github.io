"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useMousePosition } from "@/hooks/useMousePosition";

/**
 * Input + lifecycle bridge for the canvas:
 * - feeds pointer / device tilt into the scene store
 * - pauses rendering entirely while the tab is hidden (zero GPU work in background tabs)
 */
export function MouseController() {
  useMousePosition();
  const setFrameloop = useThree((s) => s.setFrameloop);

  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setFrameloop]);

  return null;
}
