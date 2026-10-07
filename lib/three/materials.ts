/**
 * 3D material tokens. Avatar skin/hair colours live in data/avatar.ts;
 * these are the theme-dependent particle settings.
 */
export type MaterialTier = "high" | "medium" | "low";

export const particleTheme = {
  dark: { a: "#c9cbe0", b: "#8b95ff", opacity: 0.85, blending: "additive" as const, lineOpacity: 0.16 },
  light: { a: "#2c2f45", b: "#4b55d6", opacity: 0.55, blending: "normal" as const, lineOpacity: 0.1 },
};
