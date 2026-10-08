/**
 * The spiral galaxy behind the page.
 *
 * Scrolling flies the camera forward through the dust field (see CameraController);
 * the galaxy rides ahead of it, held in the upper-left quadrant so it never sits
 * behind a heading, and drifts a little closer as the page goes on.
 *
 * It is generated, not downloaded: no texture ships for any of this. Everything that
 * shapes it lives here so the look can be retuned without touching a shader.
 */
export const galaxyConfig = {
  radius: 46,
  arms: 4,
  /** Radians of twist per unit of radius */
  spin: 0.085,
  /** How far stars wander off their arm */
  scatter: 0.46,
  /** Disc half-thickness at the core */
  thickness: 2.6,
  /** Fraction of stars thrown into the spherical halo instead of the disc */
  haloFraction: 0.12,
  /** Distance the galaxy keeps ahead of the camera */
  distance: 86,
  /**
   * Shrinks the disc without moving it, so the stars keep their size on screen
   * while the galaxy itself takes about two-thirds of the frame height.
   */
  scale: 0.52,
  tilt: -0.86,
  roll: 0.22,
  /** Base angular speed; inner stars orbit faster (see the vertex shader) */
  spinRate: 0.0115,
};

/**
 * Per-theme palette and compositing.
 *
 * These are uniforms, not baked vertex colours, so a theme change crossfades the
 * whole galaxy instead of rebuilding its buffer.
 *
 * Light mode is not the dark palette dimmed — that was the original bug. Additive
 * blending cannot darken, so pale stars added onto a near-white page are simply
 * invisible. Light mode inverts the whole idea: dense regions are *dark*, the galaxy
 * reads as ink on paper, and compositing switches to normal blending.
 */
export const galaxyTheme = {
  dark: {
    core: "#ffe6b8",
    mid: "#c9cbe0",
    outer: "#7d88f0",
    hot: "#dff1ff",
    opacity: 0.82,
    glow: "#ffe6b8",
    glowOpacity: 0.1,
    blending: "additive" as const,
  },
  light: {
    // Darkest at the core where stars are densest, fading toward the rim so the
    // periphery dissolves into the page instead of speckling evenly across it.
    // Most stars sit in the mid-to-outer band, so `outer` carries the overall weight:
    // too pale and the galaxy vanishes into the page, too dark and it reads as speckle.
    core: "#2c2f45",
    mid: "#4b55d6",
    outer: "#9aa0cc",
    hot: "#1d1d1f",
    opacity: 0.56,
    glow: "#4b55d6",
    glowOpacity: 0.05,
    blending: "normal" as const,
  },
};
