"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Theme, ThemeId, THEMES, DEFAULT_THEME } from "@/config/themes";

interface ThemeContextType {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("nadakki-theme") as ThemeId;
    if (saved && THEMES[saved]) {
      setThemeId(saved);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      const theme = THEMES[themeId];
      const root = document.documentElement;
      
      // Apply all CSS variables
      Object.entries(theme.colors).forEach(([key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        root.style.setProperty(cssVar, value);
      });

      // Save preference
      localStorage.setItem("nadakki-theme", themeId);
      
      // Update body background
      document.body.style.backgroundColor = theme.colors.bgPrimary;
    }
  }, [themeId, mounted]);

  const setTheme = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeId(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeId], themeId, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
