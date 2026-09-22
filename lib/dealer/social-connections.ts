import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const SOCIAL_CONNECTIONS_PATH = "/api/social/connections";

export type DealerSocialConnection = {
  platform: string;
  connected: boolean;
  account: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readTrimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseDealerSocialConnection(value: unknown): DealerSocialConnection | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const platform = readTrimmed(rec.platform) ?? readTrimmed(rec.id);
  if (!platform) return null;
  return {
    platform,
    connected: rec.connected === true,
    account: readTrimmed(rec.account),
  };
}

export async function fetchDealerSocialConnections(): Promise<DealerSocialConnection[]> {
  const response = await apiFetch(SOCIAL_CONNECTIONS_PATH, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    throw accessApiErrorFromHttp(response.status, body, SOCIAL_CONNECTIONS_PATH);
  }
  const root = asRecord(body);
  const list = Array.isArray(root?.connections) ? root.connections : [];
  const rows: DealerSocialConnection[] = [];
  for (const item of list) {
    const row = parseDealerSocialConnection(item);
    if (row) rows.push(row);
  }
  return rows;
}
