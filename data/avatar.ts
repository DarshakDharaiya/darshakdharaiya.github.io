/**
 * ─────────────────────────────────────────────
 *  EDIT ME — your Memoji
 * ─────────────────────────────────────────────
 * The hero turns through real Memoji renders at nine angles, packed into a
 * strip by output/build-poses.cjs. To change the character, drop new renders
 * into output/poses-src/, list their angles in that script and re-run it; the
 * tile order and angles land in data/memojiPoses.json.
 *
 * The single portrait below is the navigation badge, and the placeholder shown
 * while that strip loads. It is produced by output/build-portrait.cjs.
 */
export const avatar = {
  portrait: {
    src: "/memoji/avatar.webp",
    alt: "Memoji with swept brown hair, hazel eyes and a friendly smile",
  },
};

export type AvatarConfig = typeof avatar;
