/** Personal Shopper API — Fase 8 with mock fallback. */

import { autosFetch } from "@/lib/autos-consumer-api";
import { demoDelay } from "@/lib/autos-agent/demo-delay";
import { FEATURE_PERSONAL_SHOPPER_BACKEND } from "@/lib/autos-agent/feature-flags";
import { buildMockMatches, buildMockProfile } from "@/lib/shopper/mock-data";
import { getShopperUserId } from "@/lib/shopper/storage";
import type {
  ShopperMatch,
  ShopperNotificationChannel,
  ShopperPreferences,
  ShopperProfile,
  ShopperRegisterResponse,
} from "@/lib/shopper/types";

export type ShopperApiResult<T> = { data: T; fromBackend: boolean };

export async function registerShopperProfile(
  query: string,
  notifications: ShopperNotificationChannel[],
): Promise<ShopperApiResult<ShopperRegisterResponse>> {
  if (FEATURE_PERSONAL_SHOPPER_BACKEND) {
    try {
      const res = await autosFetch<ShopperRegisterResponse>(
        "/api/v1/autos_ai/buyer_shopper/register",
        {
          method: "POST",
          body: JSON.stringify({ query, notifications, user_id: getShopperUserId() }),
        },
      );
      if (res) return { data: res, fromBackend: true };
    } catch (error) {
      console.warn("Personal Shopper register failed, using mock", error);
    }
  }

  await demoDelay();
  const profile = buildMockProfile(query, notifications);
  return {
    data: { profile, extractedPreferences: profile.preferences },
    fromBackend: false,
  };
}

export async function refineShopperPreferences(
  updates: Partial<ShopperPreferences>,
  current: ShopperProfile,
): Promise<ShopperApiResult<ShopperProfile>> {
  if (FEATURE_PERSONAL_SHOPPER_BACKEND) {
    try {
      const res = await autosFetch<ShopperProfile>("/api/v1/autos_ai/buyer_shopper/refine", {
        method: "POST",
        body: JSON.stringify({ user_id: current.userId, updates }),
      });
      if (res) return { data: res, fromBackend: true };
    } catch (error) {
      console.warn("Personal Shopper refine failed, using mock", error);
    }
  }

  await demoDelay();
  return {
    data: {
      ...current,
      preferences: { ...current.preferences, ...updates },
      updatedAt: new Date().toISOString(),
    },
    fromBackend: false,
  };
}

export async function getShopperMatches(
  profile?: ShopperProfile | null,
): Promise<ShopperApiResult<ShopperMatch[]>> {
  const userId = profile?.userId ?? getShopperUserId();

  if (FEATURE_PERSONAL_SHOPPER_BACKEND) {
    try {
      const res = await autosFetch<{ matches: ShopperMatch[] }>(
        `/api/v1/autos_ai/buyer_shopper/matches?user_id=${encodeURIComponent(userId)}`,
      );
      if (res?.matches) return { data: res.matches, fromBackend: true };
    } catch (error) {
      console.warn("Personal Shopper matches failed, using mock", error);
    }
  }

  await demoDelay();
  const prefs = profile?.preferences ?? buildMockProfile("", ["in_app"]).preferences;
  return { data: buildMockMatches(prefs), fromBackend: false };
}

export async function analyzeShopperQuery(
  query: string,
): Promise<ShopperApiResult<ShopperPreferences>> {
  if (FEATURE_PERSONAL_SHOPPER_BACKEND) {
    try {
      const res = await autosFetch<{ preferences: ShopperPreferences }>(
        "/api/v1/autos_ai/buyer_shopper/register",
        {
          method: "POST",
          body: JSON.stringify({ query, dry_run: true, user_id: getShopperUserId() }),
        },
      );
      if (res?.preferences) return { data: res.preferences, fromBackend: true };
    } catch (error) {
      console.warn("Personal Shopper analyze failed, using mock", error);
    }
  }

  await demoDelay(400, 900);
  const profile = buildMockProfile(query, ["in_app"]);
  return { data: profile.preferences, fromBackend: false };
}
