"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  coreGlowFragment,
  coreGlowVertex,
  galaxyFragment,
  galaxyVertex,
} from "@/lib/three/galaxyShaders";
import { galaxyConfig as G, galaxyTheme } from "@/lib/three/galaxy";
import { sceneStore } from "@/lib/three/store";
import { clamp, damp } from "@/lib/utils";
import type { PerformanceProfile } from "@/hooks/useDevicePerformance";

/** Deterministic PRNG — the same galaxy every reload, no jump on HMR. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A barred spiral built from one points cloud.
 *
 * Stars are laid on logarithmic arms and scattered outward by a cubed random, which
 * is what gives the arms soft edges and dark lanes between them. A tenth of them go
 * into a spherical halo so the galaxy has a bulge rather than a flat cut-out.
 * The arms are wound by the vertex shader, not on the CPU: nothing is uploaded per frame.
 */
function buildGalaxy(count: number) {
  const rand = mulberry32(31);
  const positions = new Float32Array(count * 3);
  const radii = new Float32Array(count);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const shades = new Float32Array(count);
  const hots = new Float32Array(count);

  const haloCount = Math.round(count * G.haloFraction);

  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number, norm: number;

    if (i < haloCount) {
      // Spherical bulge + sparse halo, denser toward the centre.
      const r = Math.pow(rand(), 2.4) * G.radius * 0.6;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      x = r * Math.sin(ph) * Math.cos(th);
      y = r * Math.cos(ph) * 0.75;
      z = r * Math.sin(ph) * Math.sin(th);
      norm = r / G.radius;
    } else {
      const t = Math.pow(rand(), 0.78);
      const radius = t * G.radius;
      const armAngle = ((i % G.arms) / G.arms) * Math.PI * 2;
      const spinAngle = radius * G.spin;
      // Cubed scatter: tight on the arm, with a long tail into the lanes.
      const spread = () =>
        Math.pow(rand(), 2.6) * (rand() < 0.5 ? 1 : -1) * G.scatter * (0.5 + radius * 0.28);
      const angle = armAngle + spinAngle + spread() * 0.6;
      x = Math.cos(angle) * radius + spread();
      z = Math.sin(angle) * radius + spread();
      // The disc flares thin as it goes out.
      y = spread() * G.thickness * (1 - t * 0.7) * 0.5;
      norm = t;
    }

    positions.set([x, y, z], i * 3);
    radii[i] = norm;
    seeds[i] = rand();

    // The core → mid → rim ramp now lives in the vertex shader, driven by aRadius.
    // Only the per-star variation is baked: brightness jitter, and the rare giants.
    hots[i] = i >= haloCount && rand() < 0.035 ? 1 : 0;
    shades[i] = 0.72 + rand() * 0.5;

    // A few bright anchors stop the field from reading as uniform noise.
    sizes[i] = rand() < 0.012 ? 1.9 + rand() * 1.5 : 0.5 + rand() * 0.85;
    if (norm < 0.18) sizes[i] *= 1.35;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aShade", new THREE.BufferAttribute(shades, 1));
  geometry.setAttribute("aHot", new THREE.BufferAttribute(hots, 1));
  geometry.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  // The shader rotates vertices, so cull against a sphere big enough for all of them.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), G.radius * 2);
  return geometry;
}

export function Galaxy({ profile }: { profile: PerformanceProfile }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const glow = useRef<THREE.ShaderMaterial>(null);
  const bulge = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => buildGalaxy(profile.galaxyStars), [profile.galaxyStars]);
  /** Scratch colour for the per-frame palette crossfade; never allocate in useFrame. */
  const target = useMemo(() => new THREE.Color(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Start from the theme that is already applied, not from dark. Otherwise a light-mode
  // visitor watches the galaxy crossfade out of the dark palette on first paint.
  const initial = galaxyTheme[sceneStore.theme];

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uSpinRate: { value: G.spinRate },
      uScale: { value: G.scale },
      uOpacity: { value: initial.opacity },
      uReduced: { value: 0 },
      uCore: { value: new THREE.Color(initial.core) },
      uMid: { value: new THREE.Color(initial.mid) },
      uOuter: { value: new THREE.Color(initial.outer) },
      uHot: { value: new THREE.Color(initial.hot) },
    }),
    // Read once at mount on purpose; useFrame owns every later change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const glowUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(initial.glow) },
      uPower: { value: 1.6 },
      uOpacity: { value: initial.glowOpacity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, rawDt) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const dt = Math.min(rawDt, 1 / 30);
    const reduced = sceneStore.reducedMotion;

    m.uniforms.uTime.value += dt * (reduced ? 0.2 : 1);
    m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    m.uniforms.uReduced.value = reduced ? 1 : 0;

    // Keep the galaxy ahead of the flight, drifting a little closer down the page so
    // the page ends nearer to it than it started.
    const s = sceneStore.scroll.progress;
    // Held in the upper-left quadrant, clear of every heading. Wide viewports can
    // carry it further out; portrait ones would lose it off the edge.
    const k = clamp(state.size.width / state.size.height / 1.6, 0.34, 1);
    // A portrait frame is no narrower vertically but far narrower across, so the disc
    // is shrunk to fit it. Shrinking in the shader leaves the stars their size on
    // screen, which is what keeps the arms legible instead of collapsing to a blob.
    const fit = G.scale * (0.6 + 0.4 * k);
    m.uniforms.uScale.value = damp(m.uniforms.uScale.value, fit, 2, dt);
    if (bulge.current) bulge.current.scale.setScalar(G.radius * m.uniforms.uScale.value * 0.26);
    g.position.z = damp(g.position.z, state.camera.position.z - G.distance + s * 14, 4, dt);
    g.position.x = damp(g.position.x, state.camera.position.x * 0.45 - 4 - 12 * k, 1.2, dt);
    g.position.y = damp(g.position.y, state.camera.position.y * 0.45 + 5 + 11 * k - s * 5, 1.2, dt);
    g.rotation.z = damp(g.rotation.z, G.roll + (reduced ? 0 : s * 0.2), 1.5, dt);

    // Theme: crossfade the palette rather than snapping it, and swap compositing.
    // Additive cannot darken, so on a light page it would leave the galaxy invisible —
    // light mode draws dark stars with normal blending instead.
    const t = galaxyTheme[sceneStore.theme];
    const lerp = 1 - Math.exp(-4 * dt);
    target.set(t.core);
    m.uniforms.uCore.value.lerp(target, lerp);
    target.set(t.mid);
    m.uniforms.uMid.value.lerp(target, lerp);
    target.set(t.outer);
    m.uniforms.uOuter.value.lerp(target, lerp);
    target.set(t.hot);
    m.uniforms.uHot.value.lerp(target, lerp);

    // Recedes slightly down the page so the content takes over.
    m.uniforms.uOpacity.value = damp(m.uniforms.uOpacity.value, t.opacity - s * 0.2, 3, dt);

    const blending = t.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (m.blending !== blending) {
      m.blending = blending;
      m.needsUpdate = true;
    }

    if (glow.current) {
      const gm = glow.current;
      target.set(t.glow);
      gm.uniforms.uColor.value.lerp(target, lerp);
      gm.uniforms.uOpacity.value = damp(gm.uniforms.uOpacity.value, t.glowOpacity, 3, dt);
      if (gm.blending !== blending) {
        gm.blending = blending;
        gm.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={group} rotation={[G.tilt, 0.4, G.roll]}>
      <points geometry={geometry} frustumCulled={false} renderOrder={-3}>
        <shaderMaterial
          ref={mat}
          vertexShader={galaxyVertex}
          fragmentShader={galaxyFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={initial.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </points>

      {/* Galactic bulge: one additive sphere, brightest where it faces the camera. */}
      <mesh ref={bulge} scale={G.radius * G.scale * 0.26} renderOrder={-4}>
        <sphereGeometry args={[1, 24, 16]} />
        <shaderMaterial
          ref={glow}
          vertexShader={coreGlowVertex}
          fragmentShader={coreGlowFragment}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={initial.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}
