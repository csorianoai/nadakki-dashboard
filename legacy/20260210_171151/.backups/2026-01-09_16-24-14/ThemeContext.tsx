"use client";

import { createContext, useContext, ReactNode } from "react";

type ThemeColors = {
  bgPrimary?: string;
  bgSecondary?: string;
  bgCard?: string;
  border?: string;
  textMuted?: string;
  accentPrimary?: string;
};

type Theme = {
  colors?: ThemeColors;
};

type ThemeContextType = {
  theme: Theme;
};

const defaultTheme: ThemeContextType = {
  theme: {
    colors: {
      bgPrimary: "#f9fafb",
      bgSecondary: "#ffffff",
      bgCard: "#ffffff",
      border: "#e5e7eb",
      textMuted: "#6b7280",
      accentPrimary: "#8b5cf6",
    },
  },
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
