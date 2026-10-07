"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { usePathname } from "next/navigation";
import { ParticleField } from "./ParticleField";
import { CAMERA } from "@/lib/three/camera";
import { Lights } from "./Lights";
import { CameraController } from "./CameraController";
import { MouseController } from "./MouseController";
import { sceneStore } from "@/lib/three/store";
import type { PerformanceProfile } from "@/hooks/useDevicePerformance";

/** One persistent WebGL environment shared by every route (it survives navigation). */
export default function Scene({ profile, onReady }: { profile: PerformanceProfile; onReady?: () => void }) {
  const pathname = usePathname();
  const [dpr, setDpr] = useState(Math.min(profile.maxDpr, typeof window !== "undefined" ? window.devicePixelRatio : 1));

  useEffect(() => {
    const home = pathname === "/";
    // The interactive face now has its own canvas inside the hero.
    sceneStore.showAvatar = false;
    if (!home) sceneStore.mood = "detail";
  }, [pathname]);

  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA.z], fov: CAMERA.fov, near: 0.1, far: 120 }}
      dpr={dpr}
      gl={{
        antialias: profile.tier !== "low",
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady?.();
      }}
      style={{ pointerEvents: "none" }}
    >
      <PerformanceMonitor
        bounds={() => [45, 58]}
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(profile.maxDpr, d + 0.25))}
        flipflops={4}
      >
        <AdaptiveDpr pixelated={false} />
        <MouseController />
        <CameraController />
        <Lights />
        <ParticleField count={profile.particleCount} constellations={profile.constellationCount} />
      </PerformanceMonitor>
    </Canvas>
  );
}
