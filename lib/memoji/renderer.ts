import {
  Color, Mesh, PerspectiveCamera, Scene, ShaderMaterial, SRGBColorSpace,
  Texture, Vector2, WebGLRenderer,
} from "three";
import { createHeadGeometry } from "./geometry";

const VERTEX = `
attribute vec2 sideUv;
attribute float sideWeight;
attribute float earSurface;
attribute vec2 earUv;
varying vec2 portraitUv;
varying vec2 profileUv;
varying float profileWeight;
varying float ear;
varying vec2 earTextureUv;
varying vec3 surfaceNormal;
varying float headDepth;
varying float headWidth;
void main() {
  portraitUv = uv;
  profileUv = sideUv;
  profileWeight = sideWeight;
  ear = earSurface;
  earTextureUv = earUv;
  surfaceNormal = normalize(normalMatrix * normal);
  headDepth = position.z;
  headWidth = abs(position.x);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAGMENT = `
uniform sampler2D portrait;
uniform float blink;
uniform vec2 gaze;
varying vec2 portraitUv;
varying vec2 profileUv;
varying float profileWeight;
varying float ear;
varying vec2 earTextureUv;
varying vec3 surfaceNormal;
varying float headDepth;
varying float headWidth;

vec3 samplePortrait(vec2 uv) {
  return texture2D(portrait, vec2(uv.x / 3.0, 1.0 - uv.y)).rgb;
}

vec3 eye(vec3 original, vec2 center, vec2 radius) {
  vec2 p = portraitUv - center;
  float x = p.x / radius.x;
  if (abs(x) > 1.3 || abs(p.y) > radius.y * 1.4) return original;
  float arc = sqrt(max(0.0, 1.0 - x * x));
  float mask = 1.0 - smoothstep(1.12, 1.28, length(p / radius));
  float movingLid = smoothstep(0.0, .08, blink);
  float closedLine = .009 * arc;
  float upper = mix(-radius.y * arc, closedLine, blink);
  float lower = mix(radius.y * arc, closedLine, blink);
  vec3 upperSkin = samplePortrait(vec2(portraitUv.x, center.y - radius.y * 1.8));
  vec3 lowerSkin = samplePortrait(vec2(portraitUv.x, center.y + radius.y * 1.6));
  float upperMask = (1.0 - smoothstep(upper - .001, upper + .001, p.y)) * mask * movingLid;
  float lowerMask = smoothstep(lower - .001, lower + .001, p.y) * mask * movingLid;
  vec3 looking = samplePortrait(portraitUv - gaze * vec2(.006, .0035));
  float gazeMask = 1.0 - smoothstep(.85, 1.05, length(p / radius));
  vec3 color = mix(original, looking, gazeMask * (1.0 - blink));
  color = mix(color, upperSkin * (1.0 - .05 * blink * arc), upperMask);
  color = mix(color, lowerSkin, lowerMask);
  float lidLine = (1.0 - smoothstep(.001, .0025, abs(p.y - upper)))
    * (1.0 - smoothstep(.82, 1.0, abs(x))) * smoothstep(.02, .2, blink);
  return mix(color, upperSkin * .40, lidLine);
}

void main() {
  vec3 color = samplePortrait(portraitUv);
  color = eye(color, vec2(.400, .552), vec2(.059, .030));
  color = eye(color, vec2(.613, .550), vec2(.061, .030));
  vec3 side = texture2D(portrait, vec2(profileUv.x, 1.0 - profileUv.y)).rgb;
  vec3 scalpSample = side;
  // The separately generated images have different baked lighting. Match the
  // posterior cheek colour to the front photograph instead of showing a seam.
  vec3 cheek = samplePortrait(vec2(portraitUv.x < .505 ? .34 : .67, .62));
  // The frontal photo already contains ears and edge highlights. Remove those
  // skin pixels from the lateral cheek before applying the sculpted ear colour.
  float oldEar = max(1.0 - smoothstep(.30, .34, portraitUv.x), smoothstep(.68, .72, portraitUv.x))
    * smoothstep(.49, .53, portraitUv.y) * (1.0 - smoothstep(.68, .73, portraitUv.y));
  color = mix(color, cheek, oldEar * smoothstep(.40, .60, color.r));
  float cheekSurface = smoothstep(.49, .54, portraitUv.y) * smoothstep(-.30, -.10, headDepth);
  side = mix(side, cheek, cheekSurface);
  color = mix(color, side, profileWeight);
  // Rebuild the lateral boundary on the surface, so neither photograph's old
  // ear/sideburn edge leaves a pointed cutout or a skin patch inside the hair.
  float temple = max(smoothstep(.66, .80, headWidth), profileWeight)
    * smoothstep(.455, .490, portraitUv.y) * (1.0 - smoothstep(.66, .70, portraitUv.y));
  float hairlineY = .660 - .130 * smoothstep(-.45, .25, headDepth)
    - .060 * smoothstep(.35, .85, headDepth);
  float scalp = 1.0 - smoothstep(hairlineY - .006, hairlineY + .006, portraitUv.y);
  vec3 hair = samplePortrait(vec2(portraitUv.x < .505 ? .31 : .70, .40));
  vec3 scalpHair = mix(hair, scalpSample, 1.0 - smoothstep(.25, .40, scalpSample.r));
  color = mix(color, mix(cheek, scalpHair, scalp), temple * (1.0 - ear));
  // A tapered sideburn continues the scalp in front of the ear. The front
  // cutout's horizontal edge must not become a shelf across the temple.
  float burnT = clamp((portraitUv.y - .47) / .105, 0.0, 1.0);
  float burnCenter = .63 + .065 * burnT;
  float cap = max(0.0, (portraitUv.y - .535) / .040);
  float burnWidth = mix(.16, .10, burnT) * sqrt(max(0.0, 1.0 - cap * cap));
  float sideburn = smoothstep(.74, .83, headWidth)
    * (1.0 - smoothstep(max(0.0, burnWidth - .012), burnWidth + .012, abs(headDepth - burnCenter)))
    * smoothstep(.455, .485, portraitUv.y) * (1.0 - smoothstep(.570, .576, portraitUv.y));
  color = mix(color, hair * .94, sideburn * (1.0 - ear));
  // Local coordinates stay attached to the shell. Retain the reference's ear
  // details without projecting or folding them across the skull surface.
  vec2 concha = (earTextureUv - vec2(.15, .25)) / vec2(.38, .40);
  float cavity = exp(-dot(concha, concha));
  vec3 earColor = cheek * (1.0 - .50 * cavity) * mix(vec3(1.0), vec3(1.0, .96, .94), cavity);
  float earTile = portraitUv.x < .505 ? 1.0 : 2.0;
  float earCenter = earTile < 1.5 ? .392 : .656;
  float earDirection = earTile < 1.5 ? 1.0 : -1.0;
  vec2 referenceUv = vec2((earTile + earCenter + earDirection * earTextureUv.x * .055) / 3.0,
    1.0 - (.560 - earTextureUv.y * .080));
  vec3 referenceEar = texture2D(portrait, referenceUv).rgb;
  vec3 referenceSkin = texture2D(portrait, vec2((earTile + earCenter) / 3.0, 1.0 - .610)).rgb;
  vec3 earDetail = clamp(referenceEar / max(referenceSkin, vec3(.02)) * cheek, 0.0, 1.0);
  // Reject the profile crop's dark hair pixels at its upper/anterior edge.
  float detailInset = 1.0 - smoothstep(.65, .95, length(earTextureUv));
  earColor = mix(earColor, earDetail, .65 * smoothstep(.20, .35, referenceEar.r) * detailInset);
  color = mix(color, earColor, ear);
  float diffuse = max(0.0, dot(normalize(surfaceNormal), normalize(vec3(-.35, .45, 1.0))));
  float light = mix(.91 + .09 * diffuse, .82 + .18 * diffuse,
    max(ear, profileWeight * cheekSurface));
  light = mix(light, .76 + .24 * diffuse, ear);
  gl_FragColor = vec4(color * light, 1.0);
  #include <colorspace_fragment>
}`;

export type MemojiRenderer = {
  draw: (yaw: number, pitch: number, roll: number, bob: number, blink: number, gazeX: number, gazeY: number) => void;
  dispose: () => void;
};

/** Closed skull/ear surfaces and one fixed texture atlas. Only rotation, eyelids and
 * gaze change; there is no pose selection or image cross-fade. */
export function createMemojiRenderer(canvas: HTMLCanvasElement, image: HTMLImageElement): MemojiRenderer | null {
  const releases: (() => void)[] = [];
  const dispose = () => releases.toReversed().forEach((release) => release());
  try {
    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power", stencil: false });
    releases.push(() => renderer.dispose());
    renderer.setClearColor(new Color(0), 0);
    renderer.outputColorSpace = SRGBColorSpace;
    const scene = new Scene();
    const camera = new PerspectiveCamera(25, 1, .1, 30);
    camera.position.z = 9.7;
    const geometry = createHeadGeometry();
    releases.push(() => geometry.dispose());
    const texture = new Texture(image);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    releases.push(() => texture.dispose());
    const uniforms = { portrait: { value: texture }, blink: { value: 0 }, gaze: { value: new Vector2() } };
    const material = new ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT });
    releases.push(() => material.dispose());
    const head = new Mesh(geometry, material);
    scene.add(head);
    let shaderFailed = false;
    renderer.debug.onShaderError = () => { shaderFailed = true; };
    renderer.compile(scene, camera);
    if (shaderFailed) throw new Error("Portrait shader failed");
    let width = 0, height = 0;
    return {
      dispose,
      draw(yaw, pitch, roll, bob, blink, gazeX, gazeY) {
        if (renderer.getContext().isContextLost()) return;
        if (width !== canvas.width || height !== canvas.height) {
          width = canvas.width; height = canvas.height;
          renderer.setSize(width, height, false);
          camera.aspect = width / Math.max(height, 1);
          camera.updateProjectionMatrix();
        }
        head.rotation.set(pitch * Math.PI / 180, yaw * Math.PI / 180, -roll, "YXZ");
        head.position.y = -bob * 4;
        uniforms.blink.value = blink;
        uniforms.gaze.value.set(gazeX, gazeY);
        renderer.render(scene, camera);
      },
    };
  } catch {
    dispose();
    return null;
  }
}
