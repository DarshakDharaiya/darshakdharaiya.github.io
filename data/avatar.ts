/**
 * ─────────────────────────────────────────────
 *  EDIT ME — your interactive Memoji canvas and navigation portrait
 * ─────────────────────────────────────────────
 * 1. Put transparent portrait images in /public/memoji/.
 * 2. List them below — the first pose is the default.
 * 3. `hoverPose` is the index shown while the cursor is over it (a wave works great).
 *
 * The hero is a closed 3D reconstruction textured with the reference portrait.
 * Portrait images provide the navigation badge and a preview while WebGL loads.
 */
export const avatar = {
  memoji: {
    poses: [
      { src: "/memoji/avatar.webp", alt: "Memoji with swept brown hair, hazel eyes, and a friendly smile" },
      // { src: "/memoji/wave.png", alt: "Darshak's Memoji waving" },
      // { src: "/memoji/thumbs-up.png", alt: "Darshak's Memoji giving a thumbs up" },
    ] as { src: string; alt: string }[],
    hoverPose: null as number | null,
  },

  /* ── 3D face appearance, matched to the supplied visual reference ── */
  skin: "#e9b38f",
  /** Slightly deeper tone for ears */
  skinShade: "#d6a07a",
  lips: "#b97c6a",
  hair: "#462b1b",
  /** Sheen / strand highlight colour */
  hairHighlight: "#a16a42",
  eyebrows: "#49301f",
  beard: false,
  beardColor: "#1a1410",
  /** Iris: centre → middle → outer ring */
  irisInner: "#885c25",
  irisMid: "#a58b49",
  irisOuter: "#628d98",
  /** Gold aviators (set false to hide) */
  glasses: false,
  gold: "#d2a54c",
  jacket: "#a8733f",
  tee: "#f4f2ee",
};

export const hasMemojiImage = avatar.memoji.poses.length > 0;

export type AvatarConfig = typeof avatar;
