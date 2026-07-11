"use client";

import { useServerInsertedHTML } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
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
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | undefined>(
    undefined,
  );

  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
  ));

  // On mount, adopt the stored preference and reflect the class the pre-paint
  // script already applied. resolvedTheme stays undefined on the server and the
  // first client render, so there's no hydration mismatch.
  useEffect(() => {
    const stored =
      (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? DEFAULT_THEME;
    setThemeState(stored);
    setResolvedTheme(resolve(stored));
  }, []);

  // Follow the OS setting while the preference is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = getSystemTheme();
      setResolvedTheme(next);
      apply(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    const resolved = resolve(next);
    setResolvedTheme(resolved);
    apply(resolved);
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
