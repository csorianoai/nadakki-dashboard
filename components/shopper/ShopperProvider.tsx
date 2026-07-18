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
import {
  getNewMatchCount,
  getShopperMatches,
  getShopperProfile,
  saveShopperMatches,
  saveShopperProfile,
} from "@/lib/shopper/storage";
import type { ShopperMatch, ShopperProfile } from "@/lib/shopper/types";

type ShopperContextValue = {
  profile: ShopperProfile | null;
  matches: ShopperMatch[];
  newMatchCount: number;
  onboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  refresh: () => void;
  setProfile: (p: ShopperProfile | null) => void;
  setMatches: (m: ShopperMatch[]) => void;
  updateMatch: (id: string, patch: Partial<ShopperMatch>) => void;
};

const ShopperContext = createContext<ShopperContextValue | null>(null);

export function ShopperProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ShopperProfile | null>(null);
  const [matches, setMatchesState] = useState<ShopperMatch[]>([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const refresh = useCallback(() => {
    setProfileState(getShopperProfile());
    setMatchesState(getShopperMatches());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setProfile = useCallback((p: ShopperProfile | null) => {
    if (p) saveShopperProfile(p);
    setProfileState(p);
  }, []);

  const setMatches = useCallback((m: ShopperMatch[]) => {
    saveShopperMatches(m);
    setMatchesState(m);
  }, []);

  const updateMatch = useCallback((id: string, patch: Partial<ShopperMatch>) => {
    setMatchesState((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
      saveShopperMatches(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      profile,
      matches,
      newMatchCount: matches.filter((m) => m.status === "new").length || getNewMatchCount(),
      onboardingOpen,
      openOnboarding: () => setOnboardingOpen(true),
      closeOnboarding: () => setOnboardingOpen(false),
      refresh,
      setProfile,
      setMatches,
      updateMatch,
    }),
    [profile, matches, onboardingOpen, refresh, setProfile, setMatches, updateMatch],
  );

  return <ShopperContext.Provider value={value}>{children}</ShopperContext.Provider>;
}

export function useShopper() {
  const ctx = useContext(ShopperContext);
  if (!ctx) throw new Error("useShopper must be used within ShopperProvider");
  return ctx;
}
