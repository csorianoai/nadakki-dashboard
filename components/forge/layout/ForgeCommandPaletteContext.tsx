"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ForgeCreditHubCommandPalette } from "./ForgeCreditHubCommandPalette";

type ForgeCommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const ForgeCommandPaletteContext = createContext<ForgeCommandPaletteContextValue | null>(null);

export function ForgeCommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } else {
      window.setTimeout(() => lastFocus.current?.focus?.(), 0);
    }
  }, [open]);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return (
    <ForgeCommandPaletteContext.Provider value={value}>
      {children}
      <ForgeCreditHubCommandPalette open={open} onOpenChange={setOpen} />
    </ForgeCommandPaletteContext.Provider>
  );
}

export function useForgeCommandPalette(): ForgeCommandPaletteContextValue {
  const ctx = useContext(ForgeCommandPaletteContext);
  if (!ctx) throw new Error("useForgeCommandPalette must be used within ForgeCommandPaletteProvider");
  return ctx;
}

/** Safe where Credit Hub does not mount `ForgeCommandPaletteProvider` (e.g. global top bar). */
export function useForgeCommandPaletteOptional(): ForgeCommandPaletteContextValue | null {
  return useContext(ForgeCommandPaletteContext);
}
