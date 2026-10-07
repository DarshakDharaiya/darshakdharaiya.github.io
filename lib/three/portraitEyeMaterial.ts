import * as THREE from "three";

export type PortraitEyeMaterial = {
  material: THREE.MeshBasicMaterial;
  gaze: { value: THREE.Vector2 };
  blink: { value: number };
  /** Gaze is normalized [-1, 1], with positive y looking down; blink is [0, 1]. */
  update: (gazeX: number, gazeY: number, blinkAmount: number) => void;
  /** Dispose the material only. The caller retains ownership of the texture. */
  dispose: () => void;
};

const eyeShader = /* glsl */ `
uniform vec2 uPortraitGaze;
uniform float uPortraitBlink;

#ifdef USE_MAP
vec2 portraitPixelUv( vec2 pixel ) {
  return vec2( pixel.x / 1024.0, 1.0 - pixel.y / 1024.0 );
}

vec3 portraitSkinSample( vec2 pixel ) {
  return texture2D( map, portraitPixelUv( pixel ) ).rgb;
}

vec4 portraitEye(
  vec4 original,
  vec2 pixel,
  vec2 center,
  vec2 axis,
  float halfWidth,
  float upperHeight,
  float lowerHeight
) {
  vec2 down = vec2( -axis.y, axis.x );
  vec2 relative = pixel - center;
  vec2 local = vec2( dot( relative, axis ), dot( relative, down ) );
  if ( abs( local.x ) > halfWidth + 3.0 || local.y < -upperHeight - 5.0 || local.y > lowerHeight + 4.0 ) return original;

  float horizontal = 1.0 - smoothstep( halfWidth - 2.0, halfWidth + 2.0, abs( local.x ) );
  float arc = pow( max( 0.0, 1.0 - pow( local.x / halfWidth, 2.0 ) ), 0.62 );
  float upper = -upperHeight * arc;
  float lower = lowerHeight * arc;
  float edgeDistance = min( local.y - upper, lower - local.y );
  float irisAperture = smoothstep( 1.5, 9.0, edgeDistance ) * smoothstep( 3.0, 13.0, halfWidth - abs( local.x ) );
  vec4 result = original;

  // Subtle resampling inside the aperture moves the original iris/highlight.
  // The feather reaches zero before the eyelid and outer sclera boundaries.
  if ( irisAperture > 0.001 && dot( uPortraitGaze, uPortraitGaze ) > 0.000001 ) {
    vec2 displacement = uPortraitGaze * vec2( 6.0, 3.5 ) * irisAperture;
    vec3 shifted = texture2D( map, portraitPixelUv( pixel - displacement ) ).rgb;
    result.rgb = mix( result.rgb, shifted, irisAperture );
  }

  if ( uPortraitBlink > 0.001 ) {
    float closure = clamp( uPortraitBlink, 0.0, 1.0 );
    float closingLine = 7.0 * arc;
    float movingUpper = mix( upper, closingLine, closure );
    float movingLower = mix( lower, closingLine, closure );
    float originalOpening = smoothstep( upper - 8.0, upper - 3.0, local.y )
      * ( 1.0 - smoothstep( lower + 1.0, lower + 5.0, local.y ) ) * horizontal;
    float opening = smoothstep( movingUpper - 0.65, movingUpper + 0.8, local.y )
      * ( 1.0 - smoothstep( movingLower - 0.8, movingLower + 0.65, local.y ) );

    // Nearby source skin retains the portrait's actual color and illumination.
    // Both lids meet; the lower lid travels less than the upper one.
    vec2 upperPixel = center + axis * local.x + down * ( upper - 14.0 );
    vec2 lowerPixel = center + axis * local.x + down * ( lower + 13.0 );
    vec3 upperSkin = portraitSkinSample( upperPixel );
    vec3 lowerSkin = portraitSkinSample( lowerPixel );
    float skinBlend = smoothstep( upper, max( lower, upper + 0.5 ), local.y );
    vec3 lidSkin = mix( upperSkin, lowerSkin, skinBlend );
    result.rgb = mix( result.rgb, lidSkin, originalOpening * ( 1.0 - opening ) );

    // A fine curved upper lash follows the moving lid, rather than leaving
    // the original black outline hovering above the closed eye.
    float lash = ( 1.0 - smoothstep( 0.7, 2.2, abs( local.y - movingUpper ) ) )
      * horizontal * min( 1.0, closure * 5.0 );
    vec3 lashColor = min( upperSkin, lowerSkin ) * vec3( 0.19, 0.16, 0.13 );
    result.rgb = mix( result.rgb, lashColor, lash );
  }

  // Eye animation never changes the silhouette or the original alpha.
  return result;
}

vec4 portraitAnimateEyes( vec4 original, vec2 uv ) {
  // Open eyes at rest are exactly the original texture, without extra mixing.
  if ( uPortraitBlink <= 0.001 && dot( uPortraitGaze, uPortraitGaze ) <= 0.000001 ) return original;
  vec2 pixel = vec2( uv.x, 1.0 - uv.y ) * 1024.0;
  vec4 result = portraitEye( original, pixel, vec2( 436.0, 611.0 ), normalize( vec2( 1.0, 0.035 ) ), 81.0, 46.0, 20.0 );
  return portraitEye( result, pixel, vec2( 714.0, 574.0 ), normalize( vec2( 1.0, -0.32 ) ), 74.0, 42.0, 20.0 );
}
#endif
`;

/**
 * Adds restrained eye motion to the supplied 1024-square portrait projection.
 * This is calibrated texture animation, not an independently modeled eye rig;
 * it preserves the supplied eye appearance and supports modest gaze changes.
 * Requires the portrait's unchanged UV projection and a WebGL renderer.
 */
export function createPortraitEyeMaterial(texture: THREE.Texture): PortraitEyeMaterial {
  if (texture.colorSpace !== THREE.SRGBColorSpace) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }
  const gaze = { value: new THREE.Vector2(0, 0) };
  const blink = { value: 0 };
  const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff, toneMapped: false });
  const animatedMap = THREE.ShaderChunk.map_fragment.replace(
    "diffuseColor *= sampledDiffuseColor;",
    "sampledDiffuseColor = portraitAnimateEyes( sampledDiffuseColor, vMapUv );\n\tdiffuseColor *= sampledDiffuseColor;",
  );
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPortraitGaze = gaze;
    shader.uniforms.uPortraitBlink = blink;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <map_pars_fragment>", `#include <map_pars_fragment>\n${eyeShader}`)
      .replace("#include <map_fragment>", animatedMap);
  };
  material.customProgramCacheKey = () => "portrait-eye-material-v2";

  return {
    material,
    gaze,
    blink,
    update: (gazeX, gazeY, blinkAmount) => {
      gaze.value.set(THREE.MathUtils.clamp(gazeX, -1, 1), THREE.MathUtils.clamp(gazeY, -1, 1));
      blink.value = THREE.MathUtils.clamp(blinkAmount, 0, 1);
    },
    dispose: () => material.dispose(),
  };
}
