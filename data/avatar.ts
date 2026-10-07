/**
 * ─────────────────────────────────────────────
 *  EDIT ME — your Memoji
 * ─────────────────────────────────────────────
 * The hero rotates a closed 3D mesh with one fixed front/side texture atlas.
 * output/build-head.cjs extracts the front view from the supplied pose strip.
 * build-profiles.cjs measures the side silhouette and creates memojiProfile.json.
 * The frontal silhouette lives in memojiHead.json; geometry and eyelid landmarks
 * in lib/memoji are calibrated to this character and need updating if replaced.
 *
 * The portrait is the placeholder while the 3D head loads, produced by
 * output/build-portrait.cjs. The navigation badge uses the supplied three-quarter
 * portrait with its background removed.
 */
export const avatar = {
  badge: {
    src: "/memoji/nav-avatar.webp",
  },
  portrait: {
    src: "/memoji/avatar.webp",
    alt: "Memoji with swept brown hair, hazel eyes and a friendly smile",
  },
};

export type AvatarConfig = typeof avatar;
