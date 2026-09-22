import { fetchAccessSponsorshipPayload } from "@/lib/access/client";
import type { AccessClientContext } from "@/lib/access/client";

export const ACCESS_SPONSORSHIP_PATH = "/api/v1/access/sponsorship";

/** Commercial columns from GET /api/v1/access/sponsorship. Never legal identity, never payer_account_id. */
export type CommercialSponsorship = {
  subscription_id: string;
  beneficiary_unit_id: string | null;
  payer_tenant_id: string | null;
  inherits_to_children: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
  payer_name: string | null;
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

function readBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function parseCommercialSponsorship(value: unknown): CommercialSponsorship | null {
  const row = asRecord(value);
  if (!row) return null;
  const subscription_id = readTrimmed(row.subscription_id);
  if (!subscription_id) return null;
  return {
    subscription_id,
    beneficiary_unit_id: readTrimmed(row.beneficiary_unit_id),
    payer_tenant_id: readTrimmed(row.payer_tenant_id),
    inherits_to_children: readBool(row.inherits_to_children),
    starts_at: readTrimmed(row.starts_at),
    ends_at: readTrimmed(row.ends_at),
    status: readTrimmed(row.status),
    payer_name: readTrimmed(row.payer_name),
  };
}

export function parseSponsorshipPayload(body: unknown): CommercialSponsorship[] {
  const root = asRecord(body);
  const list = root && Array.isArray(root.sponsorships) ? root.sponsorships : [];
  const parsed: CommercialSponsorship[] = [];
  for (const item of list) {
    const row = parseCommercialSponsorship(item);
    if (row) parsed.push(row);
  }
  return parsed;
}

export function sponsorshipCopy(payerName: string): string {
  return `patrocinado por ${payerName}`;
}

export function visibleSponsorshipCopy(rows: CommercialSponsorship[]): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const row of rows) {
    if (!row.payer_name) continue;
    if (seen.has(row.payer_name)) continue;
    seen.add(row.payer_name);
    lines.push(sponsorshipCopy(row.payer_name));
  }
  return lines;
}

export async function fetchCommercialSponsorships(
  explicitContext?: AccessClientContext | null,
): Promise<CommercialSponsorship[]> {
  const payload = await fetchAccessSponsorshipPayload(explicitContext);
  return parseSponsorshipPayload(payload);
}
