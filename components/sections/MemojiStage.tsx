"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import poseData from "@/data/memojiPoses.json";
import { avatar } from "@/data/avatar";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type Pose = { index: number; yaw: number; pitch: number };
const POSES: Pose[] = poseData.poses;
const STRIP = poseData.src;
const TILE = poseData.tile;


const MAX_YAW = 90;
const MAX_PITCH = 26;
const FADE_MS = 150;
/** Pitch counts for more than yaw when choosing a pose: the up and down
 *  renders only exist facing forward, so they must not win a turned pose. */
const PITCH_WEIGHT = 2.4;
/** A new pose must beat the current one by this much before it takes over,
 *  otherwise the head flickers between two renders on the boundary. */
const HYSTERESIS = 0.82;

const clamp = (v: number, a = -1, b = 1) => Math.max(a, Math.min(b, v));
/** Fine control near centre, full profile only at the extremes of travel. */
const curve = (t: number) => Math.sign(t) * Math.pow(Math.abs(t), 1.55);

function nearestPose(yaw: number, pitch: number) {
  let best = 0;
  let bestScore = Infinity;
  for (const p of POSES) {
    const dy = yaw - p.yaw;
    const dp = (pitch - p.pitch) * PITCH_WEIGHT;
    const score = dy * dy + dp * dp;
    if (score < bestScore) { bestScore = score; best = p.index; }
  }
  return { index: best, score: bestScore };
}

function scoreOf(index: number, yaw: number, pitch: number) {
  const p = POSES[index];
  const dy = yaw - p.yaw;
  const dp = (pitch - p.pitch) * PITCH_WEIGHT;
  return dy * dy + dp * dp;
}

/**
 * The hero avatar: real Memoji renders at nine angles, from one full profile to
 * the other, chosen by where the pointer is and cross-faded as it moves.
 * Drawing actual renders rather than reprojecting one image is what lets the
 * head reach a true side view, with the nose in outline and a modelled ear.
 */
export default function MemojiStage({ className }: { className?: string }) {
  const surface = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef<() => void>(() => {});
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const captionId = useId();
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const reset = useCallback(() => resetRef.current(), []);

  useEffect(() => { reducedRef.current = reduced; }, [reduced]);

  useEffect(() => {
    const host = surface.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) { queueMicrotask(() => setStatus("fallback")); return; }

    const abort = new AbortController();
    const frontIndex = POSES.findIndex((p) => p.yaw === 0 && p.pitch === 0);
    let strip: HTMLImageElement | null = null;
    let disposed = false, settled = false, onscreen = true;
    let raf: number | null = null, lastTime = 0;
    let current = frontIndex, previous = frontIndex, fadeStart = -1;
    let manual = false, lastInput = performance.now(), nodUntil = -1;
    let anchor: { x: number; y: number } | null = null;
    const aim = { x: 0, y: 0 };           // where we want to look, -1..1
    const eased = { x: 0, y: 0 };          // smoothed, drives the pose
    const drag = { id: -1, x: 0, startX: 0, active: false };

    const draw = (now: number) => {
      if (!strip) return;
      const fade = fadeStart < 0 ? 1 : Math.min((now - fadeStart) / FADE_MS, 1);
      if (fade >= 1) fadeStart = -1;
      const weight = 1 - (1 - fade) ** 3;
      const scale = Math.min(canvas.width, canvas.height) / TILE;
      const size = TILE * scale;
      const x = (canvas.width - size) / 2;
      const y = (canvas.height - size) / 2;

      context.clearRect(0, 0, canvas.width, canvas.height);
      // Add premultiplied colour and alpha; source-over would make the head
      // translucent against the page midway through a cross-fade.
      context.globalCompositeOperation = "lighter";
      for (const [index, alpha] of [[previous, 1 - weight], [current, weight]] as const) {
        if (alpha <= 0.001) continue;
        context.globalAlpha = alpha;
        context.drawImage(strip, index * TILE, 0, TILE, TILE, x, y, size, size);
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      host.dataset.memojiPose = String(current);
      host.dataset.memojiYaw = POSES[current].yaw.toFixed(0);
    };

    const select = (yaw: number, pitch: number, now: number) => {
      const best = nearestPose(yaw, pitch);
      if (best.index === current) return;
      // Only switch once the candidate is clearly the better match.
      if (best.score > scoreOf(current, yaw, pitch) * HYSTERESIS) return;
      previous = current;
      current = best.index;
      fadeStart = reducedRef.current ? -1 : now;
    };

    const canRun = () => !disposed && strip !== null && onscreen && !document.hidden;
    const schedule = () => { if (raf === null && canRun()) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; lastTime = 0; };

    const tick = (now: number) => {
      raf = null;
      if (!canRun()) return;
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = now;
      const still = reducedRef.current;
      const idle = !manual && !drag.active && now - lastInput > 2600;

      let targetX = aim.x;
      let targetY = aim.y;
      if (idle && !still) {
        // A slow look around, so the avatar is not frozen when untouched.
        targetX += Math.sin(now / 2600) * 0.26;
        targetY += Math.sin(now / 3700) * 0.12;
      }
      if (now < nodUntil && !still) {
        targetY += Math.sin(((nodUntil - now) / 620) * Math.PI) * 1.1;
      }
      targetX = clamp(targetX);
      targetY = clamp(targetY);

      if (still) {
        eased.x = targetX; eased.y = targetY;
      } else {
        const k = 1 - Math.exp(-7 * delta);
        eased.x += (targetX - eased.x) * k;
        eased.y += (targetY - eased.y) * k;
      }

      select(curve(eased.x) * MAX_YAW, clamp(eased.y) * MAX_PITCH, now);
      draw(now);
      if (!still) canvas.style.transform = `translate3d(${eased.x * 6}px, ${eased.y * 4}px, 0)`;

      const moving = Math.abs(targetX - eased.x) + Math.abs(targetY - eased.y) > 0.0015;
      if (!still && (moving || fadeStart >= 0 || idle || now < nodUntil)) schedule();
      else lastTime = 0;
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      draw(performance.now());
      schedule();
    };

    const look = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedRef.current || drag.active) return;
      if (manual) {
        // A key press or Reset owns the view until the pointer actually moves.
        if (!anchor) { anchor = { x: event.clientX, y: event.clientY }; return; }
        if (Math.hypot(event.clientX - anchor.x, event.clientY - anchor.y) <= 10) return;
        manual = false; anchor = null;
      }
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Usable across the whole page, not just over the avatar.
      aim.x = clamp((event.clientX - rect.left - rect.width / 2) / Math.max(rect.width * 1.15, window.innerWidth * 0.42));
      aim.y = clamp((event.clientY - rect.top - rect.height / 2) / Math.max(rect.height * 1.3, window.innerHeight * 0.45));
      lastInput = performance.now();
      schedule();
    };

    const claim = () => { manual = true; anchor = null; lastInput = performance.now(); };
    resetRef.current = () => { claim(); aim.x = 0; aim.y = 0; nodUntil = -1; schedule(); };
    const nod = () => { if (!reducedRef.current) { nodUntil = performance.now() + 620; schedule(); } };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || !event.isPrimary) return;
      drag.id = event.pointerId; drag.x = event.clientX; drag.startX = aim.x; drag.active = false;
      claim();
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.active) {
        if (Math.abs(dx) < 8) return;
        drag.active = true;
        host.setPointerCapture(event.pointerId);
      }
      aim.x = clamp(drag.startX + dx / Math.max(host.getBoundingClientRect().width * 0.6, 1));
      lastInput = performance.now();
      schedule();
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== drag.id) return;
      if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
      drag.id = -1; drag.active = false;
      lastInput = performance.now();
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
    const onVisibility = () => { if (document.hidden) stop(); else schedule(); };
    const onBlur = () => { drag.id = -1; drag.active = false; };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      if (onscreen) schedule(); else stop();
    });
    io.observe(host);
    window.addEventListener("pointermove", look, { passive: true });
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    host.addEventListener("pointerdown", onDown, { passive: true });
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);
    host.addEventListener("click", nod);
    host.addEventListener("keydown", onKey);
    resize();

    const fail = () => { if (!disposed && !settled) { settled = true; window.clearTimeout(timer); setStatus("fallback"); } };
    const timer = window.setTimeout(fail, 8000);

    void (async () => {
      let url: string | null = null;
      try {
        const response = await fetch(STRIP, { signal: abort.signal });
        if (!response.ok) throw new Error("pose strip unavailable");
        const blob = await response.blob();
        if (disposed || settled) return;
        url = URL.createObjectURL(blob);
        const image = new window.Image();
        image.decoding = "async";
        image.src = url;
        await image.decode();
        if (disposed || settled) return;
        if (image.naturalWidth < TILE * POSES.length) throw new Error("pose strip is the wrong size");
        strip = image;
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
      stop();
      resizeObserver.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", look);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("click", nod);
      host.removeEventListener("keydown", onKey);
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
              : "Interactive Memoji. Move the pointer or swipe to turn the head from one profile to the other. Arrow keys turn it, Enter nods, Escape faces forward."
        }
        aria-describedby={captionId}
        data-memoji-state={status}
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
              <span className="[@media(pointer:coarse)]:hidden">Move to turn · click to nod</span>
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
