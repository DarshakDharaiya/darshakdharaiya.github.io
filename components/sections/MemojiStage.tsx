"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import profileData from "@/data/memojiProfile.json";
import { avatar } from "@/data/avatar";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { createMemojiRenderer, type MemojiRenderer } from "@/lib/memoji/renderer";
import { createBlinkController } from "@/lib/memoji/blink";

const PORTRAIT = profileData.src;
const MAX_YAW = 30;
const MAX_PITCH = 12;
const TOUCH_RETURN_MS = 2000;

const clamp = (v: number, a = -1, b = 1) => Math.max(a, Math.min(b, v));

/**
 * Pointer-following portrait inspired by the reference's neck rotation.
 * The skull and modeled ears rotate together with a fixed texture atlas. Eyelids and
 * gaze animate independently; depth is calibrated to the supplied side views.
 */
export default function MemojiStage({ className }: { className?: string }) {
  const surface = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef<() => void>(() => {});
  const motionChangedRef = useRef<() => void>(() => {});
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const captionId = useId();
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const reset = useCallback(() => resetRef.current(), []);

  useEffect(() => {
    reducedRef.current = reduced;
    motionChangedRef.current();
  }, [reduced]);

  useEffect(() => {
    const host = surface.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const abort = new AbortController();
    let renderer: MemojiRenderer | null = null;
    let contextAvailable = true;
    let disposed = false, settled = false, onscreen = true;
    let raf: number | null = null, lastTime = 0;
    let manual = false, lastInput = performance.now(), nodUntil = -1;
    let returnTimer: number | undefined;
    let anchor: { x: number; y: number } | null = null;
    const aim = { x: 0, y: 0 };           // where we want to look, -1..1
    const eased = { x: 0, y: 0 };          // smoothed, drives the pose
    const gaze = { x: 0, y: 0 };
    const blinks = createBlinkController();
    blinks.reset(performance.now());
    const drag = { id: -1, x: 0, y: 0, startX: 0, startY: 0, active: false };
    let suppressClick = false;

    const draw = (now: number) => {
      const still = reducedRef.current;
      const yaw = eased.x * MAX_YAW, pitch = eased.y * MAX_PITCH;
      // Tiny resting movement; pointer tracking always owns the gaze.
      const resting = !manual && !drag.active && now - lastInput > 2600 && !still;
      const roll = still ? 0 : -eased.x * .018 + (resting ? Math.sin(now / 2400) * .008 : 0);
      const bob = resting ? Math.sin(now / 1800) * .003 : 0;
      const blink = still ? 0 : blinks.sample(now);
      renderer?.draw(yaw, pitch, roll, bob, blink, gaze.x, gaze.y);
      host.dataset.memojiYaw = yaw.toFixed(2);
      host.dataset.memojiPitch = pitch.toFixed(2);
      host.dataset.memojiBlink = blink.toFixed(3);
    };

    const canRun = () => !disposed && contextAvailable && renderer !== null && onscreen && !document.hidden;
    const schedule = () => { if (raf === null && canRun()) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; lastTime = 0; };

    const tick = (now: number) => {
      raf = null;
      if (!canRun()) return;
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = now;
      const still = reducedRef.current;
      let targetX = aim.x;
      let targetY = aim.y;
      if (now < nodUntil && !still) {
        targetY += Math.sin(((nodUntil - now) / 620) * Math.PI) * 1.1;
      }
      targetX = clamp(targetX);
      targetY = clamp(targetY);

      if (still) {
        eased.x = targetX; eased.y = targetY;
        gaze.x = 0; gaze.y = 0;
      } else {
        // Reference: horizontal follows with more lag than vertical.
        eased.x += (targetX - eased.x) * (1 - Math.exp(-6.3 * delta));
        eased.y += (targetY - eased.y) * (1 - Math.exp(-13.4 * delta));
        gaze.x += (targetX - gaze.x) * (1 - Math.exp(-20 * delta));
        gaze.y += (targetY - gaze.y) * (1 - Math.exp(-20 * delta));
      }
      draw(now);
      if (!still) schedule();
      else lastTime = 0;
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      draw(performance.now());
      schedule();
    };

    const look = (event: PointerEvent) => {
      if (!["mouse", "pen"].includes(event.pointerType) || reducedRef.current || drag.active) return;
      if (manual) {
        // A key press or Reset owns the view until the pointer actually moves.
        if (!anchor) { anchor = { x: event.clientX, y: event.clientY }; return; }
        if (Math.hypot(event.clientX - anchor.x, event.clientY - anchor.y) <= 10) return;
        manual = false; anchor = null;
      }
      window.clearTimeout(returnTimer);
      // Viewport coordinates match the reference and make both turns reachable
      // even though this portrait sits on the right of the hero.
      aim.x = clamp(event.clientX / window.innerWidth * 2 - 1);
      aim.y = clamp(event.clientY / window.innerHeight * 2 - 1);
      lastInput = performance.now();
      schedule();
    };

    const claim = () => { window.clearTimeout(returnTimer); manual = true; anchor = null; lastInput = performance.now(); };
    resetRef.current = () => { claim(); aim.x = 0; aim.y = 0; nodUntil = -1; schedule(); };
    const nod = () => {
      if (suppressClick) { suppressClick = false; return; }
      if (!reducedRef.current) {
        const now = performance.now();
        nodUntil = now + 620; blinks.trigger(now + 80); schedule();
      }
    };
    const returnHome = () => { manual = false; aim.x = 0; aim.y = 0; nodUntil = -1; schedule(); };
    motionChangedRef.current = () => {
      resetRef.current();
      eased.x = 0; eased.y = 0;
      gaze.x = 0; gaze.y = 0;
      blinks.reset(performance.now());
      stop(); draw(performance.now()); schedule();
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || !event.isPrimary || reducedRef.current) return;
      suppressClick = false;
      drag.id = event.pointerId; drag.x = event.clientX; drag.y = event.clientY;
      drag.startX = aim.x; drag.startY = aim.y; drag.active = false;
      claim();
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        drag.active = true;
        suppressClick = true;
        host.setPointerCapture(event.pointerId);
      }
      aim.x = clamp(drag.startX + dx / Math.max(host.getBoundingClientRect().width * 0.6, 1));
      aim.y = clamp(drag.startY + dy / Math.max(host.getBoundingClientRect().height * 0.8, 1));
      lastInput = performance.now();
      schedule();
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== drag.id) return;
      if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
      drag.id = -1; drag.active = false;
      lastInput = performance.now();
      window.clearTimeout(returnTimer);
      returnTimer = window.setTimeout(returnHome, TOUCH_RETURN_MS);
    };
    const onKey = (event: KeyboardEvent) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "Escape", "Enter", " "];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      claim();
      if (event.key === "ArrowLeft") aim.x = clamp(aim.x - 0.26);
      if (event.key === "ArrowRight") aim.x = clamp(aim.x + 0.26);
      if (event.key === "ArrowUp") aim.y = clamp(aim.y - 0.5);
      if (event.key === "ArrowDown") aim.y = clamp(aim.y + 0.5);
      if (event.key === "Home" || event.key === "Escape") { aim.x = 0; aim.y = 0; }
      if (event.key === "Enter" || event.key === " ") nod();
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else { blinks.reset(performance.now()); schedule(); }
    };
    const onBlur = () => {
      const touching = drag.id !== -1;
      if (drag.id !== -1 && host.hasPointerCapture(drag.id)) host.releasePointerCapture(drag.id);
      drag.id = -1; drag.active = false;
      if (touching || !manual) { window.clearTimeout(returnTimer); returnHome(); }
    };
    const onLeave = () => { if (!manual && !drag.active) returnHome(); };
    const onContextLost = () => {
      contextAvailable = false;
      stop(); setStatus("fallback");
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      if (onscreen) { blinks.reset(performance.now()); schedule(); } else stop();
    });
    io.observe(host);
    window.addEventListener("pointermove", look, { passive: true });
    window.addEventListener("blur", onBlur);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    host.addEventListener("pointerdown", onDown, { passive: true });
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);
    host.addEventListener("click", nod);
    host.addEventListener("keydown", onKey);
    canvas.addEventListener("webglcontextlost", onContextLost);
    resize();

    const fail = () => { if (!disposed && !settled) { settled = true; window.clearTimeout(timer); setStatus("fallback"); } };
    const timer = window.setTimeout(fail, 8000);

    void (async () => {
      let url: string | null = null;
      try {
        const response = await fetch(PORTRAIT, { signal: abort.signal });
        if (!response.ok) throw new Error("portrait unavailable");
        const blob = await response.blob();
        if (disposed || settled) return;
        url = URL.createObjectURL(blob);
        const image = new window.Image();
        image.decoding = "async";
        image.src = url;
        await image.decode();
        if (disposed || settled) return;
        if (image.naturalWidth !== profileData.tile * profileData.count || image.naturalHeight !== profileData.tile) throw new Error("portrait atlas is the wrong size");
        renderer = createMemojiRenderer(canvas, image);
        if (!renderer) throw new Error("portrait renderer unavailable");
        settled = true;
        window.clearTimeout(timer);
        draw(performance.now());
        setStatus("ready");
        schedule();
      } catch {
        fail();
      } finally {
        if (url) URL.revokeObjectURL(url);
      }
    })();

    return () => {
      disposed = true;
      abort.abort();
      window.clearTimeout(timer);
      window.clearTimeout(returnTimer);
      stop();
      renderer?.dispose();
      resetRef.current = () => {};
      motionChangedRef.current = () => {};
      resizeObserver.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", look);
      window.removeEventListener("blur", onBlur);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("click", nod);
      host.removeEventListener("keydown", onKey);
      canvas.removeEventListener("webglcontextlost", onContextLost);
    };
  }, []);

  const ready = status === "ready";
  const failed = status === "fallback";

  return (
    <div className={cn("relative mx-auto aspect-square w-full", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full bg-accent-soft blur-3xl" />
      <div
        ref={surface}
        role={failed ? "img" : "button"}
        tabIndex={failed ? -1 : 0}
        aria-label={
          failed
            ? avatar.portrait.alt
            : reduced
              ? "Interactive Memoji. Use the arrow keys to turn the head, Escape to face forward."
              : "Interactive Memoji. Move the pointer to look around, or swipe to turn the head. Arrow keys turn it, Enter nods, Escape faces forward."
        }
        aria-describedby={captionId}
        data-memoji-state={status}
        data-memoji-renderer="3d"
        className="relative size-full rounded-full [touch-action:pan-y] focus-visible:outline-offset-4"
      >
        {!ready && (
          <div className="pointer-events-none absolute inset-[6%]">
            <Image src={avatar.portrait.src} alt="" fill loading="eager" sizes="(min-width: 1024px) 40vw, 272px" className="object-contain" />
          </div>
        )}
        <canvas ref={canvasRef} aria-hidden className={cn("block size-full", ready ? "opacity-100" : "opacity-0")} />
      </div>
      <div className="absolute -bottom-7 inset-x-0 flex items-center justify-center gap-3 text-xs text-fg-muted">
        <p id={captionId} className="whitespace-nowrap">
          {failed ? "Memoji portrait" : reduced ? "Use the arrow keys" : (
            <>
              <span className="[@media(pointer:coarse)]:hidden">Move to look around · click to nod</span>
              <span className="hidden [@media(pointer:coarse)]:inline">Swipe to turn</span>
            </>
          )}
        </p>
        {ready && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-full border border-line-strong px-2.5 py-1 transition-colors hover:text-fg"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
