"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createAvatarGeometries } from "@/lib/three/avatarGeometry";
import type { MaterialTier } from "@/lib/three/materials";
import { CAMERA } from "@/lib/three/camera";
import { sceneStore } from "@/lib/three/store";
import { physics } from "@/lib/animation";
import { avatar } from "@/data/avatar";
import { clamp, damp } from "@/lib/utils";

type Spring = { x: number; v: number };
/** Semi-implicit Euler spring step */
function step(s: Spring, target: number, k: number, c: number, dt: number) {
  s.v += (k * (target - s.x) - c * s.v) * dt;
  s.x += s.v * dt;
}

const NECK_Y = -0.9; // head pivots at the neck, like a real head
const INNER_SCALE = 0.72;

/**
 * Memoji-style 3D avatar.
 * - Head turns toward the cursor / device tilt (spring + inertia); the body follows at a fraction.
 * - Eyes track the cursor independently and blink at natural, irregular intervals.
 * - Hovering makes it smile and raise its brows; mouse-drag spins it, then it springs back to face you.
 * - Scroll: lifts and drifts out of frame as the camera flies forward.
 */
export function Avatar({ tier }: { tier: MaterialTier }) {
  const geo = useMemo(() => createAvatarGeometries(tier), [tier]);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);
  const irisMap = useMemo(() => createIrisTexture(avatar.irisInner, avatar.irisMid, avatar.irisOuter), []);
  useEffect(() => () => irisMap.dispose(), [irisMap]);

  const root = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const browL = useRef<THREE.Mesh>(null);
  const browR = useRef<THREE.Mesh>(null);
  const smileClosed = useRef<THREE.Mesh>(null);
  const smileOpen = useRef<THREE.Group>(null);

  const s = useRef({
    rx: { x: 0, v: 0 },
    ry: { x: 0, v: 0 },
    spinY: { x: 0, v: 0 },
    spinX: { x: 0, v: 0 },
    scale: { x: 0.001, v: 0 },
    smile: { x: 0, v: 0 },
    brow: { x: 0, v: 0 },
    nextBlink: 2.5,
    blinkStart: -1,
    dragging: false,
  });

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const localRay = useMemo(() => new THREE.Ray(), []);
  const inv = useMemo(() => new THREE.Matrix4(), []);
  const hitBox = useMemo(() => new THREE.Box3(new THREE.Vector3(-1.1, -1.3, -1.1), new THREE.Vector3(1.1, 1.75, 1.25)), []);

  // Drag-to-spin (mouse only — touch must keep scrolling)
  useEffect(() => {
    const st = s.current;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !sceneStore.avatarHovered) return;
      if ((e.target as Element)?.closest?.("a, button, input, textarea, [data-cursor]")) return;
      st.dragging = true;
    };
    const onMove = (e: PointerEvent) => {
      if (!st.dragging) return;
      st.spinY.v += e.movementX * 0.08;
      st.spinX.v += e.movementY * 0.04;
    };
    const onUp = () => (st.dragging = false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  useFrame(({ camera, size, clock }, rawDt) => {
    const g = root.current;
    const h = head.current;
    const inn = inner.current;
    if (!g || !h || !inn) return;
    const st = s.current;
    const dt = Math.min(rawDt, 1 / 30);
    const t = clock.elapsedTime;
    const reduced = sceneStore.reducedMotion;

    // Hero-local scroll progress
    const hp = clamp(sceneStore.scroll.y / Math.max(1, size.height));
    const show = sceneStore.showAvatar && hp < 1.1;
    g.visible = show || st.scale.x > 0.01;

    // ── Layout: beside the headline on landscape, above it on portrait
    const aspect = size.width / size.height;
    const visH = 2 * CAMERA.z * Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));
    const visW = visH * aspect;
    const portrait = aspect < 0.95;
    const baseX = portrait ? 0 : visW * 0.26;
    const baseY = portrait ? visH * 0.21 : -0.1;
    const baseScale = portrait ? Math.min(0.64, visW / 5.2) : clamp(visW / 10.5, 0.7, 1.15);

    // ── Look target: cursor, or device tilt on phones
    const p = sceneStore.pointer;
    const tilt = sceneStore.tilt;
    const ix = tilt.active ? tilt.x : p.active ? p.x : Math.sin(t * 0.35) * 0.25;
    const iy = tilt.active ? tilt.y : p.active ? p.y : Math.sin(t * 0.27) * 0.12;
    const amp = reduced ? 0.2 : 1;

    const { stiffness: k, damping: c } = physics.dObject;
    // The avatar sits right of centre, so offset the gaze so "looking at" the cursor reads correctly
    const relX = portrait ? ix : ix - 0.45;
    step(st.ry, relX * 0.55 * amp, k, c, dt);
    step(st.rx, -iy * 0.32 * amp, k, c, dt);
    step(st.spinY, 0, st.dragging ? 0 : 5, st.dragging ? 1.5 : 2.6, dt);
    step(st.spinX, 0, st.dragging ? 0 : 8, st.dragging ? 1.5 : 3.4, dt);

    // ── Hover (ray vs. local box)
    let hovered = false;
    if (show && p.active && hp < 0.6) {
      ndc.set(p.x, p.y);
      raycaster.setFromCamera(ndc, camera);
      inv.copy(inn.matrixWorld).invert();
      localRay.copy(raycaster.ray).applyMatrix4(inv);
      hovered = localRay.intersectsBox(hitBox);
    }
    if (hovered !== sceneStore.avatarHovered) sceneStore.avatarHovered = hovered;
    const happy = hovered || st.dragging;

    step(st.smile, happy ? 1 : 0, 180, 18, dt);
    step(st.brow, happy ? 1 : 0, 220, 16, dt);
    const targetScale = show ? baseScale * (happy ? 1.04 : 1) * (1 - hp * 0.4) : 0;
    step(st.scale, targetScale, 90, 14, dt);

    // ── Transform: body follows a fraction of the head turn
    const bob = reduced ? 0 : Math.sin(t * 0.9) * 0.05;
    const exitX = portrait ? 0 : visW * 0.28;
    g.position.set(
      damp(g.position.x, baseX + hp * exitX, 4, dt),
      damp(g.position.y, baseY + bob + hp * (portrait ? 3.2 : 1.8), 4, dt),
      damp(g.position.z, reduced ? 0 : hp * 1.2, 4, dt),
    );
    g.scale.setScalar(Math.max(0.0001, st.scale.x));
    g.rotation.set(st.rx.x * 0.25, st.ry.x * 0.35 + st.spinY.x + (reduced ? 0 : hp * 0.8), 0);
    h.rotation.set(
      st.rx.x * 0.75 + st.spinX.x,
      st.ry.x * 0.65,
      reduced ? 0 : Math.sin(t * 0.6) * 0.04 - st.ry.x * 0.08,
    );

    // ── Eyes: track the cursor slightly ahead of the head, blink irregularly
    const lookY = clamp(relX * 0.55, -0.45, 0.45);
    const lookX = clamp(-iy * 0.4, -0.35, 0.35);
    if (t > st.nextBlink && st.blinkStart < 0) st.blinkStart = t;
    let lid = 1;
    if (st.blinkStart >= 0) {
      const ph = (t - st.blinkStart) / 0.16;
      if (ph >= 1) {
        st.blinkStart = -1;
        // Occasional double-blink feels alive
        st.nextBlink = t + (Math.random() < 0.2 ? 0.25 : 2.5 + Math.random() * 3.5);
      } else lid = 1 - 0.92 * Math.sin(ph * Math.PI);
    }
    // Happy eyes squint a little
    const squint = 1 - st.smile.x * 0.18;
    for (const e of [eyeL.current, eyeR.current]) {
      if (!e) continue;
      e.rotation.y = damp(e.rotation.y, lookY, 10, dt);
      e.rotation.x = damp(e.rotation.x, lookX, 10, dt);
      e.scale.y = lid * squint;
    }

    // ── Expression
    const browLift = st.brow.x * 0.05;
    if (browL.current) browL.current.position.y = 0.31 + browLift;
    if (browR.current) browR.current.position.y = 0.31 + browLift * 1.4;
    if (smileClosed.current) smileClosed.current.scale.setScalar(Math.max(0.0001, 1 - st.smile.x));
    if (smileOpen.current) smileOpen.current.scale.set(Math.max(0.0001, 0.85 + st.smile.x * 0.15), Math.max(0.0001, st.smile.x), 1);
  });

  return (
    <group ref={root}>
      <group ref={inner} scale={INNER_SCALE} position={[0, 0.42, 0]}>
        {/* Bust — tan chore jacket over a white tee */}
        <mesh geometry={geo.jacket}>
          <meshPhysicalMaterial color={avatar.jacket} roughness={0.88} sheen={0.7} sheenColor="#e2b98a" sheenRoughness={0.6} />
        </mesh>
        <mesh geometry={geo.tee}>
          <meshPhysicalMaterial color={avatar.tee} roughness={0.9} sheen={0.4} sheenColor="#ffffff" />
        </mesh>
        <mesh geometry={geo.patch}>
          <meshStandardMaterial color="#e8a73c" roughness={0.6} />
        </mesh>
        <mesh geometry={geo.zipper}>
          <meshStandardMaterial color={avatar.gold} metalness={1} roughness={0.3} />
        </mesh>
        <mesh geometry={geo.neck}>
          <SkinMaterial color={avatar.skin} />
        </mesh>

        {/* Head pivots at the neck */}
        <group position={[0, NECK_Y, 0]}>
          <group ref={head}>
            <group position={[0, -NECK_Y, 0]}>
              <mesh geometry={geo.head}>
                <SkinMaterial color={avatar.skin} />
              </mesh>
              <mesh geometry={geo.ears}>
                <SkinMaterial color={avatar.skinShade} />
              </mesh>
              <mesh geometry={geo.earring}>
                <meshStandardMaterial color={avatar.gold} metalness={1} roughness={0.22} />
              </mesh>
              <mesh geometry={geo.nose}>
                <SkinMaterial color={avatar.skin} />
              </mesh>
              <mesh geometry={geo.hair}>
                <meshPhysicalMaterial
                  color={avatar.hair}
                  roughness={0.55}
                  sheen={1}
                  sheenColor={avatar.hairHighlight}
                  sheenRoughness={0.4}
                  clearcoat={0.25}
                  clearcoatRoughness={0.45}
                  side={THREE.DoubleSide}
                  onBeforeCompile={hairStrands}
                  customProgramCacheKey={() => "avatar-hair"}
                />
              </mesh>
              {avatar.beard && (
                <mesh geometry={geo.beard}>
                  <meshPhysicalMaterial
                    color={avatar.beardColor}
                    roughness={0.8}
                    sheen={0.8}
                    sheenColor={avatar.hairHighlight}
                    sheenRoughness={0.6}
                    side={THREE.DoubleSide}
                    onBeforeCompile={beardTexture}
                    customProgramCacheKey={() => "avatar-beard"}
                  />
                </mesh>
              )}

              {/* Brows */}
              <mesh ref={browL} geometry={geo.brow} position={[-0.36, 0.31, 0.86]} rotation={[0.1, -0.24, 0.04]}>
                <meshStandardMaterial color={avatar.eyebrows} roughness={0.8} />
              </mesh>
              <mesh ref={browR} geometry={geo.brow} position={[0.36, 0.31, 0.86]} rotation={[0.1, 0.24, -0.04]}>
                <meshStandardMaterial color={avatar.eyebrows} roughness={0.8} />
              </mesh>

              {/* Eyes */}
              {[
                { ref: eyeL, x: -0.36 },
                { ref: eyeR, x: 0.36 },
              ].map(({ ref, x }) => (
                <group key={x} ref={ref} position={[x, 0.05, 0.78]}>
                  <mesh geometry={geo.eyeWhite}>
                    <meshPhysicalMaterial color="#f6f3ee" roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
                  </mesh>
                  <mesh geometry={geo.iris}>
                    <meshPhysicalMaterial map={irisMap} roughness={0.2} clearcoat={1} clearcoatRoughness={0.04} />
                  </mesh>
                  <mesh geometry={geo.pupil}>
                    <meshStandardMaterial color="#060606" roughness={0.2} />
                  </mesh>
                  <mesh geometry={geo.glint}>
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                  </mesh>
                  <mesh geometry={geo.lid}>
                    <SkinMaterial color={avatar.skin} />
                  </mesh>
                  <mesh geometry={geo.lash}>
                    <meshStandardMaterial color="#1a120c" roughness={0.6} />
                  </mesh>
                </group>
              ))}

              {/* Mouth (sits in the window left open in the beard) */}
              <group position={[0, -0.46, 0.875]} rotation={[0.32, 0, 0]}>
                <mesh ref={smileClosed} geometry={geo.smile}>
                  <meshStandardMaterial color={avatar.lips} roughness={0.55} />
                </mesh>
                <group ref={smileOpen} position={[0, 0.05, 0.01]}>
                  <mesh geometry={geo.mouthOpen}>
                    <meshStandardMaterial color="#47191a" roughness={0.7} side={THREE.DoubleSide} />
                  </mesh>
                  <mesh geometry={geo.teeth}>
                    <meshStandardMaterial color="#fbfaf7" roughness={0.3} side={THREE.DoubleSide} />
                  </mesh>
                </group>
              </group>

              {/* Gold aviators with gradient-tinted lenses */}
              {avatar.glasses && (
                <>
                  <mesh geometry={geo.frame}>
                    <meshPhysicalMaterial color={avatar.gold} metalness={1} roughness={0.2} clearcoat={0.6} />
                  </mesh>
                  <mesh geometry={geo.lenses} renderOrder={2}>
                    <meshPhysicalMaterial
                      vertexColors
                      transparent
                      opacity={0.86}
                      roughness={0.12}
                      metalness={0.1}
                      clearcoat={0.25}
                      clearcoatRoughness={0.2}
                      specularIntensity={0.25}
                      envMapIntensity={0.6}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </>
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Fine, short-hair noise for the beard so it reads as hair, not a painted mask. */
function beardTexture(shader: { vertexShader: string; fragmentShader: string }) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vBeardPos;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBeardPos = position;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vBeardPos;")
    .replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      float n = fract(sin(dot(floor(vBeardPos * 90.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float strand = sin(vBeardPos.y * 140.0 + vBeardPos.x * 30.0) * 0.5 + 0.5;
      diffuseColor.rgb *= mix(0.78, 1.2, n * 0.6 + strand * 0.4);`,
    );
}

/**
 * Combed-strand highlights for the hair, computed from object-space position:
 * bands run front→back and curve slightly with the sweep, so every merged hair piece
 * gets consistent strands regardless of its UVs.
 */
function hairStrands(shader: { vertexShader: string; fragmentShader: string }) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vHairPos;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHairPos = position;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vHairPos;")
    .replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      // Fade strands out on the steep sides so they never cross into a plaid
      float top = smoothstep(0.1, 0.75, vHairPos.y);
      float sweep = vHairPos.x + 0.12 * vHairPos.z + 0.06 * sin(vHairPos.z * 3.0);
      float a = sin(sweep * 11.0) * 0.5 + 0.5;
      float b = sin(sweep * 27.0 + 1.7) * 0.5 + 0.5;
      float strands = smoothstep(0.2, 0.9, mix(a, b, 0.35));
      diffuseColor.rgb *= mix(1.0, mix(0.82, 1.18, strands), top);`,
    );
}

/** Radial iris: warm brown centre → hazel → blue-grey → dark limbal ring. */
function createIrisTexture(inner: string, mid: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  // Canvas top = front pole of the (rotated) iris sphere = centre of the iris
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, inner);
  g.addColorStop(0.16, inner);
  g.addColorStop(0.26, mid);
  g.addColorStop(0.38, outer);
  g.addColorStop(0.47, "#262b2e");
  g.addColorStop(1, "#262b2e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft "vinyl" skin: diffuse base, warm sheen for subsurface feel, a whisper of clearcoat. */
function SkinMaterial({ color }: { color: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.5}
      sheen={0.8}
      sheenColor="#ffc3a6"
      sheenRoughness={0.5}
      clearcoat={0.18}
      clearcoatRoughness={0.55}
    />
  );
}
