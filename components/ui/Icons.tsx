import type { SVGProps } from "react";
import type { Social } from "@/data/types";

type P = SVGProps<SVGSVGElement>;

export const ArrowRight = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ArrowUpRight = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);
export const ArrowDown = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);
export const ArrowLeft = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

export const GitHubIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);
export const LinkedInIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);
export const MailIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
export const PlayStoreIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M3.6 1.8a1.5 1.5 0 0 0-.6 1.2v18a1.5 1.5 0 0 0 .6 1.2l10-10.2-10-10.2Zm11.1 11.3L5.3 22.6l11.9-6.8-2.5-2.7Zm3.6-3.9-2.7 1.6L14.7 12l2.9 2.9 2.7-1.6c.9-.5.9-1.9 0-2.4l-2-1.2ZM5.3 1.4l9.4 9.5 2.5-2.7L5.3 1.4Z" />
  </svg>
);
export const SunIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const MoonIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);
export const StarIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5Z" />
  </svg>
);

export function SocialIcon({ id, ...p }: { id: Social["id"] } & P) {
  switch (id) {
    case "github":
      return <GitHubIcon {...p} />;
    case "linkedin":
      return <LinkedInIcon {...p} />;
    case "email":
      return <MailIcon {...p} />;
    case "playstore":
      return <PlayStoreIcon {...p} />;
    default:
      return null;
  }
}

/** Monogram used in nav/footer/favicon — echoes the 3D object's geometry.
 *  Plain currentColor fill: SVG gradient ids collide when the mark renders several times. */
export const DMark = (p: P) => (
  <svg viewBox="0 0 32 32" aria-hidden {...p}>
    <path
      fillRule="evenodd"
      fill="currentColor"
      d="M8.6 4h7.9a12 12 0 0 1 0 24H8.6A2.6 2.6 0 0 1 6 25.4V6.6A2.6 2.6 0 0 1 8.6 4Zm3.3 5.8a.9.9 0 0 0-.9.9v10.6c0 .5.4.9.9.9h4.6a6.2 6.2 0 0 0 0-12.4h-4.6Z"
    />
  </svg>
);
