"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useLenis } from "@/components/layout/SmoothScroll";
import { spring } from "@/lib/animation";
import { cn } from "@/lib/utils";

export function ChapterNav({ chapters }: { chapters: { id: string; label: string }[] }) {
  const [active, setActive] = useState(chapters[0]?.id);
  const lenis = useLenis();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [chapters]);

  return (
    <nav aria-label="Case study chapters" className="sticky top-32 hidden lg:block">
      <ol className="space-y-0.5">
        {chapters.map((c, i) => {
          const isActive = c.id === active;
          return (
            <li key={c.id} className="relative">
              <a
                href={`#${c.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => {
                  const el = document.getElementById(c.id);
                  if (!el || !lenis) return;
                  e.preventDefault();
                  lenis.scrollTo(el, { offset: -120, duration: 1.2 });
                }}
                className={cn(
                  "relative z-10 flex items-baseline gap-3 rounded-pill px-4 py-2 text-[15px] transition-colors duration-300",
                  isActive ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
                )}
              >
                <span className="font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                {c.label}
              </a>
              {isActive && (
                <motion.span layoutId="chapter-active" className="absolute inset-0 rounded-pill bg-accent-soft" transition={spring.snappy} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
