/**
 * Builds the hero avatar's pose strip from the supplied Memoji renders.
 *
 * The renders arrive on solid black with no alpha, at different scales and
 * framings. For the head to turn without jumping, every pose must be cut out,
 * scaled alike and anchored on the same point:
 *
 *   1. cut out  — the background is flood-filled from the border (near-black
 *                 only, so the dark hair survives), then foreground colour is
 *                 padded outward before the alpha edge is softened, which is
 *                 what stops a black halo appearing around the head
 *   2. normalise — each head is scaled so its diagonal matches, which stays
 *                 stable as the head turns (width alone collapses in profile,
 *                 height alone drifts when the chin lifts), then centred
 *   3. pack     — one horizontal strip plus a manifest of each tile's angle
 *
 * Run from the project root: node output/build-poses.cjs
 */
const fs = require("node:fs");
const sharp = require("sharp");

const SRC = "output/poses-src";
const OUT = "public/memoji/poses.webp";
const MANIFEST = "data/memojiPoses.json";
const TILE = 512;
const TARGET_DIAGONAL = 0.86; // of the tile
const BG_LEVEL = 26; // a pixel this dark on the border is background

/**
 * Source renders and the direction each one faces, in degrees.
 * yaw: negative = turned toward the viewer's left. pitch: negative = chin up.
 * `flip` mirrors a render to cover the turn on the other side.
 */
const POSES = [
  { file: "7.webp", yaw: -90, pitch: 0 },
  { file: "4.webp", yaw: -38, pitch: 0, flip: true },
  { file: "5.webp", yaw: -20, pitch: 0, flip: true },
  { file: "3.webp", yaw: 0, pitch: -26 },
  { file: "1.webp", yaw: 0, pitch: 0 },
  { file: "8.webp", yaw: 0, pitch: 26 },
  { file: "5.webp", yaw: 20, pitch: 0 },
  { file: "4.webp", yaw: 38, pitch: 0 },
  { file: "6.webp", yaw: 90, pitch: 0 },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Flood fill the near-black border inward; interior darks (hair) are kept. */
function cutOut(data, W, H) {
  const bg = new Uint8Array(W * H);
  const isDark = (p) => data[p * 4] < BG_LEVEL && data[p * 4 + 1] < BG_LEVEL && data[p * 4 + 2] < BG_LEVEL;
  const stack = [];
  const push = (p) => { if (!bg[p] && isDark(p)) { bg[p] = 1; stack.push(p); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (y > 0) push(p - W);
    if (y < H - 1) push(p + W);
  }

  // Pad head colour outward so softening the alpha cannot pull in black.
  const out = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    out[p * 4] = data[p * 4]; out[p * 4 + 1] = data[p * 4 + 1]; out[p * 4 + 2] = data[p * 4 + 2];
    out[p * 4 + 3] = bg[p] ? 0 : 255;
  }
  let solid = Uint8Array.from(bg, (v) => (v ? 0 : 1));
  for (let pass = 0; pass < 3; pass++) {
    const next = Uint8Array.from(solid);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (solid[p]) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
          const q = ny * W + nx;
          if (!solid[q]) continue;
          r += out[q * 4]; g += out[q * 4 + 1]; b += out[q * 4 + 2]; n++;
        }
        if (!n) continue;
        out[p * 4] = Math.round(r / n); out[p * 4 + 1] = Math.round(g / n); out[p * 4 + 2] = Math.round(b / n);
        next[p] = 1;
      }
    }
    solid = next;
  }

  // Soften the alpha edge (3x3 box) now that the colour behind it is correct.
  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = bg[p] ? 0 : 255;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        sum += alpha[ny * W + nx]; n++;
      }
      out[(y * W + x) * 4 + 3] = Math.round(sum / n);
    }
  }
  return out;
}

function bounds(data, W, H) {
  let l = W, r = -1, t = H, b = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] < 40) continue;
    if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y;
  }
  return { l, r, t, b, w: r - l + 1, h: b - t + 1 };
}

(async () => {
  const prepared = [];
  for (const pose of POSES) {
    const { data, info } = await sharp(`${SRC}/${pose.file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const cut = cutOut(data, info.width, info.height);
    const box = bounds(cut, info.width, info.height);
    const diagonal = Math.hypot(box.w, box.h);
    prepared.push({ pose, cut, info, box, diagonal });
    console.log(`${pose.file} yaw=${String(pose.yaw).padStart(4)} pitch=${String(pose.pitch).padStart(3)}${pose.flip ? " (mirrored)" : ""}  head ${box.w}x${box.h}  diag ${diagonal.toFixed(0)}`);
  }

  const tiles = [];
  for (const { pose, cut, info, box, diagonal } of prepared) {
    const scale = (TILE * TARGET_DIAGONAL) / diagonal;
    const w = Math.max(1, Math.round(box.w * scale));
    const h = Math.max(1, Math.round(box.h * scale));
    let tile = sharp(cut, { raw: { width: info.width, height: info.height, channels: 4 } })
      .extract({ left: box.l, top: box.t, width: box.w, height: box.h })
      .resize(w, h, { fit: "fill", kernel: "lanczos3" });
    if (pose.flip) tile = tile.flop();
    const resized = await tile.png().toBuffer();
    const canvas = await sharp({ create: { width: TILE, height: TILE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: resized, left: Math.round((TILE - w) / 2), top: Math.round((TILE - h) / 2) }])
      .png()
      .toBuffer();
    tiles.push(canvas);
  }

  const strip = await sharp({
    create: { width: TILE * tiles.length, height: TILE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(tiles.map((input, i) => ({ input, left: i * TILE, top: 0 })))
    .webp({ quality: 92, alphaQuality: 100 })
    .toBuffer();
  fs.writeFileSync(OUT, strip);

  const manifest = {
    src: "/memoji/poses.webp",
    tile: TILE,
    count: tiles.length,
    // Mirrored tiles face the other way, so record the direction actually drawn.
    poses: POSES.map((p, i) => ({ index: i, yaw: p.yaw, pitch: p.pitch })),
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nwrote ${OUT} (${(strip.length / 1024).toFixed(0)} KB, ${tiles.length} tiles of ${TILE}px)`);
  console.log(`wrote ${MANIFEST}`);
})();
