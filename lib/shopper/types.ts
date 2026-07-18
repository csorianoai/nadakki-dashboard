/** Personal Shopper profile & match types — Fase 8. */

import type { Vehicle } from "@/lib/vehicles";

export type ShopperNotificationChannel = "whatsapp" | "email" | "in_app";

export type ShopperPreferences = {
  query: string;
  types: string[];
  brands: string[];
  maxPrice?: number;
  monthlyBudget?: number;
  province: string;
};

export type ShopperProfile = {
  userId: string;
  active: boolean;
  preferences: ShopperPreferences;
  notifications: ShopperNotificationChannel[];
  createdAt: string;
  updatedAt: string;
  vehiclesAnalyzedThisMonth: number;
};

export type MatchStatus = "new" | "viewed" | "dismissed" | "converted";

export type ShopperMatch = {
  id: string;
  vehicle: Vehicle;
  score: number;
  reasons: string[];
  status: MatchStatus;
  matchedAt: string;
};

export type ShopperRegisterResponse = {
  profile: ShopperProfile;
  extractedPreferences: ShopperPreferences;
};
