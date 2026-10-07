/**
 * Measures the portrait's pose: silhouette midline, roll angle, eye and brow
 * placement. Run from the project root: node output/measure-portrait.cjs [file]
 */
const sharp = require("sharp");

const FILE = process.argv[2] || "output/avatar.original.webp";

(async () => {
  const { data, info } = await sharp(FILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const at = (x, y) => { const i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];

  // ── Silhouette
  const rows = [];
  for (let y = 0; y < H; y++) {
    let left = -1, right = -1;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { left = x; break; }
    for (let x = W - 1; x >= 0; x--) if (data[(y * W + x) * 4 + 3] > 128) { right = x; break; }
    rows.push({ y, left, right, mid: left < 0 ? -1 : (left + right) / 2, w: left < 0 ? 0 : right - left });
  }
  const filled = rows.filter((r) => r.left >= 0);
  const top = filled[0].y, bottom = filled[filled.length - 1].y;
  console.log(`canvas ${W}x${H}  head rows ${top}..${bottom}  height ${bottom - top}`);

  console.log("\nrow   left right  mid  width");
  for (let i = 0; i <= 10; i++) {
    const y = Math.round(top + ((bottom - top) * i) / 10);
    const r = rows[y];
    console.log(String(y).padStart(4), String(r.left).padStart(5), String(r.right).padStart(5), String(Math.round(r.mid)).padStart(5), String(r.w).padStart(5));
  }

  // Midline drift across the lower (face) half tells us the roll + off-centre amount.
  const faceRows = filled.filter((r) => r.y > top + (bottom - top) * 0.45);
  const n = faceRows.length;
  const meanY = faceRows.reduce((s, r) => s + r.y, 0) / n;
  const meanM = faceRows.reduce((s, r) => s + r.mid, 0) / n;
  let num = 0, den = 0;
  for (const r of faceRows) { num += (r.y - meanY) * (r.mid - meanM); den += (r.y - meanY) ** 2; }
  const slope = num / den;
  console.log(`\nface midline: mean x ${meanM.toFixed(1)} (canvas centre ${(W / 2).toFixed(1)}, off by ${(meanM - W / 2).toFixed(1)})`);
  console.log(`face midline slope ${slope.toFixed(4)} -> roll ${(Math.atan(slope) * 180 / Math.PI).toFixed(2)} deg`);

  // ── Dark features (pupils, brows) in the upper face
  const comps = [];
  const seen = new Int32Array(W * H).fill(-1);
  const dark = (x, y) => { const p = at(x, y); return p[3] > 200 && lum(p) < 150; };
  for (let y = 400; y < 700; y++) {
    for (let x = 200; x < 900; x++) {
      if (seen[y * W + x] !== -1 || !dark(x, y)) continue;
      const id = comps.length; const stack = [[x, y]]; seen[y * W + x] = id;
      let minX = x, maxX = x, minY = y, maxY = y, cnt = 0, sxw = 0, syw = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop(); cnt++; sxw += cx; syw += cy;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 200 || nx >= 900 || ny < 400 || ny >= 700) continue;
          if (seen[ny * W + nx] !== -1 || !dark(nx, ny)) continue;
          seen[ny * W + nx] = id; stack.push([nx, ny]);
        }
      }
      comps.push({ cnt, minX, maxX, minY, maxY, cx: sxw / cnt, cy: syw / cnt });
    }
  }
  comps.sort((a, b) => b.cnt - a.cnt);
  console.log("\nlargest dark features (brows / eyes):");
  for (const c of comps.slice(0, 5)) {
    console.log(`  px=${String(c.cnt).padStart(5)} x=${c.minX}..${c.maxX} y=${c.minY}..${c.maxY} centre=(${c.cx.toFixed(0)},${c.cy.toFixed(0)})`);
  }
})();
