import { BufferGeometry, Float32BufferAttribute } from "three";
import head from "@/data/memojiHead.json";
import profile from "@/data/memojiProfile.json";

const SEGMENTS = 144;
const RINGS = 127;
const SIZE = 4;
const bump = (u: number, v: number, x: number, y: number, rx: number, ry: number) =>
  Math.exp(-(((u - x) / rx) ** 2 + ((v - y) / ry) ** 2));
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Profile-fitted skull with closed anatomical ear shells. The anterior roots
 * intersect the skull deeply; all colours remain attached during rotation. */
export function createHeadGeometry() {
  const positions: number[] = [], uvs: number[] = [], sideUvs: number[] = [], sideWeights: number[] = [], indices: number[] = [];
  const parts: number[] = [], earUvs: number[] = [];
  const add = (u: number, v: number, z: number, weight: number, textureU = u, textureV = v) => {
    positions.push((u - .5) * SIZE, (.5 - v) * SIZE, z);
    parts.push(0);
    earUvs.push(0, 0);
    uvs.push(textureU, textureV); sideWeights.push(weight);
    const right = u < .505, mapping = right ? profile.right : profile.left;
    const row = Math.max(0, Math.min(128, (v - head.top) / (head.bottom - head.top) * 128));
    const a = Math.floor(row), b = Math.min(a + 1, 128);
    const sourceY = mapping.y[a] + (mapping.y[b] - mapping.y[a]) * (row - a);
    // The side photographs have different forehead widths. Restrict the
    // lateral hair projection to the scalp, away from their facial features.
    const sideZ = v > .37 ? Math.min(z, .27) : z;
    const [back, forward] = profile.depth[Math.round(row)];
    const safeZ = Math.max(back + .03, Math.min(forward - .03, sideZ));
    sideUvs.push(((right ? 1 : 2) + mapping.axis + safeZ * mapping.zToU * (right ? 1 : -1)) / 3, sourceY);
  };
  const topU = (head.outline[0][0] + head.outline[0][1]) / 2;
  add(topU, head.top, (profile.depth[0][0] + profile.depth[0][1]) / 2, .5);
  for (let row = 1; row <= RINGS; row++) {
    const t = row / (RINGS + 1), v = head.top + (head.bottom - head.top) * t;
    const [left, right] = head.outline[row];
    const center = (left + right) / 2;
    // Remove the photograph's ear silhouette before adding sculpted ear relief.
    const earBand = smooth(.50, .53, v) * (1 - smooth(.65, .68, v));
    // Interpolate the temple-to-jaw contour across the ear rows. Subtracting
    // a bulge from every scanline left visible corrugations in the cheek.
    const cheekRadius = (.736 - .269) / 2 - (.306 - .269) * (v - .510) / (.667 - .510);
    const radius = (right - left) / 2 * (1 - earBand) + cheekRadius * earBand;
    const depth = [0, 1].map(axis => {
      let sum = 0, weights = 0;
      for (let offset = -3; offset <= 3; offset++) {
        const weight = 4 - Math.abs(offset);
        sum += profile.depth[Math.max(0, Math.min(128, row + offset))][axis] * weight;
        weights += weight;
      }
      return sum / weights;
    });
    const [backZ, measuredFront] = depth;
    const bridgeT = Math.max(0, Math.min(1, (row - 78) / (101 - 78)));
    const cheekPlane = profile.depth[78][1] + (profile.depth[101][1] - profile.depth[78][1]) * bridgeT;
    const nasalBand = smooth(76, 80, row) * (1 - smooth(98, 103, row));
    const nose = Math.max(0, measuredFront - cheekPlane) * nasalBand;
    const lips = .035 * Math.exp(-(((v - .719) / .018) ** 2));
    const faceZ = measuredFront - nose - lips;
    const centerZ = (backZ + faceZ) / 2;
    for (let column = 0; column < SEGMENTS; column++) {
      const theta = column / SEGMENTS * Math.PI * 2;
      const facing = Math.cos(theta), u = center + radius * Math.sin(theta);
      // A broad facial plane meets rounded temples, rather than an egg-shaped face.
      const facePlane = smooth(.40, .46, v) * (1 - smooth(.72, .80, v));
      const curve = facing + (Math.sin(facing * Math.PI / 2) - facing) * facePlane;
      let z = centerZ + (facing > 0 ? curve * (faceZ - centerZ) : facing * (centerZ - backZ));
      if (facing > 0) {
        const relief = nose * bump(u, v, .505, v, .040, 1)
          + .06 * bump(u, v, .505, .594, .027, .068)
          + .05 * bump(u, v, .37, .637, .067, .062)
          + .05 * bump(u, v, .64, .637, .067, .062)
          - .12 * bump(u, v, .40, .548, .062, .035)
          - .12 * bump(u, v, .612, .548, .062, .035)
          + lips * bump(u, v, .505, v, .085, 1);
        z += relief * facing;
      }
      // Texture weights belong to the surface, never to the camera/yaw.
      // Stop projecting the front photograph around the ear/cheek edge.
      // Blend colours in the shader, rather than folding UV coordinates into
      // the ear crop (which repeatedly sampled the photograph's cutout edge).
      const scalpWeight = 1 - smooth(-.12, .05, facing);
      const cheekWeight = 1 - smooth(.18, .62, facing);
      const skinBand = smooth(.49, .53, v);
      const weight = scalpWeight * (1 - skinBand) + cheekWeight * skinBand;
      add(u, v, z, weight);
    }
  }
  const bottom = positions.length / 3;
  const last = head.outline.at(-1)!;
  add((last[0] + last[1]) / 2, head.bottom, (profile.depth[128][0] + profile.depth[128][1]) / 2, .5);
  for (let column = 0; column < SEGMENTS; column++) {
    const next = (column + 1) % SEGMENTS;
    indices.push(0, 1 + column, 1 + next);
    for (let row = 0; row < RINGS - 1; row++) {
      const a = 1 + row * SEGMENTS + column, b = 1 + row * SEGMENTS + next;
      const c = a + SEGMENTS, d = b + SEGMENTS;
      indices.push(a, c, b, b, c, d);
    }
    const lastStart = 1 + (RINGS - 1) * SEGMENTS;
    indices.push(lastStart + column, bottom, lastStart + next);
  }
  // A thin, cupped pinna with a free posterior rim and a buried anterior root.
  // A Gaussian bump in the skull cannot produce this silhouette or undercut.
  const EAR_SEGMENTS = 64, EAR_RINGS = 20;
  for (const sign of [-1, 1]) {
    const surfaces: number[] = [];
    for (const front of [true, false]) {
      const start = positions.length / 3;
      surfaces.push(start);
      const vertex = (h: number, vertical: number, r: number) => {
        // Keep the bowl outside the skull; bury only the anterior attachment.
        // A uniformly tilted plane lets the head occlude the recessed bowl.
        const rimRoot = .12 * smooth(-.05, .60, h) * smooth(.30, .70, Math.abs(vertical));
        const xPlane = (.98 - .08 * h - .22 * smooth(.55, .95, h) - rimRoot)
          * (1 - .13 * Math.abs(vertical) ** 3);
        const dome = Math.sqrt(Math.max(0, 1 - r * r));
        const helix = .065 * Math.exp(-(((r - .82) / .10) ** 2));
        const concha = .075 * Math.exp(-(((h - .15) / .38) ** 2 + ((vertical - .25) / .40) ** 2));
        const antihelix = .025 * Math.exp(-(((r - .48) / .10) ** 2)) * smooth(-.3, .25, vertical);
        const tragus = .035 * Math.exp(-(((h - .65) / .20) ** 2 + ((vertical + .08) / .26) ** 2));
        const relief = front ? .015 + .030 * dome + helix + antihelix + tragus - concha : -.015 - .045 * dome;
        const x = sign * (xPlane + relief);
        const y = -.342 + vertical * .30;
        const z = .40 + h * .21 * (.88 + .12 * vertical) + .025 * vertical;
        const v = .5 - y / SIZE;
        add(.5 + x / SIZE, v, z, 1);
        parts[parts.length - 1] = 1;
        earUvs[earUvs.length - 2] = h;
        earUvs[earUvs.length - 1] = vertical;
      };
      vertex(0, 0, 0);
      for (let ring = 1; ring <= EAR_RINGS; ring++) {
        const r = ring / EAR_RINGS;
        for (let column = 0; column < EAR_SEGMENTS; column++) {
          const angle = column / EAR_SEGMENTS * Math.PI * 2;
          vertex(Math.cos(angle) * r, Math.sin(angle) * r, r);
        }
      }
      // Coordinates (h, vertical) run along z and y, so their outward normal
      // points toward -x. Mirror winding for each side and rear surface.
      const reverse = (sign > 0) === front;
      const triangle = (a: number, b: number, c: number) =>
        indices.push(a, reverse ? c : b, reverse ? b : c);
      for (let column = 0; column < EAR_SEGMENTS; column++) {
        const next = (column + 1) % EAR_SEGMENTS;
        triangle(start, start + 1 + column, start + 1 + next);
        for (let ring = 0; ring < EAR_RINGS - 1; ring++) {
          const a = start + 1 + ring * EAR_SEGMENTS + column;
          const b = start + 1 + ring * EAR_SEGMENTS + next;
          triangle(a, a + EAR_SEGMENTS, b);
          triangle(b, a + EAR_SEGMENTS, b + EAR_SEGMENTS);
        }
      }
    }
    const frontEdge = surfaces[0] + 1 + (EAR_RINGS - 1) * EAR_SEGMENTS;
    const backEdge = surfaces[1] + 1 + (EAR_RINGS - 1) * EAR_SEGMENTS;
    for (let column = 0; column < EAR_SEGMENTS; column++) {
      const next = (column + 1) % EAR_SEGMENTS;
      const a = frontEdge + column, b = frontEdge + next, c = backEdge + column, d = backEdge + next;
      if (sign > 0) indices.push(a, b, c, b, d, c);
      else indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("sideUv", new Float32BufferAttribute(sideUvs, 2));
  geometry.setAttribute("sideWeight", new Float32BufferAttribute(sideWeights, 1));
  geometry.setAttribute("earSurface", new Float32BufferAttribute(parts, 1));
  geometry.setAttribute("earUv", new Float32BufferAttribute(earUvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
