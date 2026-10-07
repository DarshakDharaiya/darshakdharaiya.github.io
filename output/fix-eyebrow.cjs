/**
 * Replaces the viewer-right eyebrow in the portrait with a mirrored, foreshortened
 * copy of the viewer-left one, so both brows share one shape.
 *
 *   1. rebuild brow-free skin over the old brow with a Coons patch, so all four
 *      edges of the repaired rectangle match the surrounding face exactly
 *   2. derive the left brow's coverage against its own skin plate
 *   3. paint that coverage, mirrored and foreshortened, tinted to the right
 *      brow's own colour so the side's lighting is kept
 *
 * Only interior pixels change, so the traced silhouette (portraitOutline.json) still holds.
 * Run from the project root: node output/fix-eyebrow.cjs
 * Reference rows were measured from the image; they avoid the hairline and the eyes.
 */
const fs = require("fs");
const sharp = require("sharp");

const SRC = "public/memoji/avatar.webp";
const BACKUP = "output/avatar.original.webp";

// Brow boxes measured with .inspect/brows.cjs
const L = { x0: 331, x1: 503, y0: 447, y1: 497, rgb: [92, 60, 45] };
const R = { x0: 636, x1: 777, y0: 465, y1: 515, rgb: [106, 70, 51] };
// Repair rectangles, bounded by brow-free rows/columns (checked against the eye and hairline)
const DEST = { x0: 622, x1: 792, y0: 444, y1: 524 };
const SRCBOX = { x0: 323, x1: 511, y0: 439, y1: 505 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

(async () => {
  if (!fs.existsSync(BACKUP)) fs.copyFileSync(SRC, BACKUP);
  const { data, info } = await sharp(BACKUP).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const out = Buffer.from(data);
  const idx = (x, y) => (y * W + x) * 4;

  /** Coons patch over `box`: interior rebuilt from the four boundary edges. */
  const skinPlate = (box) => {
    const w = box.x1 - box.x0, h = box.y1 - box.y0;
    const plate = new Float32Array((w + 1) * (h + 1) * 3);
    const edge = (x, y, c) => data[idx(x, y) + c];
    for (let j = 0; j <= h; j++) {
      const v = j / h, y = box.y0 + j;
      for (let i = 0; i <= w; i++) {
        const u = i / w, x = box.x0 + i;
        for (let c = 0; c < 3; c++) {
          const top = edge(x, box.y0, c), bottom = edge(x, box.y1, c);
          const left = edge(box.x0, y, c), right = edge(box.x1, y, c);
          const corners =
            (1 - u) * (1 - v) * edge(box.x0, box.y0, c) + u * (1 - v) * edge(box.x1, box.y0, c) +
            (1 - u) * v * edge(box.x0, box.y1, c) + u * v * edge(box.x1, box.y1, c);
          plate[(j * (w + 1) + i) * 3 + c] = (1 - v) * top + v * bottom + (1 - u) * left + u * right - corners;
        }
      }
    }
    return { plate, w, h, box };
  };

  const samplePlate = (p, x, y) => {
    const fx = clamp(x - p.box.x0, 0, p.w), fy = clamp(y - p.box.y0, 0, p.h);
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, p.w), y1 = Math.min(y0 + 1, p.h);
    const tx = fx - x0, ty = fy - y0;
    const o = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const a = p.plate[(y0 * (p.w + 1) + x0) * 3 + c] * (1 - tx) + p.plate[(y0 * (p.w + 1) + x1) * 3 + c] * tx;
      const b = p.plate[(y1 * (p.w + 1) + x0) * 3 + c] * (1 - tx) + p.plate[(y1 * (p.w + 1) + x1) * 3 + c] * tx;
      o[c] = a * (1 - ty) + b * ty;
    }
    return o;
  };

  const sampleImage = (x, y) => {
    const x0 = clamp(Math.floor(x), 0, W - 1), y0 = clamp(Math.floor(y), 0, H - 1);
    const x1 = clamp(x0 + 1, 0, W - 1), y1 = clamp(y0 + 1, 0, H - 1);
    const tx = clamp(x - x0, 0, 1), ty = clamp(y - y0, 0, 1);
    const o = [0, 0, 0, 0];
    for (let c = 0; c < 4; c++) {
      const a = data[idx(x0, y0) + c] * (1 - tx) + data[idx(x1, y0) + c] * tx;
      const b = data[idx(x0, y1) + c] * (1 - tx) + data[idx(x1, y1) + c] * tx;
      o[c] = a * (1 - ty) + b * ty;
    }
    return o;
  };

  const destPlate = skinPlate(DEST);
  const srcPlate = skinPlate(SRCBOX);
  const browLum = lum(L.rgb[0], L.rgb[1], L.rgb[2]);
  const tint = [R.rgb[0] / L.rgb[0], R.rgb[1] / L.rgb[1], R.rgb[2] / L.rgb[2]];
  const rw = R.x1 - R.x0, rh = R.y1 - R.y0;
  const lw = L.x1 - L.x0, lh = L.y1 - L.y0;

  for (let y = DEST.y0; y <= DEST.y1; y++) {
    for (let x = DEST.x0; x <= DEST.x1; x++) {
      const i = idx(x, y);
      if (data[i + 3] < 8) continue; // never touch pixels outside the head
      const skin = samplePlate(destPlate, x, y);

      // Mirror horizontally and foreshorten onto the left brow's box.
      const sx = L.x0 + ((R.x1 - x) / rw) * lw;
      const sy = L.y0 + ((y - R.y0) / rh) * lh;
      let cov = 0;
      let browPixel = null;
      if (sx >= SRCBOX.x0 && sx <= SRCBOX.x1 && sy >= SRCBOX.y0 && sy <= SRCBOX.y1) {
        const s = sampleImage(sx, sy);
        const sSkin = samplePlate(srcPlate, sx, sy);
        const skinLum = lum(sSkin[0], sSkin[1], sSkin[2]);
        cov = clamp((skinLum - lum(s[0], s[1], s[2])) / Math.max(1, skinLum - browLum), 0, 1);
        browPixel = s;
      }

      for (let c = 0; c < 3; c++) {
        const base = skin[c];
        const value = cov > 0.002 ? base * (1 - cov) + clamp(browPixel[c] * tint[c], 0, 255) * cov : base;
        out[i + c] = Math.round(clamp(value, 0, 255));
      }
    }
  }

  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 95, alphaQuality: 100 }).toFile(SRC);
  console.log("wrote", SRC);
})();
