/**
 * Builds public/memoji/avatar.webp from the untouched generated portrait.
 *
 * The supplied image is a three-quarter pose whose features disagree with each
 * other: the brows slope opposite to the eyes, one brow droops, and the whole
 * head leans. Two repairs are applied, in this order, because the second one
 * moves every pixel:
 *
 *   1. brow  — the viewer-right brow is replaced by a mirrored, foreshortened
 *              copy of the left one. Skin under the old brow is rebuilt with a
 *              Coons patch so all four edges of the repair match the face.
 *   2. upright — the head is rotated so its crown-to-chin axis is vertical and
 *              then centred on the canvas, so it no longer reads as tilted.
 *   3. eyes   — the eyes are drawn at different heights (and the rotation that
 *              levels the brows tilts them further). A smooth local warp slides
 *              each eye to their shared mean height, carrying the socket
 *              shading with it, so there is no seam to blend.
 *
 *   4. defringe — the face material ignores the texture's alpha, so colour left
 *              in transparent edge pixels (the generator leaves a few red ones)
 *              renders as solid specks. Opaque colour is padded outward into
 *              them; alpha is untouched, so the silhouette is unchanged.
 *
 * It prints the final eye centres; lib/three/portraitEyeMaterial.ts must match
 * them or the blink and gaze land in the wrong place.
 *
 * Re-run after changing either stage, then regenerate the silhouette:
 *   node output/build-portrait.cjs && node output/portrait-outline.cjs
 */
const sharp = require("sharp");

const SRC = "output/avatar.original.webp";
const OUT = "public/memoji/avatar.webp";

// Brow boxes measured on SRC with output/measure-portrait.cjs
const L = { x0: 331, x1: 503, y0: 447, y1: 497, rgb: [92, 60, 45] };
const R = { x0: 636, x1: 777, y0: 465, y1: 515, rgb: [106, 70, 51] };
// Repair rectangles bounded by brow-free rows/columns (clear of the eyes and hairline)
const DEST = { x0: 622, x1: 792, y0: 444, y1: 524 };
const SRCBOX = { x0: 323, x1: 511, y0: 439, y1: 505 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Stage 1 — mirror the left brow onto the right. */
function repairBrow(data, W, H) {
  const out = Buffer.from(data);
  const idx = (x, y) => (y * W + x) * 4;

  const skinPlate = (box) => {
    const w = box.x1 - box.x0, h = box.y1 - box.y0;
    const plate = new Float32Array((w + 1) * (h + 1) * 3);
    const edge = (x, y, c) => data[idx(x, y) + c];
    for (let j = 0; j <= h; j++) {
      const v = j / h, y = box.y0 + j;
      for (let i = 0; i <= w; i++) {
        const u = i / w, x = box.x0 + i;
        for (let c = 0; c < 3; c++) {
          const corners =
            (1 - u) * (1 - v) * edge(box.x0, box.y0, c) + u * (1 - v) * edge(box.x1, box.y0, c) +
            (1 - u) * v * edge(box.x0, box.y1, c) + u * v * edge(box.x1, box.y1, c);
          plate[(j * (w + 1) + i) * 3 + c] =
            (1 - v) * edge(x, box.y0, c) + v * edge(x, box.y1, c) +
            (1 - u) * edge(box.x0, y, c) + u * edge(box.x1, y, c) - corners;
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

  const destPlate = skinPlate(DEST), srcPlate = skinPlate(SRCBOX);
  const browLum = lum(L.rgb[0], L.rgb[1], L.rgb[2]);
  const tint = [R.rgb[0] / L.rgb[0], R.rgb[1] / L.rgb[1], R.rgb[2] / L.rgb[2]];
  const rw = R.x1 - R.x0, rh = R.y1 - R.y0, lw = L.x1 - L.x0, lh = L.y1 - L.y0;

  for (let y = DEST.y0; y <= DEST.y1; y++) {
    for (let x = DEST.x0; x <= DEST.x1; x++) {
      const i = idx(x, y);
      if (data[i + 3] < 8) continue;
      const skin = samplePlate(destPlate, x, y);
      const sx = L.x0 + ((R.x1 - x) / rw) * lw;
      const sy = L.y0 + ((y - R.y0) / rh) * lh;
      let cov = 0, brow = null;
      if (sx >= SRCBOX.x0 && sx <= SRCBOX.x1 && sy >= SRCBOX.y0 && sy <= SRCBOX.y1) {
        const s = sampleImage(sx, sy);
        const sSkin = samplePlate(srcPlate, sx, sy);
        const skinLum = lum(sSkin[0], sSkin[1], sSkin[2]);
        cov = clamp((skinLum - lum(s[0], s[1], s[2])) / Math.max(1, skinLum - browLum), 0, 1);
        brow = s;
      }
      for (let c = 0; c < 3; c++) {
        const value = cov > 0.002 ? skin[c] * (1 - cov) + clamp(brow[c] * tint[c], 0, 255) * cov : skin[c];
        out[i + c] = Math.round(clamp(value, 0, 255));
      }
    }
  }
  return out;
}

/** Centre of mass of the alpha mask over a row range. */
function centroid(data, W, y0, y1) {
  let sx = 0, n = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 128) { sx += x; n++; }
    }
  }
  return n ? sx / n : null;
}

/** Stage 2 — rotate the crown-to-chin axis upright, then centre. */
function upright(data, W, H) {
  let top = H, bottom = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 128) { if (y < top) top = y; if (y > bottom) bottom = y; break; }
    }
  }
  const band = Math.round((bottom - top) * 0.09);
  const crown = centroid(data, W, top, top + band);
  const chin = centroid(data, W, bottom - band, bottom);
  const angle = Math.atan2(chin - crown, bottom - band / 2 - (top + band / 2));
  console.log(`crown x=${crown.toFixed(1)}  chin x=${chin.toFixed(1)}  tilt ${(angle * 180 / Math.PI).toFixed(2)} deg`);

  // Rotate about the head's own centre so nothing leaves the canvas.
  const cx = W / 2, cy = (top + bottom) / 2;
  const cos = Math.cos(-angle), sin = Math.sin(-angle);
  const rotated = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Inverse map: destination -> source.
      const dx = x - cx, dy = y - cy;
      const sxf = cos * dx + sin * dy + cx;
      const syf = -sin * dx + cos * dy + cy;
      const d = (y * W + x) * 4;
      if (sxf < 0 || sxf > W - 1 || syf < 0 || syf > H - 1) continue;
      const x0 = Math.floor(sxf), y0 = Math.floor(syf);
      const x1 = Math.min(x0 + 1, W - 1), y1 = Math.min(y0 + 1, H - 1);
      const tx = sxf - x0, ty = syf - y0;
      // Premultiply before blending so transparent pixels cannot bleed colour in.
      let acc = [0, 0, 0, 0];
      for (const [px, py, w] of [[x0, y0, (1 - tx) * (1 - ty)], [x1, y0, tx * (1 - ty)], [x0, y1, (1 - tx) * ty], [x1, y1, tx * ty]]) {
        const s = (py * W + px) * 4;
        const a = data[s + 3] / 255;
        acc[0] += data[s] * a * w; acc[1] += data[s + 1] * a * w; acc[2] += data[s + 2] * a * w; acc[3] += a * w;
      }
      const a = acc[3];
      rotated[d + 3] = Math.round(clamp(a * 255, 0, 255));
      if (a > 0.0001) {
        rotated[d] = Math.round(clamp(acc[0] / a, 0, 255));
        rotated[d + 1] = Math.round(clamp(acc[1] / a, 0, 255));
        rotated[d + 2] = Math.round(clamp(acc[2] / a, 0, 255));
      }
    }
  }

  // Centre the head in the frame.
  let l = W, r = -1, t = H, b = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (rotated[(y * W + x) * 4 + 3] <= 128) continue;
    if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y;
  }
  const shiftX = Math.round(W / 2 - (l + r) / 2), shiftY = Math.round(H / 2 - (t + b) / 2);
  console.log(`head ${l}..${r} x ${t}..${b}  centring shift (${shiftX}, ${shiftY})`);
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const sy = y - shiftY;
    if (sy < 0 || sy >= H) continue;
    for (let x = 0; x < W; x++) {
      const sx = x - shiftX;
      if (sx < 0 || sx >= W) continue;
      out.set(rotated.subarray((sy * W + sx) * 4, (sy * W + sx) * 4 + 4), (y * W + x) * 4);
    }
  }
  return out;
}


/** Darkest blobs in the face are the pupils and lash lines; brows are far lighter. */
function findEyes(data, W, H) {
  const seen = new Int32Array(W * H).fill(-1);
  const dark = (x, y) => {
    const i = (y * W + x) * 4;
    return data[i + 3] > 200 && lum(data[i], data[i + 1], data[i + 2]) < 35;
  };
  const found = [];
  for (let y = 450; y < 720; y++) {
    for (let x = 280; x < 880; x++) {
      if (seen[y * W + x] !== -1 || !dark(x, y)) continue;
      const id = found.length, stack = [[x, y]];
      seen[y * W + x] = id;
      let n = 0, sx = 0, sy = 0, minX = x, maxX = x, minY = y, maxY = y;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        n++; sx += cx; sy += cy;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 280 || nx >= 880 || ny < 450 || ny >= 720) continue;
          if (seen[ny * W + nx] !== -1 || !dark(nx, ny)) continue;
          seen[ny * W + nx] = id; stack.push([nx, ny]);
        }
      }
      found.push({ n, cx: sx / n, cy: sy / n, minX, maxX, minY, maxY });
    }
  }
  const eyes = found.filter((c) => c.n > 1500).sort((a, b) => a.cx - b.cx);
  if (eyes.length !== 2) throw new Error(`expected 2 eyes, found ${eyes.length}`);
  return eyes;
}

/** Stage 3 — slide each eye vertically to their shared mean height. */
function levelEyes(data, W, H) {
  const [left, right] = findEyes(data, W, H);
  const mean = (left.cy + right.cy) / 2;
  const shift = [
    { x: left.cx, y: left.cy, dy: mean - left.cy },
    { x: right.cx, y: right.cy, dy: mean - right.cy },
  ];
  console.log(`eyes: left (${left.cx.toFixed(0)}, ${left.cy.toFixed(0)})  right (${right.cx.toFixed(0)}, ${right.cy.toFixed(0)})  -> level at y=${mean.toFixed(0)}`);
  if (Math.abs(shift[0].dy) < 1) return null; // already level

  // Wide enough to carry the whole socket, narrow enough to leave the mouth and
  // hairline alone. Weights are normalised so overlapping falloffs cannot sum past 1.
  const SIGMA = 105;
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let dy = 0;
      for (const s of shift) {
        const w = Math.exp(-((x - s.x) ** 2 + (y - s.y) ** 2) / (2 * SIGMA * SIGMA));
        dy += s.dy * w;
      }
      const d = (y * W + x) * 4;
      const syf = clamp(y - dy, 0, H - 1);
      const y0 = Math.floor(syf), y1 = Math.min(y0 + 1, H - 1), ty = syf - y0;
      let acc = [0, 0, 0, 0];
      for (const [py, w] of [[y0, 1 - ty], [y1, ty]]) {
        const s = (py * W + x) * 4;
        const a = data[s + 3] / 255;
        acc[0] += data[s] * a * w; acc[1] += data[s + 1] * a * w; acc[2] += data[s + 2] * a * w; acc[3] += a * w;
      }
      const a = acc[3];
      out[d + 3] = Math.round(clamp(a * 255, 0, 255));
      if (a > 0.0001) {
        out[d] = Math.round(clamp(acc[0] / a, 0, 255));
        out[d + 1] = Math.round(clamp(acc[1] / a, 0, 255));
        out[d + 2] = Math.round(clamp(acc[2] / a, 0, 255));
      }
    }
  }
  return out;
}


/**
 * Stage 4 — bleed opaque colour outward into near-transparent edge pixels.
 * Alpha is preserved, so the silhouette is unchanged.
 */
function defringe(data, W, H, passes = 6) {
  const out = Buffer.from(data);
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) solid[i] = out[i * 4 + 3] >= 200 ? 1 : 0;
  let filled = 0;
  for (let pass = 0; pass < passes; pass++) {
    const next = Uint8Array.from(solid);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (solid[p]) continue; // includes fully transparent pixels: their stale colour still samples
        let r = 0, g = 0, b = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
          const q = ny * W + nx;
          if (!solid[q]) continue;
          r += out[q * 4]; g += out[q * 4 + 1]; b += out[q * 4 + 2]; n++;
        }
        if (!n) continue;
        out[p * 4] = Math.round(r / n);
        out[p * 4 + 1] = Math.round(g / n);
        out[p * 4 + 2] = Math.round(b / n);
        next[p] = 1;
        filled++;
      }
    }
    solid.set(next);
  }
  console.log(`defringe: recoloured ${filled} edge pixels`);
  return out;
}

(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const browFixed = repairBrow(data, W, H);
  const uprighted = upright(browFixed, W, H);
  // The warp moves the blob slightly less than asked, so settle it over a few passes.
  let final = uprighted;
  for (let pass = 0; pass < 4; pass++) {
    const next = levelEyes(final, W, H);
    if (!next) break;
    final = next;
  }
  final = defringe(final, W, H);
  await sharp(final, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 95, alphaQuality: 100 }).toFile(OUT);
  console.log("wrote", OUT);
  const check = findEyes(final, W, H);
  console.log(`final eye centres: left (${check[0].cx.toFixed(0)}, ${check[0].cy.toFixed(0)})  right (${check[1].cx.toFixed(0)}, ${check[1].cy.toFixed(0)})`);
})();
