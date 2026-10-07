"use client";

import { useEffect } from "react";
import { sceneStore } from "@/lib/three/store";

/**
 * Global pointer + device-tilt tracker.
 * Writes into the non-reactive sceneStore (consumed by WebGL every frame) — never causes re-renders.
 * Mount once at the app root.
 */
export function useMousePosition() {
  useEffect(() => {
    let lastT = performance.now();
    let lastX = 0;
    let lastY = 0;

    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      const now = performance.now();
      const dt = Math.max(1, now - lastT) / 1000;
      const v = sceneStore.pointerVelocity;
      v.x = v.x * 0.8 + ((x - lastX) / dt) * 0.2;
      v.y = v.y * 0.8 + ((y - lastY) / dt) * 0.2;
      lastX = x;
      lastY = y;
      lastT = now;
      sceneStore.pointer.x = x;
      sceneStore.pointer.y = y;
      sceneStore.pointer.active = e.pointerType === "mouse" || e.pointerType === "pen";
    };
    const onLeave = () => {
      sceneStore.pointer.active = false;
    };

    // Device tilt (Android & desktop sensors). iOS requires a permission prompt — we don't force one.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      sceneStore.tilt.x = Math.max(-1, Math.min(1, e.gamma / 30));
      sceneStore.tilt.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      sceneStore.tilt.active = true;
    };
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    if (coarse) window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);
}
