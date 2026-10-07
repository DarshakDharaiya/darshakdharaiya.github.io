"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { linesFragment, linesVertex, pointsFragment, pointsVertex } from "@/lib/three/shaders";
import { particleTheme } from "@/lib/three/materials";
import { moodConfig, sceneStore } from "@/lib/three/store";
import { damp } from "@/lib/utils";

const DEPTH = 60;
const WIDTH = 26;
const HEIGHT = 16;

/** Deterministic PRNG so the field is identical across reloads (no visual "jump" on HMR) */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildField(count: number, constellations: number) {
  const rand = mulberry32(7);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const sizes = new Float32Array(count);
  const anchors = new Float32Array(count);

  // Constellation points are grouped into small clusters so their links stay short and elegant
  const clusterCount = Math.max(3, Math.round(constellations / 40));
  const clusters = Array.from({ length: clusterCount }, () => [
    (rand() - 0.5) * WIDTH * 1.4,
    (rand() - 0.5) * HEIGHT * 1.2,
    -rand() * (DEPTH - 6),
  ]);

  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number;
    if (i < constellations) {
      const c = clusters[i % clusterCount];
      const r = 3.2 * Math.cbrt(rand());
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      x = c[0] + r * Math.sin(ph) * Math.cos(th) * 1.4;
      y = c[1] + r * Math.sin(ph) * Math.sin(th);
      z = c[2] + r * Math.cos(ph);
    } else {
      // Bias toward the edges of the frame so text in the centre stays calm
      const u = rand() - 0.5;
      x = Math.sign(u) * Math.pow(Math.abs(u) * 2, 0.75) * WIDTH;
      y = (rand() - 0.5) * HEIGHT * 2;
      z = -rand() * DEPTH;
    }
    positions.set([x, y, z], i * 3);
    seeds.set([rand(), rand(), rand(), rand()], i * 4);
    // Mostly fine dust, a few larger "bokeh" motes
    sizes[i] = rand() < 0.04 ? 3.2 + rand() * 2.4 : 0.9 + rand() * 1.4;
    anchors[i] = z;
  }

  // Link each constellation point to its 2 nearest neighbours (within its cluster radius)
  const linePos: number[] = [];
  const lineSeed: number[] = [];
  const lineAnchor: number[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < constellations; i++) {
    const near: { j: number; d: number }[] = [];
    for (let j = 0; j < constellations; j++) {
      if (i === j) continue;
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < 7.5) near.push({ j, d });
    }
    near.sort((a, b) => a.d - b.d);
    for (const { j } of near.slice(0, 2)) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const anchor = (positions[i * 3 + 2] + positions[j * 3 + 2]) / 2;
      for (const k of [i, j]) {
        linePos.push(positions[k * 3], positions[k * 3 + 1], positions[k * 3 + 2]);
        lineSeed.push(seeds[k * 4], seeds[k * 4 + 1], seeds[k * 4 + 2], 0);
        lineAnchor.push(anchor);
      }
    }
  }

  const points = new THREE.BufferGeometry();
  points.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  points.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  points.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  points.setAttribute("aAnchorZ", new THREE.BufferAttribute(anchors, 1));

  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
  lines.setAttribute("aSeed", new THREE.Float32BufferAttribute(lineSeed, 4));
  lines.setAttribute("aAnchorZ", new THREE.Float32BufferAttribute(lineAnchor, 1));

  // Shader moves vertices; disable culling via an oversized bounding sphere
  const sphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  points.boundingSphere = sphere;
  lines.boundingSphere = sphere;
  return { points, lines };
}

export function ParticleField({ count, constellations }: { count: number; constellations: number }) {
  const { points, lines } = useMemo(() => buildField(count, constellations), [count, constellations]);
  const group = useRef<THREE.Group>(null);

  const uniforms = useMemo(() => {
    const t = particleTheme[sceneStore.theme];
    return {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(10, 10) },
      uPointerStrength: { value: 0 },
      uAspect: { value: 1 },
      uCamZ: { value: 0 },
      uDepth: { value: DEPTH },
      uEnergy: { value: moodConfig.hero.energy },
      uSpread: { value: 1 },
      uDensity: { value: 1 },
      uPixelRatio: { value: 1 },
      uColorA: { value: new THREE.Color(t.a) },
      uColorB: { value: new THREE.Color(t.b) },
      uOpacity: { value: t.opacity },
    };
  }, []);
  const lineUniforms = useMemo(
    () => ({ ...uniforms, uOpacity: { value: particleTheme[sceneStore.theme].lineOpacity } }),
    [uniforms],
  );

  const pointsMat = useRef<THREE.ShaderMaterial>(null);
  const linesMat = useRef<THREE.ShaderMaterial>(null);
  const targetA = useMemo(() => new THREE.Color(), []);
  const targetB = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const pm = pointsMat.current;
    const lm = linesMat.current;
    if (!pm || !lm) return;
    // Mutate through the material refs (shared uniform objects), never the memoised value
    const u = pm.uniforms as typeof uniforms;
    const { gl, size } = state;
    const reduced = sceneStore.reducedMotion;
    const mood = moodConfig[sceneStore.mood];
    const theme = particleTheme[sceneStore.theme];

    u.uTime.value += dt * (reduced ? 0.25 : 1);
    u.uAspect.value = size.width / size.height;
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uCamZ.value = state.camera.position.z;

    // Pointer: ease the strength in/out so particles never "snap"
    const p = sceneStore.pointer;
    u.uPointer.value.set(p.x, p.y);
    u.uPointerStrength.value = damp(u.uPointerStrength.value, p.active && !reduced ? 1 : 0, 3, dt);

    // Section mood: energy, density and spread drift toward the current section's character
    u.uEnergy.value = damp(u.uEnergy.value, reduced ? 0.15 : mood.energy, 1.2, dt);
    u.uDensity.value = damp(u.uDensity.value, mood.density, 1.5, dt);
    u.uSpread.value = damp(u.uSpread.value, mood.spread, 1.2, dt);

    // Theme: crossfade colours rather than snapping
    targetA.set(theme.a);
    targetB.set(theme.b);
    u.uColorA.value.lerp(targetA, 1 - Math.exp(-4 * dt));
    u.uColorB.value.lerp(targetB, 1 - Math.exp(-4 * dt));
    u.uOpacity.value = damp(u.uOpacity.value, theme.opacity, 4, dt);
    lm.uniforms.uOpacity.value = damp(lm.uniforms.uOpacity.value, theme.lineOpacity, 4, dt);

    const blending = theme.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;
    for (const m of [pm, lm]) {
      if (m.blending !== blending) {
        m.blending = blending;
        m.needsUpdate = true;
      }
    }

    // Slow scroll-linked rotation gives the sense of moving through a volume, not past a wallpaper
    if (group.current) {
      const s = sceneStore.scroll.progress;
      group.current.rotation.z = damp(group.current.rotation.z, reduced ? 0 : s * 0.35, 2, dt);
      group.current.rotation.y = damp(group.current.rotation.y, reduced ? 0 : (s - 0.5) * 0.08, 2, dt);
    }
  });

  return (
    <group ref={group}>
      <points geometry={points} frustumCulled={false}>
        <shaderMaterial
          ref={pointsMat}
          vertexShader={pointsVertex}
          fragmentShader={pointsFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments geometry={lines} frustumCulled={false}>
        <shaderMaterial
          ref={linesMat}
          vertexShader={linesVertex}
          fragmentShader={linesFragment}
          uniforms={lineUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
