"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneStore } from "@/lib/three/store";
import { physics } from "@/lib/animation";
import { CAMERA } from "@/lib/three/camera";

/**
 * Scroll = flight. The camera travels forward through the particle volume as the page scrolls,
 * with a spring-lagged pointer parallax and a subtle FOV breath that changes perspective between sections.
 */
const UNITS_PER_VIEWPORT = 2.6;

export function CameraController() {
  const ref = useRef({ z: { x: CAMERA.z, v: 0 }, px: { x: 0, v: 0 }, py: { x: 0, v: 0 } });

  useFrame(({ camera, size }, rawDt) => {
    const state = ref.current;
    const dt = Math.min(rawDt, 1 / 30);
    const cam = camera as THREE.PerspectiveCamera;
    const reduced = sceneStore.reducedMotion;
    const viewports = sceneStore.scroll.y / Math.max(1, size.height);
    const travel = reduced ? 0.6 : UNITS_PER_VIEWPORT;
    const targetZ = CAMERA.z - viewports * travel;

    const { stiffness: k, damping: c } = physics.camera;
    state.z.v += (k * (targetZ - state.z.x) - c * state.z.v) * dt;
    state.z.x += state.z.v * dt;

    const p = sceneStore.pointer;
    const amp = reduced ? 0 : 0.35;
    state.px.v += (k * ((p.active ? p.x : 0) * amp - state.px.x) - c * state.px.v) * dt;
    state.px.x += state.px.v * dt;
    state.py.v += (k * ((p.active ? p.y : 0) * amp * 0.6 - state.py.x) - c * state.py.v) * dt;
    state.py.x += state.py.v * dt;

    cam.position.set(state.px.x, state.py.x, state.z.x);
    cam.lookAt(state.px.x * 0.3, state.py.x * 0.3, state.z.x - 10);

    // Perspective breath: slightly wider through the middle of the page
    const s = sceneStore.scroll.progress;
    const fov = CAMERA.fov + (reduced ? 0 : Math.sin(s * Math.PI) * 6);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
