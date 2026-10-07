"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "motion/react";
import { avatar } from "@/data/avatar";
import { site } from "@/data/site";
import { spring } from "@/lib/animation";
import { useFinePointer } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * A transparent 3D-style portrait as a living object:
 * - tilts toward the cursor (or phone tilt) on soft springs, with a little parallax
 * - floats gently, with a contact shadow that breathes with it
 * - shows the hover pose (e.g. a wave) on hover; click/tap cycles poses with an iMessage-sticker "pop"
 * - recedes (up + smaller + fade) as the hero scrolls away
 */
export function MemojiPortrait({ className }: { className?: string }) {
  const { poses, hoverPose } = avatar.memoji;
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const [pose, setPose] = useState(0);
  const [hover, setHover] = useState(false);
  const interactive = poses.length > 1;
  const Surface = interactive ? motion.button : motion.div;
  const shown = hover && hoverPose != null && poses[hoverPose] ? hoverPose : pose;

  const rx = useSpring(0, spring.soft);
  const ry = useSpring(0, spring.soft);
  const tx = useSpring(0, spring.gentle);
  const ty = useSpring(0, spring.gentle);

  const { scrollY } = useScroll();
  const exitY = useTransform(scrollY, [0, 800], [0, -140]);
  const exitScale = useTransform(scrollY, [0, 800], [1, 0.82]);
  const exitOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  useEffect(() => {
    if (reduced) return;
    const look = (nx: number, ny: number) => {
      ry.set(nx * 16);
      rx.set(-ny * 12);
      tx.set(nx * 14);
      ty.set(ny * 10);
    };
    const onMove = (e: PointerEvent) =>
      look((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      look(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    else window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [fine, reduced, rx, ry, tx, ty]);

  if (!poses.length) return null;
  const current = poses[shown];

  return (
    <motion.div
      className={cn("relative mx-auto aspect-square w-full", className)}
      style={reduced ? undefined : { y: exitY, scale: exitScale, opacity: exitOpacity }}
      initial={reduced ? false : { opacity: 0, scale: 0.8, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={reduced ? { duration: 0 } : { ...spring.gentle, delay: 0.3 }}
    >
      {/* Soft accent halo — seats the Memoji in the scene */}
      <div
        aria-hidden
        className="absolute inset-[12%] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 35%, transparent), transparent)" }}
      />

      <Surface
        {...(interactive ? {
          type: "button" as const,
          onClick: () => setPose((p) => (p + 1) % poses.length),
          onPointerEnter: () => fine && setHover(true),
          onPointerLeave: () => setHover(false),
          "aria-label": `${site.firstName}'s avatar — click to change expression`,
          "data-cursor": "label",
          "data-cursor-label": "SAY HI 👋",
        } : {})}
        className="relative block size-full focus-visible:outline-offset-8"
        style={reduced ? undefined : { rotateX: rx, rotateY: ry, x: tx, y: ty, transformPerspective: 900 }}
        whileTap={interactive && !reduced ? { scale: 0.94 } : undefined}
      >
        <span className={cn("absolute inset-0 block", !reduced && "memoji-float")}>
          <AnimatePresence initial={false}>
            <motion.span
              key={current.src}
              className="absolute inset-0 block"
              initial={reduced ? false : { opacity: 0, scale: 0.82, rotate: -6, y: 10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 1.06, transition: { duration: 0.15 } }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 18, mass: 0.7 }}
            >
              <Image
                src={current.src}
                alt={current.alt}
                fill
                loading={shown === 0 ? "eager" : "lazy"}
                fetchPriority={shown === 0 ? "high" : "auto"}
                sizes="(min-width: 1440px) 544px, (min-width: 1024px) 40vw, (min-width: 640px) 320px, 272px"
                className="object-contain drop-shadow-[0_30px_40px_rgb(0_0_0/0.28)]"
                draggable={false}
              />
            </motion.span>
          </AnimatePresence>
        </span>
      </Surface>

      {/* Contact shadow, breathing with the float */}
      <div
        aria-hidden
        className={cn(
          "absolute bottom-[2%] left-1/2 h-[6%] w-[46%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-xl dark:bg-black/60",
          !reduced && "memoji-shadow",
        )}
      />

      {/* Preload the other poses so swaps are instant */}
      <div className="hidden" aria-hidden>
        {poses.map((p, i) =>
          i === shown ? null : <Image key={p.src} src={p.src} alt="" width={8} height={8} sizes="(min-width: 1024px) 34vw, 70vw" />,
        )}
      </div>
    </motion.div>
  );
}

/** Small round Memoji for the nav; falls back to the monogram when no Memoji is configured. */
export function MemojiBadge({ fallback }: { fallback: ReactNode }) {
  const first = avatar.memoji.poses[0];
  if (!first) return <>{fallback}</>;
  return (
    <span className="relative block size-full overflow-hidden rounded-full">
      <Image src={first.src} alt="" fill loading="eager" sizes="48px" className="scale-[1.25] object-contain object-top translate-y-[6%]" />
    </span>
  );
}
