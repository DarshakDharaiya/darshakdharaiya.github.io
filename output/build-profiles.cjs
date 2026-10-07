/** Fit depth to the supplied right profile and pack fixed front/side textures.
 * Run after build-head.cjs: node output/build-profiles.cjs
 * Source PNGs are the user's supplied profile references, retained in poses-src.
 */
const fs = require('node:fs');
const sharp = require('sharp');
const head = require('../data/memojiHead.json');
const SIZE = 4, TILE = 512;
const right = { path: 'output/poses-src/profile-right.png', axis: 500, eye: 665 };
const left = { path: 'output/poses-src/profile-left.png', axis: 845, eye: 651 };

// Extend surface colours beyond the cutout for projection sampling. The mesh
// supplies the silhouette; black source backgrounds must never tint its edges.
function extendRows(data, width, height, rows) {
  const valid = rows.map((r, y) => r ? y : -1).filter(y => y >= 0);
  const source = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    const sourceRow = rows[y] ? y : valid.reduce((best, candidate) => Math.abs(candidate-y)<Math.abs(best-y)?candidate:best, valid[0]);
    const [l, r] = rows[sourceRow];
    for (let x = 0; x < width; x++) {
      if (y === sourceRow && x >= l && x <= r && source[(y*width+x)*4+3] >= 180) continue;
      let nearest = Math.round(Math.max(l + Math.min(3, (r-l)/2), Math.min(r - Math.min(3, (r-l)/2), x)));
      if (source[(sourceRow*width+nearest)*4+3] < 180) {
        for (let distance=1;distance<=width;distance++) {
          if(nearest-distance>=l && source[(sourceRow*width+nearest-distance)*4+3]>=180){nearest-=distance;break;}
          if(nearest+distance<=r && source[(sourceRow*width+nearest+distance)*4+3]>=180){nearest+=distance;break;}
        }
      }
      const dest = (y * width + x) * 4, from = (sourceRow * width + nearest) * 4;
      for (let c=0;c<3;c++) data[dest+c] = source[from+c];
      data[dest+3] = 255;
    }
  }
  return data;
}

async function prepare(profile) {
  const { data, info } = await sharp(profile.path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rows = Array.from({ length: info.height }, () => null);
  for (let y = 0; y < info.height; y++) {
    let l = info.width, r = -1;
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (Math.max(data[i], data[i + 1], data[i + 2]) < 26) continue;
      l = Math.min(l, x); r = x;
    }
    if (r >= l) rows[y] = [l, r];
  }
  const top = rows.findIndex(Boolean), bottom = rows.findLastIndex(Boolean);
  const eyeV = .551;
  const sourceY = v => v < eyeV
    ? top + (v - head.top) / (eyeV - head.top) * (profile.eye - top)
    : profile.eye + (v - eyeV) / (head.bottom - eyeV) * (bottom - profile.eye);
  const scale = (head.bottom - head.top) * SIZE / (bottom - top);
  return {
    profile, info, scale, sourceY,
    contour: Array.from({ length: 129 }, (_, i) => {
      const y = Math.round(sourceY(head.top + (head.bottom - head.top) * i / 128));
      const nearby = rows.slice(Math.max(top, y - 3), Math.min(bottom + 1, y + 4)).filter(Boolean);
      return [0, 1].map(axis => (nearby.reduce((sum, row) => sum + row[axis], 0) / nearby.length - profile.axis) * scale);
    }),
    texture: await sharp(extendRows(data,info.width,info.height,rows), { raw: { width: info.width, height: info.height, channels: 4 } }).resize(TILE,TILE).png().toBuffer(),
  };
}

(async () => {
  const r = await prepare(right), l = await prepare(left);
  const { data: frontData } = await sharp('public/memoji/head.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const frontRows = Array.from({length:TILE},(_,y)=>{
    let l=TILE,r=-1;
    for(let x=0;x<TILE;x++) if(frontData[(y*TILE+x)*4+3]>180){l=Math.min(l,x);r=x;}
    return r>=l?[l,r]:null;
  });
  const front = await sharp(extendRows(frontData,TILE,TILE,frontRows),{raw:{width:TILE,height:TILE,channels:4}}).png().toBuffer();
  await sharp({ create: { width: TILE * 3, height: TILE, channels: 4, background: '#000000' } })
    .composite([{ input: front, left: 0, top: 0 }, { input: r.texture, left: TILE, top: 0 }, { input: l.texture, left: TILE * 2, top: 0 }])
    .webp({ lossless: true }).toFile('public/memoji/head-atlas.webp');
  const mapping = p => ({ axis: p.profile.axis / p.info.width, zToU: 1 / p.scale / p.info.width,
    y: Array.from({ length: 129 }, (_, i) => p.sourceY(head.top + (head.bottom - head.top) * i / 128) / p.info.height) });
  const result = { src: '/memoji/head-atlas.webp', tile: TILE, count: 3, depth: r.contour, right: mapping(r), left: mapping(l) };
  fs.writeFileSync('data/memojiProfile.json', JSON.stringify(result) + '\n');
  console.log(`Depth fitted to profile; scale ${r.scale.toFixed(5)} units/pixel; atlas 1536 × 512`);
})();
