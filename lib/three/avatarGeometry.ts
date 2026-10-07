import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Procedural avatar geometry, modelled on Darshak's own Bitmoji:
 * tousled dark quiff, full boxed beard + moustache, gold aviators, earring,
 * tan chore jacket over a white tee. Everything is built in "head space":
 * head radius ≈ 1, face pointing +Z, neck pivot at y = -0.9.
 */
export const HEAD_SCALE = new THREE.Vector3(0.93, 1.15, 0.96);

type Q = "high" | "medium" | "low";
const seg = (q: Q, hi: number) => (q === "high" ? hi : q === "medium" ? Math.round(hi * 0.7) : Math.round(hi * 0.45));

function blob(r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, q: Q = "high") {
  const g = new THREE.SphereGeometry(r, seg(q, 36), seg(q, 24));
  g.scale(sx, sy, sz);
  g.translate(x, y, z);
  return g;
}

/** An elongated hair tuft: stretched sphere, tilted, then placed. */
function tuft(x: number, y: number, z: number, len: number, rx: number, rz: number, q: Q) {
  const g = new THREE.SphereGeometry(0.2, seg(q, 20), seg(q, 14));
  g.scale(0.85, len, 0.75);
  g.rotateX(rx);
  g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}

/** Memoji face shape applied to a unit-sphere point: full cheeks, tapering jaw, soft chin. */
function sculpt(x: number, y: number, z: number): [number, number, number] {
  if (y < 0) {
    const d = -y;
    x *= 1 - 0.2 * Math.pow(d, 1.7);
    z *= 1 - 0.08 * Math.pow(d, 2);
  } else {
    x *= 1 + 0.03 * Math.sin(y * Math.PI);
  }
  if (z > 0.6) z *= 1 - 0.04 * (z - 0.6);
  return [x, y, z];
}

function sculptGeometry(g: THREE.BufferGeometry) {
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = sculpt(p.getX(i), p.getY(i), p.getZ(i));
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** Point on the (sculpted, scaled) head surface at spherical coords, pushed out to radius r. */
function headPoint(theta: number, phi: number, r: number) {
  const x = -Math.cos(phi) * Math.sin(theta);
  const y = Math.cos(theta);
  const z = Math.sin(phi) * Math.sin(theta);
  const [sx, sy, sz] = sculpt(x, y, z);
  return new THREE.Vector3(sx * HEAD_SCALE.x * r, sy * HEAD_SCALE.y * r, sz * HEAD_SCALE.z * r);
}

/**
 * Full boxed beard + moustache as one shell over the lower face, with a window left open for the lips.
 * Built on a (theta, phi) grid; cells outside the beard region are simply not indexed.
 */
function createBeard(q: Q) {
  const nT = seg(q, 110);
  const nP = seg(q, 200);
  const T0 = Math.PI * 0.53;
  const T1 = Math.PI * 0.985;
  const PHI_SPAN = Math.PI * 0.58; // wraps back past the ears to meet the sideburns
  const positions: number[] = [];
  const index: number[] = [];

  const inBeard = (t: number, off: number) => {
    const a = Math.abs(off);
    if (a > PHI_SPAN) return false;
    // Cheek line: high at the sideburns, dropping to the mouth corners; moustache band at the front
    const top = a < Math.PI * 0.14 ? Math.PI * 0.585 : Math.PI * (0.555 + 0.075 * Math.cos(Math.min(a, Math.PI / 2)));
    if (t < top) return false;
    // Lip window
    if (a < Math.PI * 0.1 && t > Math.PI * 0.6 && t < Math.PI * 0.675) return false;
    return true;
  };

  for (let i = 0; i <= nT; i++) {
    const t = T0 + ((T1 - T0) * i) / nT;
    for (let j = 0; j <= nP; j++) {
      const off = -PHI_SPAN + (2 * PHI_SPAN * j) / nP;
      // Thicker at the chin and moustache, thinner where it meets the cheeks
      const chin = Math.max(0, (t - Math.PI * 0.7) / (Math.PI * 0.3));
      const r = 1.03 + 0.05 * chin + (Math.abs(off) < Math.PI * 0.15 && t < Math.PI * 0.6 ? 0.025 : 0);
      const v = headPoint(t, Math.PI / 2 + off, r);
      positions.push(v.x, v.y, v.z);
    }
  }
  const row = nP + 1;
  for (let i = 0; i < nT; i++) {
    for (let j = 0; j < nP; j++) {
      const t = T0 + ((T1 - T0) * (i + 0.5)) / nT;
      const off = -PHI_SPAN + (2 * PHI_SPAN * (j + 0.5)) / nP;
      if (!inBeard(t, off)) continue;
      const a = i * row + j;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Aviator lens outline (right lens; outer edge toward +x). */
function aviatorShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.19, 0.13);
  s.bezierCurveTo(-0.05, 0.17, 0.12, 0.17, 0.2, 0.15);
  s.bezierCurveTo(0.27, 0.1, 0.25, -0.08, 0.12, -0.17);
  s.bezierCurveTo(0.04, -0.23, -0.12, -0.21, -0.18, -0.1);
  s.bezierCurveTo(-0.22, -0.03, -0.22, 0.08, -0.19, 0.13);
  return s;
}

function createAviators(q: Q) {
  const LENS_X = 0.36;
  const LENS_Y = 0.05;
  const LENS_Z = 1.0;
  const shape = aviatorShape();

  const placeLens = (g: THREE.BufferGeometry, side: 1 | -1) => {
    if (side === -1) {
      g.scale(-1, 1, 1);
      // A negative scale reverses triangle winding; flip it back so the camera-facing side stays the front face
      const idx = g.index;
      if (idx) {
        for (let i = 0; i < idx.count; i += 3) {
          const t = idx.getX(i + 1);
          idx.setX(i + 1, idx.getX(i + 2));
          idx.setX(i + 2, t);
        }
        idx.needsUpdate = true;
      }
    }
    g.rotateY(side * 0.14); // gentle wrap around the face
    g.translate(side * LENS_X, LENS_Y, LENS_Z);
    return g;
  };

  // Lenses with a top-down brown gradient baked into vertex colours
  const lens = (side: 1 | -1) => {
    const g = new THREE.ShapeGeometry(shape, seg(q, 24));
    const p = g.attributes.position;
    const colors: number[] = [];
    const top = new THREE.Color("#24150b");
    const bottom = new THREE.Color("#7a5434");
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const t = THREE.MathUtils.clamp((p.getY(i) + 0.2) / 0.37, 0, 1);
      c.copy(bottom).lerp(top, t);
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return placeLens(g, side);
  };
  const lenses = mergeGeometries([lens(1), lens(-1)])!;

  // Wire frames traced along the lens outline
  const rim = (side: 1 | -1) => {
    const pts = shape.getPoints(40).map((v) => new THREE.Vector3(v.x, v.y, 0));
    const curve = new THREE.CatmullRomCurve3(pts, true);
    return placeLens(new THREE.TubeGeometry(curve, seg(q, 80), 0.017, 8, true), side);
  };
  const bar = (a: THREE.Vector3, b: THREE.Vector3, mid?: THREE.Vector3, r = 0.014) => {
    const curve = mid ? new THREE.QuadraticBezierCurve3(a, mid, b) : new THREE.LineCurve3(a, b);
    return new THREE.TubeGeometry(curve, 16, r, 6, false);
  };
  const frame = mergeGeometries([
    rim(1),
    rim(-1),
    // Aviator double bridge
    bar(new THREE.Vector3(-0.17, 0.155, 1.01), new THREE.Vector3(0.17, 0.155, 1.01), new THREE.Vector3(0, 0.17, 1.05)),
    bar(new THREE.Vector3(-0.15, 0.08, 1.0), new THREE.Vector3(0.15, 0.08, 1.0), new THREE.Vector3(0, 0.045, 1.06)),
    // Temples back to the ears
    bar(new THREE.Vector3(0.58, 0.18, 0.92), new THREE.Vector3(0.9, 0.12, 0.05), new THREE.Vector3(0.84, 0.17, 0.62), 0.016),
    bar(new THREE.Vector3(-0.58, 0.18, 0.92), new THREE.Vector3(-0.9, 0.12, 0.05), new THREE.Vector3(-0.84, 0.17, 0.62), 0.016),
  ])!;
  return { lenses, frame };
}

export function createAvatarGeometries(quality: Q) {
  const head = sculptGeometry(new THREE.SphereGeometry(1, seg(quality, 80), seg(quality, 64)));
  head.scale(HEAD_SCALE.x, HEAD_SCALE.y, HEAD_SCALE.z);

  // Hair — short sides, big tousled quiff on top
  const cap = new THREE.SphereGeometry(1.04, seg(quality, 72), seg(quality, 36), 0, Math.PI * 2, 0, Math.PI * 0.46);
  cap.rotateX(-0.42);
  cap.scale(0.97, 1.16, 1.02);
  const hairParts = [
    cap,
    blob(0.66, 0.02, 1.06, 0.12, 1.32, 0.72, 1.25, quality), // main volume
    blob(0.58, 0, 0.62, -0.58, 1.38, 0.95, 0.85, quality), // back
    blob(0.42, -0.74, 0.55, -0.1, 0.48, 0.95, 1.3, quality), // short sides
    blob(0.42, 0.74, 0.55, -0.1, 0.48, 0.95, 1.3, quality),
    blob(0.15, -0.88, 0.0, 0.2, 0.42, 1.5, 0.7, quality), // sideburns into the beard
    blob(0.15, 0.88, 0.0, 0.2, 0.42, 1.5, 0.7, quality),
    // Tousled tufts across the top, leaning forward and to the side
    tuft(0.0, 1.42, 0.42, 1.6, 0.7, -0.25, quality),
    tuft(-0.32, 1.36, 0.36, 1.45, 0.65, 0.35, quality),
    tuft(0.34, 1.38, 0.3, 1.5, 0.6, -0.45, quality),
    tuft(-0.12, 1.5, 0.05, 1.5, 0.35, 0.15, quality),
    tuft(0.2, 1.48, -0.05, 1.45, 0.3, -0.3, quality),
    tuft(-0.45, 1.25, 0.05, 1.3, 0.3, 0.6, quality),
    tuft(0.48, 1.28, 0.0, 1.3, 0.25, -0.65, quality),
    tuft(0.08, 1.3, 0.62, 1.2, 1.0, 0.1, quality),
  ];
  const hair = mergeGeometries(hairParts.map((g) => (g.index ? g.toNonIndexed() : g)))!;

  const ears = mergeGeometries([
    blob(0.22, -0.92, -0.08, -0.04, 0.62, 1.32, 0.9, quality),
    blob(0.22, 0.92, -0.08, -0.04, 0.62, 1.32, 0.9, quality),
  ])!;
  // Gold earring on the left ear (viewer's right)
  const earring = new THREE.TorusGeometry(0.055, 0.014, 8, 24);
  earring.rotateY(Math.PI / 2);
  earring.translate(0.95, -0.33, 0.02);

  const nose = blob(0.15, 0, -0.14, 0.92, 0.92, 1.35, 1.05, quality);

  // Thick, fairly straight brows (they sit just above the aviator frames)
  const brow = new THREE.TorusGeometry(0.24, 0.05, 8, 28, Math.PI * 0.42);
  brow.rotateZ(Math.PI / 2 - Math.PI * 0.21);
  brow.translate(0, -0.24, 0);
  brow.scale(1, 0.45, 1);

  // Eyes
  const eyeWhite = new THREE.SphereGeometry(0.165, seg(quality, 32), seg(quality, 24));
  const iris = new THREE.SphereGeometry(0.105, seg(quality, 32), seg(quality, 24));
  iris.rotateX(Math.PI / 2);
  iris.scale(1, 1, 0.45);
  iris.translate(0, 0, 0.124);
  const pupil = new THREE.SphereGeometry(0.048, 20, 14);
  pupil.scale(1, 1, 0.4);
  pupil.translate(0, 0, 0.153);
  const glint = new THREE.SphereGeometry(0.022, 12, 8);
  glint.translate(0.042, 0.048, 0.166);
  const LID_R = 0.172;
  const LID_T = Math.PI * 0.3;
  const LID_TILT = 0.3;
  const lid = new THREE.SphereGeometry(LID_R, seg(quality, 32), 12, 0, Math.PI * 2, 0, LID_T);
  lid.rotateX(LID_TILT);
  const lash = new THREE.TorusGeometry(LID_R * Math.sin(LID_T), 0.014, 6, 32, Math.PI);
  lash.rotateX(Math.PI / 2);
  lash.translate(0, LID_R * Math.cos(LID_T), 0);
  lash.rotateX(LID_TILT);

  // Mouth — relaxed closed smile; open smile on hover
  const SMILE = Math.PI * 0.42;
  const smile = new THREE.TorusGeometry(0.3, 0.028, 8, 36, SMILE);
  smile.rotateZ(-Math.PI / 2 - SMILE / 2);
  smile.translate(0, 0.28, 0);
  const openShape = new THREE.Shape();
  openShape.moveTo(-0.19, 0);
  openShape.absellipse(0, 0, 0.19, 0.14, Math.PI, Math.PI * 2, false, 0);
  openShape.lineTo(-0.19, 0);
  const mouthOpen = new THREE.ShapeGeometry(openShape, 24);
  const teethShape = new THREE.Shape();
  teethShape.moveTo(-0.15, -0.005);
  teethShape.lineTo(0.15, -0.005);
  teethShape.quadraticCurveTo(0.13, -0.05, 0.1, -0.055);
  teethShape.lineTo(-0.1, -0.055);
  teethShape.quadraticCurveTo(-0.13, -0.05, -0.15, -0.005);
  const teeth = new THREE.ShapeGeometry(teethShape, 12);
  teeth.translate(0, 0, 0.002);

  const beard = createBeard(quality);
  const { lenses, frame } = createAviators(quality);

  // ── Bust: neck, tan chore jacket, white tee, collar, chest patch
  const neck = new THREE.CylinderGeometry(0.34, 0.4, 0.75, seg(quality, 32), 1, true);
  neck.translate(0, -1.25, -0.08);
  const collar = (side: 1 | -1) => {
    const g = blob(0.32, 0, 0, 0, 1.05, 0.42, 0.28, quality);
    g.rotateZ(side * -0.55);
    g.rotateY(side * 0.35);
    g.translate(side * 0.3, -1.5, 0.24);
    return g;
  };
  const jacket = mergeGeometries([blob(1, 0, -2.15, -0.12, 1.08, 0.78, 0.66, quality), collar(1), collar(-1)])!;
  const tee = blob(0.4, 0, -1.78, 0.26, 0.55, 1.2, 0.45, quality);
  const patch = new THREE.BoxGeometry(0.17, 0.13, 0.02);
  patch.rotateY(0.42);
  patch.translate(0.38, -1.88, 0.44);
  const zipper = new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6);
  zipper.translate(0.17, -2.2, 0.5);

  return {
    head, hair, ears, earring, nose, brow, eyeWhite, iris, pupil, glint, lid, lash,
    smile, mouthOpen, teeth, beard, lenses, frame, neck, jacket, tee, patch, zipper,
  };
}

export type AvatarGeometries = ReturnType<typeof createAvatarGeometries>;
