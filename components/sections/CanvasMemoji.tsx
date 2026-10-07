"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type CanvasMemojiProps = {
  className?: string;
  spriteSrc?: string;
  fallbackSrc?: string;
  columns?: number;
  rows?: number;
};

type Controls = { reset: () => void; motionChanged: () => void };
type AssetState = { key: string; status: "loading" | "ready" | "fallback" };
const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/** Rows look up / level / down; columns turn left / straight ahead / right. */
export default function CanvasMemoji({
  className,
  spriteSrc = "/memoji/directions.webp",
  fallbackSrc = "/memoji/default-frame.webp",
  columns = 3,
  rows = 3,
}: CanvasMemojiProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<Controls | null>(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const captionId = useId();
  const assetKey = `${spriteSrc}:${columns}:${rows}`;
  const [asset, setAsset] = useState<AssetState>({ key: assetKey, status: "loading" });
  const ready = asset.key === assetKey && asset.status === "ready";
  const failed = asset.key === assetKey && asset.status === "fallback";
  const reset = useCallback(() => controlsRef.current?.reset(), []);

  useEffect(() => {
    reducedRef.current = reduced;
    controlsRef.current?.motionChanged();
  }, [reduced]);

  useEffect(() => {
    const surface = surfaceRef.current;
    const canvas = canvasRef.current;
    if (!surface || !canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      queueMicrotask(() => setAsset({ key: assetKey, status: "fallback" }));
      return;
    }

    const abort = new AbortController();
    const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
    let touchDevice = touchMedia.matches;
    let disposed = false;
    let intersecting = true;
    let sprite: HTMLImageElement | null = null;
    let loadingImage: HTMLImageElement | null = null;
    let blobUrl: string | null = null;
    let settled = false;
    let raf: number | null = null;
    let lastTime = 0;
    let lastInputAt = performance.now();
    let nodAt = -1;
    let suppressClickUntil = 0;
    let nearestFrame = -1;
    let currentFrame = Math.floor(rows / 2) * columns + Math.floor(columns / 2);
    let previousFrame = currentFrame;
    let transitionAt = -1;
    let explicitControl = false;
    let pointerPosition: { x: number; y: number } | null = null;
    let pointerAnchor: { x: number; y: number } | null = null;
    const gaze = { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 };
    const touch = { id: -1, x: 0, y: 0, targetX: 0, horizontal: false };

    const draw = (yaw: number, pitch: number, now = performance.now()) => {
      if (!sprite) return;
      const cellWidth = sprite.naturalWidth / columns;
      const cellHeight = sprite.naturalHeight / rows;
      const column = ((clamp(yaw) + 1) / 2) * (columns - 1);
      const row = ((clamp(pitch) + 1) / 2) * (rows - 1);
      // Keep a crisp pose at rest. Hysteresis prevents flicker near a cell
      // boundary; only the short handover blends neighboring images.
      const snap = (value: number, previous: number, count: number) => {
        let next = previous;
        while (next < count - 1 && value > next + 0.58) next++;
        while (next > 0 && value < next - 0.58) next--;
        return next;
      };
      const nextColumn = snap(column, currentFrame % columns, columns);
      const nextRow = snap(row, Math.floor(currentFrame / columns), rows);
      const frame = nextRow * columns + nextColumn;
      if (frame !== currentFrame) {
        previousFrame = currentFrame;
        currentFrame = frame;
        transitionAt = reducedRef.current ? -1 : now;
      }
      const progress = transitionAt < 0 ? 1 : Math.min((now - transitionAt) / 100, 1);
      const weight = 1 - (1 - progress) ** 3;
      if (progress >= 1) transitionAt = -1;
      const scale = Math.min(canvas.width / cellWidth, canvas.height / cellHeight) * 0.9;
      const width = cellWidth * scale;
      const height = cellHeight * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;

      context.clearRect(0, 0, canvas.width, canvas.height);
      // Add weighted premultiplied colors AND alpha. Source-over would make
      // the portrait translucent at intermediate poses against the page.
      context.globalCompositeOperation = "lighter";
      for (const [index, opacity] of [[previousFrame, 1 - weight], [currentFrame, weight]]) {
        if (opacity <= 0) continue;
        const col = index % columns;
        const frameRow = Math.floor(index / columns);
        context.globalAlpha = opacity;
        context.drawImage(sprite, col * cellWidth, frameRow * cellHeight, cellWidth, cellHeight, x, y, width, height);
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      if (frame !== nearestFrame) {
        nearestFrame = frame;
        surface.dataset.memojiFrame = String(frame);
      }
      canvas.style.transform = reducedRef.current ? "" : `translate3d(${yaw * 2}px, ${pitch * 1.5}px, 0)`;
    };

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      lastTime = 0;
    };

    const canAnimate = () => !disposed && sprite !== null && intersecting && !document.hidden;
    const schedule = () => {
      if (raf === null && canAnimate()) raf = requestAnimationFrame(tick);
    };
    const tick = (now: number) => {
      raf = null;
      if (!canAnimate()) return;
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.04) : 1 / 60;
      lastTime = now;
      const minimalMotion = reducedRef.current;
      const idle = touchDevice && !minimalMotion && touch.id === -1 && now - lastInputAt > 3000;
      const nodProgress = nodAt < 0 ? 1 : Math.min((now - nodAt) / 650, 1);
      const nod = minimalMotion || nodProgress >= 1 ? 0 : Math.sin(nodProgress * Math.PI) * 0.8;
      if (nodProgress >= 1) nodAt = -1;
      const targetX = clamp(gaze.targetX + (idle ? Math.sin(now / 1900) * 0.1 : 0));
      const targetY = clamp(gaze.targetY + nod + (idle ? Math.sin(now / 2400) * 0.055 : 0));

      if (minimalMotion) {
        gaze.x = targetX;
        gaze.y = targetY;
        gaze.vx = gaze.vy = 0;
      } else {
        const drag = Math.exp(-20 * delta);
        gaze.vx = (gaze.vx + (targetX - gaze.x) * 115 * delta) * drag;
        gaze.vy = (gaze.vy + (targetY - gaze.y) * 115 * delta) * drag;
        gaze.x = clamp(gaze.x + gaze.vx * delta);
        gaze.y = clamp(gaze.y + gaze.vy * delta);
      }
      draw(gaze.x, gaze.y, now);
      const moving = Math.abs(targetX - gaze.x) + Math.abs(targetY - gaze.y) + Math.abs(gaze.vx) + Math.abs(gaze.vy) > 0.001;
      // Touch idle motion needs a running clock; a settled desktop face sleeps.
      if (!minimalMotion && (moving || nodAt >= 0 || transitionAt >= 0 || touchDevice)) schedule();
      else lastTime = 0;
    };

    const resize = () => {
      const rect = surface.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      draw(gaze.x, gaze.y);
      schedule();
    };

    const claimExplicitControl = () => {
      explicitControl = true;
      pointerAnchor = pointerPosition;
      nodAt = -1;
    };
    const returnToCenter = () => {
      claimExplicitControl();
      gaze.targetX = gaze.targetY = 0;
      nodAt = -1;
      lastInputAt = performance.now();
      schedule();
    };
    controlsRef.current = {
      reset: returnToCenter,
      motionChanged: () => {
        if (reducedRef.current) returnToCenter();
        else schedule();
      },
    };

    const look = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedRef.current || touch.id !== -1) return;
      pointerPosition = { x: event.clientX, y: event.clientY };
      if (explicitControl) {
        // A key or Reset owns the view until the pointer actually moves.
        // Repeated events at the same position must not overwrite that view.
        if (!pointerAnchor) {
          pointerAnchor = pointerPosition;
          return;
        }
        if (Math.hypot(pointerPosition.x - pointerAnchor.x, pointerPosition.y - pointerAnchor.y) <= 8) return;
        explicitControl = false;
        pointerAnchor = null;
      }
      const rect = surface.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      gaze.targetX = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width * 0.8));
      gaze.targetY = clamp((event.clientY - rect.top - rect.height / 2) / (rect.height * 0.8));
      lastInputAt = performance.now();
      schedule();
    };
    const startTouch = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || !event.isPrimary) return;
      touch.id = event.pointerId;
      touch.x = event.clientX;
      touch.y = event.clientY;
      touch.targetX = gaze.targetX;
      touch.horizontal = false;
      lastInputAt = performance.now();
    };
    const swipe = (event: PointerEvent) => {
      if (event.pointerId !== touch.id) return;
      const dx = event.clientX - touch.x;
      const dy = event.clientY - touch.y;
      if (!touch.horizontal) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) {
          touch.id = -1;
          suppressClickUntil = performance.now() + 450;
          return;
        }
        if (Math.abs(dx) < 7) return;
        touch.horizontal = true;
        surface.setPointerCapture(event.pointerId);
      }
      const width = surface.getBoundingClientRect().width;
      if (!width) return;
      gaze.targetX = clamp(touch.targetX + dx / (width * 0.35));
      lastInputAt = performance.now();
      schedule();
    };
    const finishTouch = (event: PointerEvent) => {
      if (event.pointerId !== touch.id) return;
      if (touch.horizontal || event.type === "pointercancel") suppressClickUntil = performance.now() + 450;
      touch.id = -1;
      touch.horizontal = false;
      if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
      lastInputAt = performance.now();
      schedule();
    };
    const nod = () => {
      if (reducedRef.current || performance.now() < suppressClickUntil) return;
      nodAt = performance.now();
      lastInputAt = nodAt;
      schedule();
    };
    const key = (event: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " ", "Escape", "Home"].includes(event.key)) return;
      event.preventDefault();
      claimExplicitControl();
      if (event.key === "Escape" || event.key === "Home") returnToCenter();
      else if (event.key === "Enter" || event.key === " ") nod();
      else {
        const yawStep = columns > 1 ? 2 / (columns - 1) : 1;
        const pitchStep = rows > 1 ? 2 / (rows - 1) : 1;
        if (event.key === "ArrowLeft") gaze.targetX = clamp(gaze.targetX - yawStep);
        if (event.key === "ArrowRight") gaze.targetX = clamp(gaze.targetX + yawStep);
        if (event.key === "ArrowUp") gaze.targetY = clamp(gaze.targetY - pitchStep);
        if (event.key === "ArrowDown") gaze.targetY = clamp(gaze.targetY + pitchStep);
        lastInputAt = performance.now();
        schedule();
      }
    };
    const visibility = () => { if (document.hidden) stop(); else schedule(); };
    const mediaChanged = () => { touchDevice = touchMedia.matches; schedule(); };
    const blur = () => {
      touch.id = -1;
      touch.horizontal = false;
      returnToCenter();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(surface);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      if (intersecting) schedule();
      else stop();
    });
    observer.observe(surface);
    window.addEventListener("pointermove", look, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    touchMedia.addEventListener("change", mediaChanged);
    surface.addEventListener("pointerdown", startTouch, { passive: true });
    surface.addEventListener("pointermove", swipe, { passive: true });
    surface.addEventListener("pointerup", finishTouch);
    surface.addEventListener("pointercancel", finishTouch);
    surface.addEventListener("lostpointercapture", finishTouch);
    surface.addEventListener("click", nod);
    surface.addEventListener("keydown", key);
    resize();

    const fail = () => {
      if (disposed || settled) return;
      settled = true;
      window.clearTimeout(loadTimer);
      setAsset({ key: assetKey, status: "fallback" });
    };
    const loadTimer = window.setTimeout(() => {
      fail();
      abort.abort();
      if (loadingImage) loadingImage.src = "";
    }, 6000);

    void (async () => {
      try {
        if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1) throw new Error("Invalid Memoji grid");
        const response = await fetch(spriteSrc, { signal: abort.signal });
        if (!response.ok) throw new Error("Memoji sheet unavailable");
        const blob = await response.blob();
        if (disposed || settled) return;
        blobUrl = URL.createObjectURL(blob);
        loadingImage = new window.Image();
        loadingImage.decoding = "async";
        loadingImage.src = blobUrl;
        await loadingImage.decode();
        if (disposed || settled) return;
        if (!loadingImage.naturalWidth || !loadingImage.naturalHeight) throw new Error("Invalid Memoji sheet");
        sprite = loadingImage;
        settled = true;
        window.clearTimeout(loadTimer);
        draw(0, 0);
        setAsset({ key: assetKey, status: "ready" });
        schedule();
      } catch {
        fail();
      } finally {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
        }
      }
    })();

    return () => {
      disposed = true;
      abort.abort();
      window.clearTimeout(loadTimer);
      stop();
      if (loadingImage && !sprite) loadingImage.src = "";
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      controlsRef.current = null;
      resizeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("pointermove", look);
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      touchMedia.removeEventListener("change", mediaChanged);
      surface.removeEventListener("pointerdown", startTouch);
      surface.removeEventListener("pointermove", swipe);
      surface.removeEventListener("pointerup", finishTouch);
      surface.removeEventListener("pointercancel", finishTouch);
      surface.removeEventListener("lostpointercapture", finishTouch);
      surface.removeEventListener("click", nod);
      surface.removeEventListener("keydown", key);
    };
  }, [assetKey, columns, rows, spriteSrc]);

  return (
    <div className={cn("relative mx-auto aspect-square w-full", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full bg-accent-soft blur-3xl" />
      <div
        ref={surfaceRef}
        role={ready ? "button" : "img"}
        tabIndex={ready ? 0 : -1}
        aria-label={ready ? reduced ? "Interactive Memoji. Use arrow keys or swipe horizontally to look around. Escape resets the view." : "Interactive Memoji. Move your pointer or swipe horizontally to look around. Use arrow keys to turn, and Escape to reset." : "Memoji portrait with swept brown hair and a friendly smile"}
        aria-describedby={captionId}
        data-memoji-state={ready ? "ready" : failed ? "fallback" : "loading"}
        className="relative size-full rounded-full [touch-action:pan-y] focus-visible:outline-offset-4"
      >
        {!ready && <div className="pointer-events-none absolute inset-[5%]"><Image src={fallbackSrc} alt="" fill loading="eager" sizes="(min-width: 1024px) 40vw, 272px" className="object-contain" /></div>}
        <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none block size-full", ready ? "opacity-100" : "opacity-0")} />
      </div>
      <div className="absolute -bottom-7 inset-x-0 flex items-center justify-center gap-3 text-xs text-fg-muted">
        <p id={captionId}>
          {failed ? "Memoji portrait" : reduced ? "Use arrow keys or swipe" : <><span className="[@media(pointer:coarse)]:hidden">Move to look around</span><span className="hidden [@media(pointer:coarse)]:inline">Swipe to look around</span></>}
        </p>
        {ready && <button type="button" onClick={reset} className="rounded-full border border-line-strong px-2.5 py-1 transition-colors hover:text-fg">Reset</button>}
      </div>
    </div>
  );
}
