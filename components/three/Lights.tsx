"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Portrait-studio lighting for the avatar — no HDR download.
 * Big soft key from front-left, gentle fill, and two rim lights that separate the
 * silhouette from the dark particle field (the classic Memoji "glow edge").
 * The environment is rendered once (frames={1}) and only feeds soft reflections.
 */
export function Lights() {
  return (
    <>
      <Environment resolution={128} frames={1} background={false}>
        <color attach="background" args={["#1a1b22"]} />
        <Lightformer form="rect" intensity={2.2} position={[-3, 3, 6]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={1} position={[4, 0, 5]} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={3} position={[0, 6, -4]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="circle" color="#8b95ff" intensity={3} position={[6, 2, -5]} scale={3} />
      </Environment>
      <hemisphereLight args={["#ffffff", "#3a3440", 0.9]} />
      {/* Key */}
      <directionalLight position={[-3, 4, 6]} intensity={2.1} color="#fff4ea" />
      {/* Fill */}
      <directionalLight position={[4, 0, 5]} intensity={0.6} color="#e6ebff" />
      {/* Rims */}
      <directionalLight position={[4, 3, -5]} intensity={2.2} color="#9aa3ff" />
      <directionalLight position={[-4, 2, -5]} intensity={1.4} color="#ffd9c4" />
    </>
  );
}
