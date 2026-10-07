import { site } from "@/data/site";
import { socials } from "@/data/social";
import { DMark } from "@/components/ui/Icons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="container-x relative overflow-hidden pb-10 pt-20">
      {/* Wordmark — set so large it bleeds to the gutters */}
      <p
        aria-hidden
        className="mb-12 select-none whitespace-nowrap text-center text-[clamp(2.5rem,10.6vw,13rem)] leading-[0.82] font-semibold tracking-[-0.065em] text-transparent [-webkit-text-stroke:1px_var(--line-strong)] md:mb-16"
      >
        {site.name}
      </p>
      <div className="hairline mb-8" />
      <div className="flex flex-col items-start justify-between gap-6 text-sm text-fg-muted md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <DMark className="size-5 text-fg" />
          <span>
            © {year} {site.name}. Designed &amp; engineered by hand.
          </span>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {socials.map((s) => (
            <li key={s.id}>
              <a
                href={s.href}
                target={s.id === "email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="link-underline hover:text-fg"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="font-mono text-xs">Built with Next.js · Three.js · GSAP</p>
      </div>
    </footer>
  );
}
