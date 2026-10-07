/**
 * Offline software rasteriser for the 3D portrait, so poses can be checked
 * without a visible WebGL pane. Mirrors the FacePortrait setup: orthographic
 * camera, textured front, vertex-coloured back, front-facing triangles only.
 *
 *   node output/sync-geometry.cjs && node output/render-portrait.mts
 */
import * as THREE from "three";
import sharp from "sharp";
import { createPortraitGeometry } from "./.tmp/portraitGeometry.mts";

const SIZE = 420;
const WORLD_HEIGHT = 3.4; // camera zoom = min(w, h) / 3.4
const TEX = "public/memoji/avatar.webp";
const BG = { r: 16, g: 17, b: 22 };

const linearToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

const tex = await sharp(TEX).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const TW = tex.info.width, TH = tex.info.height, tdata = tex.data;

function sampleTex(u: number, v: number) {
  const x = Math.min(TW - 1, Math.max(0, Math.round(u * TW - 0.5)));
  const y = Math.min(TH - 1, Math.max(0, Math.round((1 - v) * TH - 0.5)));
  const i = (y * TW + x) * 4;
  return [tdata[i] / 255, tdata[i + 1] / 255, tdata[i + 2] / 255];
}

const geometry = createPortraitGeometry("high");
const pos = geometry.getAttribute("position").array as Float32Array;
const uv = geometry.getAttribute("uv").array as Float32Array;
const col = geometry.getAttribute("color").array as Float32Array;
const index = geometry.getIndex()!.array as ArrayLike<number>;
const groups = geometry.groups;

export function render(yawDeg: number, pitchDeg = 0) {
  const zoom = SIZE / WORLD_HEIGHT;
  const out = new Uint8Array(SIZE * SIZE * 3);
  for (let i = 0; i < SIZE * SIZE; i++) { out[i * 3] = BG.r; out[i * 3 + 1] = BG.g; out[i * 3 + 2] = BG.b; }
  const depth = new Float32Array(SIZE * SIZE).fill(-Infinity);

  const m = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(THREE.MathUtils.degToRad(pitchDeg), THREE.MathUtils.degToRad(yawDeg), 0, "XYZ"),
  );
  const n = pos.length / 3;
  const sx = new Float32Array(n), sy = new Float32Array(n), sz = new Float32Array(n);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(m);
    sx[i] = SIZE / 2 + v.x * zoom;
    sy[i] = SIZE / 2 - v.y * zoom;
    sz[i] = v.z;
  }
  const groupOf = (triStart: number) => {
    for (const g of groups) if (triStart >= g.start && triStart < g.start + g.count) return g.materialIndex ?? 0;
    return 0;
  };

  for (let t = 0; t < index.length; t += 3) {
    const a = index[t], b = index[t + 1], c = index[t + 2];
    const ax = sx[a], ay = sy[a], bx = sx[b], by = sy[b], cx = sx[c], cy = sy[c];
    // Screen y is flipped, so a front face has negative signed area here.
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (area >= 0) continue;
    const mat = groupOf(t);
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(ax, bx, cx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = (bx - ax) * (py - ay) - (px - ax) * (by - ay);
        const w1 = (cx - bx) * (py - by) - (px - bx) * (cy - by);
        const w2 = (ax - cx) * (py - cy) - (px - cx) * (ay - cy);
        if (!((w0 <= 0 && w1 <= 0 && w2 <= 0) || (w0 >= 0 && w1 >= 0 && w2 >= 0))) continue;
        const l2 = w0 / area, l0 = w1 / area, l1 = w2 / area;
        const z = l0 * sz[a] + l1 * sz[b] + l2 * sz[c];
        const di = y * SIZE + x;
        if (z <= depth[di]) continue;
        let r: number, g: number, bl: number;
        if (mat === 0) {
          const u = l0 * uv[a * 2] + l1 * uv[b * 2] + l2 * uv[c * 2];
          const vv = l0 * uv[a * 2 + 1] + l1 * uv[b * 2 + 1] + l2 * uv[c * 2 + 1];
          [r, g, bl] = sampleTex(u, vv);
        } else {
          r = linearToSrgb(l0 * col[a * 3] + l1 * col[b * 3] + l2 * col[c * 3]);
          g = linearToSrgb(l0 * col[a * 3 + 1] + l1 * col[b * 3 + 1] + l2 * col[c * 3 + 1]);
          bl = linearToSrgb(l0 * col[a * 3 + 2] + l1 * col[b * 3 + 2] + l2 * col[c * 3 + 2]);
        }
        depth[di] = z;
        out[di * 3] = Math.round(Math.max(0, Math.min(1, r)) * 255);
        out[di * 3 + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
        out[di * 3 + 2] = Math.round(Math.max(0, Math.min(1, bl)) * 255);
      }
    }
  }
  return out;
}

/** Grid of poses: columns are yaw, rows are pitch. */
export async function grid(yaws: number[], pitches: number[], file: string) {
  const tiles: { input: Buffer; left: number; top: number }[] = [];
  for (let r = 0; r < pitches.length; r++) {
    for (let c = 0; c < yaws.length; c++) {
      const raw = render(yaws[c], pitches[r]);
      const input = await sharp(Buffer.from(raw), { raw: { width: SIZE, height: SIZE, channels: 3 } }).png().toBuffer();
      tiles.push({ input, left: c * SIZE, top: r * SIZE });
    }
  }
  await sharp({ create: { width: SIZE * yaws.length, height: SIZE * pitches.length, channels: 3, background: BG } })
    .composite(tiles).png().toFile(file);
  console.log("wrote", file);
}

if (process.argv[2] !== "lib") {
  // The reachable range: YAW_LIMIT 0.56 rad, PITCH_LIMIT 0.36 rad.
  await grid([-32, -16, 0, 16, 32], [-20, 0, 20], "output/.tmp/poses.png");
}
