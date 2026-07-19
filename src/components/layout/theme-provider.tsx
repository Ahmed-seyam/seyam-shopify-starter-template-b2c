"use client";

import { useServerInsertedHTML } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  /** The user's selection: "light" | "dark" | "system". */
  theme: Theme;
  /** The theme actually applied ("light" | "dark"); undefined until mounted. */
  resolvedTheme: ResolvedTheme | undefined;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "theme";
const DEFAULT_THEME: Theme = "system";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// localStorage as an external store: same-tab writes notify via `listeners`,
// cross-tab writes via the "storage" event. The server snapshot is the
// default, so the first client render matches SSR and there's no hydration
// mismatch (resolvedTheme stays undefined until mounted).
const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function subscribeTheme(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function subscribeSystem(callback: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Applies the resolved theme to <html>. Briefly disables CSS transitions so
 * switching themes doesn't animate every color at once (mirrors next-themes'
 * `disableTransitionOnChange`).
 */
function apply(resolved: ResolvedTheme) {
  const root = document.documentElement;

  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode("*,*::before,*::after{transition:none !important}"),
  );
  document.head.appendChild(style);

  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;

  // Force a reflow to flush the change, then re-enable transitions.
  window.getComputedStyle(document.body);
  requestAnimationFrame(() => document.head.removeChild(style));
}

// Runs before paint to set the theme class, avoiding a light/dark flash.
// Injected into <head> via useServerInsertedHTML (outside the React tree), so
// React 19 doesn't warn about an inline <script> rendered in a component.
const themeInitScript = `(function(){try{var e=localStorage.getItem('${STORAGE_KEY}')||'${DEFAULT_THEME}',m=window.matchMedia('(prefers-color-scheme: dark)').matches,d=e==='dark'||(e==='system'&&m),r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readTheme,
    () => DEFAULT_THEME,
  );
  const systemTheme = useSyncExternalStore(
    subscribeSystem,
    getSystemTheme,
    () => undefined,
  );

  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
  ));

  // systemTheme is undefined on the server and the first client render, which
  // keeps resolvedTheme undefined until mounted (no hydration mismatch).
  const resolvedTheme =
    systemTheme === undefined
      ? undefined
      : theme === "system"
        ? systemTheme
        : theme;

  // Sync the <html> class whenever the resolution changes (user choice or OS
  // switch). On mount this re-applies what the pre-paint script already set.
  useEffect(() => {
    if (resolvedTheme) apply(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    for (const listener of listeners) listener();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
