/**
 * Copies lib/three/portraitGeometry.ts into output/.tmp as a Node-runnable
 * module (JSON import -> fs read) so output/render-portrait.mts can rasterise
 * the exact shipped geometry. Regenerate after editing the geometry.
 */
const fs = require("node:fs");
let src = fs.readFileSync("lib/three/portraitGeometry.ts", "utf8");
src = src.replace(
  'import outlineData from "./portraitOutline.json";',
  'import { readFileSync } from "node:fs";\nconst outlineData = JSON.parse(readFileSync(new URL("../../lib/three/portraitOutline.json", import.meta.url), "utf8"));',
);
src = src.replace('import type { MaterialTier } from "./materials";', 'type MaterialTier = "high" | "medium" | "low";');
fs.mkdirSync("output/.tmp", { recursive: true });
fs.writeFileSync("output/.tmp/portraitGeometry.mts", src);
console.log("synced output/.tmp/portraitGeometry.mts");
