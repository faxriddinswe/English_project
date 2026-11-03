"use client";

import { useSyncExternalStore, useCallback } from "react";

type Theme = "dark" | "light";
const THEME_CHANGED = "se-theme-changed";
const currentTheme = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
const serverTheme = (): Theme => "dark";

function applyTheme(theme: Theme) {
  if (theme === "light")
    document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}

function subscribe(onChange: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== "theme" && event.key !== null) return;
    applyTheme(event.newValue === "light" ? "light" : "dark");
    onChange();
  };
  window.addEventListener(THEME_CHANGED, onChange);
  window.addEventListener("storage", storageChanged);
  return () => {
    window.removeEventListener(THEME_CHANGED, onChange);
    window.removeEventListener("storage", storageChanged);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme);
  const toggle = useCallback(() => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new Event(THEME_CHANGED));
  }, []);

  return { theme, toggle };
}
