"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { sceneStore } from "@/lib/three/store";

type Theme = "light" | "dark";
type Preference = Theme | "system";

type ThemeContextValue = {
  theme: Theme;
  preference: Preference;
  /** Toggle with an optional origin (px) for the circular reveal */
  toggle: (origin?: { x: number; y: number }) => void;
  setPreference: (p: Preference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "theme-preference";

/** Inline, render-blocking script: sets data-theme before first paint (no flash). */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=p==='light'||p==='dark'?p:(d?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

function readPreference(): Preference {
  try {
    const p = localStorage.getItem(STORAGE_KEY);
    return p === "light" || p === "dark" ? p : "system";
  } catch {
    return "system";
  }
}

const systemTheme = (): Theme => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<Preference>("system");
  const [theme, setTheme] = useState<Theme>("dark");
  /** Identifies the most recent reveal, so an aborted one cannot clean up after a newer one. */
  const transitionToken = useRef(0);

  const apply = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    sceneStore.theme = t;
    setTheme(t);
    window.dispatchEvent(new CustomEvent("themechange", { detail: t }));
  }, []);

  // Sync with the value the init script already applied
  useEffect(() => {
    const p = readPreference();
    const t = (document.documentElement.dataset.theme as Theme) ?? systemTheme();
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from DOM set by init script */
    setPref(p);
    setTheme(t);
    /* eslint-enable react-hooks/set-state-in-effect */
    sceneStore.theme = t;
  }, []);

  // Follow the OS while preference is "system"
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply(systemTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference, apply]);

  const setPreference = useCallback((p: Preference) => {
    setPref(p);
    try {
      if (p === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, p);
    } catch {}
    apply(p === "system" ? systemTheme() : p);
  }, [apply]);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      const root = document.documentElement;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // No View Transitions (or the user asked for less motion): swap instantly.
      // The browser also skips transitions while the document is hidden, in which
      // case `finished` still settles and the class is cleaned up below.
      if (!document.startViewTransition || reduce) {
        setPreference(next);
        return;
      }

      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? 0;
      // Exact distance from the origin to the furthest corner. The old code grew the
      // circle to a flat 150vmax, so a third of the animation ran after the screen was
      // already covered — which is what made the wipe feel slow and hard to time.
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      root.style.setProperty("--theme-x", `${x}px`);
      root.style.setProperty("--theme-y", `${y}px`);
      root.style.setProperty("--theme-r", `${radius}px`);
      root.classList.add("theme-transition");

      // Toggling again mid-wipe starts a second transition and aborts the first.
      // Without this token the first one's cleanup would strip the class out from
      // under the second, which drops it back to an instant swap.
      const token = ++transitionToken.current;
      const vt = document.startViewTransition(() => {
        flushSync(() => setPreference(next));
      });
      vt.finished.finally(() => {
        if (transitionToken.current === token) root.classList.remove("theme-transition");
      });
    },
    [theme, setPreference],
  );

  return (
    <ThemeContext.Provider value={{ theme, preference, toggle, setPreference }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
