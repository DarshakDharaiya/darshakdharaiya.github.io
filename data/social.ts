import type { Social } from "./types";
import { site } from "./site";

/**
 * Public profiles. Everything that renders them — the hero row, the footer, the
 * contact block and the JSON-LD `sameAs` list — maps over this array, so adding
 * an entry here is the only edit needed.
 */
export const socials: Social[] = [
  // ── Uncomment and set `href`/`handle` to show GitHub. The icon and wiring
  //    already exist; nothing else needs changing.
  // {
  //   id: "github",
  //   label: "GitHub",
  //   href: "https://github.com/<your-username>",
  //   handle: "<your-username>",
  // },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/darshakdharaiya",
    handle: "in/darshakdharaiya",
  },
  { id: "email", label: "Email", href: `mailto:${site.email}`, handle: site.email },
];
