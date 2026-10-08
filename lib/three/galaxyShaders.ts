/**
 * GLSL for the spiral galaxy.
 *
 * The arms are wound by the vertex shader rather than on the CPU, so the whole
 * galaxy is one static buffer and one draw call with nothing uploaded per frame.
 */

export const galaxyVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSpinRate;
uniform float uScale;
uniform float uReduced;

uniform vec3 uCore;
uniform vec3 uMid;
uniform vec3 uOuter;
uniform vec3 uHot;

attribute float aRadius;
attribute float aSize;
attribute float aSeed;
/** Per-star brightness jitter, and 1.0 for the rare hot giants. */
attribute float aShade;
attribute float aHot;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Differential rotation: the core sweeps round while the outer arms barely move,
  // which is what winds the spiral tighter over time.
  float angle = uTime * uSpinRate / (0.34 + aRadius * 0.9);
  float s = sin(angle);
  float c = cos(angle);
  vec3 p = position;
  p.x = position.x * c - position.z * s;
  p.z = position.x * s + position.z * c;
  p.y += sin(uTime * 0.21 + aSeed * 6.2831) * 0.3 * (0.2 + aRadius);
  p *= uScale;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = mix(1.0, 0.68 + 0.32 * sin(uTime * (0.7 + aSeed * 2.6) + aSeed * 14.0), 1.0 - uReduced);

  // Colour is mixed here rather than baked into the buffer, so switching theme is a
  // uniform crossfade instead of a geometry rebuild.
  vec3 tint = aRadius < 0.35
    ? mix(uCore, uMid, aRadius / 0.35)
    : mix(uMid, uOuter, (aRadius - 0.35) / 0.65);
  tint = mix(tint, uHot, aHot * 0.8);
  vColor = tint * aShade;
  vAlpha = twinkle;
  gl_PointSize = aSize * uPixelRatio * (175.0 / max(-mv.z, 1.0));
}
`;

export const galaxyFragment = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  // Tight core with a wide falloff halo — stars read as points, not squares.
  float disc = (1.0 - smoothstep(0.06, 0.5, d)) * 0.8 + pow(1.0 - smoothstep(0.0, 0.5, d), 3.0) * 0.28;
  float a = disc * vAlpha * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

/** Soft bulge at the galactic centre: brightest head-on, fading toward the limb. */
export const coreGlowVertex = /* glsl */ `
varying vec3 vNormalV;
void main() {
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const coreGlowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uPower;
uniform float uOpacity;
varying vec3 vNormalV;

void main() {
  float g = pow(clamp(dot(normalize(vNormalV), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), uPower);
  float a = g * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}
`;
