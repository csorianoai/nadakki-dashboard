"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "nadakki-forge-nav-rail-collapsed";

type ForgeLayoutChromeContextValue = {
  /** true = rail estrecho solo iconos (56px); false = expandido (240px). */
  railCollapsed: boolean;
  setRailCollapsed: (value: boolean) => void;
  toggleRail: () => void;
};

const ForgeLayoutChromeContext = createContext<ForgeLayoutChromeContextValue | null>(null);

export function ForgeLayoutChromeProvider({ children }: { children: ReactNode }) {
  const [railCollapsed, setRailCollapsedState] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "0") setRailCollapsedState(false);
      if (raw === "1") setRailCollapsedState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setRailCollapsed = useCallback((value: boolean) => {
    setRailCollapsedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleRail = useCallback(() => {
    setRailCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ railCollapsed, setRailCollapsed, toggleRail }),
    [railCollapsed, setRailCollapsed, toggleRail]
  );

  return <ForgeLayoutChromeContext.Provider value={value}>{children}</ForgeLayoutChromeContext.Provider>;
}

export function useForgeLayoutChrome(): ForgeLayoutChromeContextValue {
  const ctx = useContext(ForgeLayoutChromeContext);
  if (!ctx) {
    throw new Error("useForgeLayoutChrome debe usarse dentro de ForgeLayoutChromeProvider");
  }
  return ctx;
}
