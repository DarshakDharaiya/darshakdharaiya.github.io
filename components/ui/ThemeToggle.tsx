"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { MoonIcon, SunIcon } from "./Icons";
import { spring } from "@/lib/animation";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      aria-label={`Switch to ${next} theme`}
      className={cn(
        "relative grid size-10 place-items-center rounded-full text-fg transition-colors hover:bg-accent-soft active:scale-95",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={spring.snappy}
          className="grid place-items-center"
        >
          {theme === "dark" ? <MoonIcon className="size-[18px]" /> : <SunIcon className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
