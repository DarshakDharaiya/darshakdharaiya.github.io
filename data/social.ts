import type { Social } from "./types";
import { site } from "./site";

/** Public profiles. Add GitHub here later if you want it shown. */
export const socials: Social[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/darshakdharaiya",
    handle: "in/darshakdharaiya",
  },
  { id: "email", label: "Email", href: `mailto:${site.email}`, handle: site.email },
];
