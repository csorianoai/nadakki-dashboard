import type { Campaign, CampaignStatus } from "@/lib/api";

const STATUSES: CampaignStatus[] = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
  "archived",
];

function coerceStatus(s: string): CampaignStatus {
  const l = s.toLowerCase() as CampaignStatus;
  return STATUSES.includes(l) ? l : "draft";
}

/** Map remote marketing campaign JSON to dashboard Campaign shape (no invented metrics). */
export function mapApiRecordToCampaign(
  idParam: string,
  raw: Record<string, unknown>
): Campaign {
  const id = String(raw.id ?? raw.campaign_id ?? idParam);
  const name = String(raw.name ?? raw.title ?? "Campaña");
  const status = coerceStatus(String(raw.status ?? "draft"));
  const typeRaw = String(raw.type ?? "email").toLowerCase();
  const type = (
    ["email", "sms", "push", "ads", "newsletter"].includes(typeRaw)
      ? typeRaw
      : "email"
  ) as Campaign["type"];
  const created_at = String(
    raw.created_at ?? raw.createdAt ?? new Date().toISOString().slice(0, 10)
  );
  const updated_at = String(
    raw.updated_at ?? raw.updatedAt ?? new Date().toISOString().slice(0, 10)
  );

  let stats: Campaign["stats"] | undefined;
  const st = raw.stats;
  if (st && typeof st === "object" && !Array.isArray(st)) {
    const o = st as Record<string, unknown>;
    const sent = Number(o.sent ?? o.delivered ?? 0);
    const opened = Number(o.opened ?? o.opens ?? 0);
    const clicked = Number(o.clicked ?? o.clicks ?? 0);
    const conversions = Number(o.conversions ?? o.conv ?? 0);
    if (sent || opened || clicked || conversions) {
      stats = { sent, opened, clicked, conversions };
    }
  }

  return {
    id,
    name,
    status,
    type,
    created_at,
    updated_at,
    description:
      raw.description != null ? String(raw.description) : undefined,
    subject: raw.subject != null ? String(raw.subject) : undefined,
    content: raw.content != null ? String(raw.content) : undefined,
    audience_size:
      typeof raw.audience_size === "number"
        ? raw.audience_size
        : typeof raw.audienceSize === "number"
          ? raw.audienceSize
          : undefined,
    stats,
  };
}
