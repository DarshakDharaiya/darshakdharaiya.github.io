/** Extract the fixed hero texture and silhouette. Run: node output/build-head.cjs */
const fs = require("node:fs");
const sharp = require("sharp");
const TILE = 512;

(async () => {
  const { data: pixels } = await sharp("public/memoji/poses.webp")
    .extract({ left: TILE * 4, top: 0, width: TILE, height: TILE })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rows = [];
  for (let y = 0; y < TILE; y++) {
    let left = TILE, right = -1;
    for (let x = 0; x < TILE; x++) if (pixels[(y * TILE + x) * 4 + 3] >= 180) {
      left = Math.min(left, x); right = x;
    }
    rows.push(right >= left ? [left / TILE, (right + 1) / TILE] : null);
  }
  const top = rows.findIndex(Boolean), bottom = rows.findLastIndex(Boolean);
  const outline = Array.from({ length: 129 }, (_, i) => {
    const y = Math.round(top + (bottom - top) * i / 128);
    const nearby = rows.slice(Math.max(top, y - 2), Math.min(bottom + 1, y + 3)).filter(Boolean);
    return [0, 1].map(axis => nearby.reduce((sum, row) => sum + row[axis], 0) / nearby.length);
  });
  // Extend edge colours into transparent pixels to avoid black texture fringes.
  let rgb = Buffer.from(pixels), valid = Uint8Array.from({ length: TILE * TILE }, (_, i) => pixels[i * 4 + 3] > 32 ? 1 : 0);
  for (let pass = 0; pass < 5; pass++) {
    const next = Buffer.from(rgb), nextValid = Uint8Array.from(valid);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      if (valid[i]) continue;
      const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
        .filter(([a, b]) => a >= 0 && a < TILE && b >= 0 && b < TILE)
        .map(([a, b]) => b * TILE + a).filter(n => valid[n]);
      if (!neighbors.length) continue;
      for (let c = 0; c < 3; c++) next[i * 4 + c] = Math.round(neighbors.reduce((sum, n) => sum + rgb[n * 4 + c], 0) / neighbors.length);
      nextValid[i] = 1;
    }
    rgb = next; valid = nextValid;
  }
  await sharp(rgb, { raw: { width: TILE, height: TILE, channels: 4 } }).webp({ lossless: true }).toFile("public/memoji/head.webp");
  fs.writeFileSync("data/memojiHead.json", JSON.stringify({ src: "/memoji/head.webp", top: top / TILE, bottom: bottom / TILE, outline }) + "\n");
  console.log("Built fixed portrait and 129 silhouette samples");
})();
