import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);
const KEY = "fitsphere_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved =
      (window.localStorage.getItem(KEY) as Theme | null) ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider
      value={{ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={
        "relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card/70 text-foreground shadow-soft transition hover:bg-muted hover:scale-105 " +
        className
      }
    >
      <Sun
        className={
          "theme-icon absolute h-4 w-4 " +
          (isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")
        }
      />
      <Moon
        className={
          "theme-icon absolute h-4 w-4 " +
          (isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")
        }
      />
    </button>
  );
}
