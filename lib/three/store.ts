/**
 * Shared, mutable, non-reactive interaction state.
 * DOM listeners write here; WebGL reads it inside useFrame.
 * Deliberately NOT React state: these values change every frame and must never trigger re-renders.
 */
export type SceneMood = "hero" | "calm" | "work" | "skills" | "contact" | "detail";

export const sceneStore = {
  /** Pointer in NDC (-1..1), y up */
  pointer: { x: 0, y: 0, active: false },
  /** Pointer velocity in NDC/s, smoothed */
  pointerVelocity: { x: 0, y: 0 },
  /** Device tilt mapped to -1..1 */
  tilt: { x: 0, y: 0, active: false },
  /** Document scroll progress 0..1 and raw px */
  scroll: { progress: 0, y: 0, velocity: 0 },
  /** Hero-local progress 0..1 (0 = top, 1 = hero scrolled out) */
  heroProgress: 0,
  /** Section mood drives particle energy/density */
  mood: "hero" as SceneMood,
  /** Is the pointer currently over the 3D avatar */
  avatarHovered: false,
  /** Drag spin impulse applied to the avatar */
  dragImpulse: { x: 0, y: 0 },
  /** Are we on the home page (avatar visible) */
  showAvatar: true,
  reducedMotion: false,
  theme: "dark" as "dark" | "light",
};

export const moodConfig: Record<SceneMood, { energy: number; density: number; spread: number }> = {
  hero: { energy: 0.55, density: 1, spread: 1 },
  calm: { energy: 0.35, density: 0.7, spread: 1.1 },
  work: { energy: 0.45, density: 0.85, spread: 1.25 },
  skills: { energy: 0.6, density: 1, spread: 0.9 },
  contact: { energy: 1.15, density: 1, spread: 0.85 },
  detail: { energy: 0.3, density: 0.55, spread: 1.2 },
};
