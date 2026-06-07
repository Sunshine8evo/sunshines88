"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sunshine-dashboard-theme";

function readStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function useDashboardTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const initial = readStoredTheme();
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
