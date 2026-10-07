import { site } from "@/data/site";

/** Persistent vertical résumé tab on the right edge (desktop only). */
export function ResumeTab() {
  return (
    <a
      href={site.resumePath}
      download="Darshak-Dharaiya-Resume.pdf"
      className="group fixed top-1/2 right-5 z-40 -translate-y-1/2 hidden items-center gap-3 font-mono text-[11px] tracking-[0.28em] text-fg-subtle uppercase transition-colors duration-300 [writing-mode:vertical-rl] hover:text-fg lg:flex"
    >
      Résumé
      <span className="block h-10 w-px origin-top bg-line-strong transition-[height,background-color] duration-700 ease-out-expo group-hover:h-16 group-hover:bg-fg" aria-hidden />
      <span className="sr-only">(PDF download)</span>
    </a>
  );
}
