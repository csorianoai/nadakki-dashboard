/** Personal Shopper localStorage persistence. */

import type { ShopperMatch, ShopperProfile } from "@/lib/shopper/types";

const PROFILE_KEY = "nadakki_shopper_profile";
const MATCHES_KEY = "nadakki_shopper_matches";
const NOTIFIED_KEY = "nadakki_shopper_notified_at";

export function getShopperProfile(): ShopperProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as ShopperProfile) : null;
  } catch {
    return null;
  }
}

export function saveShopperProfile(profile: ShopperProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getShopperMatches(): ShopperMatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MATCHES_KEY);
    return raw ? (JSON.parse(raw) as ShopperMatch[]) : [];
  } catch {
    return [];
  }
}

export function saveShopperMatches(matches: ShopperMatch[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export function getNewMatchCount(): number {
  return getShopperMatches().filter((m) => m.status === "new").length;
}

export function getLastNotifiedAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NOTIFIED_KEY);
}

export function setLastNotifiedAt(iso: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFIED_KEY, iso);
}

export function getShopperUserId(): string {
  if (typeof window === "undefined") return "demo-user";
  let id = window.localStorage.getItem("nadakki_shopper_user_id");
  if (!id) {
    id = `shopper-${Date.now()}`;
    window.localStorage.setItem("nadakki_shopper_user_id", id);
  }
  return id;
}
