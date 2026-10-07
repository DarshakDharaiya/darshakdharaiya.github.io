/**
 * Makes the portrait face the viewer squarely.
 *
 * The supplied portrait is a three-quarter pose: the eyes sit at different
 * heights, the brows slope the opposite way, one cheek bulges and the whole
 * head sits off-centre. A frontal projection is exactly what the 3D
 * reconstruction assumes, so the texture is rebuilt symmetric about the face's
 * own midline:
 *
 *   - the midline is found by maximising the overlap of the skin mask with its
 *     own mirror, rather than guessed
 *   - skin and features are mirrored, which levels the eyes and brows and makes
 *     the jaw symmetric; the midline itself is continuous, so there is no seam
 *   - hair keeps its original swept shape: a pixel is left alone wherever
 *     either side of the mirror is hair
 *   - the head is then centred on the canvas
 *
 * Run from the project root: node output/symmetrise-portrait.cjs
 */
const sharp = require("sharp");

const SRC = "output/avatar.original.webp";
const OUT = "public/memoji/avatar.webp";
const DARK = 165; // luminance below this is hair / lashes / brows
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const A = (x, y) => data[(y * W + x) * 4 + 3];
  const lum = (x, y) => {
    const i = (y * W + x) * 4;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  };

  // ── Hair = the dark region connected to the top of the head.
  // Brows, lashes and lips are dark too but are not connected to it, so they
  // count as face and get mirrored.
  const isDark = (x, y) => A(x, y) > 128 && lum(x, y) < DARK;
  const hair = new Uint8Array(W * H);
  const stack = [];
  for (let y = 0; y < 360; y++) for (let x = 0; x < W; x++) {
    if (isDark(x, y) && !hair[y * W + x]) { hair[y * W + x] = 1; stack.push(y * W + x); }
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const q = ny * W + nx;
      if (hair[q] || !isDark(nx, ny)) continue;
      hair[q] = 1; stack.push(q);
    }
  }

  // ── Midline: the vertical axis whose mirror best matches the head's own mask.
  // Measured over the face rows only, so the swept hair cannot bias it.
  const solid = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A(x, y) > 128) solid[y * W + x] = 1;
  const faceTop = 430, faceBottom = 950;
  let best = { m: W / 2, score: -1 };
  for (let m2 = Math.round(2 * 480); m2 <= Math.round(2 * 620); m2++) {
    let agree = 0, total = 0;
    for (let y = faceTop; y <= faceBottom; y += 2) {
      for (let x = 200; x < 900; x += 2) {
        const mx = m2 - x;
        if (mx < 0 || mx >= W) continue;
        const a = solid[y * W + x], b = solid[y * W + mx];
        total++;
        if (a === b) agree++;
      }
    }
    const score = agree / total;
    if (score > best.score) best = { m: m2 / 2, score };
  }
  const M2 = Math.round(best.m * 2); // mirror: x -> M2 - x
  console.log(`midline x = ${(M2 / 2).toFixed(1)}  (symmetry ${(best.score * 100).toFixed(1)}%)`);

  // ── Compose: mirrored face, original hair.
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const mx = M2 - x;
      const inside = mx >= 0 && mx < W;
      const origHair = hair[y * W + x] === 1;
      const mirrHair = inside && hair[y * W + mx] === 1;
      // Keep the original wherever either side is hair, so the swept fringe and
      // the long temple strand survive unduplicated.
      const useOriginal = origHair || mirrHair || !inside;
      const s = useOriginal ? i : (y * W + mx) * 4;
      out[i] = data[s]; out[i + 1] = data[s + 1]; out[i + 2] = data[s + 2]; out[i + 3] = data[s + 3];
    }
  }

  // ── Centre the head on the canvas.
  let left = W, right = -1, top = H, bottom = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (out[(y * W + x) * 4 + 3] <= 128) continue;
    if (x < left) left = x; if (x > right) right = x;
    if (y < top) top = y; if (y > bottom) bottom = y;
  }
  const shiftX = Math.round(W / 2 - (left + right) / 2);
  const shiftY = Math.round(H / 2 - (top + bottom) / 2);
  console.log(`head ${left}..${right} x ${top}..${bottom}  shift (${shiftX}, ${shiftY})`);
  const centred = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const sy = y - shiftY;
    if (sy < 0 || sy >= H) continue;
    for (let x = 0; x < W; x++) {
      const sx = x - shiftX;
      if (sx < 0 || sx >= W) continue;
      const d = (y * W + x) * 4, s = (sy * W + sx) * 4;
      centred[d] = out[s]; centred[d + 1] = out[s + 1]; centred[d + 2] = out[s + 2]; centred[d + 3] = out[s + 3];
    }
  }

  await sharp(centred, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 95, alphaQuality: 100 }).toFile(OUT);
  console.log("wrote", OUT);
  console.log(`new eye midline x = ${clamp(M2 / 2 + shiftX, 0, W).toFixed(1)}`);
})();
