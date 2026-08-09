import { useEffect, useState, useSyncExternalStore } from "react";

/** What the user picked. `system` defers to the OS and keeps following it. */
export type ThemeMode = "system" | "light" | "dark";

/** What that choice resolves to right now, and what the stylesheet keys off. */
export type ResolvedTheme = "light" | "dark";

/** Shared with the bootstrap script in index.html; changing it strands choices. */
const STORAGE_KEY = "tintshot:theme";

const LIGHT_QUERY = "(prefers-color-scheme: light)";

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    // Storage access throws outright in Safari private browsing.
    return "system";
  }
}

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(LIGHT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

/**
 * Owns the editor's light/dark theme: the user's choice, its persistence, and
 * the `data-theme` attribute the palettes in index.css are selected by.
 *
 * The OS preference is external state, so it is read through
 * `useSyncExternalStore` and the resolved theme stays derived — no effect has to
 * mirror one piece of state into another. The same resolution runs inline in
 * index.html before first paint, so the first effect pass here writes the
 * attribute the document already carries and mounting never causes a flash.
 *
 * This governs the surrounding interface only. The canvas and the PNG it exports
 * are drawn from Settings and never read a CSS variable.
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  // The OS is tracked even while a theme is pinned, so that handing the choice
  // back to `system` resolves correctly on the very same render.
  const systemTheme = useSyncExternalStore<ResolvedTheme>(
    subscribeToSystemTheme,
    getSystemTheme,
    () => "dark",
  );
  const resolved: ResolvedTheme = mode === "system" ? systemTheme : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  // Storing `system` as an absent key keeps a user who handed the choice back
  // indistinguishable from one who never made it.
  useEffect(() => {
    try {
      if (mode === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // A theme that works for this session but is forgotten on reload beats
      // failing to switch at all.
    }
  }, [mode]);

  // `setMode` is React's own setter, already stable across renders.
  return { mode, resolved, setMode };
}
