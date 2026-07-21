/** Stateless share URL encoding for Autos cart + compare. */

import type { CartState } from "./cart-types";
import { SHARE_MAX_AGE_MS, SHARE_URL_MAX_CHARS } from "./cart-types";

export type SharePayload = {
  v: 1;
  tenant_id: string;
  issued_at: number;
  vehicles: CartState["vehicles"];
  compare_ids: string[];
  compare_enabled: boolean;
};

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf8").toString("base64url");
  }
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSharePayload(token: string): SharePayload | null {
  try {
    let json: string;
    if (typeof Buffer !== "undefined") {
      const padded = token.replace(/-/g, "+").replace(/_/g, "/");
      json = Buffer.from(padded, "base64").toString("utf8");
    } else {
      const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
      json = atob(b64);
    }
    const parsed = JSON.parse(json) as Partial<SharePayload>;
    if (parsed.v !== 1 || typeof parsed.tenant_id !== "string" || typeof parsed.issued_at !== "number") {
      return null;
    }
    if (!Array.isArray(parsed.vehicles) || !Array.isArray(parsed.compare_ids)) return null;
    return parsed as SharePayload;
  } catch {
    return null;
  }
}

export function isShareExpired(payload: SharePayload, now = Date.now()): boolean {
  return now - payload.issued_at > SHARE_MAX_AGE_MS;
}

export function buildShareTokenFromState(state: CartState, tenantId: string, now = Date.now()): string | null {
  const payload: SharePayload = {
    v: 1,
    tenant_id: tenantId,
    issued_at: now,
    vehicles: state.vehicles,
    compare_ids: state.compare_ids,
    compare_enabled: state.compare_enabled,
  };
  const token = encodeSharePayload(payload);
  if (token.length > SHARE_URL_MAX_CHARS - 40) return null;
  return token;
}

export function buildShareUrl(token: string, origin = ""): string {
  const base = origin || "";
  return `${base}/autos/cart?share_token=${encodeURIComponent(token)}`;
}

export function cartStateFromShare(payload: SharePayload): CartState {
  return {
    version: 1,
    vehicles: payload.vehicles,
    compare_ids: payload.compare_ids,
    compare_enabled: payload.compare_enabled,
    last_updated: Date.now(),
  };
}
