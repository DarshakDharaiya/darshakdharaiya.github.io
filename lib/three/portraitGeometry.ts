import * as THREE from "three";
import outlineData from "./portraitOutline.json";
import type { MaterialTier } from "./materials";

type RGB = readonly number[];
type OutlineRow = {
  v: number;
  left: number;
  right: number;
  leftColor: RGB;
  rightColor: RGB;
};

const outline = outlineData;
const imageScale = 2.8 / (outline.bottom - outline.top);
const centerV = (outline.top + outline.bottom) / 2;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const gaussian = (value: number, center: number, spread: number) => Math.exp(-0.5 * ((value - center) / spread) ** 2);
const bump = (u: number, v: number, x: number, y: number, width: number, height: number) => gaussian(u, x, width) * gaussian(v, y, height);
const smoothstep = (from: number, to: number, value: number) => {
  const t = THREE.MathUtils.clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};
const srgbColor = (rgb: RGB) => new THREE.Color(rgb[0], rgb[1], rgb[2]).convertSRGBToLinear();

/** Interpolate the measured alpha contour and its original sRGB edge colors. */
function sampleOutline(v: number): OutlineRow {
  const rows = outline.rows;
  let low = 0;
  let high = rows.length - 1;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (rows[mid].v <= v) low = mid;
    else high = mid;
  }
  const a = rows[low];
  const b = rows[high];
  const t = THREE.MathUtils.clamp((v - a.v) / (b.v - a.v), 0, 1);
  return {
    v,
    left: mix(a.left, b.left, t),
    right: mix(a.right, b.right, t),
    leftColor: a.leftColor.map((value, channel) => mix(value, b.leftColor[channel], t)),
    rightColor: a.rightColor.map((value, channel) => mix(value, b.rightColor[channel], t)),
  };
}

/**
 * A closed volume reconstructed from one portrait, rather than a plane or a
 * collection of face primitives. The frontal UV projection preserves the
 * supplied appearance; depth and the unseen sides/back are approximations,
 * not a trained reconstruction or an original rigged Memoji sculpt.
 *
 * Material group 0: portrait map (UV v is flipped for a standard Three texture).
 * Material group 1: vertex-colored back. No facial texture repeats behind it.
 */
export function createPortraitGeometry(tier: MaterialTier): THREE.BufferGeometry {
  const columns = tier === "low" ? 40 : tier === "medium" ? 64 : 88;
  const ringCount = tier === "low" ? 56 : tier === "medium" ? 88 : 120;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const frontIndices: number[] = [];
  const backIndices: number[] = [];
  const frontRings: number[][] = [];
  const backRings: number[][] = [];
  const skin = srgbColor([0.85, 0.63, 0.48]);
  const hair = srgbColor([0.275, 0.168, 0.106]);
  const hairHighlight = srgbColor([0.365, 0.235, 0.153]);

  const addVertex = (u: number, v: number, z: number, color: THREE.Color) => {
    const index = positions.length / 3;
    positions.push((u - 0.5) * imageScale, (centerV - v) * imageScale, z);
    uvs.push(u, 1 - v);
    colors.push(color.r, color.g, color.b);
    return index;
  };

  const frontDepth = (u: number, v: number, t: number, vertical: number) => {
    const dome = Math.sqrt(Math.max(0, 1 - t * t));
    const ear = bump(u, v, 0.207, 0.636, 0.044, 0.081) + bump(u, v, 0.806, 0.613, 0.028, 0.071);
    const jaw = smoothstep(0.72, 0.94, v);
    let depth = dome * (0.71 * vertical * (1 - jaw * 0.12) - ear * 0.17);

    // Broad forehead, cheeks and chin soften the oval into facial contours.
    let sculpt = bump(u, v, 0.515, 0.435, 0.19, 0.105) * 0.065;
    sculpt += bump(u, v, 0.39, 0.67, 0.09, 0.065) * 0.075;
    sculpt += bump(u, v, 0.7, 0.64, 0.071, 0.068) * 0.07;
    sculpt += bump(u, v, 0.55, 0.875, 0.092, 0.045) * 0.075;

    // Eye sockets and upper lid/brow ridges follow the tilted source portrait.
    sculpt -= bump(u, v, 0.42, 0.583, 0.074, 0.025) * 0.055;
    sculpt -= bump(u, v, 0.695, 0.557, 0.068, 0.024) * 0.053;
    sculpt += bump(u, v, 0.42, 0.541, 0.077, 0.021) * 0.035;
    sculpt += bump(u, v, 0.695, 0.519, 0.069, 0.022) * 0.032;

    // A continuous bridge, tip and wings replace intersecting nose spheres.
    sculpt += bump(u, v, 0.58, 0.60, 0.029, 0.062) * 0.11;
    sculpt += bump(u, v, 0.59, 0.686, 0.039, 0.034) * 0.245;
    sculpt += bump(u, v, 0.548, 0.699, 0.022, 0.019) * 0.036;
    sculpt += bump(u, v, 0.629, 0.694, 0.022, 0.019) * 0.036;
    sculpt -= bump(u, v, 0.59, 0.719, 0.032, 0.011) * 0.019;

    // Small lip ridges and a mouth crease retain the closed smile.
    sculpt += bump(u, v, 0.575, 0.759, 0.082, 0.012) * 0.027;
    sculpt += bump(u, v, 0.575, 0.785, 0.085, 0.014) * 0.037;
    sculpt -= bump(u, v, 0.575, 0.771, 0.08, 0.007) * 0.018;

    // Broad swept volumes underneath the source's baked hair strands.
    sculpt += bump(u, v, 0.45, 0.19, 0.22, 0.11) * 0.145;
    sculpt += bump(u, v, 0.33, 0.24, 0.1, 0.095) * 0.065;
    depth += sculpt * dome;
    return Math.max(0, depth);
  };

  const backDepth = (u: number, v: number, t: number, vertical: number) => {
    const dome = Math.sqrt(Math.max(0, 1 - t * t));
    const jaw = smoothstep(0.67, 0.94, v);
    const ear = bump(u, v, 0.207, 0.636, 0.044, 0.081) + bump(u, v, 0.806, 0.613, 0.028, 0.071);
    // A head is about as deep as it is wide. A shallow skull reads as a flat
    // disc the moment the portrait turns, so the back carries most of the depth.
    const skull = 1.16 * vertical * (1 - jaw * 0.4);
    const crown = bump(u, v, 0.51, 0.28, 0.2, 0.15) * 0.08;
    return -Math.max(0, dome * (skull + crown - ear * 0.15));
  };

  const backColor = (row: OutlineRow, t: number, left: THREE.Color, right: THREE.Color) => {
    const nape = 0.665 + (1 - Math.abs(t)) * 0.04;
    const hairWeight = 1 - smoothstep(nape - 0.012, nape + 0.012, row.v);
    const strandTint = 0.07 + Math.cos(t * 7 + row.v * 10) * 0.045;
    const inferred = hair.clone().lerp(hairHighlight, strandTint).lerp(skin, 1 - hairWeight);
    // Sampled edge colors make the shared silhouette meet the portrait map.
    const edge = left.clone().lerp(right, (t + 1) / 2);
    return inferred.lerp(edge, Math.abs(t) ** 4);
  };

  const first = sampleOutline(outline.top);
  const last = sampleOutline(outline.bottom);
  const topColor = srgbColor(first.leftColor).lerp(srgbColor(first.rightColor), 0.5);
  const bottomColor = srgbColor(last.leftColor).lerp(srgbColor(last.rightColor), 0.5);
  const topPole = addVertex((first.left + first.right) / 2, first.v, 0, topColor);
  const bottomPole = addVertex((last.left + last.right) / 2, last.v, 0, bottomColor);

  for (let ring = 0; ring < ringCount; ring++) {
    const fraction = (ring + 1) / (ringCount + 1);
    const v = mix(outline.top, outline.bottom, fraction);
    const row = sampleOutline(v);
    const vertical = Math.sin(fraction * Math.PI) ** 0.55;
    const leftColor = srgbColor(row.leftColor);
    const rightColor = srgbColor(row.rightColor);
    const front: number[] = [];
    const back: number[] = [];

    for (let column = 0; column <= columns; column++) {
      const t = (column / columns) * 2 - 1;
      const u = mix(row.left, row.right, column / columns);
      const color = backColor(row, t, leftColor, rightColor);
      front.push(addVertex(u, v, frontDepth(u, v, t, vertical), color));
    }
    for (let column = 0; column <= columns; column++) {
      // Front and back share the very same boundary vertices: no seam holes,
      // duplicate silhouettes or paper-thin disconnected sides.
      if (column === 0 || column === columns) back.push(front[column]);
      else {
        const t = (column / columns) * 2 - 1;
        const u = mix(row.left, row.right, column / columns);
        back.push(addVertex(u, v, backDepth(u, v, t, vertical), backColor(row, t, leftColor, rightColor)));
      }
    }
    frontRings.push(front);
    backRings.push(back);
  }

  // Separate index groups allow a baked portrait front and a normally lit back.
  for (let column = 0; column < columns; column++) {
    frontIndices.push(topPole, frontRings[0][column], frontRings[0][column + 1]);
    backIndices.push(topPole, backRings[0][column + 1], backRings[0][column]);
    const final = ringCount - 1;
    frontIndices.push(frontRings[final][column], bottomPole, frontRings[final][column + 1]);
    backIndices.push(backRings[final][column], backRings[final][column + 1], bottomPole);
  }
  for (let ring = 0; ring < ringCount - 1; ring++) {
    for (let column = 0; column < columns; column++) {
      const a = frontRings[ring][column];
      const b = frontRings[ring][column + 1];
      const c = frontRings[ring + 1][column];
      const d = frontRings[ring + 1][column + 1];
      frontIndices.push(a, c, b, b, c, d);
      const e = backRings[ring][column];
      const f = backRings[ring][column + 1];
      const g = backRings[ring + 1][column];
      const h = backRings[ring + 1][column + 1];
      backIndices.push(e, f, g, f, h, g);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex([...frontIndices, ...backIndices]);
  geometry.addGroup(0, frontIndices.length, 0);
  geometry.addGroup(frontIndices.length, backIndices.length, 1);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
