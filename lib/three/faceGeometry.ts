import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { MaterialTier } from "./materials";

/** A complete, closed 3D head; all features have depth and survive rotation. */
export function createFaceGeometries(tier: MaterialTier) {
  const segments = tier === "low" ? 40 : tier === "medium" ? 64 : 88;
  const ellipsoid = (x: number, y: number, z: number) => {
    const geometry = new THREE.SphereGeometry(1, segments, segments / 2);
    geometry.scale(x, y, z);
    return geometry;
  };
  const head = ellipsoid(0.93, 1.12, 0.89);
  const positions = head.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const taper = y < 0 ? 1 - 0.23 * Math.pow(-y / 1.12, 1.6) : 1;
    positions.setX(i, positions.getX(i) * taper);
  }
  head.computeVertexNormals();

  // One continuous swept cap, with sculpted comb grooves rather than intersecting tufts.
  const hairVertices: number[] = [];
  const hairIndices: number[] = [];
  const rows = segments / 2;
  for (let row = 0; row <= rows; row++) {
    const u = row / rows;
    for (let col = 0; col <= segments; col++) {
      const phi = (col / segments) * Math.PI * 2;
      const front = Math.max(0, Math.sin(phi));
      const back = Math.max(0, -Math.sin(phi));
      const hairline = 0.08 + front * 0.66 - back * 0.55 + front * 0.055 * Math.cos(phi);
      const theta = u * Math.acos(hairline / 1.12);
      const top = Math.pow(Math.max(0, Math.cos(theta)), 2);
      const x = -Math.cos(phi) * Math.sin(theta);
      const z = Math.sin(phi) * Math.sin(theta);
      const sweep = x + z * 0.22 + 0.12 * Math.sin(z * 2.4);
      const groove = Math.cos(sweep * 23) * 0.017 * top * Math.sin(u * Math.PI);
      const shellY = Math.cos(theta) * 1.12;
      const taper = shellY < 0 ? 1 - 0.23 * Math.pow(-shellY / 1.12, 1.6) : 1;
      const shell = new THREE.Vector3(x * 0.93 * taper, shellY, z * 0.89).multiplyScalar(1.015);
      const quiff = new THREE.Vector3(
        Math.sign(x) * Math.pow(Math.abs(x), 0.72) * (0.98 + top * 0.32 + groove) - top * 0.10,
        Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), 0.78) * 1.08 + top * (0.25 - x * 0.09) + groove,
        Math.sign(z) * Math.pow(Math.abs(z), 0.78) * (0.96 + groove) + front * top * 0.07,
      );
      // The hairline meets the actual scalp; volume grows smoothly above it.
      shell.lerp(quiff, Math.pow(1 - u, 0.35));
      hairVertices.push(shell.x, shell.y, shell.z);
      if (row < rows && col < segments) {
        const a = row * (segments + 1) + col;
        const b = a + segments + 1;
        hairIndices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const hair = new THREE.BufferGeometry();
  hair.setAttribute("position", new THREE.Float32BufferAttribute(hairVertices, 3));
  hair.setIndex(hairIndices);
  hair.computeVertexNormals();

  const ears = ellipsoid(0.145, 0.28, 0.15);
  const earInner = ellipsoid(0.073, 0.17, 0.045);
  const tip = ellipsoid(0.14, 0.16, 0.18);
  tip.translate(0, -0.21, 0.93);
  const bridge = ellipsoid(0.085, 0.17, 0.08);
  bridge.translate(0, -0.07, 0.85);
  const nose = mergeGeometries([tip, bridge])!;
  tip.dispose();
  bridge.dispose();

  const tube = (points: THREE.Vector3[], radius: number) =>
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, radius, 10, false);
  const brow = tube([
    new THREE.Vector3(-0.23, -0.005, -0.02),
    new THREE.Vector3(-0.15, 0.055, 0),
    new THREE.Vector3(0, 0.075, 0.015),
    new THREE.Vector3(0.18, 0.035, 0),
  ], 0.033);
  const eyeWhite = ellipsoid(0.255, 0.135, 0.09);
  const iris = ellipsoid(0.12, 0.12, 0.022);
  const irisPositions = iris.attributes.position;
  const irisUV = iris.attributes.uv;
  for (let i = 0; i < irisPositions.count; i++) {
    irisUV.setXY(i, irisPositions.getX(i) / 0.24 + 0.5, irisPositions.getY(i) / 0.24 + 0.5);
  }
  const pupil = ellipsoid(0.082, 0.086, 0.012);
  const glint = ellipsoid(0.022, 0.022, 0.009);
  const lidVertices: number[] = [];
  const lidIndices: number[] = [];
  for (let row = 0; row <= 4; row++) {
    const v = row / 4;
    for (let col = 0; col <= 32; col++) {
      const x = -0.255 + (col / 32) * 0.51;
      const arc = Math.sqrt(Math.max(0, 1 - (x / 0.255) ** 2));
      lidVertices.push(x, arc * (0.081 + v * 0.054), arc * (0.115 - v * 0.10));
      if (row < 4 && col < 32) {
        const a = row * 33 + col;
        lidIndices.push(a, a + 1, a + 33, a + 1, a + 34, a + 33);
      }
    }
  }
  const lid = new THREE.BufferGeometry();
  lid.setAttribute("position", new THREE.Float32BufferAttribute(lidVertices, 3));
  lid.setIndex(lidIndices);
  lid.computeVertexNormals();
  const lash = tube([
    new THREE.Vector3(-0.255, 0, 0),
    new THREE.Vector3(-0.13, 0.070, 0.099),
    new THREE.Vector3(0, 0.081, 0.115),
    new THREE.Vector3(0.13, 0.070, 0.099),
    new THREE.Vector3(0.255, 0, 0),
  ], 0.012);
  const smile = tube([
    new THREE.Vector3(-0.285, 0.025, -0.02),
    new THREE.Vector3(-0.15, -0.023, 0.027),
    new THREE.Vector3(0, -0.035, 0.04),
    new THREE.Vector3(0.15, -0.012, 0.027),
    new THREE.Vector3(0.285, 0.045, -0.02),
  ], 0.013);
  const lipShape = new THREE.Shape();
  lipShape.moveTo(-0.28, 0.015);
  lipShape.bezierCurveTo(-0.12, -0.05, 0.10, -0.04, 0.28, 0.033);
  lipShape.bezierCurveTo(0.16, -0.065, -0.10, -0.085, -0.28, 0.015);
  const lip = new THREE.ExtrudeGeometry(lipShape, { depth: 0.015, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 3, steps: 1, curveSegments: 24 });
  const openShape = new THREE.Shape();
  openShape.moveTo(-0.265, 0.028);
  openShape.quadraticCurveTo(0, -0.02, 0.265, 0.028);
  openShape.bezierCurveTo(0.22, -0.25, -0.22, -0.25, -0.265, 0.028);
  const mouthOpen = new THREE.ShapeGeometry(openShape, 24);
  const teethShape = new THREE.Shape();
  teethShape.moveTo(-0.225, 0.012);
  teethShape.quadraticCurveTo(0, -0.03, 0.225, 0.012);
  teethShape.quadraticCurveTo(0.18, -0.067, 0, -0.077);
  teethShape.quadraticCurveTo(-0.18, -0.067, -0.225, 0.012);
  const teeth = new THREE.ShapeGeometry(teethShape, 24);
  return { head, hair, ears, earInner, nose, brow, eyeWhite, iris, pupil, glint, lid, lash, smile, lip, mouthOpen, teeth };
}
