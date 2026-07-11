"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/core/ui/button";
import { useTheme } from "@/components/layout/theme-provider";

/**
 * Both icons are always rendered and CSS (`dark:` variant) picks the visible
 * one — no client state, so server and client markup match on hydration.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="hidden size-5 dark:block" />
      <MoonIcon className="size-5 dark:hidden" />
    </Button>
  );
}
