const sharp = require("sharp");
const fs = require("node:fs/promises");

async function extract() {
  const {data,info} = await sharp("public/memoji/avatar.webp").ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const spans=[];
  for(let y=0;y<info.height;y++) {
    let left=info.width,right=-1;
    for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>180) {left=Math.min(left,x);right=Math.max(right,x);}
    if(right>=left) spans.push({y,left,right});
  }
  const top=spans[0].y, bottom=spans[spans.length-1].y;
  const rows=[];
  for(let i=0;i<=192;i++) {
    const y=Math.round(top+(bottom-top)*i/192);
    const row=spans.reduce((closest,current)=>Math.abs(current.y-y)<Math.abs(closest.y-y)?current:closest,spans[0]);
    const color=(x)=>{const index=(row.y*info.width+x)*4;return Array.from(data.subarray(index,index+3)).map(value=>value/255);};
    rows.push({v:row.y/info.height,left:row.left/info.width,right:row.right/info.width,leftColor:color(Math.min(row.right,row.left+3)),rightColor:color(Math.max(row.left,row.right-3))});
  }
  const result={width:info.width,height:info.height,top:top/info.height,bottom:bottom/info.height,rows};
  await fs.writeFile("lib/three/portraitOutline.json",JSON.stringify(result));
  console.log(JSON.stringify({width:info.width,height:info.height,top,bottom,rows:rows.length,first:rows[0],last:rows[rows.length-1]}));
}
extract().catch(error=>{console.error(error);process.exitCode=1;});
