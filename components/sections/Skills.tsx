"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { skillCategories } from "@/data/skills";
import { projects } from "@/data/projects";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useFinePointer } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { spring } from "@/lib/animation";
import { cn } from "@/lib/utils";

const sizeByLevel = {
  core: "text-lg md:text-2xl px-5 py-2.5 md:px-7 md:py-3.5",
  strong: "text-base md:text-xl px-4 py-2 md:px-6 md:py-3",
  familiar: "text-sm md:text-base px-4 py-2 md:px-5 md:py-2.5",
} as const;

/** Which shipped projects mention a skill (loose match so "Room" ↔ "Room", "Coroutines" ↔ "Coroutines") */
function usedIn(skill: string) {
  const key = skill.toLowerCase().split(/[\s/]+/)[0];
  return projects.filter((p) => p.stack.some((s) => s.toLowerCase().includes(key))).map((p) => p.shortTitle);
}

export function Skills() {
  const [category, setCategory] = useState<string>(skillCategories[0].id);
  const [hovered, setHovered] = useState<string | null>(null);
  const fieldRef = useRef<HTMLUListElement>(null);
  const centers = useRef<{ el: HTMLElement; x: number; y: number }[]>([]);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const interactive = fine && !reduced;

  const all = useMemo(
    () => skillCategories.flatMap((c) => c.skills.map((s) => ({ ...s, category: c.id }))),
    [],
  );
  const active = skillCategories.find((c) => c.id === category)!;
  const hoveredUsage = hovered ? usedIn(hovered) : [];

  // Cache pill centres relative to the field (cheap pointer math, no layout reads per move)
  useEffect(() => {
    const field = fieldRef.current;
    if (!field || !interactive) return;
    const measure = () => {
      centers.current = Array.from(field.querySelectorAll<HTMLElement>("[data-pill]")).map((el) => ({
        el,
        x: el.offsetLeft + el.offsetWidth / 2,
        y: el.offsetTop + el.offsetHeight / 2,
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(field);
    return () => ro.disconnect();
  }, [interactive]);

  const onMove = (e: PointerEvent) => {
    if (!interactive || !fieldRef.current) return;
    const r = fieldRef.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    for (const c of centers.current) {
      const dx = c.x - px;
      const dy = c.y - py;
      const d = Math.hypot(dx, dy);
      const radius = 220;
      const f = d < radius ? Math.pow(1 - d / radius, 2) : 0;
      // Repel gently; the pill directly under the cursor lifts instead of fleeing
      const near = d < 40;
      const push = near ? 0 : f * 26;
      c.el.style.setProperty("transform", `translate3d(${(dx / (d || 1)) * push}px, ${(dy / (d || 1)) * push}px, 0) scale(${near ? 1.08 : 1 + f * 0.04})`);
    }
  };
  const onLeave = () => {
    for (const c of centers.current) c.el.style.removeProperty("transform");
    setHovered(null);
  };

  return (
    <section id="skills" data-mood="skills" aria-labelledby="skills-title" className="container-x py-section">
      <SectionHeader index="04" eyebrow="Capabilities" title={["A toolkit shaped", "by shipping."]} />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Categories */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <div role="group" aria-label="Skill categories" className="flex flex-wrap gap-2 lg:flex-col lg:items-start lg:gap-1">
              {skillCategories.map((c, i) => {
                const selected = c.id === category;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    aria-controls="skills-field"
                    onClick={() => setCategory(c.id)}
                    onPointerEnter={() => fine && setCategory(c.id)}
                    className={cn(
                      "relative flex items-baseline gap-3 rounded-pill px-4 py-2 text-left transition-colors lg:px-0 lg:py-1.5",
                      selected ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
                    )}
                  >
                    <span className="hidden font-mono text-xs lg:inline">0{i + 1}</span>
                    <span className="text-base font-medium lg:text-h3 lg:font-semibold">{c.title}</span>
                    {selected && (
                      <motion.span
                        layoutId="skill-cat"
                        className="absolute inset-0 -z-10 rounded-pill bg-accent-soft lg:hidden"
                        transition={spring.snappy}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 min-h-[7.5rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.p
                  key={hovered ?? active.id}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.35 }}
                  className="max-w-sm text-lead text-fg-muted"
                >
                  {hovered ? (
                    hoveredUsage.length ? (
                      <>
                        <span className="text-fg">{hovered}</span> — shipped in {hoveredUsage.join(", ")}.
                      </>
                    ) : (
                      <>
                        <span className="text-fg">{hovered}</span> — part of my everyday workflow.
                      </>
                    )
                  ) : (
                    active.blurb
                  )}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Field */}
        <ul
          id="skills-field"
          ref={fieldRef}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="relative flex flex-wrap content-start gap-2.5 md:gap-3.5 lg:col-span-8 lg:pt-2"
        >
          {all.map((s) => {
            const inCat = s.category === category;
            return (
              <li
                key={s.name}
                data-pill
                className="transition-transform duration-[800ms] ease-out-expo will-change-transform"
              >
                <span
                  tabIndex={0}
                  onPointerEnter={() => setHovered(s.name)}
                  onFocus={() => {
                    setHovered(s.name);
                    setCategory(s.category);
                  }}
                  onBlur={() => setHovered(null)}
                  className={cn(
                    "block cursor-default rounded-pill border font-medium tracking-[-0.02em] transition-[opacity,background-color,border-color,color,box-shadow,filter] duration-500",
                    sizeByLevel[s.level],
                    inCat
                      ? "glass border-[var(--glass-border)] text-fg"
                      : "border-line text-fg-subtle opacity-40 blur-[0.3px]",
                    hovered === s.name && "shadow-glow",
                  )}
                >
                  {s.name}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg-subtle">
        <span className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-full border border-line-strong" aria-hidden /> Larger = daily, production depth
        </span>
        <span>Hover a skill to see where it shipped</span>
      </p>
    </section>
  );
}
