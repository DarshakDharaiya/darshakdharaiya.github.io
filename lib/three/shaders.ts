/**
 * GLSL for the particle environment.
 * Points and constellation lines share `displace()` so lines stay glued to their particles.
 */

const common = /* glsl */ `
uniform float uTime;
uniform vec2  uPointer;         // NDC
uniform float uPointerStrength; // 0..1, eased on CPU
uniform float uAspect;
uniform float uCamZ;
uniform float uDepth;
uniform float uEnergy;
uniform float uSpread;
uniform float uDensity;

attribute vec4 aSeed;
attribute float aAnchorZ;

varying float vAlpha;
varying float vInfluence;
varying float vTint;

// Organic drift + infinite depth wrapping around the camera.
vec3 displace(vec3 p, vec4 seed, float anchorZ) {
  p.xy *= uSpread;
  float speed = (0.06 + seed.x * 0.09) * (0.55 + uEnergy);
  float t = uTime * speed;
  p.x += sin(t + seed.y * 6.2831) * (0.25 + seed.z * 0.45);
  p.y += cos(t * 0.83 + seed.z * 6.2831) * (0.25 + seed.w * 0.35);
  p.z += sin(t * 0.61 + seed.x * 6.2831) * 0.35;

  // Wrap by the anchor so paired line vertices always wrap together
  float rel = anchorZ - uCamZ;
  float wrapped = mod(rel + uDepth - 3.0, uDepth) - uDepth + 3.0;
  p.z += wrapped - rel;
  return p;
}

// Pointer field: particles near the cursor are pushed outward and swirled.
vec4 applyPointer(vec4 mv, out float influence) {
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 d = ndc - uPointer;
  d.x *= uAspect;
  float dist = length(d);
  influence = (1.0 - smoothstep(0.0, 0.32, dist)) * uPointerStrength;
  vec2 dir = d / max(dist, 1e-4);
  vec2 swirl = vec2(-dir.y, dir.x);
  float depthScale = -mv.z * 0.055;
  mv.xy += (dir * 0.9 + swirl * 0.45) * influence * depthScale;
  return mv;
}

float depthFade(float viewZ) {
  // fade in from the far plane, out right before the camera
  return (1.0 - smoothstep(uDepth * 0.55, uDepth - 1.0, -viewZ)) * smoothstep(0.4, 2.2, -viewZ);
}
`;

export const pointsVertex = /* glsl */ `
${common}
uniform float uPixelRatio;
attribute float aSize;

void main() {
  vec3 p = displace(position, aSeed, aAnchorZ);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float influence;
  mv = applyPointer(mv, influence);
  gl_Position = projectionMatrix * mv;

  float visible = step(aSeed.w, uDensity);
  vAlpha = visible * depthFade(mv.z);
  vInfluence = influence;
  vTint = aSeed.y;
  gl_PointSize = aSize * (1.0 + influence * 1.4) * uPixelRatio * (26.0 / -mv.z);
}
`;

export const pointsFragment = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
varying float vAlpha;
varying float vInfluence;
varying float vTint;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float disc = 1.0 - smoothstep(0.08, 0.5, r);
  float a = disc * vAlpha * uOpacity * (0.45 + vInfluence * 0.9);
  if (a < 0.004) discard;
  vec3 col = mix(uColorA, uColorB, clamp(step(0.8, vTint) + vInfluence, 0.0, 1.0));
  gl_FragColor = vec4(col, a);
}
`;

export const linesVertex = /* glsl */ `
${common}
void main() {
  vec3 p = displace(position, aSeed, aAnchorZ);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float influence;
  mv = applyPointer(mv, influence);
  gl_Position = projectionMatrix * mv;
  vAlpha = depthFade(mv.z);
  vInfluence = influence;
  vTint = aSeed.y;
}
`;

export const linesFragment = /* glsl */ `
uniform vec3 uColorB;
uniform float uOpacity;
varying float vAlpha;
varying float vInfluence;
varying float vTint;
void main() {
  float a = vAlpha * uOpacity * (0.35 + vInfluence * 2.2);
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColorB, a);
}
`;
