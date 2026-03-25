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
    [
      "email",
      "sms",
      "push",
      "ads",
      "newsletter",
      "in-app",
      "whatsapp",
      "multi-channel",
    ].includes(typeRaw)
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
  if (!stats && raw.metrics && typeof raw.metrics === "object" && !Array.isArray(raw.metrics)) {
    const o = raw.metrics as Record<string, unknown>;
    const sent = Number(o.sent ?? o.delivered ?? 0);
    const opened = Number(o.opened ?? o.opens ?? 0);
    const clicked = Number(o.clicked ?? o.clicks ?? 0);
    const conversions = Number(o.conversions ?? o.conv ?? o.converted ?? 0);
    if (sent || opened || clicked || conversions) {
      stats = { sent, opened, clicked, conversions };
    }
  }

  let settings: Record<string, unknown> | undefined;
  const set = raw.settings;
  if (set && typeof set === "object" && !Array.isArray(set)) {
    settings = set as Record<string, unknown>;
  }

  const contentRaw = raw.content;
  let contentStr: string | undefined;
  if (contentRaw != null) {
    if (typeof contentRaw === "string") contentStr = contentRaw;
    else if (typeof contentRaw === "object") {
      const c = contentRaw as Record<string, unknown>;
      const body = c.body ?? c.html ?? c.text;
      contentStr = body != null ? String(body) : JSON.stringify(contentRaw);
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
    content: contentStr,
    audience_size:
      typeof raw.audience_size === "number"
        ? raw.audience_size
        : typeof raw.audienceSize === "number"
          ? raw.audienceSize
          : undefined,
    settings,
    stats,
  };
}
