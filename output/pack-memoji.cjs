const sharp = require("sharp");
const fs = require("node:fs/promises");

async function pack(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const tile = info.width / 3;
  const alpha = (x, y) => data[(y * info.width + x) * 4 + 3];
  const composite = [];
  const bounds = [];
  for (let sourceColumn = 0; sourceColumn < 3; sourceColumn++) {
    const left = sourceColumn * tile;
    const seam = (nominal) => {
      let minimum = Infinity;
      let candidates = [];
      for (let y = nominal - 30; y <= nominal + 30; y++) {
        let mass = 0;
        for (let x = left; x < left + tile; x++) if (alpha(x, y) > 160) mass++;
        if (mass < minimum) { minimum = mass; candidates = [y]; }
        else if (mass === minimum) candidates.push(y);
      }
      return candidates[Math.floor(candidates.length / 2)];
    };
    const cuts = [0, seam(tile), seam(tile * 2), info.height];
    for (let row = 0; row < 3; row++) {
      let x0 = left + tile, x1 = left, y0 = cuts[row + 1], y1 = cuts[row];
      for (let y = cuts[row]; y < cuts[row + 1]; y++) {
        for (let x = left; x < left + tile; x++) {
          if (alpha(x, y) > 160) {
            x0 = Math.min(x0, x); x1 = Math.max(x1, x);
            y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          }
        }
      }
      x0 = Math.max(left, x0 - 2); x1 = Math.min(left + tile - 1, x1 + 2);
      y0 = Math.max(cuts[row], y0 - 2); y1 = Math.min(cuts[row + 1] - 1, y1 + 2);
      const portrait = await sharp(input).extract({ left:x0, top:y0, width:x1-x0+1, height:y1-y0+1 })
        .resize({ width:396, height:396, fit:"inside" }).png().toBuffer();
      const metadata = await sharp(portrait).metadata();
      const destinationColumn = 2 - sourceColumn;
      composite.push({ input:portrait, left:destinationColumn*tile+Math.round((tile-metadata.width)/2), top:row*tile+Math.round((tile-metadata.height)/2) });
      bounds.push({ row, sourceColumn, destinationColumn, cuts, x0, y0, x1, y1 });
    }
  }
  const packed = await sharp({ create:{width:info.width,height:info.height,channels:4,background:{r:0,g:0,b:0,alpha:0}} }).composite(composite).png().toBuffer();
  await sharp(packed).webp({quality:86,alphaQuality:100}).toFile("public/memoji/directions.webp");
  await sharp(packed).extract({left:tile,top:tile,width:tile,height:tile}).webp({quality:90,alphaQuality:100}).toFile("public/memoji/default-frame.webp");
  await sharp(packed).flatten({background:"#f5f3f0"}).png().toFile("output/playwright/directions-packed-qa.png");
  await fs.writeFile("output/memoji-packing.json", JSON.stringify(bounds,null,2));
  console.log(JSON.stringify({width:info.width,height:info.height,bytes:(await fs.stat("public/memoji/directions.webp")).size,bounds}));
}

pack(process.argv[2]).catch(error=>{ console.error(error); process.exitCode=1; });
