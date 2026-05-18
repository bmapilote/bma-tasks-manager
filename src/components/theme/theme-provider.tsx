"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    return (localStorage.getItem("theme") as Theme) || "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Use a ref to signal initial setup is done without triggering re-renders
  const initialized = useRef(false);
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Perform initial theme read in a flushSync-like fashion
  // using a single state setter combined in a microtask
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = getInitialTheme();
    const res = getResolvedTheme(saved);
    // Batch both state updates together
    setThemeState(saved);
    setResolvedTheme(res);
    if (res === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setThemeState((prev) => {
        if (prev === "system") {
          const res = getResolvedTheme("system");
          setResolvedTheme(res);
          if (res === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        return prev;
      });
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    const res = getResolvedTheme(next);
    setThemeState(next);
    setResolvedTheme(res);
    if (typeof document !== "undefined") {
      if (res === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("theme", next);
      } catch { }
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
