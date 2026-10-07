"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { spring } from "@/lib/animation";
import { sceneStore } from "@/lib/three/store";
import { useFinePointer } from "@/hooks/useMediaQuery";

type CursorState =
  | { kind: "default" }
  | { kind: "hover" }
  | { kind: "text" }
  | { kind: "label"; label: string }
  | { kind: "drag" };

/**
 * Two-part cursor: an exact dot + a spring-lagged ring that morphs per context.
 * Context comes from the DOM: `data-cursor="label"` + `data-cursor-label="VIEW PROJECT →"`,
 * interactive elements (a, button), text inputs, and the 3D D (via sceneStore).
 * Never mounts on touch / coarse pointers.
 */
export function CustomCursor() {
  const fine = useFinePointer();
  if (!fine) return null;
  return <CursorImpl />;
}

function CursorImpl() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, spring.cursor);
  const ry = useSpring(y, spring.cursor);
  const [state, setState] = useState<CursorState>({ kind: "default" });
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const domState = useRef<CursorState>({ kind: "default" });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    const resolve = (target: EventTarget | null): CursorState => {
      const el = target instanceof Element ? target : null;
      if (!el) return { kind: "default" };
      const labelled = el.closest<HTMLElement>("[data-cursor]");
      if (labelled) {
        const kind = labelled.dataset.cursor;
        if (kind === "label") return { kind: "label", label: labelled.dataset.cursorLabel ?? "VIEW" };
        if (kind === "drag") return { kind: "drag" };
        if (kind === "none") return { kind: "default" };
      }
      if (el.closest("input, textarea, [contenteditable=true]")) return { kind: "text" };
      if (el.closest("a, button, [role=button], label, summary, select")) return { kind: "hover" };
      return { kind: "default" };
    };

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      domState.current = resolve(e.target);
      setState(sceneStore.avatarHovered && domState.current.kind === "default" ? { kind: "drag" } : domState.current);
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setVisible(false);

    // 3D hover state lives outside the DOM — poll it cheaply
    let raf = 0;
    let lastD = false;
    const poll = () => {
      if (sceneStore.avatarHovered !== lastD) {
        lastD = sceneStore.avatarHovered;
        setState(lastD && domState.current.kind === "default" ? { kind: "drag" } : domState.current);
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  const ring = {
    default: { width: 34, height: 34 },
    hover: { width: 60, height: 60 },
    text: { width: 4, height: 30 },
    label: { width: 118, height: 118 },
    drag: { width: 76, height: 76 },
  }[state.kind];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {/* Ring */}
      <motion.div
        className="absolute top-0 left-0 flex items-center justify-center rounded-full"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{
          ...ring,
          opacity: visible ? 1 : 0,
          scale: pressed ? 0.86 : 1,
          borderRadius: state.kind === "text" ? 2 : 999,
        }}
        transition={spring.snappy}
      >
        <motion.div
          className="absolute inset-0 rounded-[inherit]"
          animate={{
            backgroundColor:
              state.kind === "label"
                ? "var(--fg)"
                : state.kind === "hover" || state.kind === "drag"
                  ? "var(--accent-soft)"
                  : state.kind === "text"
                    ? "var(--fg)"
                    : "rgba(0,0,0,0)",
            borderColor: state.kind === "label" || state.kind === "text" ? "rgba(0,0,0,0)" : "var(--line-strong)",
          }}
          style={{ borderWidth: 1, borderStyle: "solid" }}
          transition={{ duration: 0.25 }}
        />
        <AnimatePresence>
          {(state.kind === "label" || state.kind === "drag") && (
            <motion.span
              key={state.kind === "label" ? state.label : "drag"}
              className="relative font-mono text-[10px] tracking-[0.16em] whitespace-nowrap"
              style={{ color: state.kind === "label" ? "var(--bg)" : "var(--fg)" }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={spring.snappy}
            >
              {state.kind === "label" ? state.label : "DRAG"}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      {/* Dot */}
      <motion.div
        className="absolute top-0 left-0 size-[6px] rounded-full bg-fg"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: visible && state.kind !== "label" && state.kind !== "text" ? 1 : 0, scale: state.kind === "hover" ? 0.5 : 1 }}
        transition={{ duration: 0.18 }}
      />
    </div>
  );
}
