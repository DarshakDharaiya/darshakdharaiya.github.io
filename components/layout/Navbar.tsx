"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { spring } from "@/lib/animation";
import { useLenis } from "./SmoothScroll";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { DMark, SocialIcon } from "@/components/ui/Icons";
import { socials } from "@/data/social";
import { MemojiBadge } from "@/components/sections/MemojiPortrait";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

export const navItems = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
] as const;

function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    // Sections without a nav entry (hero, achievements…) clear the highlight
    const els = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    const ids = new Set<string>(navItems.map((n) => n.id));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(ids.has(e.target.id) ? e.target.id : null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enabled]);
  return enabled ? active : null;
}

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const lenis = useLenis();
  const active = useActiveSection(isHome);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: lock scroll + Escape to close
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      // Button remounts after close; focus it on the next frame
      requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[aria-controls=mobile-menu]")?.focus());
    };
  }, [open, lenis]);

  const go = (e: MouseEvent, id: string) => {
    setOpen(false);
    if (!isHome) return; // let Link navigate to /#id
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
    else target.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  const toTop = (e: MouseEvent) => {
    if (!isHome) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* ───────── Desktop ───────── */}
      <motion.header
        className="fixed inset-x-0 top-4 z-50 hidden justify-center md:flex"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring.gentle, delay: 0.4 }}
      >
        <motion.nav
          aria-label="Primary"
          className="glass flex items-center rounded-pill"
          animate={{ paddingTop: scrolled ? 4 : 7, paddingBottom: scrolled ? 4 : 7, paddingLeft: scrolled ? 6 : 8, paddingRight: scrolled ? 6 : 8, scale: scrolled ? 0.96 : 1 }}
          transition={spring.gentle}
        >
          <Link
            href="/"
            onClick={toTop}
            aria-label={`${site.name} — home`}
            className="mr-2 grid size-10 place-items-center rounded-full text-fg transition-transform hover:rotate-[-8deg] active:scale-90"
          >
            <MemojiBadge fallback={<DMark className="size-6" />} />
          </Link>
          <ul className="flex items-center">
            {navItems.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id} className="relative">
                  <Link
                    href={`/#${item.id}`}
                    onClick={(e) => go(e, item.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative z-10 block rounded-pill px-4 py-2 text-[14px] tracking-[-0.01em] transition-colors duration-300",
                      isActive ? "text-bg" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-pill bg-fg"
                      transition={spring.snappy}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <span className="mx-2 h-5 w-px bg-line-strong" aria-hidden />
          <ThemeToggle />
        </motion.nav>
      </motion.header>

      {/* ───────── Mobile ───────── */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between p-4 md:hidden">
        <Link
          href="/"
          onClick={toTop}
          aria-label={`${site.name} — home`}
          className="glass grid size-12 place-items-center rounded-full text-fg"
        >
          <MemojiBadge fallback={<DMark className="size-6" />} />
        </Link>
        {!open && (
        <motion.button
          ref={menuButtonRef}
          layoutId="mobile-menu"
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Open menu"
          className="glass flex h-12 items-center gap-2.5 rounded-full px-5 text-[15px] font-medium text-fg"
          style={{ borderRadius: 999 }}
          transition={spring.gentle}
        >
          <span className="flex flex-col gap-[5px]" aria-hidden>
            <span className="block h-[1.5px] w-4 rounded bg-current" />
            <span className="block h-[1.5px] w-4 rounded bg-current" />
          </span>
          Menu
        </motion.button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[55] bg-bg/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              layoutId="mobile-menu"
              className="glass-strong fixed inset-x-3 top-3 z-[60] overflow-hidden p-6 md:hidden"
              style={{ borderRadius: 32 }}
              transition={spring.gentle}
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Navigate</span>
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close menu"
                      autoFocus
                      className="grid size-10 place-items-center rounded-full text-fg hover:bg-accent-soft"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </div>
                </div>
                <ul className="mt-6">
                  {navItems.map((item, i) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.soft, delay: 0.1 + i * 0.045 }}
                      className="border-b border-line last:border-0"
                    >
                      <Link
                        href={`/#${item.id}`}
                        onClick={(e) => go(e, item.id)}
                        className="flex items-baseline justify-between py-4 text-[2rem] font-semibold tracking-[-0.04em] text-fg"
                      >
                        {item.label}
                        <span className="font-mono text-xs text-fg-subtle">0{i + 1}</span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-6 flex gap-2">
                  {socials.map((s) => (
                    <a
                      key={s.id}
                      href={s.href}
                      target={s.id === "email" ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="grid size-12 place-items-center rounded-full border border-line text-fg"
                    >
                      <SocialIcon id={s.id} className="size-5" />
                    </a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
